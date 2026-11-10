# Revisión de seguridad

Solo emuladores demo-barberpro-m13 en loopback; no datos reales, despliegues, migraciones productivas ni envío de correos. La revisión no certifica seguridad absoluta ni equivale a una prueba de penetración de producción.

## Controles contrastados

- La inicialización cliente exige host y proyecto locales. El backend exige las variables exactas de Auth y Firestore emulados antes de proporcionar Admin SDK. La CLI usa configuración aislada y retira credenciales de entorno.
- comprobarSesion valida usuario actual de Auth, disabled, correo, expiración, auth_time frente a revocación, rol/version del token y espejo users. Se rechazan roles manipulados y tokens antiguos en las integraciones.
- Las reglas restringen perfil propio a nombre/teléfono/timestamp, impiden modificar roles desde SDK y deniegan escrituras directas de negocio. Lecturas de citas corresponden a propietario, profesional asignado o gestión. Colecciones no reconocidas y Storage están cerrados.
- Se conservan trece exports originales; setMyRole deniega el autoservicio. Los seis callables añadidos de agenda/administración verifican permiso y versión, limitan campos y usan transacciones y recibos idempotentes.
- Reservas y agenda comparten controles por día. Se comprueba ocupación dentro de transacciones y se actualiza el mismo documento de control, evitando basar la exclusión únicamente en una consulta previa de disponibilidad. Los tests de concurrencia intentan reservas, movimientos y bloques incompatibles.
- Los textos de negocio se insertan como textContent; innerHTML se usa para plantillas constantes. CSV protege fórmulas de texto, y el calendario escapa separadores y saltos. La CSP limita scripts al propio origen y conexiones a emuladores; las fuentes siguen dependiendo de Google Fonts.
- El reset demo está limitado a colecciones concretas, admin verificado y confirmación explícita; simula por defecto. Requiere entorno aislado sin escritores concurrentes: no es una transacción de mantenimiento global.
- Recordatorios usan IDs deterministas y transacción sobre la cita. La simulación no deja marcas; queued no se presenta como sent. No hay proveedor real de correo ni job productivo instalado.

## Hallazgo de autorización

adminSetClaims comprobaba al actor antes de entrar en asignarRolAutorizado, pero la transacción solo leía el destinatario. Una revocación concurrente del administrador no formaba parte del conjunto de lectura. Se pasa la identidad validada al núcleo y se comprueba de nuevo dentro de la transacción. La herramienta CLI local conserva su mecanismo explícito sin sesión de navegador; el helper no se exporta como callable.

La prueba nueva captura una identidad admin, la revoca y solicita otro cambio con esa identidad antigua. Exige permission-denied y comprueba que perfil y claims del destinatario permanecen intactos; finalmente restablece la cuenta ficticia. Es una regresión del núcleo de autorización, no una reproducción temporizada completa del endpoint HTTP antiguo. No se afirma haber explotado un entorno real.

## Límites pendientes

Las reglas Firestore se validan con el emulador; no se despliegan ni se certifican índices productivos. La revocación/disabled del backend es inmediata por consulta a Auth; las reglas SDK no consultan Auth Admin y conservan los límites de vigencia del token emitido. Las llamadas con tokens del emulador no acreditan la firma criptográfica productiva, que allí no se comprueba.

No se añade App Check, transporte de mensajes, hosting ni autenticación de servidor a una aplicación diseñada como demo local. La disponibilidad de fuentes externas y el comportamiento de navegadores distintos a Chromium no quedan garantizados. El resultado final de npm audit y Gitleaks se registrará con los comandos ejecutados; cero hallazgos de secretos no demuestra que toda dependencia sea segura.
