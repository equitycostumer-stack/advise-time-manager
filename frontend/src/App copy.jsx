import { useState } from "react";
import logo from "./assets/Logo.png";

function App() {

  const asesores = [
    "Michelle Gonzalez",
    "Odeilys Marin",
    "Glorimar Paez",
    "Karen Rodriguez",
    "Viviana Gomez"
  ];

  const mensajes = [
    "🌿 Inicia tu día con calma. Inhala profundo... exhala.",
    "💚 Hoy ayudarás a muchas personas. Hazlo con tranquilidad.",
    "😊 Tu paz mental es más importante que cualquier llamada.",
    "☀️ Sonríe. Hoy será un excelente día.",
    "🌅 Cada llamada es una nueva oportunidad."
  ];

  const [asesor, setAsesor] = useState("");
  const [mensaje] = useState(
    mensajes[Math.floor(Math.random() * mensajes.length)]
  );

  return (
    <div
      style={{
        background: "#eef4f7",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial"
      }}
    >
      <div
        style={{
          width: "800px",
          background: "white",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0px 10px 30px rgba(0,0,0,.15)",
          textAlign: "center"
        }}
      >
        <img
          src={logo}
          alt="Equity Line"
          style={{
            width: "180px",
            marginBottom: "20px"
          }}
        />

        <h1
          style={{
            color: "#0B4F8C",
            marginBottom: "5px"
          }}
        >
          EQUITY LINE
        </h1>

        <h2
          style={{
            color: "#26a65b",
            marginTop: 0
          }}
        >
          Professional Services
        </h2>

        <hr />

        <h2
          style={{
            color: "#0B4F8C"
          }}
        >
          Control de Tiempo y Bienestar
        </h2>

        <h3>
          {new Date().toLocaleTimeString()}
        </h3>

        <p>
          {new Date().toLocaleDateString()}
        </p>

        <select
          value={asesor}
          onChange={(e) => setAsesor(e.target.value)}
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "18px",
            borderRadius: "10px",
            marginTop: "20px"
          }}
        >
          <option value="">
            Seleccione un asesor
          </option>

          {asesores.map((a) => (
            <option key={a}>
              {a}
            </option>
          ))}
        </select>

        <div
          style={{
            marginTop: "35px",
            display: "grid",
            gap: "15px"
          }}
        >
          <button
            style={boton("#0B5ED7")}
          >
            🟢 ENTRADA
          </button>

          <button
            style={boton("#F0AD4E")}
          >
            ☕ BREAK
          </button>

          <button
            style={boton("#5CB85C")}
          >
            🍽 ALMUERZO
          </button>

          <button
            style={boton("#17A2B8")}
          >
            🚻 BAÑO
          </button>

          <button
            style={boton("#DC3545")}
          >
            🔴 SALIDA
          </button>
        </div>

        <div
          style={{
            marginTop: "40px",
            background: "#f7f7f7",
            padding: "20px",
            borderRadius: "15px"
          }}
        >
          <h3>💚 Mensaje del día</h3>

          <p
            style={{
              fontSize: "18px",
              color: "#555"
            }}
          >
            {mensaje}
          </p>
        </div>

        <div
          style={{
            marginTop: "30px",
            color: "#777"
          }}
        >
          Coach: Javier Palma
          <br />
          Customer Services: Axel Gonzalez
          <br />
          Jefa Principal: Carolina Garcia
        </div>

      </div>
    </div>
  );
}

function boton(color) {
  return {
    background: color,
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: "12px",
    fontSize: "22px",
    cursor: "pointer",
    fontWeight: "bold"
  };
}

export default App;