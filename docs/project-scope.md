# Proyecto: Personal Dashboard — MVP

## 1. Objetivo del proyecto

Desarrollar una aplicación web privada, personal y de uso local que funcione como un dashboard informativo permanente, pensado inicialmente para visualizarse en una pantalla mediante un navegador a pantalla completa (kiosk mode).

La aplicación tendrá como objetivo mostrar información útil de un vistazo, con una interfaz visual cuidada, minimalista y optimizada para permanecer abierta durante largos periodos.

En esta primera versión (MVP), el alcance funcional queda limitado exclusivamente a:

1. Fecha y hora local.
2. Información meteorológica de una localidad configurable.

**IMPORTANTE:** No implementar noticias, RSS, scraping, calendario, cotizaciones bursátiles ni ninguna otra funcionalidad futura. La arquitectura debe permitir incorporarlas posteriormente sin necesidad de modificar sustancialmente los módulos existentes.

Se proporcionará una imagen de referencia visual. Debe utilizarse como principal guía de diseño, distribución, jerarquía visual, colores, tipografía y espaciado. Nombre de la imagen: "weather_dash_example.webp"

La imagen con nombre "navaluenga.webp" corresponde a la sección hero y debe usarse con una capa en css que la oscurezca un poco para crear contraste, como imagen de background para el reloj. Una vez realizada la estructura del proyecto, está imagen deberá moverse a la carpeta assets.

No es necesario reproducirla pixel a pixel si ello perjudica la usabilidad o la adaptación a diferentes resoluciones.

---

## 2. Stack tecnológico

Utilizar las siguientes tecnologías:

### Frontend

- React 18.
- TypeScript en modo estricto.
- Vite como herramienta de desarrollo y construcción.
- CSS Modules o CSS convencional organizado por componentes.
- Lucide React para iconografía, cuando sea necesario.

Evitar incorporar bibliotecas de componentes visuales completas como Material UI, Ant Design o PrimeReact. Se busca una interfaz personalizada, ligera y coherente con la referencia visual.

No incorporar Redux. El estado de esta aplicación no justifica introducir una solución global de gestión de estado.

### Backend

- Node.js (versión LTS).
- TypeScript.
- Fastify.
- @fastify/cors únicamente si la configuración de desarrollo necesita comunicación entre distintos orígenes.
- Zod para validación de configuración y datos externos.
- dotenv para configuración mediante variables de entorno.

El backend debe servir también los archivos estáticos generados por Vite en producción, utilizando el mecanismo de serving estático de Fastify o una solución equivalente.

No utilizar Express.

### Meteorología

Utilizar Open-Meteo:

https://open-meteo.com/

API de previsión:

https://api.open-meteo.com/v1/forecast

Geocoding:

https://geocoding-api.open-meteo.com/v1/search

No se necesita API key para el uso previsto.

La aplicación debe consultar los datos meteorológicos exclusivamente desde el backend. El frontend nunca debe llamar directamente a Open-Meteo.

### Dependencias adicionales

Frontend:
- react
- react-dom
- lucide-react

Desarrollo frontend:
- vite
- typescript
- @vitejs/plugin-react-swc
- @types/react
- @types/react-dom

Backend:
- fastify
- @fastify/static
- zod
- dotenv

Desarrollo backend:
- tsx
- typescript
- @types/node

Testing:
- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- jsdom

Instalar exclusivamente las dependencias necesarias. No incorporar librerías redundantes ni dependencias que no tengan una justificación concreta.

---

## 3. Arquitectura general

Organizar el proyecto como un monorepo sencillo, con frontend y backend independientes dentro de un mismo repositorio.

Estructura orientativa:

```text
personal-dashboard/
│
├── apps/
│   ├── frontend/
│   │   ├── assets/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── clock/
│   │   │   │   └── weather/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── styles/
│   │   │   ├── types/
│   │   │   └── main.tsx
│   │   └── ...
│   │
│   └── backend/
│       ├── src/
│       │   ├── modules/
│       │   │   └── weather/
│       │   │       ├── weather.routes.ts
│       │   │       ├── weather.service.ts
│       │   │       ├── weather.provider.ts
│       │   │       ├── weather.schema.ts
│       │   │       └── weather.types.ts
│       │   ├── config/
│       │   ├── plugins/
│       │   ├── app.ts
│       │   └── server.ts
│       └── ...
│
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

La estructura es orientativa. Se puede adaptar si existe una justificación arquitectónica clara.

No crear abstracciones innecesarias ni estructuras vacías para funcionalidades que todavía no existen.

### Responsabilidades

Frontend:
- Renderizar la interfaz.
- Mostrar fecha y hora.
- Consumir la API local.
- Gestionar estados de carga y errores.
- Actualizar periódicamente la información meteorológica.

Backend:
- Gestionar la configuración de la localidad.
- Consultar el servicio Open-Meteo.
- Transformar su respuesta a un modelo interno estable.
- Mantener una caché en memoria.
- Exponer endpoints REST locales.
- Gestionar errores y timeouts.

La lógica específica de Open-Meteo debe estar aislada del resto de la aplicación. No acoplar los componentes React al modelo de respuesta del proveedor.

---

## 4. Funcionalidades del MVP

### 4.1. Fecha y hora

Mostrar:

- Hora local.
- Segundos.
- Día de la semana.
- Día del mes.
- Mes.
- Año.

Utilizar `Intl.DateTimeFormat` para el formateo regional.

Idioma inicial: español (`es-ES`).

Zona horaria: utilizar inicialmente la zona horaria local del sistema donde se ejecuta el navegador.

La hora debe actualizarse cada segundo.

IMPORTANTE:
- No realizar peticiones al backend para actualizar el reloj.
- Evitar provocar renders innecesarios en el resto de la aplicación.
- Mantener la precisión de la actualización incluso cuando el navegador retrase los temporizadores.
- Evitar intervalos que provoquen acumulación o fugas de memoria.

### 4.2. Meteorología

Utilizar Open-Meteo para mostrar:

**Información actual:**
- Temperatura actual.
- Temperatura aparente.
- Estado meteorológico.
- Humedad relativa.
- Velocidad del viento.
- Probabilidad de precipitación, si está disponible para el periodo actual.

**Información adicional:**
- Temperatura máxima del día.
- Temperatura mínima del día.
- Icono representativo de las condiciones meteorológicas.

Consultar los datos mediante los campos correspondientes de Open-Meteo.

Utilizar los códigos WMO de condiciones meteorológicas para traducir las respuestas a descripciones e iconos comprensibles.

Unificar la lógica de interpretación meteorológica en un módulo independiente.

No introducir una librería meteorológica externa para resolver esta funcionalidad.

### 4.3. Localidad configurable

La localidad inicial será Navaluenga en la provincia de Ávila, con fallback a Ávila (ciudad), España.

No obstante, debe poder modificarse mediante configuración.

Utilizar geocoding de Open-Meteo para obtener las coordenadas de la localidad.

Guardar como configuración:

- Nombre de localidad.
- País.
- Latitud.
- Longitud.
- Zona horaria.

No implementar todavía un selector visual de ciudades. Basta con permitir su configuración mediante variables de entorno.

---

## 5. Backend y API

Crear los siguientes endpoints:

### GET /api/health

Comprobar que el backend está funcionando.

Respuesta orientativa:

```json
{
  "status": "ok"
}
```

### GET /api/weather

Devolver la información meteorológica normalizada.

Ejemplo orientativo:

```json
{
  "location": {
    "name": "Ávila",
    "country": "España"
  },
  "current": {
    "temperature": 14,
    "apparentTemperature": 12,
    "relativeHumidity": 65,
    "windSpeed": 12,
    "precipitationProbability": 10,
    "weatherCode": 2,
    "description": "Parcialmente nuboso",
    "isDay": true
  },
  "daily": {
    "temperatureMax": 17,
    "temperatureMin": 7
  },
  "updatedAt": "2026-11-23T10:00:00Z"
}
```

Los valores anteriores son exclusivamente ilustrativos.

### Requisitos del backend

- Validar los datos recibidos de Open-Meteo.
- Establecer un timeout para las peticiones externas.
- Gestionar errores de red.
- Implementar caché en memoria.
- Periodicidad de actualización meteorológica configurable, inicialmente 15 minutos.
- Si Open-Meteo no está disponible, devolver la última información válida almacenada, identificándola como desactualizada.
- Si todavía no existe información almacenada, devolver un error controlado.
- No bloquear el arranque del servidor por una indisponibilidad temporal de Open-Meteo.

Evitar realizar peticiones duplicadas simultáneas cuando varios clientes soliciten la misma información.

---

## 6. Diseño visual y experiencia de usuario

La imagen adjunta será la referencia visual principal.

Antes de implementar la interfaz:

1. Analizar la imagen.
2. Identificar sus principales características visuales.
3. Definir la distribución de los elementos.
4. Identificar la paleta de colores.
5. Identificar jerarquías tipográficas.
6. Determinar cómo adaptar el diseño a diferentes resoluciones.

Priorizar una apariencia:
- Minimalista.
- Moderna.
- Elegante.
- Clara.
- Adecuada para permanecer visible durante muchas horas.
- Sin elementos decorativos innecesarios.

La fecha y hora deben tener una jerarquía visual importante.

La meteorología debe poder consultarse de un vistazo.

Evitar:
- Exceso de tarjetas.
- Bordes innecesarios.
- Sombras exageradas.
- Animaciones constantes.
- Elementos que distraigan.
- Scrollbars en la resolución principal.

La interfaz debe adaptarse a:
- 1920x1080.
- 1366x768.
- 1280x720.

Debe ser usable también en orientación vertical, aunque la prioridad sea horizontal.

No utilizar imágenes externas innecesarias. Priorizar CSS e iconografía vectorial.

### Estados visuales

Implementar:
- Carga inicial.
- Error de conexión.
- Información meteorológica disponible.
- Información meteorológica desactualizada.
- Última actualización.

Un error meteorológico nunca debe impedir mostrar el reloj.

---

## 7. Rendimiento y compatibilidad con Raspberry Pi 3B

La aplicación debe poder ejecutarse posteriormente en una Raspberry Pi 3B con 1 GB de RAM.

Prioridades:

- Bajo consumo de memoria.
- Pocas dependencias.
- Sin animaciones costosas.
- Sin gráficos complejos.
- Sin imágenes de gran tamaño.
- Evitar renders innecesarios.
- No ejecutar procesos de scraping ni tareas pesadas en el navegador.
- No introducir librerías que incrementen considerablemente el bundle.

Utilizar compilación de producción para el despliegue.

El backend debe servir el frontend compilado para evitar necesitar un servidor de desarrollo Vite en producción.

El navegador previsto será Chromium en modo kiosk.

No es necesario implementar todavía la configuración del sistema operativo ni el arranque automático de Chromium, pero documentar cómo se ejecutará posteriormente.

---

## 8. Calidad del código

Aplicar los siguientes criterios:

- TypeScript strict.
- No utilizar `any`.
- Evitar conversiones de tipos inseguras.
- Componentes funcionales.
- Responsabilidad única por módulo.
- Separación entre presentación, servicios y lógica de negocio.
- Evitar prop drilling innecesario.
- No introducir patrones de diseño sin necesidad.
- No duplicar lógica.
- Evitar constantes mágicas.
- Centralizar configuración.
- Utilizar nombres descriptivos.
- Manejar explícitamente los errores.

No modificar configuraciones de linting o TypeScript existentes sin una justificación.

No introducir dependencias para resolver problemas que puedan solucionarse de forma sencilla con APIs nativas.

---

## 9. Testing

Implementar pruebas para las funcionalidades importantes.

Como mínimo:

**Frontend**
- Formateo de fecha y hora.
- Actualización del reloj.
- Renderizado de meteorología.
- Estado de carga.
- Estado de error.
- Información desactualizada.

**Backend**
- Normalización de la respuesta de Open-Meteo.
- Interpretación de códigos meteorológicos.
- Validación de datos externos.
- Caché.
- Gestión de errores del proveedor.
- Endpoints REST.

Mockear las peticiones externas. Las pruebas no deben depender de que Open-Meteo esté disponible.

---

## 10. Scripts y ejecución

Crear scripts de ejecución desde la raíz del proyecto.

Como mínimo:

```bash
npm run dev
npm run build
npm run test
npm run typecheck
npm run start
```

`dev` debe permitir desarrollar frontend y backend simultáneamente.

`build` debe compilar ambos proyectos.

`start` debe ejecutar el backend en producción sirviendo el frontend compilado.

`typecheck` debe comprobar ambos proyectos.

No utilizar comandos que oculten errores de compilación o testing.

---

## 11. Variables de entorno

Crear `.env.example`:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

WEATHER_LOCATION_NAME=Ávila
WEATHER_COUNTRY=España
WEATHER_LATITUDE=
WEATHER_LONGITUDE=
WEATHER_TIMEZONE=Europe/Madrid

WEATHER_REFRESH_INTERVAL=900000
```

Permitir que el backend resuelva las coordenadas mediante geocoding si no están configuradas explícitamente.

No introducir credenciales ni secretos en el repositorio.

---

## 12. Documentación

Crear un README que explique:

- Requisitos previos.
- Instalación.
- Configuración.
- Ejecución en desarrollo.
- Compilación.
- Ejecución en producción.
- Variables de entorno.
- Arquitectura.
- Integración con Open-Meteo.
- Futuro despliegue en modo kiosk.

---

## 13. Fuera del alcance del MVP

No implementar:

- Noticias.
- Google News.
- RSS.
- Scraping.
- SQLite.
- Autenticación.
- Usuarios.
- Redux.
- Calendario.
- Inteligencia artificial.
- Docker.
- Electron.
- Tauri.
- Panel de administración.
- Configuración visual de fuentes meteorológicas.

La arquitectura debe permitir ampliar el proyecto en el futuro, pero no anticipar funcionalidades mediante abstracciones innecesarias.

---

## 14. Criterios de aceptación

El MVP se considerará terminado cuando:

1. El proyecto se instale correctamente.
2. Frontend y backend arranquen mediante un único comando de desarrollo.
3. La hora y fecha se muestren correctamente en español.
4. El reloj actualice los segundos sin provocar renders innecesarios del dashboard.
5. La meteorología se obtenga correctamente desde Open-Meteo.
6. El backend normalice los datos meteorológicos.
7. El frontend consuma exclusivamente la API local.
8. La información meteorológica se almacene temporalmente en caché.
9. Los errores de Open-Meteo no impidan utilizar el reloj.
10. La interfaz respete la referencia visual proporcionada.
11. La aplicación funcione sin errores en una compilación de producción.
12. Las pruebas, el typecheck y el build finalicen correctamente.

---

## 15. Forma de trabajo del agente

Antes de empezar a implementar:

1. Inspeccionar el repositorio y sus archivos existentes.
2. Comprobar las versiones de Node.js y npm disponibles.
3. Analizar la imagen de referencia.
4. Presentar brevemente la arquitectura y las dependencias propuestas.

Después, implementar el MVP por fases.

No generar todo el proyecto en un único archivo ni concentrar toda la lógica en componentes grandes.

Al finalizar:

- Ejecutar typecheck.
- Ejecutar tests.
- Ejecutar build.
- Corregir todos los errores.
- Revisar las dependencias instaladas.
- Comprobar que no existen imports innecesarios.
- Entregar un resumen de la arquitectura y decisiones adoptadas.
- Documentar cualquier limitación pendiente en carpeta docs/

**Prioridad absoluta:** código mantenible, simplicidad arquitectónica, buena experiencia visual y compatibilidad con hardware limitado.

No sacrificar calidad de código por terminar antes.