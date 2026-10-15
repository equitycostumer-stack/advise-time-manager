import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LogrosRecientes() {
  const { usuario } = useAuth();
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const { data } = await api.get("/ventas/dia");
        if (activo) {
          const lista = Array.isArray(data?.data) ? data.data : [];
          setVentas(lista.filter((venta) => venta.estado !== "ANULADA").slice(0, 4));
        }
      } catch (error) {
        console.warn("No fue posible cargar los logros recientes:", error.message);
      }
    };
    cargar();
    const intervalo = window.setInterval(cargar, 15000);
    return () => { activo = false; window.clearInterval(intervalo); };
  }, []);

  return (
    <section className="logros-recientes" aria-label={usuario?.rol === "ADMINISTRADOR" ? "Logros recientes del equipo" : "Tus logros recientes"}>
      <div className="logros-header">
        <div>
          <span className="logros-eyebrow">{usuario?.rol === "ADMINISTRADOR" ? "MOMENTUM DEL EQUIPO" : "TUS LOGROS DE HOY"}</span>
          <h3>🏅 Logros recientes</h3>
        </div>
        <span className="logros-live">● EN VIVO</span>
      </div>
      {ventas.length === 0 ? (
        <p className="logros-empty">Los próximos logros aparecerán aquí.</p>
      ) : (
        <div className="logros-lista">
          {ventas.map((venta) => (
            <div className="logro-item" key={venta.id}>
              <div className="logro-icon">✓</div>
              <div className="logro-copy">
                <strong>{venta.asesor_nombre || "Asesora"}</strong>
                <span>Registró una venta de {venta.valor ? `$${Number(venta.valor).toLocaleString("es-CO")}` : "hoy"}</span>
              </div>
              <span className="logro-star">★</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
