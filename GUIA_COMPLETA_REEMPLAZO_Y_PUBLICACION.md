# Guía completa de reemplazo y publicación

## 1. Qué se mejoró

### Seguridad y privacidad

- Bloqueo temporal después de cinco intentos fallidos por usuario.
- Límite de diez intentos de login por IP cada minuto.
- Contraseñas temporales aleatorias al restablecer una cuenta.
- Contraseñas nuevas de mínimo 10 caracteres, con letras y números.
- Un administrador no puede desactivarse ni quitarse sus propios permisos.
- Validación de roles, correos, teléfonos, IDs y usuarios.
- Errores de API sin exposición de SQL ni de URLs internas.
- Payload JSON y formularios limitados a 1 MB.
- CORS configurable mediante `ALLOWED_ORIGINS`.
- Cabeceras básicas de seguridad y eliminación de `X-Powered-By`.
- Sin secretos incluidos en el ZIP.

### Jornada y Colombia

- Consultas diarias de incidencias usando `America/Bogota`.
- Eliminación de filtros `CURRENT_DATE` y `DATE(columna)` que podían cambiar el día incorrectamente o impedir el uso de índices.
- Validación de fechas calendario reales, incluidos años bisiestos.
- Metas quincenales correctas para febrero y meses de 28, 29, 30 y 31 días.

### Ventas, recaudos y metas

- Filtros de privacidad por asesor en ventas, ranking y reportes.
- Acceso global reservado al administrador.
- Validación de valores positivos y recaudo no mayor que venta.
- Motivo obligatorio para anulación.
- Rangos de reportes limitados a 366 días.
- Límites de filas en consultas históricas.
- Panel de usuarios integrado al menú principal.
- Alta, edición, activación/desactivación y restablecimiento de usuarios.

### Calidad y mantenimiento

- Servidor oficial unificado en `backend/server.js`.
- `backend/routes/server.js` quedó como lanzador compatible y ya no conserva una segunda configuración.
- Se retiraron logs de depuración del componente de movimientos.
- Se agregó `npm run validate`.
- Se agregaron pruebas de fechas, quincenas, límites y reglas de ventas.
- Se agregaron `.env.example` para backend y frontend.

## 2. Archivos importantes de esta entrega

Backend:

- `backend/server.js`
- `backend/routes/server.js`
- `backend/routes/authRoutes.js`
- `backend/middleware/rateLimitLogin.js`
- `backend/services/authService.js`
- `backend/services/usuariosService.js`
- `backend/repositories/usuariosRepository.js`
- `backend/controllers/usuariosController.js`
- `backend/services/robustezService.test.js`
- Todos los archivos de ventas, reportes, metas e incidencias modificados en la entrega anterior.

Frontend:

- `frontend/src/App.jsx`
- `frontend/src/pages/Usuarios.jsx`
- `frontend/src/components/Buttons.jsx`
- `frontend/src/components/VentasDashboard.jsx`

Configuración:

- `backend/.env.example`
- `frontend/.env.example`
- `package.json`

## 3. Respaldo antes de reemplazar

1. Descarga el ZIP actual o crea una copia de la carpeta del repositorio.
2. No elimines la base de datos ni ejecutes SQL destructivo.
3. Mantén una copia de los archivos `.env` fuera del repositorio.
4. En VS Code confirma que abriste el repositorio correcto.
5. Crea una rama nueva antes de copiar archivos:

```bash
git switch -c mejoras-integrales-robustez
```

## 4. Reemplazo desde VS Code

1. Descarga y descomprime el ZIP de esta entrega en una carpeta temporal.
2. Copia el contenido encima de la carpeta del repositorio.
3. Cuando solicite reemplazar archivos, acepta solo dentro del repositorio.
4. No reemplaces ni subas:
   - `.env`
   - `.env.local`
   - `node_modules`
   - `frontend/dist`
   - `coverage`
   - contraseñas o claves privadas
5. Revisa el panel **Source Control**.
6. Comprueba que los archivos nuevos sean los esperados.

## 5. Instalar y validar localmente

Desde la raíz del repositorio:

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run validate
```

El resultado esperado es:

- 15 pruebas aprobadas o más si agregas pruebas propias.
- Lint con 0 errores. Las advertencias actuales son advertencias de hooks/pureza preexistentes y no bloquean la compilación.
- Build de Vite correcto.
- Sintaxis backend correcta.

Si necesitas ejecutar cada validación por separado:

```bash
npm test -- --coverage=false
npm run lint --prefix frontend
npm run build --prefix frontend
find backend -path '*/node_modules' -prune -o -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

## 6. Variables de entorno del backend en Render

En Render, servicio backend, crea o verifica:

```text
NODE_ENV=production
PORT=10000
DATABASE_URL=URL_PRIVADA_DE_SUPABASE
JWT_SECRET=SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=https://TU-DOMINIO-DE-VERCEL.vercel.app
```

Opcionales:

```text
RESEND_API_KEY=...
EMAIL_FROM=...
EMAIL_TEST_MODE=true
```

Recomendaciones:

- Usa el pooler de Supabase recomendado para el proveedor de backend.
- No pongas `DATABASE_URL` en el frontend.
- No copies los valores a GitHub, README ni mensajes.
- Cambia `EMAIL_TEST_MODE` a `false` solo después de comprobar el envío real.
- Si el proveedor asigna automáticamente `PORT`, conserva el valor que Render entregue.

## 7. Variables de entorno del frontend en Vercel

En Vercel, proyecto frontend, crea:

```text
VITE_API_URL=https://TU-BACKEND.onrender.com
```

Usa la URL pública real de Render, sin incluir credenciales.

Después de guardar las variables, crea un nuevo deployment. Las variables `VITE_*` se incorporan durante el build; cambiarla requiere volver a desplegar.

## 8. Commit y subida desde VS Code

### Interfaz gráfica

1. Abre **Source Control**.
2. Revisa cada diff.
3. Confirma que no aparezcan `.env`, `node_modules`, `dist`, `coverage` ni ZIPs.
4. Escribe:

```text
feat: completar robustez y seguridad de la aplicación
```

5. Pulsa **Commit**.
6. Pulsa **Publish Branch**.
7. En GitHub crea un Pull Request hacia `main`.

### Terminal integrada de VS Code

```bash
git status --short
git diff --check
git add .
git diff --cached --check
git status --short
git commit -m "feat: completar robustez y seguridad de la aplicación"
git push -u origin mejoras-integrales-robustez
```

Nunca uses `git push --force` para esta publicación.

## 9. Revisión del Pull Request

Antes de fusionar, comprueba:

- Un asesor no puede consultar ventas, reportes o ranking de otro asesor.
- El administrador sí puede consultar la información global.
- Un login equivocado cinco veces bloquea temporalmente la cuenta.
- Un usuario inactivo no puede iniciar sesión.
- El restablecimiento no entrega siempre la misma contraseña.
- Un asesor nuevo exige un asesor vinculado.
- Un administrador no puede desactivarse ni quitarse su rol.
- Una venta con recaudo superior es rechazada.
- Una segunda quincena de febrero funciona.
- El día operativo cambia según Colombia y no según la zona del servidor.
- Los reportes de más de 366 días son rechazados.
- El panel de usuarios aparece solo para administradores.

## 10. Publicación segura

1. Fusiona el Pull Request después de revisar los checks.
2. En Render, espera el deploy del backend.
3. Abre:

```text
https://TU-BACKEND.onrender.com/health
```

Debe responder JSON con `ok: true`.

4. En Vercel, despliega el frontend usando `VITE_API_URL` correcto.
5. Prueba login, logout, entrada, pausa, salida, venta, recaudo, reportes y configuración.
6. Revisa los logs de Render buscando errores de conexión, CORS o columnas faltantes.
7. Si un error aparece, revierte el deployment o vuelve temporalmente a la versión anterior; no borres datos.

## 11. Prueba mínima posterior a publicar

- Login correcto.
- Login con contraseña incorrecta.
- Bloqueo temporal después de varios intentos.
- Cambio obligatorio de contraseña.
- Jornada de un asesor.
- Registro de venta y recaudo.
- Anulación con motivo.
- Consulta de ranking.
- Consulta de reporte por asesor.
- Administración de usuario desde el menú.
- Revisión de una incidencia desde administrador.
- Verificación del día y hora en Colombia.

## 12. Nota sobre Supabase

Esta entrega no agrega tablas ni columnas nuevas. No ejecutes migraciones destructivas. Si la base activa no contiene las columnas ya usadas por el proyecto, detén el despliegue y revisa el esquema antes de corregirlo; no inventes nombres de columnas en producción.
