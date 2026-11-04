# Auditoría integral y optimización de `advise-time-manager`

**Fecha de consolidación:** 3 de noviembre de 2026
**Alcance:** auditoría de frontend, backend, esquema SQL versionado, seguridad, rendimiento, calidad, accesibilidad y despliegue, complementada con las correcciones y verificaciones descritas abajo.
**Modalidad:** la línea base fue una revisión estática. En el seguimiento se ejecutaron pruebas unitarias, lint, compilación y chequeo de sintaxis; no se hicieron escrituras ni se consultó una base de datos de producción.

## Resumen ejecutivo

La auditoría inicial consolidó **45 hallazgos: 0 críticos, 4 altos, 29 medios y 12 bajos**; el riesgo reportado fue **alto en despliegue/observabilidad** y **medio en las demás áreas**. Esos conteos representan la línea base, no el número de problemas que permanecen abiertos tras las correcciones de esta sesión. Los defectos funcionales prioritarios de metas y ventas retroactivas se atendieron; siguen pendientes decisiones y riesgos de infraestructura descritos más adelante.

Respecto de las solicitudes funcionales: se corrigió la edición inicial de metas y la consulta de actividad para asesores sin meta; se añadieron fecha y hora efectivas para ventas anteriores, con motivo obligatorio, rechazo de fechas futuras y evento de auditoría transaccional. La acción de eliminar una venta de hoy retira el registro de los totales activos mediante anulación auditable (sin borrado físico), limitada a administrador o asesor dueño y con autorización comprobada bajo bloqueo de fila. La aplicación de estos cambios a un esquema desplegado requiere validar la columna de acción de `ventas_cambios_auditoria`, pues no se pudo leer el esquema real.

La inspección encontró controles valiosos: autorización de metas en backend, validación de quincenas, persistencia transaccional con auditoría, comprobaciones de propiedad en operaciones de ventas, filtros de fecha, validación de algunas fechas, y tratamiento de contraseñas con bcrypt en el flujo normal. Esas fortalezas no eliminan los riesgos de tokens que conservan permisos obsoletos, operaciones de cuenta sin auditoría visible, respuestas de salud que no comprueban la base de datos y ausencia de cobertura directa suficiente para ventas y metas.

## Seguimiento de correcciones y verificaciones

| Área | Resultado comprobado |
|---|---|
| Metas por asesor | Las consultas incluyen asesores activos sin fila de meta y sus ventas/recaudos reales. Los borradores se mantienen separados de la respuesta consultada, no se pisan durante el sondeo, se preserva el mensaje de guardado y se muestran errores parciales por sección. El backend ya no convierte campos nulos/vacíos en cero. |
| Ventas retroactivas | Se acepta fecha anterior y hora efectiva HH:MM, se exige motivo de 5–500 caracteres, se rechazan fechas futuras y el servidor conserva su hora actual para ventas de hoy. La creación y el evento específico `REGISTRO_RETROACTIVO` (metadata JSON en la auditoría, usando la acción existente `EDICION`) se guardan dentro de una transacción; si falla la auditoría, se revierte el alta. El código no sobrescribe `creado`; no se pudo confirmar el DEFAULT de esa columna en la base real. No se fijó un límite máximo de antigüedad porque no se especificó una política comercial. |
| Eliminar venta de hoy | Botón limitado al administrador o al asesor propietario. El servidor bloquea la fila, verifica propietario/estado y registra la anulación con motivo dentro de la transacción. La venta se conserva como anulada para auditoría. |
| Errores y cobertura | Las validaciones funcionales responden 4xx y los errores inesperados de las rutas modificadas responden 500 genérico. Se añadieron pruebas directas de metas y fechas de ventas. |
| Rendimiento de carga | DOCX/XLSX se descargan mediante importaciones dinámicas, fuera del bundle inicial. En el build de esta sesión el JS principal pasó de 1,098.25 kB a 454.77 kB; los chunks de exportación se cargan al usarlos. |
| Verificación local | 6 suites y 31 pruebas aprobadas; build de producción aprobado; sintaxis JavaScript backend aprobada; lint sin errores y con 30 avisos existentes de React Hooks/pureza y Fast Refresh. No se usaron datos de producción. |

## Conteo consolidado

| Severidad | Cantidad | Interpretación de prioridad |
|---|---:|---|
| Crítica | 0 | No se clasificó ningún hallazgo como crítico en los resultados entregados. |
| Alta | 4 | Atender primero: bloqueo de configuración inicial de metas, falta de pruebas directas de ventas/metas y dos riesgos de disponibilidad/recuperación del proceso. |
| Media | 29 | Corregir o planificar en iteraciones priorizadas, con pruebas y revisión del impacto. |
| Baja | 12 | Mejoras de consistencia, experiencia, mantenimiento y exposición condicionada. |
| **Total** | **45** | Hallazgos identificados en la síntesis de las áreas completadas. |

Las áreas pendientes de auditoría informadas son **ninguna**. Los conteos contabilizan cada hallazgo una sola vez según la severidad asignada en el JSON; no expresan probabilidad de explotación ni severidad de incidentes reales.

## Prioridad 1 — Hallazgos altos

### 1. No se pueden asignar metas desde cero a asesores sin registro previo

**Evidencia:** `PanelControlAdmin.jsx` construye una fila de respaldo con metas en cero para asesores que no aparecen en la respuesta, pero `cambiarMeta` solo modifica elementos ya existentes en el estado `metas`. El botón de guardar entrega la fila derivada, que conserva ceros. `metasRepository.js` consulta desde `metas_asesores`, por lo que no devuelve asesores sin fila.

**Riesgo:** el administrador puede introducir valores en pantalla y recibir una operación de guardado, pero terminar creando o actualizando una meta con ceros. Esto bloquea la configuración inicial correcta de objetivos.

**Recomendación:** mantener borradores editables por asesor, independientes de las filas persistidas; inicializarlos con valores vacíos/cero según la regla de negocio y guardar ese borrador. Comprobar el cuerpo enviado y la persistencia después de recargar. Corregir junto con el hallazgo de actividad en cero descrito en la siguiente sección.

### 2. Flujos principales de metas y ventas carecen de pruebas directas

**Evidencia:** no se encontraron pruebas para `metasService.js` ni `ventasService.js`, ni pruebas frontend en el manifiesto revisado. El informe de cobertura encontrado es anterior al estado auditado y no incluye esas rutas de código.

**Riesgo:** no hay una red de regresión automatizada que compruebe límites de montos, reglas de recaudo, permisos, persistencia de metas, corrección, anulación o respuestas frente a fallos. La cobertura antigua no representa necesariamente el estado actual.

**Recomendación:** agregar pruebas unitarias con repositorios simulados y pruebas de componentes o flujos de UI. Cubrir datos incompletos, límites y errores, además de autorización y auditoría. Regenerar cobertura en CI; no usar datos ni servicios de producción.

### 3. `/health` declara disponibilidad aunque PostgreSQL no esté disponible

**Evidencia:** `backend/server.js` responde `ok` sin comprobar dependencias; el intento de conexión de `backend/config/db.js` puede fallar sin impedir que el servidor empiece a escuchar.

**Riesgo:** un proveedor o monitor puede marcar saludable un servicio incapaz de ejecutar operaciones dependientes de la base.

**Recomendación:** separar *liveness* de *readiness*. La señal de *readiness* debe ejecutar una comprobación acotada de base de datos y fallar de forma segura si no hay conexión. Documentar qué sonda debe configurar el proveedor.

### 4. Manejadores de fallos fatales registran el error y continúan

**Evidencia:** los manejadores de `uncaughtException` y `unhandledRejection` imprimen mensajes pero no muestran cierre del servidor/pool ni una terminación no exitosa explícita.

**Riesgo:** el proceso puede quedar en estado inconsistente sin activar el mecanismo de recuperación del proveedor; el `/health` superficial agrava la posibilidad de que parezca disponible.

**Recomendación:** establecer una política explícita para errores fatales: registro final, cierre controlado de recursos y salida no exitosa para fallos irrecuperables; confirmar el reinicio supervisado del proveedor. Probar en entorno no productivo.

## Prioridad 2 — Hallazgos medios y bajos por área

### Flujo de ventas en frontend

- **Medio — Botón de anulación sin condición de rol/propiedad en la lista diaria.** `VentasDashboard.jsx` muestra «Anular venta» para cualquier fila activa. Esto puede exponer la acción más allá del permiso esperado en la UI. La autorización efectiva depende del backend; la revisión conjunta encontró validación de propiedad en el servicio, no prueba de ejecución por un usuario no autorizado. **Acción:** limitar visibilidad según rol/propietario y mantener autorización de servidor como control definitivo.
- **Medio — Validación cliente incompleta de importes.** El alta valida valor positivo, pero no valida explícitamente recaudo finito/no negativo ni su relación/regla configurada con la venta; la corrección administrativa también carece de comprobaciones completas de rangos antes de convertir/enviar. **Acción:** validar campo por campo y replicar las reglas en backend.
- **Bajo — Histórico fija moneda COP.** Si ventas está configurado en USD/EUR, el histórico puede rotular importes como pesos colombianos. **Acción:** compartir la configuración monetaria o identificar explícitamente la moneda del reporte.

### Metas de ventas y recaudo

- **Medio — Actividad reportada como cero cuando falta meta.** El repositorio parte de metas existentes; el fallback de UI asigna también cero a ventas y recaudo actuales. Puede ocultar actividad real de un asesor sin registro de meta. **Acción:** partir del conjunto de asesores y hacer `LEFT JOIN` con metas/ventas, o cargar actividad independientemente; distinguir meta pendiente de actividad cero.
- **Medio — Confirmación de guardado desaparece durante la recarga.** La recarga limpia el mismo mensaje de éxito y puede sustituirlo por un error aunque el `PUT` haya terminado bien. **Acción:** separar feedback de escritura y de lectura.
- **Medio — Sondeo periódico puede sobrescribir borradores y cargas pueden competir.** Cada 15 segundos se reemplaza el estado de metas; no se observan borradores sucios ni descarte de respuestas antiguas. **Acción:** aislar borradores y evitar solapamientos o ignorar respuestas obsoletas.
- **Medio — Una falla de endpoint secundario bloquea la actualización de metas.** Un `Promise.all` agrupa metas, configuración, dashboard, asesores e historial. **Acción:** estados y errores por sección o `Promise.allSettled`.

### API de ventas y fechas retroactivas

- **Medio — No hay flujo para fecha real retroactiva.** El servicio genera la marca de tiempo actual de Bogotá; el alta no acepta fecha y la corrección administrativa tampoco la cambia. **Acción diferida:** véase «Decisiones que deben quedar diferidas».
- **Medio — Excepciones inesperadas se presentan como HTTP 400 y pueden revelar detalles.** Controladores usan 400 por defecto y devuelven el mensaje de errores sin clasificación. **Acción:** errores de validación/regla como 4xx; excepciones no clasificadas como 500 con mensaje genérico y detalle solo en logs protegidos.
- **Medio — Autorización de anulación no está ligada atómicamente al propietario vigente.** La comprobación del asesor precede a la transacción; una reasignación concurrente puede hacer que la decisión quede basada en un propietario anterior. **Acción:** validar y cambiar estado dentro de una transacción con bloqueo o condición de propietario y comprobar filas afectadas.

### Esquema SQL e integridad

- **Medio — La base admite periodos de metas incompatibles con el servicio y potencialmente solapados.** Las restricciones revisadas validan tipo/rango de manera menos estricta que el servicio. **Acción diferida:** revisar datos y diseñar migración antes de imponer restricciones o exclusiones.
- **Medio — Borrado físico de asesor podría borrar auditoría de metas.** La FK de auditoría usa `ON DELETE CASCADE`, aunque el flujo habitual revisado es baja lógica. **Acción diferida:** acordar retención y política de identidad histórica antes de cambiar FKs.
- **Medio — No se encontró DDL versionado de `ventas` ni `ventas_cambios_auditoria`.** Esto impide verificar restricciones, tipos, defaults y retención en el repositorio; no prueba que falten en producción. **Acción:** localizar/incorporar esquema canónico después de verificar cada entorno.
- **Bajo — Consultas comparables tienen distinto alcance de estado.** Algunas incluyen anuladas en el detalle y otras calculan solo activas. **Acción:** definir contrato por endpoint y agregar reconciliación de cifras.
- **Bajo — `updated_at` de metas no se actualiza automáticamente ante todo escritor.** El camino de aplicación sí lo actualiza, pero otros escritores podrían no hacerlo. **Acción:** considerar trigger o ruta de escritura única tras revisar impacto.

### Autorización y roles

- **Medio — JWT conserva privilegios hasta expiración después de cambio de rol o baja.** El middleware verifica firma/expiración y usa claims; no consulta el estado actual en cada solicitud. El valor por defecto observado es 24 horas, pero el TTL real de producción no se conoce. **Acción diferida:** decidir entre consulta a BD, versión/revocación de sesión y TTL, considerando coste y operación.
- **Bajo — Preferencia de visibilidad del ranking no protege el endpoint.** El endpoint devuelve agregados globales a cualquier usuario autenticado y no aplica `ranking_visible_asesores` ni `ranking_activo`; el componente tampoco los respeta. **Acción:** definir la semántica esperada y aplicarla en backend y UI; ocultar UI no sustituye autorización.

### Rendimiento frontend

- **Medio — Sondeos frecuentes y acumulados.** La estimación de la vista principal es aproximadamente 90 solicitudes/minuto por sesión, o 102 si hay `asesor_id`; los intervalos no esperan necesariamente a completar la solicitud anterior. **Acción:** espaciar datos no urgentes, consolidar recursos y prevenir solapamientos.
- **Medio — Vistas y exportadores se incluyen en la carga inicial.** El artefacto existente tenía un bundle JS de 1,093,938 bytes (322,116 gzip). Es una medición de un `dist` ya existente, no un build reproducido en la auditoría. **Acción:** considerar carga diferida y cargar XLSX/DOCX al exportar; medir antes/después con build reproducible.
- **Medio — Ticks por segundo hacen renderizar árboles amplios.** Relojes/contadores de App, Dashboard y Header actualizan estado cada segundo. **Acción:** aislar componentes de reloj o memoizar elementos con props estables.
- **Bajo — Tres componentes consultan la misma configuración de empresa.** **Acción:** compartir estado o caché común.
- **Bajo — Logo rasterizado grande.** El artefacto existente mide alrededor de 1 MB y gzip reduce poco el tamaño. **Acción:** optimizar dimensiones/formato y revisar visualmente.

### Pruebas y calidad

- **Medio — Campos de metas nulos o vacíos se convierten silenciosamente en cero.** `Number(null)` y `Number("")` son cero; la validación acepta valores no negativos. **Acción:** validar presencia/formato antes de convertir y probar ausente, `null`, cadena vacía, cero y límites.
- **Medio — Fallos de persistencia pueden devolverse como 400.** Afecta controladores de ventas y metas. **Acción:** manejador tipado y pruebas diferenciadas entre validación e infraestructura.
- **Bajo — Validación integrada no incluye lint de backend ni cobertura actual.** **Acción:** separar validación rápida/cobertura y acordar lint backend.
- **Bajo — Scripts operativos contienen/imprimen contraseña administrativa fija.** **Acción:** retirar el secreto fijo, no imprimir contraseñas y rotar si se confirma que fue usada o reutilizada.

### Seguridad y dependencias

- **Medio — Scripts fijan `Admin123*` y la muestran en consola/SQL generado.** No hay evidencia de que esté activa en producción. **Acción:** eliminar valor fijo, recibir/generar secreto único de forma segura y verificar uso antes de rotar cuentas.
- **Medio — JWT ya emitidos no se invalidan de inmediato al desactivar o cambiar rol.** Correlaciona con el hallazgo de autorización anterior; se contabiliza como hallazgo independiente de seguridad.
- **Medio — Cambios de rol/estado y restablecimientos de contraseña carecen de auditoría visible en el repositorio revisado.** Las operaciones no pasan actor al repositorio ni registran evento equivalente. **Acción:** registrar actor, objetivo, acción y estados no sensibles dentro de transacción; nunca guardar contraseñas ni hashes en claro.
- **Bajo — JWT almacenado en `localStorage`.** Aumentaría el impacto de un XSS si llegara a existir; no se encontró un sink directo de HTML no confiable en los archivos revisados. **Acción:** evaluar cookie HttpOnly/Secure/SameSite y CSP con revisión CSRF.
- **Bajo — Lockfile contiene versiones incluidas en avisos de seguridad con exposición limitada en flujos visibles.** La revisión indica axios 1.18.1 y follow-redirects 1.16.0 dentro de intervalos afectados, pero no confirmó explotación; React Router está en versión corregida y XLSX se usa para exportar, no para leer archivos. **Acción:** actualizar en rama autorizada, verificar árbol y artefacto, y no tratar el advisory como prueba de incidente.

### UX y accesibilidad

- **Medio — Mensaje de error de login puede perder legibilidad en tema oscuro.** El texto se fuerza a claro y el fondo rosado no tiene variante oscura. **Acción:** clases semánticas con colores específicos para ambos temas.
- **Medio — Etiquetas del login no están asociadas programáticamente a inputs.** **Acción:** `id` y `htmlFor`.
- **Medio — Diálogos no evidencian nombre accesible ni gestión completa del foco.** Revisar `aria-labelledby`, foco inicial, contención/restauración del foco y Escape según proceda.
- **Medio — Campos de metas sin nombre accesible por asesor/tipo de objetivo.** **Acción:** nombres accesibles específicos y encabezados de fila/columna con asociaciones verificables.
- **Bajo — Tema oscuro uniforma botones de acciones diferentes.** **Acción:** variantes visuales que distingan acciones neutrales y destructivas, además de su texto.
- **Bajo — Tabla administrativa exige desplazamiento horizontal en móvil.** **Acción:** evaluar tarjetas o columnas prioritarias; si se conserva scroll, probar teclado y tacto.

### Despliegue y observabilidad

- **Medio — Topología declarada de Vercel no coincide claramente con guía de Render.** La configuración del frontend usa URL absoluta, por lo que las reescrituras no necesariamente son el destino efectivo. **Acción diferida:** elegir y documentar arquitectura autoritativa antes de ajustar routing y variables.
- **Medio — SQL manual sin historial de migraciones verificable.** No se observó runner, secuencia/registro ni rollback; algunos scripts alteran/convierten tipos. **Acción diferida:** inventariar estado por entorno y definir flujo versionado, precondiciones y reversibilidad; no aplicar scripts a ciegas.
- **Medio — Recuperación documentada cubre rollback de aplicación, no restauración de datos.** No se documenta backup/retención/prueba de recuperación de base. **Acción diferida:** acordar política, responsables y prueba de restauración con el proveedor.
- **Medio — No hay evidencia de barrera CI versionada.** Hay comando local `npm run validate`, pero no workflow encontrado. **Acción:** agregar pipeline después de acordar checks y umbrales; mantenerlo independiente de producción.

## Qué es seguro abordar primero

La lista original se conserva como línea base. Estado tras la implementación:

1. **Completado:** borradores de metas aislados del sondeo; consulta por asesor incluye actividad aunque falte una meta; escritura validada y feedback separado.
2. **Parcial:** pruebas aisladas de validación de metas, flujo/fechas y atomicidad del registro/auditoría de ventas añadidas. Aún faltan pruebas de componente y concurrencia contra una base de prueba.
3. **Completado para los flujos tocados:** importes de venta/recaudo y metas se validan conforme a reglas actuales; la condición recaudo ≤ venta se deja aplicar por el backend solo cuando la configuración lo exige.
4. **Completado:** carga parcial de endpoints y mensajes de guardado independientes de las recargas.
5. **Parcial:** controles nuevos tienen labels; siguen pendientes revisión global de foco/nombre accesible de diálogos y errores de login en ambos temas.
6. **Completado en código:** acción limitada por UI y autorización/estado ligados a bloqueo de fila en backend. No se simuló concurrencia contra una base real.
7. **Completado para controladores de metas y ventas tocados:** validaciones tipadas 4xx y error genérico 500 para fallos imprevistos; quedan otros controladores por homogeneizar.
8. **Parcial:** carga diferida DOCX/XLSX redujo el JS inicial; persisten polling frecuente, renders por segundo, logo rasterizado grande y otras importaciones globales.
9. **Diferido:** no se actualizaron dependencias. Requiere rama/entorno de prueba y revisión de advisories.
10. **Diferido:** no se añadió CI; se necesita decidir qué verificaciones son bloqueantes para el equipo.

## Qué debe quedar diferido por aprobación o decisión técnica

1. **Ventas retroactivas — política pendiente:** el flujo se implementó para los roles que ya tenían permiso de registrar (asesor para sí mismo; administrador para cualquier asesor), con motivo obligatorio, fecha no futura, hora efectiva en Bogotá y el campo de creación sin sobrescribir. El DEFAULT real de `creado` no fue verificado. No hay antigüedad máxima. Si la empresa necesita limitarla o restringirla a administradores, debe definir esa regla antes de endurecer el flujo. La compatibilidad del valor JSON de metadata con la base real no pudo verificarse; la columna de acción reutiliza `EDICION`, ya usada por la aplicación.
2. **Migraciones y restricciones de base de datos:** antes de imponer reglas de periodo, exclusión de rangos, cambios de FK, triggers o DDL canónico, inspeccionar esquema y datos de cada ambiente, identificar duplicados/solapamientos, establecer respaldo y plan de rollback. El material revisado no permite afirmar cuál es el esquema desplegado.
3. **Retención de auditoría ante borrado físico:** decidir política de conservación, identidad histórica y requisitos de privacidad antes de cambiar `CASCADE`, nulabilidad o retención.
4. **Invalidación inmediata de JWT:** decidir estrategia (consulta a usuario por solicitud, versión de sesión, lista de revocación o combinación con TTL corto), coste de base/cache y tolerancia operativa. Acordar también TTL real de producción, que no se pudo verificar.
5. **Visibilidad del ranking:** precisar si la preferencia afecta solo a presentación, a todos los roles o a ciertos agregados; después aplicar la regla en endpoint y frontend, con pruebas de autorización.
6. **Topología Vercel/Render y readiness:** seleccionar el proveedor y servicio autoritativos, configurar URL/CORS y sondas de forma coherente y probar en staging. No cambiar rutas o URLs de producción sin esa decisión.
7. **Backups y recuperación:** acordar proveedor, retención, responsables, RPO/RTO y ensayo de restauración antes de declarar cubierto el rollback de datos.
8. **Auditoría de operaciones de cuenta y cambios de esquema:** definir el esquema de eventos y retención para rol, estado y recuperación de cuenta, sin registrar datos sensibles.
9. **Rotación de credenciales administrativas:** verificar si los scripts con contraseña fija fueron ejecutados o la credencial se reutilizó; coordinar rotación segura y confirmar cuenta objetivo. No asumir compromiso ni ejecutar resets sin autorización.

## Solicitudes funcionales: conclusión puntual

- **Edición de Meta ventas / Meta recaudo:** corregida para metas nuevas y existentes; borradores no se pierden en el sondeo y la actividad real se muestra aunque no haya fila guardada. Vacío/nulo se rechaza; 0 explícito sigue siendo válido.
- **Eliminar una venta de hoy:** implementado como anulación auditable. Solo aparece para administrador o propietario; conserva motivo, cambia el estado dentro de transacción y no borra físicamente la evidencia.
- **Ventas con fecha anterior:** implementado con hora efectiva y motivo obligatorio; el servidor rechaza fechas futuras y usa hora del servidor para las ventas de hoy. La fecha de creación real se mantiene separada. La máxima antigüedad queda sin limitar por decisión pendiente.

## Límites y cautelas

La auditoría inicial fue estática. En el seguimiento sí se ejecutaron 31 pruebas unitarias (6 suites), build, lint y chequeo de sintaxis; no se ejecutaron escrituras en base de datos. El conector Supabase no estuvo disponible y no había una cadena de conexión local, así que no se verificaron tipos, restricciones ni datos reales del esquema. Tampoco se verificaron en esta sesión los logs/runtime ni el deployment tras estos cambios, copias de seguridad, concurrencia real o explotación de dependencias. La ausencia de DDL versionado no prueba que falte en producción; la ausencia de evidencia externa no prueba que una protección no exista.
