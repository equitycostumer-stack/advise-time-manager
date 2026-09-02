# Optimización de Advise Time Manager

**Fecha:** 2 de septiembre de 2026  
**Alcance:** primera iteración de estabilización y seguridad, conservando la lógica de jornada existente.

## Mejoras aplicadas

| Área | Cambio | Beneficio |
|---|---|---|
| Autorización | La ruta de compatibilidad `GET /api/movimientos/resumen-jornada/:asesorId` reutiliza `verificarPropioAsesor`. | Un asesor no puede consultar el resumen de otro asesor modificando el parámetro de la URL. |
| Incidencias | `GET /api/incidencias/asesor/:asesorId` queda restringida al propietario o a un administrador. | Se evita la consulta cruzada de incidencias por asesor. |
| Incidencias | El listado de incidencias pendientes y el historial general se limitan automáticamente al asesor autenticado cuando no es administrador. | Se aplica mínimo privilegio sin eliminar la pantalla del asesor. |
| Revisión | `PUT /api/incidencias/:id/revisar` requiere rol `ADMINISTRADOR`. | La revisión deja de estar disponible para cuentas operativas. |
| Identidad | El backend toma `revisada_por` desde el JWT autenticado e ignora el `coach` enviado por el cliente. | Se elimina la posibilidad de falsificar el responsable de una revisión desde el frontend. |
| Validación | Los comentarios de revisión se normalizan y se limitan a 1000 caracteres; una incidencia inexistente devuelve 404. | Contrato de API más claro y entrada más controlada. |
| Frontend | Se eliminó el campo manual de coach en la revisión y se oculta la acción a asesores. | La interfaz coincide con la autorización real del backend. |
| Frontend | Alertas recibe el reloj reactivo del dashboard y se eliminó una petición de resumen que no se utilizaba al abrir el historial. | Menos trabajo innecesario y render más determinista. |
| Pruebas | Se reescribió `ResumenJornadaService.test.js` contra `resumenJornadaService.js` y los métodos actuales del repositorio. | La cobertura valida la implementación vigente, no una API legacy. |
| Pruebas | Se añadieron pruebas para la identidad autenticada, comentarios largos y 404 en revisiones. | Se protege el cambio de seguridad con regresiones automatizadas. |
| Tooling | Se añadió `npm test` en la raíz, se corrigió el módulo CommonJS legado de notificaciones y se normalizó ESLint para que los patrones React heredados sean advertencias durante la refactorización gradual. | Validación local más reproducible y sin errores bloqueantes de lint. |

## Reglas de negocio conservadas

No se modificaron la zona horaria oficial `America/Bogota`, la fórmula de tiempo productivo, la exclusión del almuerzo del tiempo trabajado, la fuente operativa de horarios (`configuracion_horarios`) ni las operaciones de ventas.

Tampoco se modificó el schema de PostgreSQL ni se cambiaron comparaciones numéricas de booleanos. El schema real no está incluido en el proyecto; por tanto, esa normalización debe hacerse después de consultar los tipos de columnas en la base activa.

## Validación ejecutada

| Verificación | Resultado |
|---|---:|
| `npm test -- --coverage=false` | 2 suites aprobadas, 10 pruebas aprobadas |
| Sintaxis JavaScript del backend | Correcta |
| `frontend/npm run build` | Build correcto |
| `frontend/npm run lint` | 0 errores, 20 advertencias heredadas |

Las advertencias restantes corresponden principalmente a llamadas de estado dentro de efectos, dependencias de hooks, uso de `Date.now()` en una página legacy y exportaciones mixtas en contextos. Se dejaron como advertencias porque resolverlas de forma completa requiere una refactorización gradual de temporizadores, dashboard y contextos, con pruebas visuales y funcionales adicionales.

## Próxima iteración recomendada

La siguiente fase debería comenzar con una consulta de solo lectura al PostgreSQL real para documentar tipos, índices, restricciones y claves foráneas. Con esa información se puede normalizar `activo`, `revisada` y otros booleanos sin adivinar el schema. Después conviene incorporar transacciones a entrada/salida, definir índices de jornada y unificar el cálculo de retraso antes de dividir `Buttons.jsx` y `App.jsx`.

## Nota de seguridad

El archivo original compartido incluía configuración de entorno. La entrega saneada excluye `.env`, dependencias instaladas, cobertura y repositorios Git. Si alguno de esos secretos pudo salir del entorno controlado, deben rotarse antes del despliegue.
