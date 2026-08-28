import { useState, useEffect } from "react";
import api from "../services/api";

export default function HistorialIncidenciasModal({ onClose }) {
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, [fecha]);

  async function cargarHistorial() {
    setLoading(true);
    try {
      const res = await api.get(`/incidencias/historial?fecha=${fecha}`);
      setIncidencias(res.data.incidencias || res.data);
    } catch (err) {
      console.error("Error cargando historial de incidencias:", err);
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "white",
          width: "700px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0px 4px 15px rgba(0,0,0,0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2>📊 Historial de Incidencias</h2>
          <button
            onClick={onClose}
            style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            ✕ Cerrar
          </button>
        </div>

        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "bold" }}>Seleccionar fecha:</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>

        {loading ? (
          <p>Cargando incidencias...</p>
        ) : incidencias.length === 0 ? (
          <p style={{ color: "#6c757d", fontStyle: "italic" }}>No se registraron incidencias para la fecha seleccionada.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {incidencias.map((i) => (
              <div
                key={i.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "15px",
                  background: i.revisada === 1 || i.revisada === true ? "#f8f9fa" : "#fff3cd"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <strong>👤 {i.nombre || i.asesor_nombre}</strong>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      background: i.revisada === 1 || i.revisada === true ? "#d1e7dd" : "#ffeeba",
                      color: i.revisada === 1 || i.revisada === true ? "#0f5132" : "#856404"
                    }}
                  >
                    {i.revisada === 1 || i.revisada === true ? "✅ Revisada" : "⏳ Pendiente"}
                  </span>
                </div>
                <p style={{ margin: "4px 0" }}><strong>Tipo:</strong> {i.tipo} ({i.nivel})</p>
                                <p style={{ margin: "4px 0" }}><strong>Detalle:</strong> {i.detalle}</p>

                {i.tipo === "PAUSA DE LLAMADAS" ? (
                  <>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}>
                      <strong>Inicio:</strong> {formatearHoraColombia(i.fecha_hora)}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}>
                      <strong>Fin:</strong> {i.fecha_fin ? formatearHoraColombia(i.fecha_fin) : "⏳ En curso"}
                    </p>
                    {i.fecha_fin && (
                      <p style={{ margin: "4px 0", fontSize: "13px", fontWeight: "bold", color: "#dc3545" }}>
                        Duración: {calcularDuracion(i.fecha_hora, i.fecha_fin)}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}><strong>Hora:</strong> {i.fecha_hora}</p>
                )}

                {(i.revisada === 1 || i.revisada === true) && (
                  <div style={{ marginTop: "8px", background: "#e2f0d9", padding: "8px", borderRadius: "6px", fontSize: "13px" }}>
                    <p style={{ margin: "2px 0" }}><strong>Coach revisor:</strong> {i.revisada_por}</p>
                    <p style={{ margin: "2px 0" }}><strong>Comentario:</strong> {i.comentario}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}