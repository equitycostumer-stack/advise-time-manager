import { useEffect, useState } from "react";
import api from "../services/api";

function fechaBogota() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date()).reduce((acc, parte) => ({ ...acc, [parte.type]: parte.value }), {});
  return { year: Number(partes.year), month: Number(partes.month), day: Number(partes.day) };
}

function periodoAnterior() {
  const hoy = fechaBogota();
  let year = hoy.year;
  let month = hoy.month;
  let inicio;
  let fin;

  if (hoy.day <= 15) {
    inicio = 16;
    const ultimo = new Date(Date.UTC(year, month, 0)).getUTCDate();
    fin = ultimo;
  } else {
    inicio = 1;
    fin = 15;
  }

  return {
    inicio: `${year}-${String(month).padStart(2, "0")}-${String(inicio).padStart(2, "0")}`,
    fin: `${year}-${String(month).padStart(2, "0")}-${String(fin).padStart(2, "0")}`
  };
}

export function FelicitacionToast({ nombre, mensaje, visible, onClose }) {
  useEffect(() => {
    if (!visible) return undefined;
    const timer = window.setTimeout(() => onClose?.(), 3000);
    return () => window.clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", top: 22, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, minWidth: 300, maxWidth: "min(560px, calc(100vw - 32px))",
      padding: "16px 22px", borderRadius: 16, color: "#fff", textAlign: "center",
      background: "linear-gradient(135deg, #0a4f87, #0a8fbd 55%, #b8941f)",
      boxShadow: "0 12px 35px rgba(10,79,135,.35)", animation: "recognition-pop .25s ease-out"
    }}>
      <div style={{ fontSize: 27, lineHeight: 1 }}>🏆 ✨</div>
      <strong style={{ display: "block", fontSize: 18, marginTop: 7 }}>¡Excelente trabajo, {nombre}!</strong>
      <span style={{ display: "block", marginTop: 4, fontSize: 14 }}>{mensaje}</span>
    </div>
  );
}

export default function ReconocimientoGlobal() {
  const [ganadora, setGanadora] = useState(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const periodo = periodoAnterior();
        const [respuesta, configuracion] = await Promise.all([
          api.get(`/ventas/resumen/asesores/periodo?fecha_desde=${periodo.inicio}&fecha_hasta=${periodo.fin}`),
          api.get("/configuracion-ventas")
        ]);
        const filas = Array.isArray(respuesta.data?.data) ? respuesta.data.data : [];
        const criterio = configuracion.data?.data?.criterio_ranking || "RECAUDO";
        const campo = criterio === "VALOR_VENDIDO" ? "total_vendido" : criterio === "CANTIDAD_VENTAS" ? "cantidad_ventas" : "total_recaudo";
        const primera = [...filas].sort((a, b) => Number(b[campo] || 0) - Number(a[campo] || 0))[0];
        if (activo && primera && Number(primera[campo] || 0) > 0) {
          setGanadora({ ...primera, ...periodo });
        }
      } catch (error) {
        console.warn("No fue posible cargar el reconocimiento quincenal:", error.message);
      }
    };
    cargar();
    const intervalo = window.setInterval(cargar, 60000);
    return () => { activo = false; window.clearInterval(intervalo); };
  }, []);

  if (!ganadora) return null;

  return (
    <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 12, color: "#5c4300", background: "linear-gradient(90deg, #fff8d9, #fffdf2)", border: "1px solid #e5c45c", boxShadow: "0 5px 16px rgba(184,148,31,.12)" }}>
      <strong>🏆 Mejor asesora de la quincena anterior: {ganadora.asesor_nombre}</strong>
      <span style={{ display: "block", fontSize: 13, marginTop: 3 }}>Reconocemos su compromiso y sus resultados. ¡Sigamos creciendo como equipo!</span>
    </div>
  );
}
