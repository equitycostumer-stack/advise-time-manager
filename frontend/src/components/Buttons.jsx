import api from "../services/api";

export default function Buttons({

    asesor,

    estado,

    setEstado,

    setResumen,

    onMovimientoRegistrado

}) {

    // ======================================================
    // REGISTRAR MOVIMIENTO
    // ======================================================

    async function registrar(tipo, nuevoEstado) {

    console.log("===== PASO 1 =====");

    if (!asesor) {

        console.log("No hay asesor seleccionado");

        alert("Seleccione un asesor.");

        return;

    }

    console.log("===== PASO 2 =====");

    console.log({
        asesor,
        tipo,
        nuevoEstado
    });

    try {

        console.log("===== PASO 3 =====");

        const { data } = await api.post(

            "/movimientos",

            {

                asesor_id: Number(asesor),

                tipo

            }

        );

        console.log("===== PASO 4 =====");

        console.log(data);

        if (!data?.ok) {

            throw new Error(

                data?.mensaje ||

                data?.error ||

                "No fue posible registrar el movimiento."

            );

        }

        console.log("===== PASO 5 =====");

        const estadoServidor =

            data?.data?.estado ||

            data?.estado ||

            nuevoEstado;

        setEstado(estadoServidor);

        if (setResumen) {

            if (tipo === "SALIDA") {

                setResumen(

                    data?.resumen ||

                    data?.data?.resumen ||

                    null

                );

            }

            else if (tipo === "ENTRADA") {

                setResumen(null);

            }

        }

        if (typeof onMovimientoRegistrado === "function") {

            console.log("===== PASO 6 =====");

            await onMovimientoRegistrado();

        }

        console.log("===== PASO 7 =====");

    }

    catch (error) {

        console.log("===== ERROR =====");

        console.error(error);

        alert(

            error.response?.data?.mensaje ||

            error.response?.data?.error ||

            error.message ||

            "No fue posible registrar el movimiento."

        );

    }

}

    // ======================================================
    // ESTILOS
    // ======================================================

    function estilo(color) {

        return {

            background: color,

            color: "#fff",

            border: "none",

            borderRadius: "10px",

            padding: "15px",

            fontSize: "18px",

            fontWeight: "bold",

            cursor: "pointer",

            width: "100%"

        };

    }
// ======================================================
// ESTADOS
// ======================================================

const estadoActual = String(estado || "")
    .trim()
    .toUpperCase();

const trabajando =
    estadoActual.includes("TRABAJANDO");

const enBreak =
    estadoActual.includes("BREAK");

const enAlmuerzo =
    estadoActual.includes("ALMUERZO");

const enBano =
    estadoActual.includes("BANO") ||
    estadoActual.includes("BAÑO");

const enCapacitacion =
    estadoActual.includes("CAPACITACION") ||
    estadoActual.includes("CAPACITACIÓN");

const enReunion =
    estadoActual.includes("REUNION") ||
    estadoActual.includes("REUNIÓN");

const disponible =
    estadoActual.includes("DISPONIBLE") ||
    estadoActual.includes("SALIDA");

return (

    <div className="grid">

        {/* ====================================== */}
        {/* ENTRADA */}
        {/* ====================================== */}

        <button
            style={estilo("#0B5ED7")}
            disabled={!disponible}
            onClick={() =>
                registrar(
                    "ENTRADA",
                    "TRABAJANDO"
                )
            }
        >
            🟢 ENTRADA
        </button>

        {/* ====================================== */}
        {/* BREAK */}
        {/* ====================================== */}

        <button
            style={estilo("#F39C12")}
            disabled={
                !trabajando &&
                !enBreak
            }
            onClick={() =>
                registrar(
                    enBreak
                        ? "BREAK_FIN"
                        : "BREAK_INICIO",
                    enBreak
                        ? "TRABAJANDO"
                        : "BREAK"
                )
            }
        >
            {
                enBreak
                    ? "▶ REGRESO BREAK"
                    : "☕ BREAK"
            }
        </button>

        {/* ====================================== */}
        {/* ALMUERZO */}
        {/* ====================================== */}

        <button
            style={estilo("#27AE60")}
            disabled={
                !trabajando &&
                !enAlmuerzo
            }
            onClick={() =>
                registrar(
                    enAlmuerzo
                        ? "ALMUERZO_FIN"
                        : "ALMUERZO_INICIO",
                    enAlmuerzo
                        ? "TRABAJANDO"
                        : "ALMUERZO"
                )
            }
        >
            {
                enAlmuerzo
                    ? "▶ REGRESO ALMUERZO"
                    : "🍽 ALMUERZO"
            }
        </button>
        {/* ====================================== */}
        {/* BAÑO */}
        {/* ====================================== */}

        <button
            style={estilo("#16A085")}
            disabled={!trabajando && !enBano}
            onClick={() =>
                registrar(
                    enBano
                        ? "BANO_FIN"
                        : "BANO_INICIO",
                    enBano
                        ? "TRABAJANDO"
                        : "BANO"
                )
            }
        >
            {
                enBano
                    ? "▶ REGRESO BAÑO"
                    : "🚻 BAÑO"
            }
        </button>

        {/* ====================================== */}
        {/* CAPACITACIÓN */}
        {/* ====================================== */}

        <button
            style={estilo("#8E44AD")}
            disabled={!trabajando && !enCapacitacion}
            onClick={() =>
                registrar(
                    enCapacitacion
                        ? "CAPACITACION_FIN"
                        : "CAPACITACION_INICIO",
                    enCapacitacion
                        ? "TRABAJANDO"
                        : "CAPACITACION"
                )
            }
        >
            {
                enCapacitacion
                    ? "▶ FIN CAPACITACIÓN"
                    : "📚 CAPACITACIÓN"
            }
        </button>

        {/* ====================================== */}
        {/* REUNIÓN */}
        {/* ====================================== */}

        <button
            style={estilo("#2C3E50")}
            disabled={!trabajando && !enReunion}
            onClick={() =>
                registrar(
                    enReunion
                        ? "REUNION_FIN"
                        : "REUNION_INICIO",
                    enReunion
                        ? "TRABAJANDO"
                        : "REUNION"
                )
            }
        >
            {
                enReunion
                    ? "▶ FIN REUNIÓN"
                    : "👥 REUNIÓN"
            }
        </button>

        {/* ====================================== */}
        {/* SALIDA */}
        {/* ====================================== */}

        <button
            style={estilo("#C0392B")}
            disabled={!trabajando}
            onClick={() =>
                registrar(
                    "SALIDA",
                    "SALIDA"
                )
            }
        >
            🔴 SALIDA
        </button>

    </div>

);

}