import { useState } from "react";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    HeadingLevel,
    WidthType,
    AlignmentType,
    ShadingType
} from "docx";
import { saveAs } from "file-saver";
import api from "../services/api";

// ======================================================
// CONVERTIR FECHA MYSQL -> COLOMBIA (mismo patrón
// ya validado en el resto del proyecto)
// ======================================================

function convertirFechaColombia(fecha) {

    if (!fecha) return null;

    if (fecha instanceof Date) return fecha;

    const valor = String(fecha).trim();

    if (!valor) return null;

    if (
        valor.endsWith("Z") ||
        /[+-]\d{2}:\d{2}$/.test(valor)
    ) {
        const f = new Date(valor);
        return Number.isNaN(f.getTime()) ? null : f;
    }

    const f = new Date(valor.replace(" ", "T") + "-05:00");

    return Number.isNaN(f.getTime()) ? null : f;

}

function formatearHora(fecha) {

    const f = convertirFechaColombia(fecha);

    if (!f) return "--:--:--";

    return f.toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });

}

function formatearMoneda(valor) {

    const numero = Number(valor) || 0;

    return numero.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });

}

function formatearFechaLarga() {

    return new Date().toLocaleDateString("es-CO", {
        timeZone: "America/Bogota",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

}

// ======================================================
// CELDA DE TABLA (helper)
// ======================================================

function celda(texto, { encabezado = false } = {}) {

    return new TableCell({

        shading: encabezado
            ? { type: ShadingType.CLEAR, fill: "0D6EFD" }
            : undefined,

        children: [
            new Paragraph({
                children: [
                    new TextRun({
                        text: String(texto ?? ""),
                        bold: encabezado,
                        color: encabezado ? "FFFFFF" : "000000"
                    })
                ]
            })
        ]

    });

}

function filaEncabezado(columnas) {

    return new TableRow({
        children: columnas.map(c => celda(c, { encabezado: true }))
    });

}

function filaDatos(columnas) {

    return new TableRow({
        children: columnas.map(c => celda(c))
    });

}

// ======================================================
// COMPONENTE
// ======================================================

export default function ExportarWord() {

    const [generando, setGenerando] = useState(false);

    async function generar() {

        setGenerando(true);

        try {

            // ==========================================
            // OBTENER DATOS FRESCOS
            // ==========================================

            const [
                dashboardRes,
                incidenciasRes,
                ventasDiaRes,
                ventasListaRes
            ] = await Promise.all([
                api.get("/dashboard"),
                api.get("/incidencias"),
                api.get("/ventas/resumen/dia"),
                api.get("/ventas/dia")
            ]);

            const asesores =
                dashboardRes.data?.asesores || [];

            const incidencias =
                Array.isArray(incidenciasRes.data)
                    ? incidenciasRes.data
                    : (incidenciasRes.data?.data || []);

            const ventasDia =
                ventasDiaRes.data?.data ||
                { cantidad_ventas: 0, total_vendido: 0 };

            // Extraer de forma segura el listado de ventas independientemente de cómo venga envuelto
            let listaVentas = [];
            const rawVentas = ventasListaRes.data;
            if (Array.isArray(rawVentas)) {
                listaVentas = rawVentas;
            } else if (rawVentas?.data && Array.isArray(rawVentas.data)) {
                listaVentas = rawVentas.data;
            } else if (rawVentas?.ventas && Array.isArray(rawVentas.ventas)) {
                listaVentas = rawVentas.ventas;
            } else {
                listaVentas = [rawVentas].filter(Boolean);
            }

            const llegadasTarde =
                asesores.filter(a => a.llego_tarde);

            // ==========================================
            // CONSTRUIR DOCUMENTO
            // ==========================================

            const secciones = [];

            secciones.push(
                new Paragraph({
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun("EQUITY LINE PROFESSIONAL SERVICES")
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: `Resumen del día — ${formatearFechaLarga()}`,
                            italics: true
                        })
                    ]
                }),
                new Paragraph({ text: "" })
            );

            // ----- ASESORES -----

            secciones.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("👥 Estado de Asesores")]
                }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        filaEncabezado(["Asesor", "Estado", "Inicio", "Retraso"]),
                        ...asesores.map(a =>
                            filaDatos([
                                a.nombre,
                                a.estado || "DISPONIBLE",
                                formatearHora(a.inicio_estado),
                                a.llego_tarde
                                    ? `${a.minutos_retraso ?? 0} min`
                                    : "Puntual"
                            ])
                        )
                    ]
                }),

                new Paragraph({ text: "" })
            );

            // ----- ALERTAS -----

            secciones.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("🚨 Alertas de Llegada Tarde")]
                })
            );

            if (llegadasTarde.length === 0) {

                secciones.push(
                    new Paragraph({ text: "No hay alertas activas." })
                );

            } else {

                llegadasTarde.forEach(a => {

                    secciones.push(
                        new Paragraph({
                            text: `• ${a.nombre} llegó tarde por ${a.minutos_retraso} minutos`
                        })
                    );

                });

            }

            secciones.push(new Paragraph({ text: "" }));

            // ----- INCIDENCIAS -----

            secciones.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("📋 Incidencias del Día")]
                })
            );

            if (incidencias.length === 0) {

                secciones.push(
                    new Paragraph({ text: "No existen incidencias." })
                );

            } else {

                secciones.push(
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            filaEncabezado(["Asesor", "Tipo", "Nivel", "Detalle"]),
                            ...incidencias.map(i =>
                                filaDatos([
                                    i.asesor_nombre || i.nombre || "—",
                                    i.tipo || "—",
                                    i.nivel || "—",
                                    i.detalle || "—"
                                ])
                            )
                        ]
                    })
                );

            }

            secciones.push(new Paragraph({ text: "" }));

            // ----- VENTAS -----

            secciones.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [new TextRun("💰 Ventas del Día")]
                }),

                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Total de ventas: ${ventasDia.cantidad_ventas ?? listaVentas.length}   |   Total vendido: ${formatearMoneda(ventasDia.total_vendido)}`,
                            bold: true
                        })
                    ]
                }),

                new Paragraph({ text: "" }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        filaEncabezado(["Asesor", "ID Cliente", "Total vendido"]),
                        ...listaVentas.map(v =>
                            filaDatos([
                                v.asesor_nombre || v.nombre || "—",
                                String(v.cliente_id || v.id_cliente || "—"),
                                formatearMoneda(v.valor || v.total_vendido || v.monto || 0)
                            ])
                        )
                    ]
                })
            );

            // ==========================================
            // GENERAR Y DESCARGAR
            // ==========================================

            const doc = new Document({
                sections: [{ children: secciones }]
            });

            const blob = await Packer.toBlob(doc);

            saveAs(
                blob,
                `Resumen_EquityLine_${new Date().toLocaleDateString("es-CO")}.docx`
            );

        } catch (error) {

            console.error("Error detallado al generar Word:", error.response || error);
            const mensajeError = error.response?.data?.mensaje || error.response?.data?.error || error.message;
            alert("No fue posible generar el documento Word. Detalle: " + mensajeError);

        } finally {

            setGenerando(false);

        }

    }

    return (

        <button
            onClick={generar}
            disabled={generando}
            style={{
                background: generando ? "#7aa8d8" : "#0d6efd",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: generando ? "default" : "pointer",
                marginBottom: "20px",
                fontWeight: "bold"
            }}
        >
            {generando ? "Generando..." : "📥 Exportar Word"}
        </button>

    );

}