import { useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function Buttons({

    asesor,

    estado,

    inicioJornada,

    movimientos = [],

    setEstado,



    onMovimientoRegistrado

}) {

    // ======================================================
    // EFECTO VISUAL DE PRESIÓN DEL BOTÓN
    // ======================================================

        const [botonPresionado, setBotonPresionado] =
        useState(null);

    // Bloquea movimientos repetidos mientras la solicitud anterior termina.
    const [movimientoEnCurso, setMovimientoEnCurso] = useState(false);
    const movimientoEnCursoRef = useRef(false);

    // ======================================================
    // PAUSA DE LLAMADAS (registro informativo)
    // ======================================================

        const [mostrarModalPausa, setMostrarModalPausa] = useState(false);
    const [motivoPausa, setMotivoPausa] = useState("");
    const [comentarioPausa, setComentarioPausa] = useState("");
    const [enviandoPausa, setEnviandoPausa] = useState(false);
    const [pausaActivaId, setPausaActivaId] = useState(null);

    useEffect(() => {
        if (!asesor) {
            setPausaActivaId(null);
            return;
        }

        api.get(`/incidencias/pausa/activa/${asesor}`)
            .then(({ data }) => {
                setPausaActivaId(data?.pausa?.id || null);
            })
            .catch((error) => {
                console.error("Error consultando pausa activa:", error);
            });
    }, [asesor]);


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

        // Protección contra doble clic, doble toque o reenvío mientras
        // el backend todavía está respondiendo.
        if (movimientoEnCursoRef.current) {
            return;
        }

        movimientoEnCursoRef.current = true;
        setMovimientoEnCurso(true);


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

            movimientoEnCursoRef.current = false;
            setMovimientoEnCurso(false);

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
    // REGISTRAR PAUSA DE LLAMADAS
    // ======================================================

    async function registrarPausaLlamadas() {

        if (!asesor) {
            alert("Seleccione un asesor.");
            return;
        }

        if (!motivoPausa) {
            alert("Seleccione un motivo.");
            return;
        }

        setEnviandoPausa(true);

        try {

            await api.post("/incidencias/pausa", {
                asesor_id: Number(asesor),
                motivo: motivoPausa,
                comentario: comentarioPausa
            });

            alert("✅ Pausa registrada.");

            setMostrarModalPausa(false);
            setMotivoPausa("");
            setComentarioPausa("");

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.mensaje ||
                error.response?.data?.error ||
                "No fue posible registrar la pausa."
            );

        } finally {
            setEnviandoPausa(false);
        }

    }

        // ======================================================
    // FINALIZAR PAUSA DE LLAMADAS
    // ======================================================

    async function finalizarPausaLlamadas() {

        if (!pausaActivaId) return;

        try {

            await api.put(`/incidencias/pausa/${pausaActivaId}/fin`);

            alert("✅ Llamadas reanudadas.");

            setPausaActivaId(null);

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.mensaje ||
                "No fue posible cerrar la pausa."
            );

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

    // Reglas diarias: solo un break y un almuerzo por jornada.
    // Baño, capacitación y reunión no se bloquean por cantidad.
    const almuerzoYaUsado = Array.isArray(movimientos) &&
        movimientos.some((movimiento) => movimiento.tipo === "ALMUERZO_INICIO");
    const breakYaUsado = Array.isArray(movimientos) &&
        movimientos.some((movimiento) => movimiento.tipo === "BREAK_INICIO");
        
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
        <>
        <div className="grid">

            {/* ====================================== */}
            {/* ENTRADA */}
            {/* ====================================== */}

            <button
                style={estilo(
                    "#0B5ED7",
                    "ENTRADA"
                )}
                disabled={movimientoEnCurso || !disponible}
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
                    movimientoEnCurso ||
                    (!trabajando && !enBreak) ||
                    (!enBreak && breakYaUsado)
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
                        : breakYaUsado
                            ? "✅ BREAK COMPLETADO"
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
                    movimientoEnCurso ||
                    (!trabajando && !enAlmuerzo) ||
                    (!enAlmuerzo && almuerzoYaUsado)
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
                        : almuerzoYaUsado
                            ? "✅ ALMUERZO COMPLETADO"
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
                    movimientoEnCurso ||
                    (!trabajando && !enBano)
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
                    movimientoEnCurso ||
                    (!trabajando && !enCapacitacion)
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
                    movimientoEnCurso ||
                    (!trabajando && !enReunion)
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
                disabled={movimientoEnCurso || !trabajando}
                onClick={() =>
                    registrar(
                        "SALIDA",
                        "SALIDA"
                    )
                }
            >
                🔴 SALIDA
            </button>

            {/* ====================================== */}
            {/* PAUSA DE LLAMADAS */}
            {/* ====================================== */}

                        <button
                style={estilo("#6C757D", "PAUSA")}
                disabled={!trabajando && !pausaActivaId}
                onClick={() =>
                    pausaActivaId
                        ? finalizarPausaLlamadas()
                        : setMostrarModalPausa(true)
                }
            >
                {pausaActivaId ? "▶ REANUDÉ LLAMADAS" : "📵 PAUSA DE LLAMADAS"}
            </button>

        </div>

        {mostrarModalPausa && (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999
                }}
            >
                <div
                    style={{
                        background: "white",
                        width: "420px",
                        padding: "25px",
                        borderRadius: "12px"
                    }}
                >
                    <h2>📵 Pausa de llamadas</h2>
                    <p style={{ color: "#666", fontSize: "14px" }}>
                        Indica por qué vas a dejar de hacer llamadas. Este registro queda guardado como informativo.
                    </p>

                    <label style={{ fontWeight: "bold" }}>Motivo</label>
                    <select
                        value={motivoPausa}
                        onChange={(e) => setMotivoPausa(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            marginBottom: "15px",
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                        }}
                    >
                        <option value="">-- Seleccione --</option>
                        <option value="Falla técnica">Falla técnica</option>
                        <option value="Atención a cliente presencial">Atención a cliente presencial</option>
                        <option value="Gestión administrativa">Gestión administrativa</option>
                        <option value="Indicación de coach/supervisor">Indicación de coach/supervisor</option>
                        <option value="Otro">Otro</option>
                    </select>

                    <label style={{ fontWeight: "bold" }}>Comentario (opcional)</label>
                    <textarea
                        value={comentarioPausa}
                        onChange={(e) => setComentarioPausa(e.target.value)}
                        rows={4}
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px",
                            borderRadius: "8px",
                            border: "1px solid #ccc"
                        }}
                    />

                    <div
                        style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "space-between"
                        }}
                    >
                        <button
                            onClick={() => setMostrarModalPausa(false)}
                            style={{
                                padding: "10px 16px",
                                background: "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer"
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={registrarPausaLlamadas}
                            disabled={enviandoPausa}
                            style={{
                                padding: "10px 16px",
                                background: "#198754",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            {enviandoPausa ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>

    );

}