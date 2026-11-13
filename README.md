# BarberPro Studio — M13

Gestión de reservas y agenda de barbería con cuatro roles: cliente, profesional, responsable y administrador. Demo académica local con datos ficticios.

Tecnologías: Astro estático, TypeScript, Tailwind, Firebase Auth/Firestore/Functions mediante emuladores. Requisitos: Node 22.23.4, npm 10 o posterior y Java 21. No hace falta cuenta Firebase.

## Instalación

Desde la raíz del proyecto en PowerShell:

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
Copy-Item app/.env.example app/.env.local
```

En app/.env.local cambiar PUBLIC_USE_FIREBASE_EMULATORS y PUBLIC_USE_FUNCTIONS_EMULATOR a 1. Conservar los demás valores ficticios. Instrucciones completas y problemas habituales: [INSTALACION](docs/INSTALACION.md).

## Arranque

Primera terminal: npm run emulators. Esperar a que estén preparados. Segunda terminal, desde la misma raíz:

```powershell
npm run datos:local
npm run dev
```

Abrir http://127.0.0.1:4321. datos:local restablece exclusivamente datos demo desechables; no repetirlo para conservar una exploración. Ctrl+C detiene los servidores. Las cuentas ficticias por rol están en [instalación](docs/INSTALACION.md).

## Pruebas

Detener servidores manuales y dejar libres los puertos de emuladores/QA:

```powershell
npm --prefix app exec -- playwright install chromium
npm test
```

También: npm run check, npm run build y npm run test:unit. La comparación visual requiere el original externo; sin él se omite expresamente. [Resultados y alcance](docs/PRUEBAS.md).

## Documentación

- [Funcionamiento y roles](docs/FUNCIONAMIENTO.md), [matriz de 40 grupos](docs/MATRIZ-REQUISITOS.md).
- [Arquitectura](docs/ARQUITECTURA.md), [seguridad y límites](docs/SEGURIDAD-Y-LIMITACIONES.md), [trazabilidad](docs/ANEXO-TRAZABILIDAD.md).
- [Defensa M13](docs/DEFENSA-M13.md) y [registro académico con asistencia de IA declarada](docs/REGISTRO-ACADEMICO.md).
- [Entrega de evaluación: ZIP, checksum e informe](https://github.com/sergilo1906/BarberPro-M13/releases/tag/evaluacion-m13-2026-11-13).
