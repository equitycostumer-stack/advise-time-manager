# Prioridades 1, 2 y 3 — Advise Time Manager

Este documento acompaña la implementación de metas, ventas, recaudo y el centro de control administrativo.

## Qué incluye

- **Prioridad 1:** registro y consulta de ventas activas por asesor.
- **Prioridad 2:** metas por asesor para periodos mensuales o quincenales.
- **Prioridad 3:** seguimiento administrativo de ventas, recaudo y cumplimiento.

La aplicación está dividida en:

- `frontend/`: React + Vite.
- `backend/`: API Express + PostgreSQL.
- `sql_prioridades_1_2_3.sql`: migración para la tabla `metas_asesores` e índices asociados.

## Instalación local

> No se deben subir al repositorio `node_modules`, archivos `.env`, cobertura ni archivos ZIP.

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
```

Configura las variables de entorno a partir de ejemplos locales. Nunca copies credenciales reales a este README ni al repositorio.

## Aplicar la migración SQL

1. Haz un respaldo de la base de datos.
2. Abre `sql_prioridades_1_2_3.sql` en el editor SQL de Supabase/PostgreSQL.
3. Verifica que existan las tablas `asesores`, `usuarios` y `ventas` con las columnas referenciadas.
4. Ejecuta el script una sola vez.
5. Comprueba que se haya creado `metas_asesores` y que los índices existan.

El índice parcial sobre `ventas.estado = 'ACTIVA'` presupone que la columna `estado` y el valor `ACTIVA` coinciden con el esquema activo. Si la instalación usa otro nombre o valor, ajusta el script después de consultar el esquema real.

## Verificación

Desde la raíz del proyecto:

```bash
npm test -- --coverage=false
npm run build --prefix frontend
npm run lint --prefix frontend
```

El backend también puede validarse sin conectarse a la base de datos:

```bash
find backend -path '*/node_modules' -prune -o -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

## Desarrollo

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

El frontend utiliza la URL de API definida en `frontend/.env`. Para producción, configura esa variable en el proveedor de despliegue y no la incluyas en el ZIP.

## Subida correcta a Git

Desde una copia limpia del proyecto:

```bash
git status --short
git add README_PRIORIDADES_1_2_3.md sql_prioridades_1_2_3.sql .gitignore
# Agrega también los archivos de código que hayas revisado y probado
git commit -m "Documenta prioridades 1 2 y 3"
git push origin feature/prioridades-control-productividad
```

Antes de ejecutar `git push`, confirma que estás en la rama correcta y que no aparecen `.env`, `node_modules`, `coverage`, archivos temporales o credenciales en `git status`.
