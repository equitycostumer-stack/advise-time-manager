import { useState } from "react";
import api from "../services/api";

export default function RegistrarVenta({

    asesor,

    asesorNombre,

    onVentaRegistrada

}) {

    const [abierto, setAbierto] = useState(false);
    const [valor, setValor] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [observacion, setObservacion] = useState("");
    const [enviando, setEnviando] = useState(false);

    // ======================================================
    // ABRIR / CERRAR MODAL
    // ======================================================

    function abrirModal() {

        if (!asesor) {
            alert("Seleccione un asesor primero.");
            return;
        }

        setValor("");
        setClienteId("");
        setObservacion("");
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

        if (!valorNumerico || valorNumerico <= 0) {
            alert("Ingrese un valor de venta válido.");
            return;
        }

        setEnviando(true);

        try {

            const { data } = await api.post("/ventas", {
                asesor_id: Number(asesor),
                cliente_id: clienteId || null,
                valor: valorNumerico,
                observacion: observacion || null
            });

            if (!data?.ok) {
                throw new Error(
                    data?.mensaje || "No fue posible registrar la venta."
                );
            }

            alert("✅ Venta registrada correctamente");

            setAbierto(false);

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

        <div style={{ marginTop: "15px" }}>

            <button
                onClick={abrirModal}
                style={{
                    background: "#20c997",
                    color: "#fff",
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
                            background: "#fff",
                            width: "100%",
                            maxWidth: "380px",
                            borderRadius: "14px",
                            padding: "25px",
                            boxShadow: "0 12px 35px rgba(0,0,0,.30)"
                        }}
                    >

                        <h2 style={{ marginTop: 0, textAlign: "center" }}>
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
                                border: "1px solid #ccc",
                                fontSize: "15px",
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
                                border: "1px solid #ccc",
                                fontSize: "16px",
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
                                border: "1px solid #ccc",
                                fontSize: "15px",
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
                                background: enviando ? "#94d3bd" : "#20c997",
                                color: "#fff",
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
                                background: "#dc3545",
                                color: "#fff",
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            ✕ Cancelar
                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}