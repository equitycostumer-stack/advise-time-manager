// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RESUMEN DE JORNADA
// ======================================================

function fila(nombre, valor) {

    return (

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #ececec"
            }}
        >

            <span>{nombre}</span>

            <strong>
                {valor ?? "--"}
            </strong>

        </div>

    );

}

export default function ResumenJornada({ resumen }) {

    if (!resumen) return null;

    const asesor = resumen.asesor || {};
    const jornada = resumen.jornada || {};
    const entrada = resumen.entrada || null;
    const salida = resumen.salida || null;

    return (

        <div
            style={{
                marginTop: "20px",
                padding: "22px",
                borderRadius: "12px",
                background: "#fff",
                border: "1px solid #ddd",
                boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}
        >

            <h2
                style={{
                    textAlign: "center",
                    marginBottom: "20px"
                }}
            >

                📊 RESUMEN DE JORNADA

            </h2>

            {/* ====================================== */}
            {/* ASESOR */}
            {/* ====================================== */}

            {fila(
                "👤 Asesor",
                asesor.nombre
            )}

            {/* ====================================== */}
            {/* ESTADO */}
            {/* ====================================== */}

            {fila(
                "Estado actual",
                jornada.estado || "SIN ESTADO"
            )}

            {fila(
                "Jornada iniciada",
                jornada.iniciada ? "✅ Sí" : "❌ No"
            )}

            {fila(
                "Jornada finalizada",
                jornada.finalizada ? "✅ Sí" : "❌ No"
            )}

            {/* ====================================== */}
            {/* ENTRADA */}
            {/* ====================================== */}

            {fila(

                "🟢 Hora de entrada",

                entrada?.fecha_hora
                    ? new Date(
                        entrada.fecha_hora
                    ).toLocaleTimeString("es-CO", {

                        hour: "2-digit",
                        minute: "2-digit"

                    })
                    : "--"

            )}

            {/* ====================================== */}
            {/* SALIDA */}
            {/* ====================================== */}

            {fila(

                "🔴 Hora de salida",

                salida?.fecha_hora
                    ? new Date(
                        salida.fecha_hora
                    ).toLocaleTimeString("es-CO", {

                        hour: "2-digit",
                        minute: "2-digit"

                    })
                    : "Jornada activa"

            )}

            {/* ====================================== */}
            {/* MOVIMIENTOS */}
            {/* ====================================== */}

            {fila(

                "📋 Total movimientos",

                resumen.movimientos
                    ? resumen.movimientos.length
                    : 0

            )}

            {/* ====================================== */}
            {/* ESTADÍSTICAS (cuando existan) */}
            {/* ====================================== */}

            {resumen.tiempo_trabajado &&

                fila(
                    "⏱ Tiempo trabajado",
                    resumen.tiempo_trabajado
                )

            }

            {resumen.tiempo_break &&

                fila(
                    "☕ Break",
                    resumen.tiempo_break
                )

            }

            {resumen.tiempo_almuerzo &&

                fila(
                    "🍽 Almuerzo",
                    resumen.tiempo_almuerzo
                )

            }

            {resumen.tiempo_bano &&

                fila(
                    "🚻 Baño",
                    resumen.tiempo_bano
                )

            }

            {resumen.tiempo_capacitacion &&

                fila(
                    "📚 Capacitación",
                    resumen.tiempo_capacitacion
                )

            }

            {resumen.tiempo_reunion &&

                fila(
                    "👥 Reunión",
                    resumen.tiempo_reunion
                )

            }

            {resumen.tiempo_productivo && (

                <div
                    style={{
                        marginTop: "20px",
                        paddingTop: "15px",
                        borderTop: "2px solid #ddd",
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: "bold",
                        fontSize: "18px"
                    }}
                >

                    <span>
                        💼 Tiempo productivo
                    </span>

                    <span>
                        {resumen.tiempo_productivo}
                    </span>

                </div>

            )}

        </div>

    );

}