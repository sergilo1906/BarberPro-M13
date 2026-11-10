# Funcionalidades de la reconstrucción

La aplicación local implementa cuentas y cuatro roles, reservas y disponibilidad, experiencia del cliente, agenda profesional, administración, resumen diario, KPIs, CSV/ICS, cola de recordatorios y herramientas demo. Se conservan las 27 rutas y trece exports originales; hay seis callables adicionales protegidos para sustituir escrituras de negocio inseguras.

La [revisión funcional vigente](auditoria-final/03-revision-funcional.md) describe operaciones, datos, permisos, correspondencia y pruebas concretas por área. La [matriz de rutas](rutas-y-roles.md) identifica las páginas reales. Los [resultados de auditoría](auditoria-final/06-pruebas-ejecutadas.md) distinguen pruebas ejecutadas, fallos y límites; no se afirma un porcentaje funcional global.

No existen pagos, recuperación de contraseña, subida de avatar, sincronización externa de calendarios ni bandeja de avisos en el original. No se añaden por inferencia. Recordatorios prepara cola local y no envía mensajes. Debug conserva contenido informativo. La fase 9 y los cierres posteriores se consideran parciales hasta completar la trazabilidad y documentación pendientes; véase auditoria-final/01-revision-fases.md.
