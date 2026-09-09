const db = require("../config/db");

function rango(desde, hasta) {
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
    const inicio = desde || hoy;
    const fin = hasta || hoy;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fin)) throw new Error("Las fechas deben tener formato YYYY-MM-DD.");
    if (inicio > fin) throw new Error("La fecha inicial no puede ser posterior a la fecha final.");
    return { desde: inicio, hasta: fin };
}

class AdminRepository {
    async registrarAuditoria(datos) {
        await db.query(`INSERT INTO auditoria_administrativa
            (usuario_id, accion, entidad, entidad_id, motivo, datos_anteriores, datos_nuevos)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)`, [
            datos.usuarioId || null, datos.accion, datos.entidad, datos.entidadId || null,
            datos.motivo || null, JSON.stringify(datos.anteriores ?? null), JSON.stringify(datos.nuevos ?? null)
        ]);
    }

    async obtenerResumen(desde, hasta) {
        const r = rango(desde, hasta);
        const [asesores, asistencia, alertas, auditoria] = await Promise.all([
            db.query(`SELECT a.id, a.nombre, a.activo, COALESCE(e.estado, 'DISPONIBLE') AS estado,
                TO_CHAR(e.inicio_estado, 'YYYY-MM-DD HH24:MI:SS') AS inicio_estado,
                TO_CHAR(e.inicio_jornada, 'YYYY-MM-DD HH24:MI:SS') AS inicio_jornada
                FROM asesores a LEFT JOIN estados_actuales e ON e.asesor_id = a.id
                ORDER BY a.activo DESC, a.nombre ASC`),
            db.query(`SELECT r.id, r.asesor_id, a.nombre AS asesor_nombre,
                TO_CHAR(r.fecha, 'YYYY-MM-DD') AS fecha,
                TO_CHAR(r.hora_entrada, 'YYYY-MM-DD HH24:MI:SS') AS hora_entrada,
                TO_CHAR(r.hora_salida, 'YYYY-MM-DD HH24:MI:SS') AS hora_salida,
                r.tiempo_trabajado, r.tiempo_break, r.tiempo_almuerzo, r.tiempo_bano,
                r.tiempo_capacitacion, r.tiempo_reunion, r.tiempo_productivo,
                r.llego_tarde, r.minutos_retraso
                FROM resumen_jornada r INNER JOIN asesores a ON a.id = r.asesor_id
                WHERE r.fecha BETWEEN $1::date AND $2::date ORDER BY r.fecha DESC, a.nombre ASC`, [r.desde, r.hasta]),
            db.query(`WITH hoy AS (SELECT (NOW() AT TIME ZONE 'America/Bogota')::date AS fecha)
                SELECT 'JORNADA_ANTERIOR' AS tipo, a.id AS asesor_id, a.nombre,
                    'Jornada abierta de un día anterior' AS detalle,
                    TO_CHAR(e.inicio_jornada, 'YYYY-MM-DD HH24:MI:SS') AS fecha
                FROM asesores a INNER JOIN estados_actuales e ON e.asesor_id = a.id CROSS JOIN hoy
                WHERE a.activo = 1 AND e.inicio_jornada::date < hoy.fecha
                UNION ALL
                SELECT 'SIN_ENTRADA', a.id, a.nombre, 'Asesor activo sin jornada registrada hoy', NULL
                FROM asesores a CROSS JOIN hoy WHERE a.activo = 1 AND NOT EXISTS
                    (SELECT 1 FROM resumen_jornada r WHERE r.asesor_id = a.id AND r.fecha = hoy.fecha)
                ORDER BY tipo, nombre`),
            db.query(`SELECT au.id, au.accion, au.entidad, au.entidad_id, au.motivo,
                au.datos_anteriores, au.datos_nuevos,
                TO_CHAR(au.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
                u.usuario FROM auditoria_administrativa au LEFT JOIN usuarios u ON u.id = au.usuario_id
                ORDER BY au.created_at DESC, au.id DESC LIMIT 25`)
        ]);
        const filas = asistencia.rows;
        const productividad = filas.reduce((t, x) => ({
            tiempo_trabajado: t.tiempo_trabajado + Number(x.tiempo_trabajado || 0),
            tiempo_productivo: t.tiempo_productivo + Number(x.tiempo_productivo || 0),
            tiempo_break: t.tiempo_break + Number(x.tiempo_break || 0),
            tiempo_almuerzo: t.tiempo_almuerzo + Number(x.tiempo_almuerzo || 0),
            tiempo_bano: t.tiempo_bano + Number(x.tiempo_bano || 0)
        }), { tiempo_trabajado: 0, tiempo_productivo: 0, tiempo_break: 0, tiempo_almuerzo: 0, tiempo_bano: 0 });
        productividad.porcentaje = productividad.tiempo_trabajado ? Math.round(productividad.tiempo_productivo / productividad.tiempo_trabajado * 100) : 0;
        return { rango: r, asesores: asesores.rows, asistencia: filas, alertas: alertas.rows, auditoria: auditoria.rows, productividad };
    }

    async obtenerAuditoria(limite = 100) {
        const n = Math.min(Math.max(Number(limite) || 100, 1), 500);
        const { rows } = await db.query(`SELECT au.id, au.accion, au.entidad, au.entidad_id, au.motivo,
            au.datos_anteriores, au.datos_nuevos, TO_CHAR(au.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
            u.usuario FROM auditoria_administrativa au LEFT JOIN usuarios u ON u.id = au.usuario_id
            ORDER BY au.created_at DESC, au.id DESC LIMIT $1`, [n]);
        return rows;
    }

    async obtenerMovimientos(desde, hasta, asesorId) {
        const r = rango(desde, hasta);
        const params = [r.desde, r.hasta];
        let filtro = "";
        if (asesorId) {
            params.push(Number(asesorId));
            filtro = ` AND m.asesor_id = $${params.length}`;
        }
        const { rows } = await db.query(`SELECT m.id, m.asesor_id, a.nombre AS asesor_nombre,
            m.tipo, TO_CHAR(m.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora, m.observacion
            FROM movimientos m INNER JOIN asesores a ON a.id = m.asesor_id
            WHERE m.fecha_hora::date BETWEEN $1::date AND $2::date ${filtro}
            ORDER BY m.fecha_hora DESC, m.id DESC LIMIT 1000`, params);
        return rows;
    }

    async cambiarEstadoAsesor(asesorId, activo, usuarioId, motivo) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const actual = await client.query("SELECT id, nombre, activo FROM asesores WHERE id = $1 FOR UPDATE", [asesorId]);
            if (!actual.rows.length) throw new Error("El asesor no existe.");
            const nuevo = await client.query("UPDATE asesores SET activo = $1 WHERE id = $2 RETURNING id, nombre, activo", [activo ? 1 : 0, asesorId]);
            await client.query(`INSERT INTO auditoria_administrativa
                (usuario_id, accion, entidad, entidad_id, motivo, datos_anteriores, datos_nuevos)
                VALUES ($1, 'CAMBIO_ESTADO', 'ASESOR', $2, $3, $4::jsonb, $5::jsonb)`,
                [usuarioId || null, asesorId, motivo || "Cambio de estado desde administración", JSON.stringify(actual.rows[0]), JSON.stringify(nuevo.rows[0])]);
            await client.query("COMMIT");
            return nuevo.rows[0];
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    }

    async corregirMovimiento(id, datos, usuarioId) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query("SELECT id, asesor_id, tipo, fecha_hora, observacion FROM movimientos WHERE id = $1 FOR UPDATE", [id]);
            if (!q.rows.length) throw new Error("El movimiento no existe.");
            if (!datos.motivo || String(datos.motivo).trim().length < 5) throw new Error("Debe indicar un motivo de al menos 5 caracteres.");
            const anterior = q.rows[0];
            const permitidos = ["ENTRADA", "SALIDA", "BREAK_INICIO", "BREAK_FIN", "ALMUERZO_INICIO", "ALMUERZO_FIN", "BANO_INICIO", "BANO_FIN", "CAPACITACION_INICIO", "CAPACITACION_FIN", "REUNION_INICIO", "REUNION_FIN"];
            const tipo = String(datos.tipo || anterior.tipo).trim().toUpperCase();
            if (!permitidos.includes(tipo)) throw new Error("Tipo de movimiento no válido.");
            const nuevo = await client.query(`UPDATE movimientos SET tipo = $1, fecha_hora = $2, observacion = $3
                WHERE id = $4 RETURNING id, asesor_id, tipo, fecha_hora, observacion`,
                [tipo, datos.fecha_hora || anterior.fecha_hora, datos.observacion ?? anterior.observacion, id]);
            await client.query(`INSERT INTO auditoria_administrativa
                (usuario_id, accion, entidad, entidad_id, motivo, datos_anteriores, datos_nuevos)
                VALUES ($1, 'CORRECCION', 'MOVIMIENTO', $2, $3, $4::jsonb, $5::jsonb)`,
                [usuarioId || null, id, String(datos.motivo).trim(), JSON.stringify(anterior), JSON.stringify(nuevo.rows[0])]);
            await client.query("COMMIT");
            return nuevo.rows[0];
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    }

    async corregirResumen(id, datos, usuarioId) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const q = await client.query(`SELECT id, asesor_id, fecha, hora_entrada, hora_salida, tiempo_trabajado,
                tiempo_productivo, tiempo_break, tiempo_almuerzo, tiempo_bano, tiempo_capacitacion,
                tiempo_reunion, llego_tarde, minutos_retraso FROM resumen_jornada WHERE id = $1 FOR UPDATE`, [id]);
            if (!q.rows.length) throw new Error("El resumen de jornada no existe.");
            if (!datos.motivo || String(datos.motivo).trim().length < 5) throw new Error("Debe indicar un motivo de al menos 5 caracteres.");
            const anterior = q.rows[0];
            const campos = ["hora_entrada", "hora_salida", "tiempo_trabajado", "tiempo_productivo", "tiempo_break", "tiempo_almuerzo", "tiempo_bano", "tiempo_capacitacion", "tiempo_reunion", "llego_tarde", "minutos_retraso"];
            const values = campos.map((c) => datos[c] === undefined ? anterior[c] : datos[c]);
            const nuevo = await client.query(`UPDATE resumen_jornada SET hora_entrada=$1, hora_salida=$2, tiempo_trabajado=$3,
                tiempo_productivo=$4, tiempo_break=$5, tiempo_almuerzo=$6, tiempo_bano=$7, tiempo_capacitacion=$8,
                tiempo_reunion=$9, llego_tarde=$10, minutos_retraso=$11 WHERE id=$12 RETURNING *`, [...values, id]);
            await client.query(`INSERT INTO auditoria_administrativa
                (usuario_id, accion, entidad, entidad_id, motivo, datos_anteriores, datos_nuevos)
                VALUES ($1, 'CORRECCION', 'RESUMEN_JORNADA', $2, $3, $4::jsonb, $5::jsonb)`,
                [usuarioId || null, id, String(datos.motivo).trim(), JSON.stringify(anterior), JSON.stringify(nuevo.rows[0])]);
            await client.query("COMMIT");
            return nuevo.rows[0];
        } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
    }
}

module.exports = new AdminRepository();
