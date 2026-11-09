# Estado de pausa — BarberPro Studio M13

> Referencia actual: el usuario autorizó expresamente fase 5 el 9 de noviembre de 2026. Su resultado y pendientes están en [fase 5](fase-5-reservas-disponibilidad.md). No se ha iniciado fase 6 ni se programa una reanudación automática. Este archivo y sus anotaciones anteriores se conservan como historial de pausa; consultar control-avance para el estado del código.

> Registro histórico del 8 de noviembre. El 9 de noviembre de 2026 se recibió una instrucción nueva y expresa para implementar fase 4. Se ha trabajado exclusivamente en esa fase; su estado actual y limitaciones están en [el informe](fase-4-autenticacion-usuarios-roles.md) y [control de avance](control-avance.md). No se han implementado fases 5, 6 ni 7. Las instrucciones de reanudación y estados anteriores de este registro se conservan como historial y ya no describen el código actual.

## Estado real antes del descanso

Comprobación inicial: 8 de noviembre de 2026, 19:48:53 UTC. Proyecto reconstruido: BarberPro-M13. Rama local: fase-3-base. Último commit de implementación: 0882f3d (Completa la base local de la fase 3).

| Fase | Estado real |
|---|---|
| 1 — Auditoría | Completada según el historial y la documentación conservada. |
| 2 — Arquitectura y planificación | Completada; documentos en ../BarberPro-M13-Planificacion/docs. |
| 3 — Base técnica e interfaz pública | Completada en su alcance, con limitaciones registradas. |
| 4 — Autenticación, usuarios, roles y seguridad | Instrucciones recibidas; implementación no iniciada. |
| 5 — Reservas y disponibilidad | Instrucciones recibidas; implementación no iniciada. Depende de fase 4. |
| 6 — Área del cliente | Instrucciones recibidas; implementación no iniciada. Depende de fases 4 y 5. |
| 7 — Área del profesional y gestión de agenda | Siguiente fase solicitada como destino del bloque; todavía no corresponde ejecutarla. No se han recibido sus instrucciones completas. |

La afirmación del último pedido de pausa de que las fases 4, 5 y 6 están terminadas no coincide con el trabajo realizado. Se recibieron sus adjuntos durante la pausa posterior a fase 3, sin cancelación expresa del descanso. No se crearon sus módulos ni informes y no se ejecutaron sus pruebas. No se presentan como completadas.

La siguiente fase realmente pendiente es la 4. Antes de abordar la fase 7 deben completarse y verificarse las fases 4, 5 y 6. Sus solicitudes se conservan; esta pausa no las elimina ni equivale a ejecutarlas.

## Archivos y procesos

- Git estaba limpio al iniciar esta preparación; no había cambios de desarrollo por guardar.
- Esta preparación añade únicamente este registro. No modifica código, configuraciones, dependencias ni el proyecto original.
- No se detectaron procesos activos correspondientes al desarrollo, pruebas o emuladores de BarberPro-M13 en la comprobación inicial.
- Los servidores de fase 3 estaban detenidos. No se inicia ningún proceso de desarrollo para la pausa.
- El registro se conserva mediante un commit local independiente; no se hace push ni despliegue.

## Documentación y planificación

[Informe de fase 3](fase-3-implementacion.md) y [control de avance](control-avance.md) reflejan la base implementada y las funcionalidades pendientes. El control de avance sigue siendo coherente con el estado real: autenticación, reservas y área privada del cliente pendientes. No se sobrescriben esos informes ni se marca avance inexistente.

La planificación de fase 2 está disponible en ../BarberPro-M13-Planificacion/docs: arquitectura.md, mapa-archivos.md, mapa-simbolos.md, rutas-y-roles.md, funcionalidades.md, plan-reconstruccion.md y control-cobertura.md. Es la referencia histórica de diseño, no una certificación de implementación. Se conserva intacta. Este archivo registra las nuevas solicitudes y el punto de reanudación sin reescribir el historial.

Instrucciones completas recibidas, disponibles en estos adjuntos locales:

- Fase 4: C:/Users/Sergi/.codex/attachments/8d216d7a-4f62-4f98-adb9-a7d4e0791746/Pasted text.txt
- Fase 5: C:/Users/Sergi/.codex/attachments/f26e9feb-e85b-448f-a673-17bdad699c3d/Pasted text.txt
- Fase 6: C:/Users/Sergi/.codex/attachments/f81452f1-d256-43e0-bb83-ed2140a7ae35/Pasted text.txt

## Pendientes y límites de la evidencia

- Implementar y probar la fase 4: Auth real en entorno local, perfiles, sesión, roles, claims, navegación, guards y autorización en backend/reglas. No hay autenticación funcional todavía.
- Configurar y ejecutar la integración real con emuladores; en fase 3 solo se probaron límites de configuración con mocks y ping unitariamente. Las reglas nuevas deniegan todo.
- Implementar y probar la fase 5, incluidos conflictos de reservas y concurrencia; después integrar la experiencia del cliente de fase 6.
- Revisar antes de publicar los avisos npm audit registrados: app 22 (11 moderados, 8 altos y 3 críticos) y Functions 9 moderados. No se ejecuta una auditoría nueva durante esta pausa.
- El último resultado ejecutado en fase 3 fue: comprobaciones Astro/TypeScript correctas, build de 27 páginas, 7 pruebas unitarias y 74 pruebas de navegador superadas. Son resultados históricos de la base, no pruebas de fases 4–6.
- La comparación visual de fase 3 cubrió seis páginas públicas en escritorio/móvil y admite la tolerancia documentada de rasterizado; los flujos privados y dispositivos físicos siguen pendientes.
- No se ha accedido a datos reales de Firebase ni se ha desplegado, migrado o cambiado permisos de producción.

## Pausa y reanudación

Se solicita un descanso de tres horas completas después de guardar este estado. No se ejecuta Start-Sleep ni se promete que la sesión permanezca activa o se reanude automáticamente. Se cierra de forma segura. La respuesta final de cierre indicará la hora UTC comprobada y la hora mínima para retomar, tres horas después. No se afirma que la pausa anterior ni esta se hayan cumplido.

Durante el descanso: no desarrollar, modificar archivos, ejecutar pruebas, instalar dependencias ni operar sobre Firebase. No avanzar la fase 7.

Al regresar:

1. Verificar que hayan transcurrido tres horas desde la hora de cierre indicada en el chat; no asumirlo por la llegada de nuevos adjuntos.
2. Leer este archivo y comprobar git status y git log dentro de BarberPro-M13. Conservar y revisar cualquier cambio nuevo sin borrarlo ni sobrescribirlo.
3. Recuperar los informes, la planificación y las instrucciones adjuntas de fase 4. Comprobar el estado real de la base antes de desarrollar.
4. Retomar por fase 4, pendiente; no saltar a fase 7 suponiendo que las fases intermedias existen. Atender los límites y cierres de cada fase recibida.
5. Al llegar realmente al cierre de fase 6, realizar la pausa posterior a ese bloque. La fase 7 requiere sus instrucciones completas y autorización, además de las dependencias terminadas.

Las pausas no alteran la numeración ni cuentan como horas efectivas de desarrollo. También corresponden tras fase 9 y, si queda trabajo adicional, tras fase 12. No se inventa tiempo trabajado ni se garantiza el restablecimiento de límites del servicio.
