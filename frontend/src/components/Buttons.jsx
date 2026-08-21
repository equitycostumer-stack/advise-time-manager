import { useState } from "react";
import api from "../services/api";

export default function Buttons({

    asesor,

    estado,

    inicioJornada,

    setEstado,

    setResumen,

    onMovimientoRegistrado

}) {

    // ======================================================
    // EFECTO VISUAL DE PRESIÓN DEL BOTÓN
    // ======================================================

    const [botonPresionado, setBotonPresionado] =
        useState(null);


    // ======================================================
    // REGISTRAR MOVIMIENTO
    // ======================================================

    async function registrar(
        tipo,
        nuevoEstado
    ) {

        console.log(
            "===== PASO 1 ====="
        );


        if (!asesor) {

            console.log(
                "No hay asesor seleccionado"
            );

            alert(
                "Seleccione un asesor."
            );

            return;

        }


        console.log(
            "===== PASO 2 ====="
        );


        console.log({

            asesor,

            tipo,

            nuevoEstado

        });


        // ==================================================
        // ACTIVAR EFECTO VISUAL
        // ==================================================

        setBotonPresionado(
            tipo
        );


        try {

            console.log(
                "===== PASO 3 ====="
            );


            const { data } =

                await api.post(

                    "/movimientos",

                    {

                        asesor_id:
                            Number(asesor),

                        tipo

                    }

                );


            console.log(
                "===== PASO 4 ====="
            );


            console.log(
                data
            );


            if (!data?.ok) {

                throw new Error(

                    data?.mensaje ||

                    data?.error ||

                    "No fue posible registrar el movimiento."

                );

            }


            console.log(
                "===== PASO 5 ====="
            );


            const estadoServidor =

                data?.data?.estado ||

                data?.estado ||

                nuevoEstado;


            setEstado(
                estadoServidor
            );


            // ==================================================
            // ACTUALIZAR RESUMEN
            // ==================================================

            if (setResumen) {

                if (
                    tipo === "SALIDA"
                ) {

                    setResumen(

                        data?.resumen ||

                        data?.data?.resumen ||

                        null

                    );

                }

                else if (
                    tipo === "ENTRADA"
                ) {

                    setResumen(
                        null
                    );

                }

            }


            // ==================================================
            // ACTUALIZAR INFORMACIÓN
            // ==================================================

            if (
                typeof onMovimientoRegistrado ===
                "function"
            ) {

                console.log(
                    "===== PASO 6 ====="
                );


                await onMovimientoRegistrado();

            }


            console.log(
                "===== PASO 7 ====="
            );

        }

        catch (error) {

            console.log(
                "===== ERROR ====="
            );


            console.error(
                error
            );


            alert(

                error.response?.data?.mensaje ||

                error.response?.data?.error ||

                error.message ||

                "No fue posible registrar el movimiento."

            );

        }

        finally {

            // ==============================================
            // QUITAR EFECTO VISUAL
            // ==============================================

            setTimeout(() => {

                setBotonPresionado(
                    null
                );

            }, 150);

        }

    }
    // ======================================================
    // ESTILOS
    // ======================================================

    function estilo(
        color,
        tipo
    ) {

        const presionado =
            botonPresionado === tipo;


        return {

            background:
                color,

            color:
                "#fff",

            border:
                "none",

            borderRadius:
                "10px",

            padding:
                "15px",

            fontSize:
                "18px",

            fontWeight:
                "bold",

            cursor:
                "pointer",

            width:
                "100%",


            // ==============================================
            // EFECTO DE PRESIÓN
            // ==============================================

            transform:
                presionado
                    ? "translateY(4px) scale(0.98)"
                    : "translateY(0) scale(1)",


            boxShadow:
                presionado

                    ? "inset 0 3px 7px rgba(0,0,0,0.35)"

                    : "0 5px 8px rgba(0,0,0,0.20)",


            transition:
                "transform 0.08s ease, box-shadow 0.08s ease"

        };

    }
   
    // ======================================================
    // ¿LA JORNADA GUARDADA ES DE HOY? (hora Colombia)
    // ======================================================

    function esMismaFechaColombia(fecha) {

        if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
            return false;
        }

        const formato = {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        };

        const fechaTexto =
            new Intl.DateTimeFormat("en-CA", formato).format(fecha);

        const hoyTexto =
            new Intl.DateTimeFormat("en-CA", formato).format(new Date());

        return fechaTexto === hoyTexto;

    }

    // ======================================================
    // ESTADOS
    // ======================================================

    const estadoActual =
        String(estado || "")
            .trim()
            .toUpperCase();


    const trabajando =
        estadoActual.includes(
            "TRABAJANDO"
        );


    const enBreak =
        estadoActual.includes(
            "BREAK"
        );


    const enAlmuerzo =
        estadoActual.includes(
            "ALMUERZO"
        );


    const enBano =
        estadoActual.includes("BANO") ||
        estadoActual.includes("BAÑO");


    const enCapacitacion =
        estadoActual.includes(
            "CAPACITACION"
        ) ||
        estadoActual.includes(
            "CAPACITACIÓN"
        );


    const enReunion =
        estadoActual.includes(
            "REUNION"
        ) ||
        estadoActual.includes(
            "REUNIÓN"
        );


     const jornadaEsDeHoy =
        esMismaFechaColombia(inicioJornada);

    const disponible =
        estadoActual.includes("DISPONIBLE") ||
        (
            estadoActual.includes("SALIDA") &&
            !jornadaEsDeHoy
        );
        
console.log("================================");
console.log("DEBUG BOTONES");
console.log("asesor:", asesor);
console.log("estado ORIGINAL:", estado);
console.log("estado NORMALIZADO:", estadoActual);
console.log("inicioJornada:", inicioJornada);
console.log("jornadaEsDeHoy:", jornadaEsDeHoy);
console.log("disponible:", disponible);
console.log("trabajando:", trabajando);
console.log("enBreak:", enBreak);
console.log("enAlmuerzo:", enAlmuerzo);
console.log("================================");

    return (

        <div className="grid">

            {/* ====================================== */}
            {/* ENTRADA */}
            {/* ====================================== */}

            <button
                style={estilo(
                    "#0B5ED7",
                    "ENTRADA"
                )}
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
                style={estilo(
                    "#F39C12",
                    enBreak
                        ? "BREAK_FIN"
                        : "BREAK_INICIO"
                )}
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
                style={estilo(
                    "#27AE60",
                    enAlmuerzo
                        ? "ALMUERZO_FIN"
                        : "ALMUERZO_INICIO"
                )}
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
                style={estilo(
                    "#16A085",
                    enBano
                        ? "BANO_FIN"
                        : "BANO_INICIO"
                )}
                disabled={
                    !trabajando &&
                    !enBano
                }
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
                style={estilo(
                    "#8E44AD",
                    enCapacitacion
                        ? "CAPACITACION_FIN"
                        : "CAPACITACION_INICIO"
                )}
                disabled={
                    !trabajando &&
                    !enCapacitacion
                }
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
                style={estilo(
                    "#2C3E50",
                    enReunion
                        ? "REUNION_FIN"
                        : "REUNION_INICIO"
                )}
                disabled={
                    !trabajando &&
                    !enReunion
                }
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
                style={estilo(
                    "#C0392B",
                    "SALIDA"
                )}
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