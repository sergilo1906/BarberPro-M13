# Guía para comprender y defender M13

Material de estudio, no acreditación de trabajo personal. La reconstrucción, correcciones y documentación tienen asistencia de Codex. Antes de la defensa, recorrer el código y comprobar con datos ficticios cada explicación; no afirmar decisiones exclusivamente manuales ni horas no confirmadas.

## Presentación de dos minutos

BarberPro Studio organiza las reservas de una barbería. El cliente consulta servicios y huecos y gestiona sus citas. El profesional organiza su semana, agenda y bloqueos. El responsable gestiona equipo, servicios e indicadores; el administrador controla también usuarios, roles y configuración.

El frontend utiliza Astro estático para las páginas, Tailwind para estilos y TypeScript para formularios y sesión. Firebase Auth identifica usuarios, Firestore almacena datos y Functions valida las operaciones privilegiadas. Esta entrega funciona con emuladores locales y cuentas ficticias; no es un servicio comercial desplegado.

Una parte central es evitar que dos peticiones confirmen el mismo intervalo. El navegador consulta disponibilidad, pero el backend vuelve a comprobarla dentro de una transacción. Las pruebas incluyen conflictos simultáneos, roles, recuperación de errores, exportaciones y comparación visual. Los resultados concretos y sus límites están en el informe adjunto; no se promete seguridad o cobertura absolutas.

## Arquitectura que conviene enseñar

| Carpeta | Explicación y ejemplo |
| --- | --- |
| `app/src/pages` | 26 páginas Astro; `reservar.astro` contiene la pantalla de reserva. |
| `app/src/modulos` | Controladores de cada área; `reservas/reservar-cita.ts` coordina la selección y confirmación. |
| `app/src/datos` | Sesión, lecturas Firestore y llamadas remotas; `funciones-remotas.ts` conecta con Functions. |
| `app/src/comun`, `modelos`, `exportaciones` | Fechas, permisos y formularios compartidos; interfaces y generación CSV/ICS. |
| `functions/index.js` y `functions/src` | 19 exports, incluidos los 13 contratos originales; identidad, validaciones, disponibilidad, transacciones y cola. |
| `app/tests`, `functions/tests` | Unitarias, integración con emuladores y navegador. |

Recorrido para explicar una reserva: página → controlador → servicio de datos → `createBooking` en `reservas.js` → `intentarCrearReservaAtomica` en `persistencia-reservas.js`. Abrir estos archivos y localizar una validación y la transacción. No hace falta memorizar todas las funciones.

## Disponibilidad, concurrencia y errores

`disponibilidad.js` carga servicio y profesionales activos, semana publicada, tramos, descansos, bloqueos y ocupación. Solo ofrece intervalos en los que cabe la duración completa. La zona horaria del negocio se trata explícitamente; las horas inexistentes y los intervalos que cruzan un salto se rechazan. El contrato HH:mm no distingue las dos repeticiones de otoño: es un límite documentado, no un segundo motor de disponibilidad.

La consulta del navegador es orientativa: otro usuario puede reservar antes de confirmar. La transacción vuelve a leer permisos, configuración y disponibilidad; lee controles diarios y locks que también modifican las demás operaciones de agenda. Si hay un cambio concurrente, Firestore reintenta y se vuelve a evaluar el hueco. Reserva, ocupación, historial de reprogramación, recibo idempotente y confirmación en cola se confirman conjuntamente.

El `requestId` identifica una solicitud y su huella. Si la respuesta se pierde después de confirmar, repetir el mismo identificador con los mismos datos devuelve el resultado guardado. Reutilizarlo con otros datos se rechaza. Cancelar libera solo los locks que pertenecen a la cita. Una reprogramación fallida conserva la cita anterior; una correcta deja historia y sucesora enlazadas. Ver `reservas-concurrencia.test.mjs` y `reservas-consistencia.test.mjs` para explicar estos casos con evidencia.

## Roles y seguridad

Ocultar un botón ayuda a navegar, pero el usuario puede manipular el navegador. Las reglas Firestore cierran las escrituras directas de negocio y limitan las lecturas. Las Functions comprueban Auth, correo verificado cuando procede, rol y versión vigentes en Auth/perfil; las transacciones vuelven a contrastar el perfil del actor. Solo un administrador autorizado puede asignar roles. `setMyRole` conserva el contrato original, pero deniega el autoservicio de privilegios.

Al cambiar de identidad se descartan datos y respuestas pendientes de la sesión anterior. CSV protege textos que podrían interpretarse como fórmulas; las vistas no inyectan textos de datos como HTML. La fábrica Admin exige el proyecto demo y hosts exactos de emuladores. Esto se ensaya localmente; no acredita firma de tokens, revocación, índices ni infraestructura de producción.

## Demostración de diez minutos

Preparar antes los emuladores, fixtures y web según [leer primero](ENTREGA-LEER-PRIMERO.md). No ejecutar `npm test` mientras esos servidores estén activos. Usar fechas futuras a más de 12 h y cerrar sesión entre cuentas.

| Minutos | Demostración |
| --- | --- |
| 0–1 | Inicio y navegación. Explicar tecnologías, demo local y asistencia de Codex. |
| 1–4 | Cliente: entrar como `reservas-client`, reservar un hueco, ver Mis citas e ICS, cambiar y cancelar; abrir perfil. Los correos completos y contraseña están en la guía de arranque. |
| 4–6 | Profesional: `profesional-escritorio`, consultar agenda y estados; abrir semana siguiente, copiar sin guardar, explicar publicación; crear y eliminar un bloqueo libre. No reducir un horario con citas existentes. |
| 6–8 | Responsable: `reservas-manager`, equipo y servicio, panel/KPIs por periodo y CSV. Mostrar que Usuarios/roles no le corresponde. |
| 8–9 | Administrador: `reservas-admin`, buscar `admin-destino-escritorio@example.test`, cambiar su rol y revertirlo; mostrar reglas de agenda sin alterar la zona durante la demo. |
| 9–10 | Enseñar transacción/prueba concurrente y resumen de pruebas. Explicar cola local, límites y qué requeriría producción. |

La demostración personal sigue pendiente hasta que el alumno la haga; las automatizadas no la sustituyen. Si falta tiempo, mostrar menos pantallas y explicar el código con precisión antes que simular acciones no realizadas.

## Preguntas técnicas para razonar

1. **¿Por qué Astro estático?** Genera HTML y recursos para las páginas; TypeScript en el navegador aporta formularios y sesión. No hay una sesión de servidor por el hecho de generar HTML.
2. **¿Qué aporta TypeScript?** Comprueba contratos durante desarrollo. Los parámetros que llegan a Functions todavía requieren validación en ejecución.
3. **¿Qué diferencia Auth de Firestore?** Auth identifica al usuario; Firestore almacena perfiles, horarios, catálogo, citas y notificaciones. Un perfil por sí solo no acredita identidad.
4. **¿Por qué cuatro roles?** Separan acciones de cliente, trabajo propio del profesional, gestión del responsable y administración de permisos/configuración. Ver `PERMISOS_RUTA` y controles backend.
5. **¿Basta con ocultar botones?** No: se pueden invocar operaciones desde fuera de la interfaz. Las reglas y Functions son la autoridad efectiva.
6. **¿Por qué guardar una versión de rol?** Detecta desajustes entre token, Auth y perfil. Un permiso desactualizado se deniega; no se conserva un privilegio para ocultar un fallo intermedio entre servicios.
7. **¿Qué pasa con dos reservas simultáneas?** Las transacciones comparten controles/ocupación; el conflicto obliga a reevaluar y solo puede confirmarse una selección incompatible. Hay una prueba con solicitudes reales al emulador.
8. **¿Por qué consultar de nuevo el hueco?** La disponibilidad pudo cambiar desde que se mostró. La primera consulta no bloquea el calendario.
9. **¿Qué es idempotencia aquí?** Repetir una misma solicitud confirmada con igual identificador/datos devuelve su resultado en vez de crear otra reserva.
10. **¿Qué pasa si falla reprogramar?** No se confirma ninguna escritura de su transacción y la cita anterior conserva su estado y ocupación. La suite comprueba también conflictos y respuestas perdidas.
11. **¿Qué son los locks?** Documentos de ocupación asociados a una cita. Se coordinan con controles diarios; no sustituyen validar toda la duración ni justifican borrar locks de otra reserva.
12. **¿Cómo se tratan los cambios horarios?** Se convierte fecha/hora con zona IANA y se comprueba la vuelta. Se rechazan horas inexistentes e intervalos que cruzan el salto; las repeticiones HH:mm tienen el límite documentado.
13. **¿Por qué snapshots del servicio en la cita?** Conservan nombre, precio y duración del momento de reservar aunque el catálogo cambie después.
14. **¿Qué hace el recordatorio?** Añade una notificación `queued` y marcas transaccionales para evitar duplicados. No envía correo y solo se ejecuta manualmente; se retiró el job programado.
15. **¿Cómo evita CSV una fórmula maliciosa?** Neutraliza textos con prefijos interpretables por una hoja de cálculo y escapa comillas/separadores; el formato se prueba con datos hostiles.
16. **¿Por qué UTC en ICS?** El evento representa un instante independiente del navegador. Se escapan textos y se pliegan líneas por bytes UTF-8; no se certifican todos los importadores externos.
17. **¿Qué diferencia las pruebas?** Unitarias aíslan cálculos/validaciones; integración prueba reglas y operaciones reales en emuladores; E2E actúa en el navegador. Ninguna por sí sola demuestra todos los escenarios.
18. **¿284 pruebas y 126 visuales se suman?** No: las 126 están incluidas en los 284 casos del workspace. En el ZIP sin original se omiten esas comparaciones expresamente y pasan los 158 recorridos funcionales.
19. **¿3.122 registros prueban equivalencia completa?** No: hay declaraciones, contratos, decisiones manuales y ámbitos reestructurados. La tabla aporta trazabilidad con distintos niveles, no una demostración matemática por variable.
20. **¿Qué hace GitHub Actions?** Instala los tres árboles y comprueba tipos, build y unitarias. No despliega, no arranca Firebase productivo y no sustituye las integraciones/E2E locales. Su ejecución real se identifica en la validación adjunta.
21. **¿Por qué quedan avisos moderados?** Los parches analizados exigen cambios mayores fuera de los rangos instalados. Se documenta exposición y límites; no se afirma que un aviso desaparece por usar emuladores.
22. **¿Qué parte debe confirmar el alumno?** Comprensión del código, recorrido personal, datos y horas reales y normas del centro. Codex y las pruebas automáticas no acreditan esas actividades.

## Qué faltaría para uso comercial

Una configuración productiva diseñada y autorizada, secretos e IAM gestionados, revisión de dependencias, reglas e índices desplegados y probados, hosting y dominio, proveedor de correo/cola con estados de entrega, programación de jobs, observabilidad, copias y restauración, privacidad/legal reales, carga y pruebas en otros navegadores/dispositivos. No basta con cambiar el identificador Firebase: el código actual deniega el entorno productivo deliberadamente.

La rúbrica exacta de M13 no se ha facilitado. Esta guía ayuda a explicar la demo y sus límites; no atribuye aceptación ni nota al profesor.
