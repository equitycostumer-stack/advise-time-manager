# Mejoras pendientes priorizadas — Advise Time Manager

**Fecha de revisión:** 2 de octubre de 2026  
**Base revisada:** ZIP adjunto, código local saneado y documentación existente.  
**Estado:** diagnóstico; todavía no se modificó el código ni la base de datos.

## Resumen ejecutivo

La aplicación ya tiene una base funcional importante: autenticación JWT, control básico por roles, jornadas, pausas, incidencias, ventas, anulaciones auditadas, metas quincenales, panel administrativo y exportaciones.

Antes de agregar nuevas funciones, conviene cerrar estas prioridades:

1. **Corregir el error de validación del frontend.**
2. **Revisar la privacidad de los reportes y resúmenes para asesores.**
3. **Completar la administración de usuarios, que actualmente muestra botones sin acciones.**
4. **Unificar fechas y zona horaria de Colombia en todas las consultas.**
5. **Proteger las operaciones de jornada con transacciones y validaciones contra duplicados.**
6. **Mejorar pruebas, manejo de errores, rendimiento y experiencia de uso.**

---

## Prioridad 0 — Corregir antes de publicar

### 0.1 Error que bloquea el análisis del frontend

**Estado confirmado:** `npm run lint --prefix frontend` falla con un error en:

- `frontend/src/components/VentasDashboard.jsx`
- Variable `data` declarada pero no utilizada en la función de anulación de venta.

**Acción:** eliminar la variable no utilizada o utilizarla para validar la respuesta del backend.

**Resultado esperado:** el análisis debe terminar sin errores bloqueantes.

### 0.2 Revisar el archivo ZIP interno

**Estado confirmado:** existe este archivo dentro del proyecto:

- `backend/controllers.zip.zip`

Aunque está excluido por `.gitignore`, no debería formar parte de una entrega limpia ni del repositorio.

**Acción:** confirmar que no contenga código necesario y retirarlo únicamente en la próxima copia de trabajo o commit autorizado.

### 0.3 Evitar mensajes técnicos en la interfaz

Hay componentes que todavía usan `console.error`, `console.log`, `alert()` y `window.confirm()` directamente.

**Riesgos:**

- El usuario final recibe mensajes poco uniformes.
- Algunos errores solo aparecen en la consola del navegador.
- Las confirmaciones no son accesibles ni tienen el mismo diseño de la aplicación.

**Acción:** crear un sistema común de mensajes, confirmaciones y estados de carga.

---

## Prioridad 1 — Seguridad y privacidad

### 1.1 Confirmar que los asesores no puedan consultar resúmenes globales

**Hallazgo de código:** en `backend/routes/ventas.js`, estas rutas solo exigen token, pero no muestran una restricción de administrador:

- `GET /api/ventas/resumen/dia`
- `GET /api/ventas/resumen/asesores`
- `GET /api/ventas/resumen/asesores/periodo`
- `GET /api/ventas/dia`

También debe revisarse `backend/routes/reportes.js`, porque las rutas de asistencia y ventas están protegidas por autenticación, pero no por rol ni por asesor propietario.

**Riesgo:** un asesor autenticado podría recibir información de ventas o productividad de todo el equipo si el controlador no aplica un filtro adicional.

**Acción recomendada:**

- Administradores: acceso global.
- Asesores: únicamente sus propios datos.
- Si una pantalla es exclusivamente administrativa, protegerla con `verificarRol("ADMINISTRADOR")`.
- Agregar pruebas de autorización para cada ruta.

> Este punto debe verificarse antes de publicar porque afecta la privacidad de datos comerciales y laborales.

### 1.2 Agregar límites y paginación a listados

**Hallazgo:** varias consultas devuelven listas completas, por ejemplo ventas por asesor, historial de incidencias, movimientos, auditorías y reportes.

**Riesgos:**

- Respuestas lentas cuando crezca la base de datos.
- Consumo excesivo de memoria.
- Exposición innecesaria de información antigua.

**Acción:** agregar `LIMIT` y `OFFSET` o paginación por cursor. Para lecturas de datos, seleccionar únicamente las columnas necesarias.

### 1.3 Validar formalmente entradas del backend

Hay validaciones manuales dispersas entre rutas, controladores y servicios.

**Acción:** centralizar validaciones para:

- IDs positivos.
- Fechas con formato `YYYY-MM-DD`.
- Rangos de fechas máximos razonables.
- Valores monetarios no negativos y con precisión definida.
- Longitud máxima de nombres, observaciones, comentarios y motivos.
- Estados válidos de jornada y ventas.
- Horarios coherentes: salida posterior a entrada.

### 1.4 Fortalecer la autenticación

**Estado actual:** JWT con renovación automática y duración esperada de 24 horas.

**Pendientes:**

- Invalidar tokens después de cambiar la contraseña.
- Considerar un identificador de sesión o versión de token para cerrar sesiones antiguas.
- Aplicar límite de intentos de inicio de sesión.
- Agregar registro de accesos fallidos sin guardar contraseñas.
- Definir una política de contraseña más robusta que el mínimo actual de 6 caracteres.
- Evaluar cookies `HttpOnly` y `Secure` en lugar de guardar el token en `localStorage`, según compatibilidad y plan de migración.

### 1.5 Mejorar CORS y configuración por entorno

**Hallazgo:** los orígenes permitidos están escritos directamente en `backend/routes/server.js`.

**Acción:** mover la lista a una variable de entorno controlada, separar desarrollo y producción y evitar aceptar orígenes no previstos.

### 1.6 Revisar la conexión SSL de PostgreSQL

**Hallazgo:** `rejectUnauthorized: false` está fijado en `backend/config/db.js`.

**Acción:** confirmar el certificado recomendado por Supabase/Render y habilitar validación del certificado en producción cuando sea posible.

---

## Prioridad 2 — Jornada, tiempo y zona horaria

### 2.1 Unificar todas las consultas en hora de Colombia

**Hallazgo:** el código mezcla:

- `America/Bogota`.
- `CURRENT_DATE`.
- `DATE(fecha_hora)`.
- Conversión manual con `-05:00`.
- Fechas del navegador con `new Date()`.

Esto aparece especialmente en incidencias, dashboard, movimientos y componentes de historial.

**Riesgo:** alrededor de medianoche pueden aparecer jornadas o incidencias asignadas al día equivocado.

**Acción:** definir una única estrategia:

- Guardar timestamps en un tipo coherente.
- Usar rangos de inicio y fin del día en `America/Bogota`.
- Evitar `DATE(columna)` cuando impida utilizar índices.
- Compartir utilidades de fecha entre backend y frontend.
- Agregar pruebas específicas para 00:00, 23:59 y cambio de mes.

### 2.2 Proteger entrada, salida y cambios de estado contra duplicados

**Hallazgo documental:** ya se recomendó incorporar transacciones a entrada/salida.

**Pendientes:**

- Impedir dos entradas simultáneas.
- Impedir una salida sin jornada activa.
- Impedir cambio de pausa incompatible con el estado actual.
- Garantizar que `estados_actuales`, `movimientos` y `resumen_jornada` queden sincronizados.
- Usar bloqueo de fila o transacción cuando dos solicitudes lleguen al mismo tiempo.

### 2.3 Validar límites de pausas y estados desde el servidor

La interfaz muestra temporizadores, pero la regla real debe cumplirse en el backend.

**Acción:** confirmar que el backend impida superar `break_max`, `bano_max`, `almuerzo_max` y demás límites configurados, incluyendo solicitudes manipuladas desde el navegador.

### 2.4 Unificar estados internos y etiquetas visibles

**Hallazgo:** se usan variantes como `BANO`, `BAÑO`, `CAPACITACION`, `CAPACITACIÓN`, `REUNION` y etiquetas con emojis.

**Acción:** conservar códigos internos sin acentos y traducirlos mediante un catálogo único para mostrar las etiquetas.

---

## Prioridad 3 — Ventas, recaudos y metas

### 3.1 Completar las pruebas del flujo de anulación

El flujo implementado ya exige motivo, confirmación y auditoría.

**Pendientes de prueba:**

- Anulación exitosa.
- Motivo menor de 5 caracteres.
- Venta inexistente.
- Venta ya anulada.
- Asesor intentando anular la venta de otro asesor.
- Administrador anulando una venta permitida.
- Fallo al guardar la auditoría: la venta no debe quedar anulada a medias.
- Verificar que la venta anulada no cuente en resúmenes ni rankings.

No se debe probar con una venta real sin autorización clara; usar datos de prueba.

### 3.2 Validar los permisos de ventas globales

La creación y consulta por asesor usan `verificarPropioAsesor`, pero las consultas globales deben revisarse con el mismo criterio de privacidad indicado en la sección 1.1.

### 3.3 Definir precisión y moneda

**Pendientes:**

- Confirmar si `valor` y `recaudo` admiten decimales.
- Confirmar que el frontend no redondee indebidamente.
- Usar una única función de moneda en todos los paneles.
- Evitar que una configuración de moneda cambie solo el símbolo sin cambiar el formato correcto.
- Mostrar claramente que `meta_ventas` es cantidad de ventas y `meta_recaudo` es dinero.

### 3.4 Mejorar el guardado de metas

**Pendientes:**

- Validar límites máximos y números enteros de `meta_ventas`.
- Validar que `meta_recaudo` no sea negativo.
- Mostrar estado “guardando” por asesor para evitar doble clic.
- Confirmar que la auditoría registre valor anterior, valor nuevo, usuario y fecha.
- Agregar pruebas de concurrencia y de actualización repetida.

### 3.5 Corregir el cálculo de periodos en el frontend

`VentasDashboard.jsx` calcula el mes y la quincena con la hora local del navegador, mientras el backend usa Colombia.

**Acción:** calcular el periodo con la utilidad oficial de Colombia o recibirlo del backend.

---

## Prioridad 4 — Administración de usuarios

### 4.1 Completar los botones de la pantalla de usuarios

**Estado confirmado:** `frontend/src/pages/Usuarios.jsx` muestra:

- `+ Nuevo Usuario`
- `Editar`
- `Contraseña`

pero actualmente no tienen acciones conectadas.

El backend sí tiene rutas para listar, crear, actualizar y restablecer contraseña.

**Acción:** construir los formularios y conectarlos a:

- `POST /api/usuarios`
- `PUT /api/usuarios/:id`
- `PUT /api/usuarios/:id/reset-password`

### 4.2 Agregar controles de seguridad para administrar usuarios

- No permitir que un administrador se quite accidentalmente sus propios permisos.
- Confirmar antes de desactivar un usuario.
- Impedir duplicados de usuario y correo.
- Mostrar claramente usuario activo/inactivo.
- Registrar auditoría de creación, edición, desactivación y restablecimiento de contraseña.
- No mostrar contraseñas ni hashes.

### 4.3 Completar navegación y permisos de la interfaz

Hay componentes de layout con elementos de menú estáticos, pero deben conectarse a vistas reales o retirarse para no crear opciones que aparentan funcionar.

---

## Prioridad 5 — Frontend y experiencia de usuario

### 5.1 Corregir el error de lint y luego reducir las advertencias

El análisis actual tiene **1 error y aproximadamente 25 advertencias**.

Las advertencias principales están en:

- `PanelControlAdmin.jsx`.
- `ResumenJornada.jsx`.
- `VentasDashboard.jsx`.
- `WorkTimer.jsx`.
- `AuthContext.jsx`.
- `Dashboard.jsx`.
- `Usuarios.jsx`.

**Acción gradual:**

1. Corregir el error bloqueante.
2. Eliminar llamadas de carga duplicadas.
3. Revisar dependencias de `useEffect`.
4. Evitar `Date.now()` directamente dentro del render.
5. Separar temporizadores y llamadas API en hooks reutilizables.
6. Dejar el lint sin errores y reducir advertencias por módulo.

### 5.2 Evitar solicitudes repetidas innecesarias

**Hallazgo:** algunos paneles actualizan cada 5 segundos y otros cada 15 segundos, además de actualizar después de eventos.

**Riesgos:**

- Muchas consultas a Render/Supabase.
- Carga innecesaria en móviles.
- Posibles respuestas fuera de orden.

**Acción:** crear un mecanismo común de actualización, cancelar solicitudes anteriores y actualizar solo cuando la pantalla esté visible.

### 5.3 Mejorar estados de carga y errores

Cada panel debería distinguir entre:

- Cargando por primera vez.
- Actualizando en segundo plano.
- Error temporal.
- Sin datos.
- Sin permisos.

No se debe reemplazar una pantalla útil por una pantalla vacía cuando falla una consulta secundaria.

### 5.4 Accesibilidad y navegación por teclado

**Pendientes:**

- Etiquetas visibles asociadas a inputs.
- `aria-label` en botones con solo iconos.
- Foco inicial y retorno de foco en modales.
- Cierre de modales con Escape.
- Contraste suficiente.
- Mensajes con `aria-live`.
- Tablas con encabezados y resumen comprensible.

### 5.5 Corregir detalles de interfaz

- `Login.jsx` referencia `/logo.png`, pero la estructura revisada no muestra ese archivo en `frontend/public`; la imagen puede ocultarse y dejar un espacio innecesario.
- Unificar colores y estilo: hay pantallas con estilos verdes, azules, dorados y fondos oscuros mezclados.
- Revisar el comportamiento en celular de tablas y modales.
- Sustituir emojis funcionales por iconos o texto accesible cuando corresponda.

---

## Prioridad 6 — Reportes y operación administrativa

### 6.1 Validar reportes históricos

Probar con rangos que incluyan:

- Un solo día.
- Cambio de mes.
- Primera y segunda quincena.
- Días sin datos.
- Rango grande.
- Usuario asesor y usuario administrador.

### 6.2 Agregar filtros, paginación y exportación controlada

Los reportes deben permitir consultar por rango y asesor sin cargar toda la base de datos en el navegador.

### 6.3 Mejorar auditoría administrativa

Confirmar que las correcciones administrativas de movimientos, resúmenes y estados registren:

- Usuario que realizó el cambio.
- Valor anterior.
- Valor nuevo.
- Fecha y hora en Colombia.
- Motivo obligatorio.
- Entidad y registro afectado.

### 6.4 Proteger acciones destructivas

Reinicio de jornada, corrección de movimientos, desactivación de usuarios y anulación de ventas deben usar un patrón común de confirmación y motivo cuando corresponda.

---

## Prioridad 7 — Calidad, pruebas y mantenimiento

### 7.1 Aumentar cobertura de pruebas

Actualmente las pruebas automatizadas aprobadas son principalmente de:

- `ResumenJornadaService`.
- `incidenciasController`.

Faltan pruebas para:

- Autenticación y renovación.
- Roles y propiedad del asesor.
- Ventas y anulaciones.
- Metas y auditoría.
- Movimientos y transacciones.
- Reportes.
- Validaciones de fechas y moneda.

### 7.2 Crear pruebas de integración de API

Usar una base de datos de prueba o mocks controlados para verificar rutas completas, códigos HTTP, permisos y respuestas sin depender de producción.

### 7.3 Separar pruebas propias de dependencias

La búsqueda de archivos de prueba debe excluir siempre `node_modules`. El comando de pruebas actual pasa, pero conviene confirmar que Jest no esté descubriendo pruebas internas de dependencias en futuras actualizaciones.

### 7.4 Revisar dependencias vulnerables

La instalación reportó vulnerabilidades moderadas y altas en los paquetes actuales.

**Acción segura:**

1. Ejecutar `npm audit` y guardar el reporte.
2. Identificar qué dependencia introduce cada vulnerabilidad.
3. Actualizar una dependencia a la vez.
4. Ejecutar pruebas y build después de cada grupo.
5. No usar `npm audit fix --force` sin revisar cambios incompatibles.

### 7.5 Agregar scripts reproducibles

Conviene agregar comandos claros para:

- Validar backend.
- Ejecutar pruebas.
- Compilar frontend.
- Ejecutar lint.
- Revisar archivos prohibidos.
- Ejecutar todo en una sola orden antes de publicar.

---

## Prioridad 8 — Base de datos y rendimiento

Esta fase requiere acceso de solo lectura a Supabase antes de modificar nada.

### 8.1 Documentar el esquema real

Consultar y guardar de forma segura:

- Tablas.
- Columnas y tipos.
- Índices.
- Restricciones.
- Claves foráneas.
- Valores por defecto.
- Tipos reales de booleanos y números.
- Zona horaria de las columnas de fecha.

### 8.2 Confirmar migraciones existentes

Antes de ejecutar SQL, verificar si ya existen:

- `metas_asesores`.
- `metas_asesores_auditoria`.
- `ventas_anulaciones_auditoria`.
- Índices de ventas activas y jornadas.

No volver a ejecutar una migración completa sin comprobar el estado actual.

### 8.3 Agregar índices después de medir

Posibles índices a confirmar con el esquema y el volumen real:

- Ventas por fecha y estado.
- Ventas por asesor y fecha.
- Movimientos por asesor y fecha.
- Incidencias por asesor y fecha.
- Resumen de jornada por asesor y fecha.
- Notificaciones por asesor y estado de lectura.

### 8.4 Eliminar funciones duplicadas o heredadas

Hay indicios de piezas históricas y rutas de compatibilidad. Deben documentarse y retirarse solo después de verificar que ningún frontend o despliegue las use.

---

## Prioridad 9 — Despliegue y operación

### 9.1 Conectar y verificar proveedores

Pendiente de la sesión actual:

- GitHub.
- Render.
- Supabase.
- Vercel.

Cuando estén conectados, verificar:

- Rama desplegada.
- Último commit.
- Estado live de Render.
- Variables de entorno sin mostrar valores.
- URL pública del backend.
- Versión desplegada en Vercel.

### 9.2 Crear una lista de comprobación de publicación

Antes de cada publicación:

```bash
find backend -path '*/node_modules' -prune -o -type f -name '*.js' -print0 | xargs -0 -n1 node --check
npm test -- --coverage=false
npm run build --prefix frontend
npm run lint --prefix frontend
git diff --check
git status
```

Además:

- Confirmar rama `main`.
- No incluir `.env`, secretos, `node_modules`, `dist`, `coverage` ni ZIP internos.
- Revisar el diff antes del commit.
- No usar `git push --force`.

### 9.3 Observabilidad

Agregar, sin exponer secretos:

- Endpoint `/health` que confirme también dependencias críticas cuando sea seguro.
- Identificador de solicitud para rastrear errores.
- Logs estructurados.
- Alertas de fallos de base de datos.
- Tiempo de respuesta de consultas importantes.
- Registro de despliegues.

---

## Orden recomendado de ejecución

### Fase A — Corrección inmediata

1. Corregir variable `data` no utilizada.
2. Confirmar que el build, las pruebas y el lint pasen.
3. Retirar el ZIP interno de la copia de entrega.
4. Revisar rutas globales de ventas y reportes.

### Fase B — Seguridad y consistencia

5. Ajustar permisos por rol/asesor.
6. Unificar fechas y hora de Colombia.
7. Agregar límites y validaciones.
8. Proteger operaciones de jornada con transacciones.
9. Completar pruebas de ventas, anulación y autorización.

### Fase C — Funciones pendientes visibles

10. Completar administración de usuarios.
11. Mejorar estados de carga, errores y confirmaciones.
12. Conectar navegación real o retirar menús estáticos.
13. Corregir accesibilidad y diseño móvil.

### Fase D — Base de datos y producción

14. Consultar el esquema real de Supabase en modo lectura.
15. Revisar migraciones e índices.
16. Medir rendimiento.
17. Conectar GitHub, Render y Vercel.
18. Publicar únicamente después de repetir todas las validaciones.

---

## Validaciones ya realizadas durante esta revisión

- Sintaxis del backend: **correcta**.
- Pruebas automatizadas: **2 suites aprobadas, 10 pruebas aprobadas**.
- Build del frontend: **correcto**.
- Lint del frontend: **1 error y aproximadamente 25 advertencias**.
- Secretos `.env`, claves y certificados en la copia saneada: **no encontrados**.
- Conectores GitHub, Render, Supabase y Vercel en esta sesión: **no conectados**.

## Pendientes que requieren acceso externo

No se puede confirmar desde el ZIP:

- Tipos y restricciones reales de Supabase.
- Índices existentes.
- Estado de las migraciones.
- Logs de Render.
- Commit exacto desplegado en Vercel.
- Estado de la solicitud de cambios asociada al pull request #6.

Esos puntos deben verificarse cuando el acceso del navegador o los conectores estén funcionando.
