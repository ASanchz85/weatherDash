#!/usr/bin/env node
// Regresión visual manual: captura el dashboard en las resoluciones objetivo con Chrome headless
// y comprueba scroll, desbordes, solapes y el recorte (aspect-ratio) de la imagen del hero.
//
// Uso: npm run screenshots -- [--label=baseline] [--url=http://localhost:3000] [--query=page=1] [--out=/tmp/weatherdash-screenshots]
// La vista de noticias se captura con --query=feed=national (o international, economy, markets, motorsport, nba).
// Requiere la app sirviéndose (npm run start tras npm run build, o npm run dev con --url=http://localhost:5173).
// Variables opcionales: CHROME_BIN, PORT, SCREENSHOT_URL.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

// El recorte excesivo de la foto del hero (varía en cada carga) solo se avisa, no es un error.
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1280, height: 800 },
  { width: 1080, height: 1920 },
];

const NEWS_HERO_SELECTOR = 'section[aria-label="Noticia destacada"]';
const HERO_SELECTOR = `section[aria-label="Fecha y hora"], ${NEWS_HERO_SELECTOR}`;
// La rejilla del dashboard cuelga de la vista rotatoria que envuelve main.
const DASHBOARD_SELECTOR = 'main > div > div';
/** Recorte máximo tolerado de la imagen del hero con background-size: cover. */
const MAX_CROP_RATIO = 0.25;
const READY_TIMEOUT_MS = 8000;
const CHROME_START_TIMEOUT_MS = 15000;

const { values: options } = parseArgs({
  options: {
    label: { type: 'string', default: 'actual' },
    url: { type: 'string' },
    query: { type: 'string', default: '' },
    out: { type: 'string', default: join(tmpdir(), 'weatherdash-screenshots') },
  },
});

const targetUrl = options.url ?? process.env.SCREENSHOT_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
// Parámetros de URL de depuración de la app (p. ej. page=1) para capturar cada vista.
const pageUrl = options.query ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${options.query}` : targetUrl;
const outputDir = join(options.out, options.label);

function findChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidates = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium'];
  const paths = (process.env.PATH ?? '').split(':');
  for (const name of candidates) {
    const found = paths.map((dir) => join(dir, name)).find((path) => existsSync(path));
    if (found) return found;
  }
  throw new Error('No se encontró Chrome. Define CHROME_BIN o instala google-chrome-stable.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(condition, timeoutMs, description) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await condition();
    if (result) return result;
    await sleep(100);
  }
  throw new Error(`Tiempo agotado esperando ${description}`);
}

async function assertAppReachable() {
  try {
    const response = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`No se puede acceder a ${targetUrl} (${error.message}). Arranca la app antes de ejecutar el script.`);
  }
}

async function launchChrome(profileDir) {
  const chrome = spawn(
    findChrome(),
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--disable-gpu',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  const exited = new Promise((resolve) => chrome.once('exit', resolve));
  const portFile = join(profileDir, 'DevToolsActivePort');

  const port = await waitFor(
    async () => {
      if (chrome.exitCode !== null) throw new Error('Chrome terminó antes de abrir el puerto de depuración');
      if (!existsSync(portFile)) return null;
      const [first] = (await readFile(portFile, 'utf8')).split('\n');
      return first ? Number(first) : null;
    },
    CHROME_START_TIMEOUT_MS,
    'el puerto de depuración de Chrome',
  );

  return { chrome, exited, port };
}

async function connectToPage(port) {
  const target = await waitFor(
    async () => {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      return targets.find((candidate) => candidate.type === 'page') ?? null;
    },
    CHROME_START_TIMEOUT_MS,
    'la pestaña de Chrome',
  );

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('No se pudo conectar con Chrome por CDP')), {
      once: true,
    });
  });

  let nextId = 0;
  const pending = new Map();
  const waiters = [];

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id !== undefined) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) entry?.reject(new Error(`${message.error.message}`));
      else entry?.resolve(message.result);
      return;
    }
    for (const waiter of [...waiters]) {
      if (waiter.method === message.method) {
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(message.params);
      }
    }
  });

  return {
    send(method, params = {}) {
      const id = ++nextId;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    once(method) {
      return new Promise((resolve) => waiters.push({ method, resolve }));
    },
    close() {
      socket.close();
    },
  };
}

/** Se serializa y ejecuta dentro de la página; devuelve las métricas de layout. */
async function measureLayout({ heroSelector, dashboardSelector }) {
  const splitTopLevel = (value) => {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const char of value) {
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    return parts;
  };

  const box = (rect) => ({
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  });

  const hero = document.querySelector(heroSelector);
  const dashboard = document.querySelector(dashboardSelector);
  if (!hero || !dashboard) return { error: 'No se encontró el hero o el contenedor principal' };

  // Cada capa [data-hero-image] es una foto a pantalla completa del hero.
  const layers = [];
  for (const element of hero.querySelectorAll('[data-hero-image]')) {
    const style = getComputedStyle(element);
    const urls = splitTopLevel(style.backgroundImage).filter((layer) => layer.startsWith('url('));
    const imageUrl = urls[0] ? urls[0].slice(4, -1).replace(/^["']|["']$/g, '') : null;
    let image = null;
    if (imageUrl) {
      const preview = new Image();
      preview.src = imageUrl;
      await preview.decode();
      image = { width: preview.naturalWidth, height: preview.naturalHeight };
    }
    layers.push({
      name: element.getAttribute('data-hero-image'),
      backgroundSize: style.backgroundSize,
      rect: box(element.getBoundingClientRect()),
      image,
    });
  }

  const heroRect = hero.getBoundingClientRect();
  const sections = [...dashboard.children].map((child) => ({
    label: child.getAttribute('aria-label') ?? child.tagName.toLowerCase(),
    rect: box(child.getBoundingClientRect()),
    clippedY: child.scrollHeight - child.clientHeight > 1,
    clippedX: child.scrollWidth - child.clientWidth > 1,
  }));

  const root = document.documentElement;
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    scrollHeight: root.scrollHeight,
    scrollWidth: root.scrollWidth,
    hero: { rect: box(heroRect), theme: hero.getAttribute('data-theme'), layers },
    sections,
  };
}

function intersects(a, b) {
  return a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
}

/** Con cover, la imagen conserva su proporción y se recorta en el eje que sobra. */
function describeCrop(heroRect, image) {
  const boxRatio = heroRect.width / heroRect.height;
  const imageRatio = image.width / image.height;
  const horizontal = boxRatio < imageRatio;
  const crop = horizontal ? 1 - boxRatio / imageRatio : 1 - imageRatio / boxRatio;
  return { boxRatio, imageRatio, crop, axis: horizontal ? 'horizontal' : 'vertical' };
}

function evaluate(metrics) {
  const problems = [];
  const warnings = [];
  const landscape = metrics.innerWidth > metrics.innerHeight;

  if (metrics.error) return { problems: [metrics.error], warnings, summary: null };

  if (metrics.scrollWidth > metrics.innerWidth + 1) problems.push('scroll horizontal');
  if (landscape && metrics.scrollHeight > metrics.innerHeight + 1) problems.push('scroll vertical en horizontal');

  for (const section of metrics.sections) {
    if (section.clippedY || section.clippedX) problems.push(`contenido desbordado en «${section.label}»`);
    if (landscape && section.rect.bottom > metrics.innerHeight + 1) {
      problems.push(`«${section.label}» sale de la pantalla`);
    }
  }
  for (let i = 0; i < metrics.sections.length; i += 1) {
    for (let j = i + 1; j < metrics.sections.length; j += 1) {
      if (intersects(metrics.sections[i].rect, metrics.sections[j].rect)) {
        problems.push(`solape entre «${metrics.sections[i].label}» y «${metrics.sections[j].label}»`);
      }
    }
  }

  const crops = [];
  if (metrics.hero.layers.length === 0) problems.push('el hero no tiene imagen de fondo');
  for (const layer of metrics.hero.layers) {
    if (layer.backgroundSize !== 'cover') {
      problems.push(`background-size de la imagen «${layer.name}» es «${layer.backgroundSize}», debe ser cover`);
    }
    if (!layer.image) {
      problems.push(`la capa «${layer.name}» del hero no tiene imagen`);
      continue;
    }
    const crop = { name: layer.name, ...describeCrop(metrics.hero.rect, layer.image) };
    crops.push(crop);
    if (crop.crop > MAX_CROP_RATIO) {
      const message = `recorte de la imagen «${layer.name}» ${(crop.crop * 100).toFixed(1)}% (máx. ${MAX_CROP_RATIO * 100}%)`;
      warnings.push(message);
    }
  }

  return { problems, warnings, summary: { crops } };
}

async function captureViewport(page, viewport) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    ...viewport,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const loaded = page.once('Page.loadEventFired');
  await page.send('Page.navigate', { url: pageUrl });
  await loaded;

  const readySelector = /(^|&)feed=/.test(options.query) ? NEWS_HERO_SELECTOR : HERO_SELECTOR;
  const ready = `document.fonts.ready.then(() => !document.querySelector('[aria-busy="true"]') && !!document.querySelector(${JSON.stringify(readySelector)}))`;
  await waitFor(
    async () => (await page.send('Runtime.evaluate', { expression: ready, awaitPromise: true })).result.value,
    READY_TIMEOUT_MS,
    'a que termine la carga de datos',
  ).catch(() => undefined);

  // Los fundidos (cambio de tema) deben haber terminado antes de medir y capturar.
  await page.send('Runtime.evaluate', {
    expression: 'Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => undefined)))',
    awaitPromise: true,
  });

  const expression = `(${measureLayout.toString()})(${JSON.stringify({
    heroSelector: HERO_SELECTOR,
    dashboardSelector: DASHBOARD_SELECTOR,
  })})`;
  const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'Error al medir el layout');
  const metrics = result.value;

  const fullHeight = Math.max(viewport.height, metrics.scrollHeight ?? 0);
  const { data } = await page.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: viewport.width, height: fullHeight, scale: 1 },
  });
  const file = join(outputDir, `${viewport.width}x${viewport.height}.png`);
  await writeFile(file, Buffer.from(data, 'base64'));

  return { viewport, file, metrics, ...evaluate(metrics) };
}

function formatLine({ viewport, metrics, problems, warnings, summary }) {
  const name = `${viewport.width}x${viewport.height}`.padEnd(10);
  const status = problems.length > 0 ? 'ERR' : warnings.length > 0 ? 'AVI' : 'OK ';
  if (!summary?.crops?.length) return `${status} ${name} ${problems.join('; ')}`;
  const { width, height } = metrics.hero.rect;
  const crops = summary.crops
    .map(({ name: layer, crop, axis }) => `${layer} ${(crop * 100).toFixed(1)}% ${axis}`)
    .join(' · ');
  return (
    `${status} ${name} hero ${Math.round(width)}x${Math.round(height)} ratio ${(width / height).toFixed(2)}` +
    ` · tema ${metrics.hero.theme} · recorte ${crops}`
  );
}

async function main() {
  await assertAppReachable();
  await mkdir(outputDir, { recursive: true });

  const profileDir = await mkdtemp(join(tmpdir(), 'weatherdash-screenshots-'));
  const { chrome, exited, port } = await launchChrome(profileDir);
  let page;
  const results = [];

  try {
    page = await connectToPage(port);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    for (const viewport of VIEWPORTS) results.push(await captureViewport(page, viewport));
  } finally {
    page?.close();
    chrome.kill('SIGTERM');
    await exited;
    // Los procesos hijos de Chrome pueden seguir escribiendo en el perfil unos instantes.
    await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }).catch(() => undefined);
  }

  const layers = results.find((entry) => entry.metrics.hero?.layers)?.metrics.hero.layers ?? [];
  console.log(`URL: ${pageUrl}`);
  for (const { name, image } of layers) {
    if (image) console.log(`Imagen del hero (${name}): ${image.width}x${image.height} (ratio ${(image.width / image.height).toFixed(3)})`);
  }
  for (const entry of results) {
    console.log(formatLine(entry));
    if (!entry.summary) continue;
    for (const problem of entry.problems) console.log(`      - ${problem}`);
    for (const warning of entry.warnings) console.log(`      - aviso: ${warning}`);
  }

  await writeFile(join(outputDir, 'report.json'), JSON.stringify(results, null, 2));
  console.log(`Capturas e informe en ${outputDir}`);

  if (results.some((entry) => entry.problems.length > 0)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
