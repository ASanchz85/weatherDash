// Arranca backend y frontend en modo desarrollo de forma simultánea.
// Si cualquiera de los dos procesos termina, se detiene el otro y se propaga el código de salida.
import { spawn } from 'node:child_process';

const workspaces = ['apps/backend', 'apps/frontend'];
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = workspaces.map((workspace) =>
  spawn(npmCommand, ['run', 'dev', '--workspace', workspace], { stdio: 'inherit' }),
);

let shuttingDown = false;

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('exit', (code) => shutdown(code ?? 1));
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
