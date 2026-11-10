# Correspondencias vigentes de símbolos

La auditoría extra confirma que la planificación de 3.122 registros no es una revisión semántica de la implementación. Véanse [revisión de código](auditoria-final/02-revision-codigo.md) e inventario.json para las declaraciones actuales, imports y límites. No se marca cada callback, variable o propiedad como verificado mediante una mera búsqueda de su nombre.

Las propuestas de fase 2 son una referencia, no una certificación de nombres implementados. Los informes 3–7 registran las correspondencias ejecutadas de esos módulos. Este documento incorpora las decisiones reales de administración; la revisión global del inventario histórico de 3.122 registros sigue pendiente de la fase 11. No se declara ejecución de todos esos símbolos.

| Original / ámbito | Implementación actual | Motivo |
|---|---|---|
| admin-users.searchUsersByEmail / lastSearchEmail | usuarios.buscarUsuarios y campo correo; datos.buscarUsuariosPorCorreo | El formulario conserva la búsqueda exacta; no hace falta una segunda caché del mismo correo. |
| admin-users.renderUserCard / roleOptions / roleLabel | tarjeta-usuario.crearTarjetaUsuario / opciones DOM / obtenerEtiquetaRol | Datos como texto y roles canónicos compartidos. |
| readOperationalStatus / weekStartToday | obtenerEstadoOperativo / obtenerLunesSemana + formatearFechaNegocio | Estados reales y zona horaria del negocio. |
| statusClasses | clasesEstadoOperativo | Reutilizada por usuarios y resumen semanal. |
| bindApplyButtons / adminSetClaimsCall | eventos de crearTarjetaUsuario / cambiarRolUsuario | Un envío por operación y backend ya autorizado. |
| equipo.loadTeam / saveProfile / bindTeamActions | cargarEquipo / guardarProfesional / eventos por tarjeta | Guardado por blur, Enter y visibilidad, sin duplicar solicitudes. |
| equipo.setCardBusy / profiles | bloquear / equipo | Estado de controles y FichaEquipo tipada. |
| services.loadServices / serviceCard / bindServiceActions | cargarServicios / crearTarjetaServicio / eventos por tarjeta | Consulta completa separada de presentación y guardado. |
| services.createForm / servicesList / active | formulario / lista / activo o campos wire active | Nombres españoles propios; claves de Firestore conservadas. |
| branding.loadConfig / parseReminderHours | cargarConfiguracion / validación explícita de todos los valores | No descartar silenciosamente una ventana inválida. |
| branding.saveBtn / timezoneInput / remindersInput | guardar / zona / avisos | Controles originales con nueva coordinación. |
| horarios.loadHoursSummary / currentWeekStart | carga autorizada del resumen / obtenerLunesSemana | Sin duplicar el editor semanal. |
| requireRole / guards repetidos | observarAreaAutorizada / protegerRutaActual | Contexto vigente e invalidación de respuestas de otra identidad. |
| updateDoc/setDoc/addDoc de negocio | saveTeamProfile/saveService/saveAgendaSettings | Nuevos contratos protegidos; escrituras directas siguen denegadas. |
| Tokens, UID, colecciones y campos externos | uid, role, barberUid, services, barbers, config/app, durationMin, price, active | Contratos de integración conservados. |
| adminRevision / expectedRevision / requestId | Campos adicionales de control | Comparación de versión y recuperación sin duplicados; ausencia de revisión equivale a cero. |

No se crean clases artificiales. Los selectores e IDs originales siguen enlazando las mismas pantallas; los data-atributos nuevos solo sirven para asignar texto o localizar elementos, no para conceder permisos.

Las correspondencias provisionales de estadísticas, exportación y herramientas backend de fase 9 están en [su registro en curso](fase-9-estado-en-curso.md). La revisión de los 3.122 registros históricos continúa pendiente y no se sustituye por esa tabla parcial.
