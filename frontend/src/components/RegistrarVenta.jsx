import { useState } from "react";
import api from "../services/api";

function ahoraColombia() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date()).reduce((resultado, parte) => ({ ...resultado, [parte.type]: parte.value }), {});
    const hora = partes.hour === "24" ? "00" : partes.hour;
    return {
        fecha: `${partes.year}-${partes.month}-${partes.day}`,
        hora: `${hora}:${partes.minute}`
    };
}

const CONFETI = Array.from({ length: 36 }, (_, indice) => ({
    id: indice,
    left: `${(indice * 37) % 100}%`,
    color: ["#D4AF37", "#0d6efd", "#198754", "#dc3545", "#ffc107"][indice % 5],
    delay: `${(indice % 9) * 0.08}s`,
    duration: `${1.4 + (indice % 5) * 0.18}s`,
    rotation: `${(indice * 47) % 360}deg`
}));

function reproducirSonidoCelebracion() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const contexto = new AudioContext();
        const ahora = contexto.currentTime;
        [523.25, 659.25, 783.99].forEach((frecuencia, indice) => {
            const oscilador = contexto.createOscillator();
            const ganancia = contexto.createGain();
            oscilador.type = "sine";
            oscilador.frequency.value = frecuencia;
            ganancia.gain.setValueAtTime(0.0001, ahora + indice * 0.12);
            ganancia.gain.exponentialRampToValueAtTime(0.16, ahora + indice * 0.12 + 0.02);
            ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + indice * 0.12 + 0.28);
            oscilador.connect(ganancia);
            ganancia.connect(contexto.destination);
            oscilador.start(ahora + indice * 0.12);
            oscilador.stop(ahora + indice * 0.12 + 0.3);
        });
        window.setTimeout(() => contexto.close(), 900);
    } catch (error) {
        console.warn("No fue posible reproducir el sonido de celebración:", error);
    }
}

export default function RegistrarVenta({

    asesor,

    asesorNombre,

    onVentaRegistrada

}) {

    const [abierto, setAbierto] = useState(false);
    const [valor, setValor] = useState("");
    const [recaudo, setRecaudo] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [observacion, setObservacion] = useState("");
    const [fechaVenta, setFechaVenta] = useState("");
    const [horaVenta, setHoraVenta] = useState("");
    const [motivoRetroactivo, setMotivoRetroactivo] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [celebrando, setCelebrando] = useState(false);
    const [detalleCelebracion, setDetalleCelebracion] = useState(null);

    // ======================================================
    // ABRIR / CERRAR MODAL
    // ======================================================

    function abrirModal() {

        if (!asesor) {
            alert("Seleccione un asesor primero.");
            return;
        }

        setValor("");
        setRecaudo("");
        setClienteId("");
        setObservacion("");
        const ahora = ahoraColombia();
        setFechaVenta(ahora.fecha);
        setHoraVenta(ahora.hora);
        setMotivoRetroactivo("");
        setAbierto(true);

    }

    function cerrarModal() {

        if (enviando) return;

        setAbierto(false);

    }

    // ======================================================
    // REGISTRAR VENTA
    // ======================================================

    async function registrar() {

        const valorNumerico = Number(valor);
        const recaudoNumerico = recaudo === "" ? 0 : Number(recaudo);
        const fechaHoy = ahoraColombia().fecha;
        const esRetroactiva = Boolean(fechaVenta && fechaVenta < fechaHoy);

        if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
            alert("Ingrese un valor de venta válido.");
            return;
        }
        if (!Number.isFinite(recaudoNumerico) || recaudoNumerico < 0) {
            alert("El recaudo debe ser un número válido mayor o igual a cero.");
            return;
        }
        if (!fechaVenta || fechaVenta > fechaHoy) {
            alert("Seleccione una fecha de venta válida que no sea futura.");
            return;
        }
        if (esRetroactiva && motivoRetroactivo.trim().length < 5) {
            alert("Para registrar una venta anterior, indique un motivo de al menos 5 caracteres.");
            return;
        }
        if (esRetroactiva && !horaVenta) {
            alert("Indique la hora efectiva de la venta anterior.");
            return;
        }

        setEnviando(true);

        try {

            const { data } = await api.post("/ventas", {
                asesor_id: Number(asesor),
                cliente_id: clienteId || null,
                valor: valorNumerico,
                recaudo: recaudoNumerico,
                observacion: observacion || null,
                fecha_venta: fechaVenta,
                ...(esRetroactiva ? {
                    hora_venta: horaVenta,
                    motivo_registro_retroactivo: motivoRetroactivo.trim()
                } : {})
            });

            if (!data?.ok) {
                throw new Error(
                    data?.mensaje || "No fue posible registrar la venta."
                );
            }

            setAbierto(false);
            setDetalleCelebracion({ valor: valorNumerico, recaudo: recaudoNumerico });
            setCelebrando(true);
            reproducirSonidoCelebracion();
            window.dispatchEvent(new Event("venta-registrada"));
            window.setTimeout(() => {
                setCelebrando(false);
                setDetalleCelebracion(null);
            }, 3200);

            if (typeof onVentaRegistrada === "function") {
                await onVentaRegistrada();
            }

        } catch (error) {

            console.error("Error registrando venta:", error);

            alert(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible registrar la venta."
            );

        } finally {

            setEnviando(false);

        }

    }

    // ======================================================
    // INTERFAZ
    // ======================================================

    return (

        <div id="registrar-venta" className="register-sale-shortcut-target" style={{ marginTop: "15px" }}>

            <button
                onClick={abrirModal}
                style={{
                    background: "#D4AF37",
                    color: "#111111",
                    border: "none",
                    borderRadius: "10px",
                    padding: "15px",
                    fontSize: "18px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    width: "100%"
                }}
            >
                💰 REGISTRAR VENTA
            </button>

            {abierto && (

                <div
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) cerrarModal();
                    }}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,.55)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "20px",
                        zIndex: 9999
                    }}
                >

                    <div
                        style={{
                            background: "#171717",
                            width: "100%",
                            maxWidth: "380px",
                            borderRadius: "14px",
                            padding: "25px",
                            boxShadow: "0 12px 35px rgba(0,0,0,.55)",
                            border: "1px solid rgba(212,175,55,0.55)",
                            color: "#F4F4F4"
                        }}
                    >

                        <h2 style={{ marginTop: 0, textAlign: "center", color: "#D4AF37" }}>
                            💰 Nueva Venta
                        </h2>

                        <hr />

                        <p style={{ marginBottom: "4px" }}>
                            <strong>Asesor</strong>
                        </p>
                        <p style={{ marginTop: 0 }}>
                            {asesorNombre || "—"}
                        </p>

                        <p style={{ marginBottom: "4px" }}>
                            <strong>Fecha de venta</strong>
                        </p>
                        <input
                            type="date"
                            value={fechaVenta}
                            max={ahoraColombia().fecha}
                            onChange={(e) => setFechaVenta(e.target.value)}
                            aria-label="Fecha efectiva de la venta"
                            style={{
                                width: "100%", padding: "10px", borderRadius: "8px",
                                border: "1px solid #555", fontSize: "15px", background: "#1b1b1b",
                                color: "#F4F4F4", marginBottom: "15px", boxSizing: "border-box"
                            }}
                        />
                        {fechaVenta && fechaVenta < ahoraColombia().fecha && (
                            <div style={{ padding: 10, marginBottom: 15, border: "1px solid #8a6d1d", borderRadius: 8, background: "#211d12" }}>
                                <p style={{ margin: "0 0 6px" }}><strong>Registro retroactivo</strong></p>
                                <label htmlFor="hora-venta-retroactiva">Hora efectiva de la venta</label>
                                <input
                                    id="hora-venta-retroactiva"
                                    type="time"
                                    value={horaVenta}
                                    onChange={(e) => setHoraVenta(e.target.value)}
                                    required
                                    style={{
                                        width: "100%", padding: "9px", margin: "5px 0 10px", borderRadius: 8,
                                        border: "1px solid #555", background: "#1b1b1b", color: "#F4F4F4", boxSizing: "border-box"
                                    }}
                                />
                                <label htmlFor="motivo-venta-retroactiva">Motivo (mínimo 5 caracteres)</label>
                                <textarea
                                    id="motivo-venta-retroactiva"
                                    value={motivoRetroactivo}
                                    onChange={(e) => setMotivoRetroactivo(e.target.value)}
                                    maxLength={500}
                                    rows={2}
                                    required
                                    placeholder="Explica por qué se registra después"
                                    style={{
                                        width: "100%", padding: "9px", marginTop: 5, borderRadius: 8,
                                        border: "1px solid #555", background: "#1b1b1b", color: "#F4F4F4", boxSizing: "border-box"
                                    }}
                                />
                                <small>La fecha y hora efectiva aparecerán en los reportes. El sistema conserva por separado cuándo se registró realmente.</small>
                            </div>
                        )}

                        <p style={{ marginBottom: "4px" }}>
                            <strong>ID del cliente</strong>
                        </p>
                        <input
                            type="text"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            placeholder="ID del cliente"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #555",
                                fontSize: "15px",
                                background: "#1b1b1b",
                                color: "#F4F4F4",
                                marginBottom: "15px",
                                boxSizing: "border-box"
                            }}
                        />

                        <p style={{ marginBottom: "4px" }}>
                            <strong>Valor de la venta</strong>
                        </p>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="$ 0"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #555",
                                fontSize: "16px",
                                background: "#1b1b1b",
                                color: "#F4F4F4",
                                marginBottom: "15px",
                                boxSizing: "border-box"
                            }}
                        />

                        <p style={{ marginBottom: "4px" }}>
                            <strong>Recaudo asociado a esta venta</strong>
                        </p>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            max={valor || undefined}
                            value={recaudo}
                            onChange={(e) => setRecaudo(e.target.value)}
                            placeholder="$ 0 (opcional)"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #555",
                                fontSize: "16px",
                                background: "#1b1b1b",
                                color: "#F4F4F4",
                                marginBottom: "15px",
                                boxSizing: "border-box"
                            }}
                        />

                        <p style={{ marginBottom: "4px" }}>
                            <strong>Tipo de Venta</strong>
                        </p>
                        <input
                            type="text"
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            placeholder="Detalle de la venta"
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid #555",
                                fontSize: "15px",
                                background: "#1b1b1b",
                                color: "#F4F4F4",
                                marginBottom: "20px",
                                boxSizing: "border-box"
                            }}
                        />

                        <button
                            onClick={registrar}
                            disabled={enviando}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "none",
                                borderRadius: "8px",
                                background: enviando ? "#6b5520" : "#D4AF37",
                                color: "#111111",
                                cursor: enviando ? "default" : "pointer",
                                fontWeight: "bold",
                                fontSize: "15px",
                                marginBottom: "10px"
                            }}
                        >
                            {enviando ? "Registrando..." : "REGISTRAR VENTA"}
                        </button>

                        <button
                            onClick={cerrarModal}
                            disabled={enviando}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border: "none",
                                borderRadius: "8px",
                                background: "#C0392B",
                                color: "#ffffff",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            ✕ Cancelar
                        </button>

                    </div>

                </div>

            )}

            {celebrando && (
                <div
                    className="sale-celebration-overlay"
                    role="status"
                    aria-live="polite"
                    style={{
                        position: "fixed",
                        inset: 0,
                        pointerEvents: "none",
                        overflow: "hidden",
                        zIndex: 10000
                    }}
                >
                    <style>{`@keyframes ventaConfetiCaida { 0% { transform: translate3d(0,-12vh,0) rotate(0deg); opacity: 1; } 100% { transform: translate3d(0,108vh,0) rotate(720deg); opacity: 0; } } @keyframes ventaCelebracionEntrada { 0% { transform: translate(-50%,-45%) scale(.75); opacity: 0; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; } }`}</style>
                    {CONFETI.map((pieza) => (
                        <span
                            key={pieza.id}
                            className="sale-confetti"
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: "-24px",
                                left: pieza.left,
                                width: "9px",
                                height: "16px",
                                background: pieza.color,
                                borderRadius: "2px",
                                transform: `rotate(${pieza.rotation})`,
                                animation: `ventaConfetiCaida ${pieza.duration} linear ${pieza.delay} forwards`
                            }}
                        />
                    ))}
                    <div className="sale-celebration-toast" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#ffffff", color: "#212529", border: "3px solid #D4AF37", borderRadius: "16px", padding: "24px 30px", textAlign: "center", boxShadow: "0 12px 35px rgba(0,0,0,.3)", animation: "ventaCelebracionEntrada .3s ease-out" }}>
                        <div style={{ fontSize: "42px" }}>🎉</div>
                        <strong style={{ display: "block", color: "#0d6efd", fontSize: "20px", marginTop: "5px" }}>¡Felicitaciones!</strong>
                        <span style={{ display: "block", marginTop: "6px" }}>{asesorNombre || "Asesor"}</span>
                        <strong className="sale-celebration-amount">Venta de ${Number(detalleCelebracion?.valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>
                        <span className="sale-celebration-collection">Recaudo registrado: ${Number(detalleCelebracion?.recaudo || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}</span>
                        <small style={{ display: "block", marginTop: "8px", color: "#198754", fontWeight: "bold" }}>Venta guardada correctamente</small>
                    </div>
                </div>
            )}

        </div>

    );

}
