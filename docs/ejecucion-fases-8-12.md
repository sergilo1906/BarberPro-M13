# Ejecución autorizada de fases 8–12

Solicitud vigente: prompt maestro adjunto `78c0d929-d83f-4035-9340-a30cdff98054`, recibido el 10 de noviembre de 2026. Autoriza continuar entre fases sin confirmaciones ordinarias y sustituye las paradas anteriores, conservando la pausa obligatoria después de fase 9. Referencia: 30 horas de trabajo y tres horas de descanso; no se imputan como horas reales.

Base comprobada: commit `0815d8d`, Git limpio, informe y log final de fase 7 (33 unitarias, 48 integraciones, 178 navegador, 50 visuales). Se repitieron check y 33 unitarias antes de modificar código: salida 0. Rama de trabajo: `fases-8-12-entrega`. Solo se modifica este proyecto; original y planificación histórica permanecen como referencia de lectura.

| Fase | Estado vigente | Condición para continuar |
|---|---|---|
| 8 — Administración | Completada localmente: 35 unitarias, 57 integraciones, 212 navegador (68 visuales), build de 27 páginas. | Guardar cierre y continuar a fase 9. |
| 9 — Funciones restantes | En implementación, tras cierre de fase 8 y publicación verificada. Se han revisado panel/KPIs/CSV, diagnóstico, recordatorios y herramientas demo originales. | Probar funciones restantes, actualizar inventario y guardar antes de la pausa. |
| Pausa | Pendiente; no iniciada ni certificada. | Guardar fases 8–9, detener servicios y registrar hora fiable. Si no se garantiza espera y reanudación, detenerse de forma segura. |
| 10 — Comparación | Pendiente. | Pausa completa comprobable, sin bloqueos críticos. |
| 11 — Auditoría y limpieza | Pendiente. | Cerrar comparación y revisar avisos de dependencias, secretos, concurrencia y todos los originales. |
| 12 — Entrega | Pendiente. | Cerrar pruebas; documentación, ZIP limpio e instalación aislada verificadas. |

Decisiones iniciales de fase 8: `/admin` es un acceso a herramientas y `/index-admin` una entrada del personal. `/branding` solo edita timezone, cancelWindowHours y reminderWindowsHours; no hay editor de marca. Usuarios busca por correo exacto y cambia roles mediante adminSetClaims, sin inventar edición general. Equipo edita nombre/visibilidad; servicios crea/edita/activa, sin eliminación ni descripciones. El resumen diario `/panel` se mantiene para fase 9 como en el mapa aprobado. Horarios y bloqueos se reutilizan desde fase 7.

Las escrituras SDK de negocio siguen cerradas. Se añaden operaciones backend con permisos, campos limitados, control de versiones y recibos idempotentes compartidos. Cambiar duración/precio no reescribe snapshots de citas; cambiar zona horaria con citas afectadas se rechaza hasta una migración explícita. No se despliegan funciones/reglas ni se alteran datos reales.

Los avisos heredados de dependencias no se dan por resueltos: su aplicabilidad y tratamiento se revisarán para cerrar seguridad. El usuario ha indicado después «subelo todo al github» y «Continua»: autoriza publicar la fuente segura en su cuenta, manteniendo explícitos los pendientes. Sigue prohibido desplegar la aplicación/Firebase o enviar el proyecto al profesor. La entrega final solo se marcará preparada cuando exista evidencia de extracción e instalación limpia del ZIP.
