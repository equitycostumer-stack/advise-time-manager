import { useState } from "react";

export default function ExportarHistorial({ historial, asesor }) {

    async function exportar() {

        if (!historial.length) return;

        const XLSX = await import("xlsx");
        const { saveAs } = await import("file-saver");

        const datos = historial.map((m) => ({

            Hora: new Date(m.fecha_hora).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }),

            Movimiento: traducirMovimiento(m.tipo),

            Observación: m.observacion || ""

        }));

        const hoja = XLSX.utils.json_to_sheet(datos);

        const libro = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(libro, hoja, "Historial");

        const excel = XLSX.write(libro, {
            bookType: "xlsx",
            type: "array"
        });

        saveAs(

            new Blob([excel]),

            `Historial_${asesor.nombre}.xlsx`

        );

    }

    return (

        <button

            onClick={exportar}

            style={{

                marginTop: 10,

                width: "100%",

                padding: "10px",

                background: "#198754",

                color: "white",

                border: "none",

                borderRadius: "8px",

                cursor: "pointer",

                fontWeight: "bold"

            }}

        >

            📥 Descargar Excel

        </button>

    );

}

function traducirMovimiento(tipo) {

    switch (tipo) {

        case "ENTRADA":
            return "✅ Entrada";

        case "SALIDA":
            return "🚪 Salida";

        case "BREAK_INICIO":
            return "☕ Inicio Break";

        case "BREAK_FIN":
            return "☕ Fin Break";

        case "ALMUERZO_INICIO":
            return "🍽 Inicio Almuerzo";

        case "ALMUERZO_FIN":
            return "🍽 Fin Almuerzo";

        case "BANO_INICIO":
            return "🚻 Inicio Baño";

        case "BANO_FIN":
            return "🚻 Fin Baño";

        case "CAPACITACION_INICIO":
            return "📚 Inicio Capacitación";

        case "CAPACITACION_FIN":
            return "📚 Fin Capacitación";

        case "REUNION_INICIO":
            return "👥 Inicio Reunión";

        case "REUNION_FIN":
            return "👥 Fin Reunión";

        default:
            return tipo;

    }

}
