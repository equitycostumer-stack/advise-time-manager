import { useEffect, useState, useMemo } from "react";
import Login from "./pages/Login";
import logo from "./assets/Logo.png";
import CambiarPassword from "./components/CambiarPassword";
import { useAuth } from "./context/AuthContext";
import "./styles/app.css";

import Dashboard from "./components/Dashboard";
import api from "./services/api";

import Header from "./components/Header";
import AdvisorSelect from "./components/AdvisorSelect";
import Buttons from "./components/Buttons";
import RegistrarVenta from "./components/RegistrarVenta";
import VentasDashboard from "./components/VentasDashboard";
import StatusCard from "./components/StatusCard";
import MessageCard from "./components/MessageCard";
import Footer from "./components/Footer";
import WorkTimer from "./components/WorkTimer";
import BreakTimer from "./components/BreakTimer";
import ResumenJornada from "./components/ResumenJornada";
import HistoricoDashboard from "./components/HistoricoDashboard";
import ConfiguracionHorarios from "./components/ConfiguracionHorarios";
import PanelControlAdmin from "./components/PanelControlAdmin";
import AuditoriaAdministrativa from "./components/AuditoriaAdministrativa";
import ValidarVentas from "./components/ValidarVentas";
import Usuarios from "./pages/Usuarios";

// ======================================================
// CONVERSIÓN ÚNICA DE FECHAS MYSQL -> COLOMBIA
// ======================================================
export function convertirFechaColombia(fecha) {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;

  const valor = String(fecha).trim();
  if (!valor) return null;

  // Ya viene con zona horaria (UTC o offset)
  if (valor.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(valor)) {
    const fechaConvertida = new Date(valor);
    return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
  }

  // MySQL: 2026-08-11 15:14:20 -> explícitamente Colombia (-05:00)
  const mysqlColombia = valor.replace(" ", "T") + "-05:00";
  const fechaConvertida = new Date(mysqlColombia);

  return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
}

const MENSAJES_MOTIVACIONALES = [
  "☀️ Sonríe. Hoy será un excelente día.",
  "🌅 Cada día es una nueva oportunidad para comenzar mejor.",
  "💚 Hoy tienes una nueva oportunidad para dar lo mejor de ti.",
  "🌟 Tu actitud puede transformar completamente tu día.",
  "😊 Una actitud positiva puede abrir muchas puertas.",
  "🌞 Comienza el día con energía y termina con satisfacción.",
  "✨ Hoy puede ser el día en que logres algo importante.",
  "🌻 Mantén una actitud positiva y sigue avanzando.",
  "💫 Cada nuevo día trae nuevas oportunidades.",
  "🙌 Confía en ti y en todo lo que eres capaz de lograr.",
  "💪 La constancia convierte los pequeños esfuerzos en grandes resultados.",
  "🏆 La disciplina de hoy construye los logros de mañana.",
  "🔥 Mantén el enfoque y continúa avanzando.",
  "📈 Cada esfuerzo cuenta cuando eres constante.",
  "🎯 La disciplina te acerca cada día más a tus objetivos.",
  "💎 La excelencia se construye con pequeños esfuerzos diarios.",
  "🚀 No te detengas. Cada paso te acerca a tu meta.",
  "💪 Los grandes resultados comienzan con decisiones pequeñas.",
  "🏅 La constancia siempre termina marcando la diferencia.",
  "⚡ Hazlo con disciplina, incluso cuando nadie esté mirando.",
  "🎯 Enfócate en lo importante y da lo mejor de ti.",
  "🚀 Un buen día comienza con objetivos claros.",
  "📋 Organiza tu día, enfócate y avanza paso a paso.",
  "⏱️ Aprovecha tu tiempo y conviértelo en resultados.",
  "🧠 Enfócate en lo que puedes controlar.",
  "🎯 Una meta clara convierte el esfuerzo en dirección.",
  "📈 Cada tarea completada es un paso hacia un mejor resultado.",
  "🔥 Mantén tu concentración y aprovecha cada oportunidad.",
  "💼 Profesionalismo, enfoque y constancia: una gran combinación.",
  "⚡ No necesitas hacerlo todo de una vez. Avanza paso a paso.",
  "📞 Cada llamada es una nueva oportunidad.",
  "📞 Cada conversación puede abrir una nueva posibilidad.",
  "🤝 Escuchar con atención también es una forma de ayudar.",
  "😊 Una buena actitud puede cambiar una conversación.",
  "💚 Cada cliente merece nuestra mejor atención.",
  "📞 Cada llamada es una oportunidad para conectar y ayudar.",
  "🎯 Escucha, comprende y busca la mejor solución.",
  "🤝 Una conversación bien llevada puede marcar la diferencia.",
  "☎️ Cada llamada puede ser el comienzo de un gran resultado.",
  "🌟 Haz que cada interacción cuente.",
  "🤝 Juntos podemos lograr mucho más.",
  "💚 Un buen equipo convierte los retos en oportunidades.",
  "👥 El éxito también se construye trabajando en equipo.",
  "🤝 Ayudar a un compañero también es avanzar.",
  "🌟 Cada persona aporta algo importante al equipo.",
  "💪 Cuando trabajamos juntos, los resultados mejoran.",
  "❤️ El respeto y la colaboración fortalecen cualquier equipo.",
  "🙌 Un equipo unido puede superar grandes desafíos.",
  "🎯 Todos tenemos un papel importante en el resultado final.",
  "💚 El éxito de uno puede inspirar el éxito de todos.",
  "🌱 Cada día tienes la oportunidad de aprender algo nuevo.",
  "📚 Cada experiencia puede convertirse en aprendizaje.",
  "🧠 Los errores también pueden enseñarnos cómo mejorar.",
  "🌱 Sigue creciendo, incluso cuando el progreso parezca pequeño.",
  "📈 Cada día puedes ser un poco mejor que ayer.",
  "💡 Busca aprender algo nuevo de cada experiencia.",
  "🌟 Tu crecimiento comienza cuando decides seguir intentando.",
  "🚀 Cada reto puede convertirse en una oportunidad de crecimiento.",
  "🌱 Los pequeños avances también son avances.",
  "💎 El aprendizaje constante es una de las mejores inversiones.",
  "🏆 Los resultados son el reflejo de la constancia.",
  "🎯 Define tu objetivo y trabaja con determinación.",
  "🚀 El próximo gran resultado puede comenzar hoy.",
  "🌟 Cada pequeño logro merece ser reconocido.",
  "💪 Cree en el proceso y sigue trabajando.",
  "📈 El progreso diario termina construyendo grandes resultados.",
  "🏅 El esfuerzo constante siempre deja huella.",
  "🔥 Los resultados extraordinarios comienzan con acciones ordinarias.",
  "💎 La excelencia no ocurre por casualidad.",
  "🎯 Enfócate en hacer hoy lo que te acercará a tu meta.",
  "💚 Respira, enfócate y continúa con buena energía.",
  "☕ Tómate un momento, respira y vuelve con energía renovada.",
  "🌿 Inicia tu día con calma y concentración.",
  "😊 Tu energía también influye en quienes te rodean.",
  "🌈 Después de cada reto existe una oportunidad para aprender.",
  "☀️ Una buena actitud hace más agradable cualquier jornada.",
  "💚 Cuida tu energía y úsala en lo que realmente importa.",
  "🌿 Mantén la calma, mantén el enfoque y sigue adelante.",
  "😊 No busques un día perfecto; construye un buen día.",
  "🌞 Hoy es una nueva oportunidad para hacerlo mejor que ayer.",
  "🔥 Tú puedes con el reto de hoy.",
  "💪 Supera tus propios límites un día a la vez.",
  "🚀 Atrévete a dar un paso más allá de lo habitual.",
  "⚡ Comienza con energía, continúa con disciplina y termina con orgullo.",
  "🏆 No te compares con otros; compite contra tu mejor versión.",
  "🔥 Cuando mantienes el enfoque, los obstáculos se vuelven oportunidades.",
  "💪 Cada desafío es una oportunidad para demostrar de qué eres capaz.",
  "🌟 Tu mejor versión se construye todos los días.",
  "🚀 Sigue adelante. Todavía hay mucho por conquistar.",
  "🎯 Hoy es un buen día para superar tus propias expectativas."
];

function formatearDuracion(segundos = 0) {
  const total = Math.max(0, Number(segundos) || 0);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;
  return [horas, minutos, segundosRestantes].map((valor) => String(valor).padStart(2, "0")).join(":");
}

// ======================================================
// APP
// ======================================================
function App() {
  const { usuario } = useAuth();

  // Declaración de todos los hooks al inicio (evita rupturas del ciclo de vida de React)
  const [asesores, setAsesores] = useState([]);
  const [asesor, setAsesor] = useState("");
  const [estado, setEstado] = useState("Disponible");
  const [inicioEstado, setInicioEstado] = useState(null);
  const [inicioJornada, setInicioJornada] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState(() => new URLSearchParams(window.location.search).get("vista") || "principal");
  const [tiempoJornadaEnVivo, setTiempoJornadaEnVivo] = useState(0);

  useEffect(() => {
    if (!inicioJornada || String(estado).toUpperCase().includes("SALIDA")) {
      setTiempoJornadaEnVivo(0);
      return undefined;
    }

    const inicio = convertirFechaColombia(inicioJornada);
    if (!inicio) {
      setTiempoJornadaEnVivo(0);
      return undefined;
    }

    const actualizar = () => setTiempoJornadaEnVivo(Math.max(0, Math.floor((Date.now() - inicio.getTime()) / 1000)));
    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    return () => clearInterval(intervalo);
  }, [inicioJornada, estado]);

  // Selección de mensaje aleatorio memorizada
  const mensaje = useMemo(
    () => MENSAJES_MOTIVACIONALES[Math.floor(Math.random() * MENSAJES_MOTIVACIONALES.length)],
    []
  );

  // Memorización del objeto del asesor seleccionado
  const asesorSeleccionado = useMemo(
    () => asesores.find((a) => a.id === Number(asesor)),
    [asesores, asesor]
  );

    // Cargar asesores al montar (solo si hay sesión iniciada)
  useEffect(() => {
    if (localStorage.getItem("token")) {
      cargarAsesores();
    } else {
      setCargando(false);
    }
  }, []);

  // Actualizar estado al cambiar el asesor seleccionado
  useEffect(() => {
    if (!asesor) {
      setEstado("Disponible");
      setInicioEstado(null);
      setInicioJornada(null);
      setResumen(null);
      return;
    }

    (async () => {
      await cargarEstado();
      await cargarResumen();
    })();
  }, [asesor]);

  // Funciones de API
  async function cargarAsesores() {
    try {
      setCargando(true);
      const { data } = await api.get("/asesores");
      setAsesores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error cargando asesores:", error);
      setAsesores([]);
    } finally {
      setCargando(false);
    }
  }

  async function cargarEstado() {
    try {
      const { data } = await api.get(`/movimientos/estado/${asesor}`);

      if (!data || !data.estado) {
        setEstado("Disponible");
        setInicioEstado(null);
        setInicioJornada(null);
        return;
      }

      const estadoBackend = String(data.estado).trim().toUpperCase();
      setInicioEstado(convertirFechaColombia(data.inicio_estado));
      setInicioJornada(convertirFechaColombia(data.inicio_jornada));

      const mapaEstados = {
        TRABAJANDO: "🟢 Trabajando",
        BREAK: "☕ Break",
        ALMUERZO: "🍽 Almuerzo",
        BANO: "🚻 Baño",
        BAÑO: "🚻 Baño",
        CAPACITACION: "📚 Capacitación",
        CAPACITACIÓN: "📚 Capacitación",
        REUNION: "👥 Reunión",
        REUNIÓN: "👥 Reunión",
        SALIDA: "🔴 Salida"
      };

      setEstado(mapaEstados[estadoBackend] || "Disponible");
    } catch (error) {
      console.error("Error cargando estado:", error);
      setEstado("Disponible");
      setInicioEstado(null);
      setInicioJornada(null);
    }
  }

  async function cargarResumen() {
    try {
      const respuesta = await api.get(`/movimientos/resumen/${asesor}`);
      const resumenRecibido = respuesta.data.data || null;

      setResumen(resumenRecibido);

      if (resumenRecibido?.jornada?.inicio_estado) {
        setInicioEstado(convertirFechaColombia(resumenRecibido.jornada.inicio_estado));
      }

      if (resumenRecibido?.jornada?.inicio_jornada) {
        setInicioJornada(convertirFechaColombia(resumenRecibido.jornada.inicio_jornada));
      }
    } catch (error) {
      console.error("Error cargando resumen:", error);
      setResumen(null);
      setInicioEstado(null);
      setInicioJornada(null);
    }
  }

  // --- COMPROBACIONES DE AUTENTICACIÓN (Renderizado condicional) ---
  if (!localStorage.getItem("token")) {
    return <Login />;
  }

  const usuarioGuardado = (() => {
    try {
      const guardado = localStorage.getItem("usuario");
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  })();

  const debeCambiarPassword =
    usuario?.debe_cambiar_password ??
    usuarioGuardado?.debe_cambiar_password ??
    false;

  if (debeCambiarPassword) {
    return <CambiarPassword />;
  }

  if (cargando) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "80px" }}>
        Cargando asesores...
      </h2>
    );
  }

  // Interfaz de usuario
  return (
    <div className="container app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <img src={logo} alt="Equity Line" className="sidebar-logo" />
          <div className="sidebar-brand-copy"><strong>EQUITY LINE</strong><span>Professional Services</span></div>
        </div>
        <div className="sidebar-version">SISTEMA DE CONTROL</div>
        <div className="sidebar-user"><span>BIENVENIDO</span><strong>{usuario?.usuario || "Usuario"}</strong><small>{usuario?.rol || "ASESOR"}</small></div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          <button className={vista === "principal" ? "active" : ""} onClick={() => setVista("principal")}>⌂ <span>Inicio</span></button>
          <button className={vista === "historico" ? "active" : ""} onClick={() => setVista("historico")}>▣ <span>Histórico</span></button>
          {usuario?.rol === "ADMINISTRADOR" && <button className={vista === "usuarios" ? "active" : ""} onClick={() => setVista("usuarios")}>♙ <span>Usuarios</span></button>}
          {usuario?.rol === "ADMINISTRADOR" && <button className={vista === "validar-ventas" ? "active" : ""} onClick={() => setVista("validar-ventas")}>✓ <span>Validar ventas</span></button>}
          {usuario && <button className={vista === "control" ? "active" : ""} onClick={() => setVista("control")}>◈ <span>Centro ejecutivo</span></button>}
        </nav>
        <div className="sidebar-footer">Equity Line<br /><small>Productividad y bienestar</small></div>
      </aside>
      <main className="app-main">
      <div className="card">
        <Header />

        <div className="app-mobile-nav" style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
          <button
            onClick={() => setVista("principal")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              background: vista === "principal" ? "#0d6efd" : "#e9ecef",
              color: vista === "principal" ? "#fff" : "#333"
            }}
          >
            🏠 Principal
          </button>

          <button
            onClick={() => setVista("historico")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              background: vista === "historico" ? "#0d6efd" : "#e9ecef",
              color: vista === "historico" ? "#fff" : "#333"
            }}
          >
            📊 Histórico
          </button>
          {usuario?.rol === "ADMINISTRADOR" && <button
            onClick={() => setVista("usuarios")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              background: vista === "usuarios" ? "#0d6efd" : "#e9ecef",
              color: vista === "usuarios" ? "#fff" : "#333"
            }}
          >
            👥 Usuarios
          </button>}
          {usuario && <button
            onClick={() => setVista("control")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              background: vista === "control" ? "#6f42c1" : "#f1eafa",
              color: vista === "control" ? "#fff" : "#4f2b91"
            }}
          >
            🎯 Centro ejecutivo
          </button>}
          {usuario?.rol === "ADMINISTRADOR" && <button
            onClick={() => setVista("validar-ventas")}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              background: vista === "validar-ventas" ? "#245b3a" : "#e8f7ee",
              color: vista === "validar-ventas" ? "#fff" : "#245b3a"
            }}
          >
            ✅ Validar ventas
          </button>}
        </div>

        {vista === "auditoria" && usuario?.rol === "ADMINISTRADOR" ? (
          <AuditoriaAdministrativa />
        ) : vista === "historico" ? (
          <HistoricoDashboard />
        ) : vista === "usuarios" ? (
          <Usuarios />
        ) : vista === "control" ? (
          <section style={{ maxWidth: 1180, margin: "0 auto", padding: "4px 0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <h2 style={{ margin: 0, color: "#4f2b91" }}>🎯 Centro de Control Ejecutivo</h2>
                <p style={{ margin: "4px 0 0", color: "#66756b" }}>Vista independiente para indicadores, metas y productividad.</p>
              </div>
              <button type="button" onClick={() => setVista("principal")} style={{ padding: "9px 13px", border: 0, borderRadius: 8, background: "#e9ecef", color: "#333", fontWeight: 700, cursor: "pointer" }}>← Volver a la app</button>
            </div>
            <PanelControlAdmin />
          </section>
        ) : vista === "validar-ventas" && usuario?.rol === "ADMINISTRADOR" ? (
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "4px 0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <h2 style={{ margin: 0, color: "#245b3a" }}>✅ Validación administrativa de ventas</h2>
                <p style={{ margin: "4px 0 0", color: "#66756b" }}>Corrige asesor, valor y recaudo conservando la auditoría.</p>
              </div>
              <button type="button" onClick={() => setVista("principal")} style={{ padding: "9px 13px", border: 0, borderRadius: 8, background: "#e9ecef", color: "#333", fontWeight: 700, cursor: "pointer" }}>← Volver a la app</button>
            </div>
            <ValidarVentas />
          </section>
        ) : (
          <>
            <section className="welcome-panel" aria-label="Resumen principal">
              <div>
                <span className="eyebrow">INICIO</span>
                <h2>Bienvenido al CRM Equity Line</h2>
                <p>Administra registros, productividad y ventas desde un solo lugar.</p>
              </div>
              <div className="welcome-badge">{usuario?.rol || "ASESOR"}</div>
            </section>

            <section className="kpi-grid" aria-label="Indicadores de hoy">
              <article className="kpi-card kpi-user">
                <div className="kpi-icon">◉</div>
                <div><span>ASESOR ACTIVO</span><strong>{asesorSeleccionado?.nombre || "Selecciona un asesor"}</strong><small>{estado}</small></div>
              </article>
              <article className="kpi-card kpi-blue">
                <div className="kpi-icon">▣</div>
                <div><span>REGISTROS HOY</span><strong>{resumen?.movimientos?.length || 0}</strong><small>Movimientos registrados</small></div>
              </article>
              <article className="kpi-card kpi-cyan">
                <div className="kpi-icon">$</div>
                <div><span>VENTAS HOY</span><strong>{resumen?.ventas?.length || 0}</strong><small>Ventas registradas</small></div>
              </article>
            </section>

            <section className="dashboard-top-cards" aria-label="Estado de jornada">
              <article className="person-card">
                <div className="person-avatar">●</div>
                <div className="person-card-content">
                  <div className="person-card-label">● Selecciona un asesor</div>
                  <AdvisorSelect asesores={asesores} asesor={asesor} setAsesor={setAsesor} />
                  <small>● En línea</small>
                </div>
              </article>
              <article className="current-status-card">
                <div className="status-play">▶</div>
                <div><span>Estado actual</span><strong>{String(estado || "Disponible").replace(/^[^A-Za-zÁÉÍÓÚÑ]+/u, "").toUpperCase()}</strong></div>
              </article>
              <article className="time-card">
                <div className="time-icon">◷</div>
                <div><span>Tiempo trabajado</span><strong>{formatearDuracion(tiempoJornadaEnVivo)}</strong><small>El tiempo de jornada aparece en el contador.</small></div>
              </article>
            </section>

            <div className="dashboard-workspace">
              <section className="dashboard-primary">
                <div className="section-heading"><h2>Registra tu movimiento</h2><span>Selecciona una acción</span></div>
                <Buttons
                  asesor={asesor}
                  estado={estado}
                  inicioJornada={inicioJornada}
                  movimientos={resumen?.movimientos || []}
                  setEstado={setEstado}
                  onMovimientoRegistrado={async () => {
                    await cargarEstado();
                    await cargarResumen();
                  }}
                />
                <RegistrarVenta
                  asesor={asesor}
                  asesorNombre={asesorSeleccionado?.nombre}
                  onVentaRegistrada={async () => {}}
                />
                <div className="secondary-widgets">
                  <StatusCard estado={estado} />
                  <WorkTimer estado={estado} inicioJornada={inicioJornada} />
                  <BreakTimer estado={estado} inicioEstado={inicioEstado} />
                </div>
              </section>

              <aside className="dashboard-secondary">
                <ResumenJornada resumen={resumen} asesor={asesorSeleccionado} />
                <VentasDashboard esAdministrador={usuario?.rol === "ADMINISTRADOR"} />
                <MessageCard mensaje={mensaje} />
              </aside>
            </div>

            <div className="below-dashboard">
              <Dashboard />
              {usuario?.rol === "ADMINISTRADOR" && <ConfiguracionHorarios />}
            </div>
            <Footer />
          </>
        )}
      </div>
      </main>
    </div>
  );
}

export default App;
