# Control de cobertura

## Estado vigente — fase 9 en curso

Los módulos restantes ya tienen una implementación inicial, conservada en GitHub a petición del usuario. Las cuatro rutas antes reservadas contienen la nueva interfaz; falta cerrar su validación específica. No se actualiza artificialmente el porcentaje funcional ni se certifica el inventario global. Véase [estado provisional de fase 9](fase-9-estado-en-curso.md). Las cifras de fase 8 se conservan debajo como resultado histórico.

## Registro histórico del cierre de fase 8

## Estado vigente — fase 8 completada en entorno local

Administración: siete páginas reconstruidas y seis módulos administrativos previstos, más entrada del personal. Se conservan 27 URLs: 23 funcionales y cuatro reservadas para fase 9. Hay 162 archivos propios versionables, 17 nuevos y 29 modificados en fase 8. Existen físicamente 119/132 destinos planificados (118 versionables y .env.local demo ignorado); faltan 13 y hay 44 adiciones justificadas. El 90,15 % de presencia no es cobertura funcional ni de pruebas. Los mapas vigentes registran las correspondencias reales; la revisión completa del inventario histórico no se da por realizada todavía.

| Identificado | Reorganizado/implementado | Probado / pendiente |
|---|---|---|
| Usuarios y roles | Usuarios, tarjeta-usuario, datos y callable existente | Búsqueda exacta, vacío, cambio autorizado y rechazo de escalada en backend; sin CRUD inventado. |
| Equipo | Equipo y saveTeamProfile | Nombre/visibilidad, Enter/blur, recuperación y rechazo del formulario antiguo tras cambio de rol comprobados. |
| Servicios | Servicios y saveService | Alta idempotente, edición, activación, precio/duración, snapshots y recuperación tras error definitivo comprobados. |
| Branding | Reglas-agenda y saveAgendaSettings | Zona/margen/avisos, flags rechazados y conflicto de zona sin modificar citas. No hay editor de logo. |
| Resumen / entrada | Resumen-horarios e inicio-equipo | Semana y navegación por rol; comparación original aislada en escritorio/móvil. |
| Seguridad | Contexto autorizado y escrituras transaccionales | Matriz backend, SDK cerrado, versión y conservación de datos ajenos al DTO. |
| Pendientes | Panel diario, KPIs, CSV, diagnóstico, recordatorios y demo | Fase 9; auditoría global, comparación final y entrega en fases posteriores. |

Pase final `npm test`: salida 0, 35 unitarias, 57 integraciones y 212 pruebas de navegador correctas (68 visuales y 16 funcionales administrativas incluidas), ninguna omitida; build de 27 páginas. No se afirma cobertura global del 100 %. Los intentos anteriores, el mensaje auxiliar de herramientas y los límites constan en el [informe](fase-8-administracion.md).

## Registro histórico del cierre de fase 7

## Estado vigente — fase 7

Inventario: 145 archivos propios versionables; 18 creados y 35 modificados respecto a fase 6. De los 132 destinos planificados existen 111 (110 versionables y .env.local demo ignorado); faltan 21. Hay 35 adiciones justificadas. El 84,09 % de presencia física no indica porcentaje funcional ni cobertura de pruebas. Se preservan las 27 URLs, con 16 vistas funcionales y 11 privadas reservadas.

| Original identificado | Reorganizado/implementado | Probado / límite |
|---|---|---|
| agenda.astro/client | Agenda-diaria, tarjetas-citas, estados y datos compartidos | Propia/global por rol, orden, filtros, vacíos y transiciones reales. |
| panel-barbero.* | Panel-profesional y consultas por periodo | Día/semana/mes; no sumar antiguas rescheduled; cinco citas de hoy como original. |
| setup-barber.* / week | Editar-horario, formulario-horario, fechas y API validada | Dos tramos, día libre, solapes, copia sin guardar, publicación, revisión y espejo atómico; lectura fallida no reutiliza el formulario anterior. |
| bloqueos.* / getBlocks | Bloqueos, formulario-bloqueo y API transaccional | Tipos horarios y vacaciones inclusivas, duplicación, eliminación y permisos. No existe edición en original. |
| Disponibilidad y reservas | Mismo cálculo de fase 5 y controles diarios compartidos | Bloque/jornada contra creación y reprogramación concurrentes; no se cancelan citas automáticamente. |
| Ficha y permisos | Sesión/rol vigentes, worker propio y gestión autorizada | Ficha ausente recuperada al guardar, oculta no reactivada, UID/manipulación y SDK directo denegados. |
| Modelos/nombres/DOM | Siete módulos previstos, DTO y correspondencias del informe | Rutas/IDs/campos preservados; sin afirmar ejecución de todos los símbolos del inventario histórico. |
| Visual | Original aislado y datos ficticios autorizados | Ocho estados × dos dispositivos; junto con 34 comparaciones anteriores. Calibración del render de QA documentada. |
| Datos/Firebase | Tres endpoints adicionales; octavo índice local | Reglas no relajadas; sin despliegue ni certificación de índices de producción. |
| Pendientes | Administración, auxiliares e integración final | Fases 8–12, datos legados fuera del editor y avisos heredados de dependencias. |

Resultado final `npm test`: salida 0, check limpio, 33 unitarias, 48 integraciones y 178 pruebas de navegador correctas, ninguna omitida. Incluye 20 recorridos funcionales profesionales y 50 comparaciones visuales totales (16 nuevas). Build de 27 páginas y 94 hashes originales iguales. La calibración de QA, los intentos fallidos y los límites constan en [fase 7](fase-7-profesional-agenda.md). No se confunde código implementado con pruebas ejecutadas ni se declara cobertura global del 100 %.

## Registro histórico del cierre de fase 6

## Estado vigente — cierre de fase 6

127 archivos propios versionables: 10 nuevos y 20 modificados respecto al cierre de fase 5. Existen 103 de los 132 destinos previstos (102 versionables y un .env.local demo ignorado); faltan 29. Hay 25 adiciones justificadas frente al plan. El 78,03 % de presencia física no es un porcentaje funcional ni de pruebas.

| Elemento | Identificado/reorganizado/implementado | Probado y límite |
|---|---|---|
| Mis citas original | Mis-citas, cambiar-cita, estados compartidos y SDK existente | Consulta propia, ocho estados/datos representativos, filtros, orden, error y recarga. |
| Historia y detalle | Lista única ascendente y detalle en tarjeta, como original | Pasadas/futuras/canceladas/terminales; sin inventar pantallas separadas. |
| Cancelar/cambiar | Interfaz conectada a operaciones transaccionales de fase 5 | Recorrido completo, margen/roles, ocupación, reintento después del commit y recarga. |
| Perfil | Controlador anterior revisado y protegido por identidad | Datos válidos/inválidos, persistencia, denegación y cambio de cuenta con escritura pendiente. |
| Sesión y privacidad | Guard central, revisiones y limpieza | Consulta retenida durante cambio de identidad; lista/detalle/perfil ajenos y campos protegidos denegados. |
| Visual | Original aislado y su render sin SDK | Ocho comparaciones nuevas; 34 en la suite completa. Modal largo permite scroll como corrección accesible. |
| Nombres y contratos | Correspondencias en informe de fase 6 | Rutas/DOM/campos/exports conservados; no se afirma ejecución de 3.122 símbolos originales. |
| Pendientes | Operativa profesional, administración y auxiliares | Fases 7–12; avisos heredados de dependencias y validación productiva pendientes. |

Resultado completo ejecutado: check limpio, 28 unitarias, 37 integraciones, 142 pruebas de navegador y build de 27 páginas; salida 0, ninguna omitida. Original: 94 hashes iguales. Se conserva el historial anterior sin presentarlo como estado vigente. [Inventario y evidencias](fase-6-cliente.md).

## Registro histórico de fase 5

## Estado vigente

Inventario: 117 archivos propios versionables, frente a 90 al iniciar fase 5; 27 creados y 19 modificados. De 132 destinos del plan existen físicamente 99 (incluido el `.env.local` demo ignorado), y faltan 33. Son 98 destinos versionables del plan y 19 adiciones justificadas en el conjunto del proyecto. La presencia del 75 % de destinos no implica un 75 % de funcionalidad ni termina la reconstrucción completa.

Las 27 rutas permanecen. Funcionan seis páginas públicas, cuatro pantallas de cuentas y `/reservar`; las otras 16 vistas privadas siguen reservadas. Se conservan 18 guards privados. Hay nueve exports backend reales de los trece originales: los cuatro anteriores y las cinco operaciones de reservas. No se ha iniciado fase 6.

| Módulo identificado | Reorganizado/implementado | Evidencia y límite |
|---|---|---|
| Reservar original | Página y dos controladores nuevos; SDK separado | Selección, fecha nativa, disponibilidad, confirmación, éxito y error, ICS. |
| Servicios/profesionales/configuración | Catálogo, personas y configuración | Consultas reales; solo datos activos y orden original; fixtures aislados. |
| Disponibilidad | Fechas, horarios y disponibilidad backend | Calendario real/DST, semana publicada, descansos, bloqueos, vacaciones, duración completa, ocupación. |
| Creación | persistencia-reservas + callable | Transacción de datos, locks, control del día y notificación; identidad autoritativa. |
| Conflictos/reintentos | Control diario y requestId opcional | Cinco carreras reales; respuesta abortada después del commit recuperada tras recargar. |
| Cancelación/reprogramación/estados | Backend y servicios cliente | Permisos, margen, transiciones, historial, locks propios y cambio atómico; UI completa de Mis citas en fase 6. |
| Listados por rol | datos/agenda y reglas existentes | Consultas reales propias, asignadas y de gestión; lectura global cliente denegada. |
| Nombres/contratos | Mapeo en informe de fase 5 | DTO/colecciones/IDs/exports conservados; sin afirmar cobertura ejecutada de los 3.122 símbolos originales. |
| Apariencia | Dist original sin SDK y estados ficticios equivalentes | Tres estados de reserva × dos dispositivos, además de las comparaciones anteriores. |
| Reglas/índices | Escrituras cliente de negocio cerradas; un índice adicional de ocupación | No hay despliegue; los emuladores no demuestran índices productivos. |
| Pendientes | Fases 6–12 y auditoría heredada | Sin paneles anticipados ni certificación de producción. |

Verificación final: `npm test` con salida 0; check sin errores/warnings/hints, 25 pruebas unitarias, 33 integraciones reales y 116 pruebas de navegador (26 visuales incluidas, ninguna omitida), más build de 27 páginas. Los 94 hashes del original coinciden. Inventario individual, incidencias corregidas y límites: [informe de fase 5](fase-5-reservas-disponibilidad.md). No se presenta un porcentaje global de funcionalidad ni se dan por resueltos los avisos heredados de dependencias.

## Registro histórico de fase 4

Las cifras y estados siguientes corresponden a fase 4; se conservan como historial y no sustituyen el estado vigente anterior.

La planificación de fase 2 permanece intacta en `../../BarberPro-M13-Planificacion/docs/control-cobertura.md`. Sus 94 archivos y 3.122 símbolos cubiertos se refieren al análisis/correspondencia, no a implementación. Este documento y el informe de fase 4 son el estado funcional vigente; la tabla histórica de fase 3 en control-avance se conserva como evidencia anterior.

Inventario actual: 90 archivos propios versionables, frente a 66 al comenzar; 24 creados y 23 modificados en esta fase. De 132 destinos planificados, 78 existen físicamente (incluido el `.env.local` ficticio e ignorado); 54 aún no. De los 90 versionables, 77 corresponden al plan y 13 son adiciones justificadas en los informes. Esta presencia no implica que los 78 destinos estén funcionalmente completos. El `.env.local` local se ha preparado exclusivamente con la plantilla demo: un checkout nuevo debe recrearlo siguiendo README.

| Elemento identificado | Reorganizado / implementado | Probado | Pendiente |
|---|---|---|---|
| 27 rutas originales | 27 URLs conservadas; 6 públicas, 3 de acceso/verificación, perfil y 17 privadas de negocio reservadas | Navegador escritorio/móvil; 18 rutas privadas rechazan invitados | Comportamiento de las 17 vistas de negocio en sus fases |
| Registro / login / logout | 4 controladores de cuentas + servicio de sesión + perfiles | SDK real contra Auth/Firestore; integración y navegador | Recuperación de contraseña no aplica: no existe en original |
| Verificación / reenvío | Auth oficial, códigos y token actualizado | Correo ficticio válido, reutilizado e inválido; reenvío y perfil pendiente | Entrega de correo real excluida del entorno local |
| Perfil | Nombre/teléfono propios; email/rol protegidos; alta parcial recuperable | Edición, recarga, campos protegidos, cuenta sin perfil; fallo parcial unitario | CRUD administrativo visual de fase 8 |
| 4 roles canónicos | `client`, `worker`, `manager`, `admin`; listas explícitas | Matriz real de datos/rutas; responsable no administra roles | Operaciones de negocio futuras |
| Guards, sesión y navegación | Política central; un observador Auth y un perfil; estados distintos | Doble consumidor, respuestas tardías, recarga, dos pestañas, salida, atrás, cambio de rol y JS desactivado | Sesiones de servidor no necesarias para esta arquitectura estática |
| 13 funciones públicas originales | 4 reales: `ping`, `adminSetClaims`, `setMyRole`, `whoAmI` | Salud unitaria; tres callables a través de HTTP real del emulador | 9 contratos de reservas/disponibilidad/demo/recordatorios en sus fases |
| Roles y perfiles backend | Cuentas/permisos separados; claims/espejo/versión; ficha profesional | Manipulación de UID/rol, expiración, disabled, token anterior y cambio parcial | No hay transacción conjunta Auth/Firestore; reintento administrativo documentado |
| Firestore y Storage | Reglas de usuario/lectura verificadas; negocio y Storage con escritura cerrada | Reglas contra emulador; lecturas ajenas, campos/roles y llamadas administrativas denegados | Validaciones/escrituras de negocio en fases 5–9; Storage sin funcionalidad de subida |
| Scripts de roles | UID explícito; simulación y entorno local obligatorio | Barreras de entorno/UID/rol unitarias; operación usada y validada en integración | No ejecutados sobre producción ni migración masiva |
| Símbolos y nombres | Funciones/variables españolas; IDs/wire/exports públicos preservados | Checker/importaciones/build; equivalencias en informe fase 4 | No se declara ejecución de los 3.122 registros del inventario histórico |
| Diseño | Formularios originales; estados accesibles | 20 comparaciones: 4 pantallas de cuentas + 6 públicas × 2 dispositivos | Safari/dispositivo físico y comparación global de fase 10 |
| Herramientas y dependencias | CLI local fijada, configuración sin login global; SDK originales mantenidos | Lanzador integrado, unitarias, checker y build | Auditoría crítica heredada de app; revisión antes del cierre sin pendientes/publicación |

Los resultados ejecutados exactos constan en [fase 4, apartado G](fase-4-autenticacion-usuarios-roles.md#g-pruebas-y-evidencia). No se ofrece porcentaje global de funcionalidad: presencia física, implementación y pruebas son medidas diferentes.

Archivos nuevos/modificados y responsabilidades completas: [inventario de fase 4](fase-4-autenticacion-usuarios-roles.md#b-organización-y-archivos). Los módulos previstos se crean cuando tienen consumidor; no hay servicios ni tipos vacíos para aumentar cobertura.

Fases 5–12 pendientes. No se han implementado reservas, disponibilidad, agenda operativa, administración general, estadísticas, exportaciones ni recordatorios. No se inicia la siguiente fase automáticamente.
