# Decisiones técnicas contrastadas

Las decisiones se apoyan en la fuente y en [las pruebas](pruebas-finales.md). No se presentan como decisiones manuales del alumno: la reconstrucción y su documentación han contado con asistencia de Codex.

| Decisión | Motivo y consecuencia |
| --- | --- |
| Conservar Astro estático | Mantiene las páginas y las rutas del original; los controladores TypeScript coordinan la interacción en el navegador. No se añade un servidor de sesión. |
| TypeScript en frontend | Los modelos y contratos ayudan a comprobar el uso de cuentas, citas, horarios y respuestas. El backend existente continúa como JavaScript ESM. |
| Conservar Tailwind y presentación | Permite comparar las mismas pantallas sin introducir un rediseño. Los cambios por seguridad o cálculo se documentan. |
| Separar presentación, coordinación y datos | Las páginas muestran la interfaz, los módulos responden a eventos y datos integra Firebase. El backend concentra validación y persistencia privilegiada. |
| Funciones y modelos sencillos | No se añaden clases sin una responsabilidad real ni frameworks nuevos. Los contratos públicos del SDK y Firestore conservan sus nombres. |
| Solo emuladores | El frontend valida proyecto/host y Admin exige variables exactas de Auth/Firestore locales. Los ensayos no modifican usuarios, citas o reglas productivas. |
| Permisos también en servidor | Custom Claims, versión y perfil deben coincidir. El backend consulta Auth vigente y las transacciones comprueban nuevamente el perfil del actor. Las reglas deniegan escrituras directas de negocio. |
| Transacciones y controles diarios | Reservas, cambios, semanas y bloqueos coordinan su ocupación. La consulta previa de disponibilidad no reserva por sí sola una hora. |
| Recuperación por solicitud | Un mismo requestId y contenido devuelve la operación ya confirmada; otro contenido con ese ID se rechaza. No se reintenta un alta con un ID nuevo tras perder su respuesta. |
| Estado de sesión y revisión de consultas | Las respuestas de una identidad anterior se descartan y se limpian datos privados al cambiar de cuenta o permisos. |
| DOM de datos como texto | Las plantillas constantes pueden usar innerHTML; los datos variables se asignan con textContent o propiedades de inputs. CSV e ICS tienen escapes específicos. |
| Recordatorios en cola | Se conserva el contrato y se prueba su idempotencia sin afirmar envío de correo ni desplegar un job. |
| Actualizaciones selectivas | Astro/Vitest/Node y overrides se cambiaron para tratar avisos concretos. No se actualizan indiscriminadamente los SDK; permanecen avisos moderados registrados. |
| Referencia visual aislada | Se lee la compilación original sin ejecutar su SDK ni escritores. Las pruebas comparan datos ficticios equivalentes y diferencian las fórmulas corregidas. |

Los módulos de persistencia y el modal de cambio requieren explicar su coordinación, no repartirlos mecánicamente en funciones para reducir líneas. Las [correspondencias](auditoria-final/correspondencias-archivos.md) identifican fusiones y sustituciones. La trazabilidad semántica completa de símbolos sigue pendiente en [mapa-simbolos](mapa-simbolos.md).
