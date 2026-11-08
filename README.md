# BarberPro Studio — M13

Base reconstruida en un directorio independiente. El original no se modifica.

## Instalación local

Usar Node 20.20.2 (`.nvmrc`) y npm 10. Con Node ya disponible:

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
```

La dependencia de desarrollo `node` proporciona el mismo runtime aislado para los scripts npm del proyecto; no cambia el Node global.

## Comandos

```powershell
npm run dev
npm run check
npm run test:unit
npm run build
npm run test:e2e
```

El servidor solo escucha en loopback. Las seis páginas públicas funcionan sin Firebase. Las demás rutas muestran un estado no disponible, sin datos ni operaciones privadas.

## Firebase

La integración está desactivada por defecto. `app/.env.example` contiene únicamente ejemplos. Para fases posteriores, copiar a `.env.local` y habilitar el modo de emuladores completo. Solo se admite el proyecto ficticio `demo-barberpro-m13` desde localhost/127.0.0.1; Auth 9099, Firestore 8088 y Functions 5001.

No se incluyen comandos de despliegue ni credenciales. Las reglas nuevas deniegan todas las operaciones hasta implementar y probar los permisos.

## Estado y documentación

Consultar [fase 3](docs/fase-3-implementacion.md) y [avance](docs/control-avance.md). Las funcionalidades de autenticación, reservas, personal y administración corresponden a fases posteriores. Esta base no simula sesiones ni autorizaciones.
