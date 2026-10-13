# Registro diario de datos y análisis

## Funcionalidad

- Cada asesora puede guardar un registro por día.
- El registro contiene solamente cantidades e IDs:
  - Datos adquiridos del día.
  - Análisis o auditorías de reportes de crédito realizados.
- Los registros se pueden consultar por fecha inicial y final.
- Un administrador puede filtrar también por asesora.
- Exportación del resultado consultado a Word y Excel.
- Si se vuelve a guardar la misma asesora y fecha, se actualiza el registro existente.
- Los asesores solo pueden consultar y modificar su propio registro; el administrador puede consultar todo el equipo.

## 1. Supabase

Abrir el SQL Editor y ejecutar completo:

```text
sql_registros_diarios.sql
```

## 2. Reemplazar/copiar archivos

Copiar respetando estas rutas:

```text
backend/routes/registrosDiarios.js
backend/controllers/registrosDiariosController.js
backend/services/registrosDiariosService.js
backend/repositories/registrosDiariosRepository.js
backend/server.js
frontend/src/components/RegistrosDiarios.jsx
frontend/src/App.jsx
```

## 3. Validar localmente

Desde la raíz:

```cmd
node --check backend\routes\registrosDiarios.js
node --check backend\controllers\registrosDiariosController.js
node --check backend\services\registrosDiariosService.js
node --check backend\repositories\registrosDiariosRepository.js
node --check backend\server.js

cd frontend
npm run build
cd ..
```

## 4. Subir a GitHub

```cmd
git add sql_registros_diarios.sql backend/routes/registrosDiarios.js backend/controllers/registrosDiariosController.js backend/services/registrosDiariosService.js backend/repositories/registrosDiariosRepository.js backend/server.js frontend/src/components/RegistrosDiarios.jsx frontend/src/App.jsx
git commit -m "Agrega registro diario de datos y analisis"
git push origin feature/validacion-ventas-admin
```

## 5. Despliegue

1. Esperar el Preview de Vercel.
2. Probar el botón **Registro diario**.
3. Desplegar Render con **Manual Deploy > Deploy latest commit**.
4. Fusionar el Pull Request a `main` cuando todo esté verificado.
5. Actualizar producción con `Ctrl + F5`.
