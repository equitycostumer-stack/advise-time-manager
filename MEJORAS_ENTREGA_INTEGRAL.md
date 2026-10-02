# Entrega integral de mejoras

## Estado

Entrega preparada para revisión en una rama nueva antes de fusionar a `main`.

## Mejoras implementadas

- Seguridad de autenticación: bloqueo por intentos, rate limit, validación de contraseña y secreto JWT.
- Administración segura de usuarios: validaciones, duplicados, roles, vínculos de asesor y contraseña temporal aleatoria.
- Privacidad de datos: alcance por asesor para ventas, reportes, ranking e incidencias.
- Zona horaria: rangos diarios en hora de Colombia y fechas reales del calendario.
- Ventas y recaudos: validación de valores, límites, anulación con motivo y metas quincenales.
- API: CORS configurable, límites de payload, cabeceras de seguridad y errores uniformes.
- Frontend: menú administrativo de usuarios, altas, edición, activación y restablecimiento.
- Mantenimiento: servidor unificado, eliminación de ZIP interno y logs de depuración.
- Calidad: pruebas automatizadas y comando `npm run validate`.

## Verificaciones ejecutadas

- 3 suites de pruebas aprobadas.
- 15 pruebas aprobadas.
- Build de Vite correcto.
- Sintaxis backend correcta.
- Búsqueda de `CURRENT_DATE` y `DATE(` sin resultados en el código de aplicación.
- No se incluyeron secretos en la entrega.

## Advertencias no bloqueantes

El lint todavía informa advertencias de React sobre efectos, dependencias de hooks y llamadas a `Date.now()` durante render. No son errores de compilación ni fueron introducidos por la lógica de seguridad. Se recomienda tratarlas en una iteración de refactor frontend separada, con pruebas visuales y de regresión.

## Antes de fusionar

- Configurar `JWT_SECRET` de al menos 32 caracteres.
- Configurar `ALLOWED_ORIGINS` con el dominio real de Vercel.
- Configurar `VITE_API_URL` con el dominio real de Render.
- Confirmar que el esquema existente contiene los campos de bloqueo de usuarios ya utilizados por la aplicación.
- Probar login, jornada, ventas, reportes, usuarios y administración con un asesor y un administrador.
