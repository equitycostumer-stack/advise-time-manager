from pathlib import Path
p=Path('/home/ubuntu/upload/modified/ConfiguracionHorarios.jsx')
s=p.read_text()
s=s.replace('''    const [mensajeEmpresa, setMensajeEmpresa] = useState("");''','''    const [mensajeEmpresa, setMensajeEmpresa] = useState("");
    const [ventasConfig, setVentasConfig] = useState({ moneda: "USD", simbolo_moneda: "$", permitir_recaudo: true, permitir_recaudo_cero: true, recaudo_no_supera_venta: true, ranking_activo: true, ranking_visible_asesores: true, criterio_ranking: "RECAUDO" });
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [guardandoVentas, setGuardandoVentas] = useState(false);
    const [mensajeVentas, setMensajeVentas] = useState("");''',1)
needle='''    function cambiarEmpresa(campo, valor) { setEmpresa((actual) => ({ ...actual, [campo]: valor })); }'''
insert=needle+'''\n\n    async function cargarVentasConfig() {\n        setCargandoVentas(true); setMensajeVentas("");\n        try { const { data } = await api.get("/configuracion-ventas"); if (data?.data) setVentasConfig((actual) => ({ ...actual, ...data.data })); }\n        catch (error) { setMensajeVentas(error.response?.data?.mensaje || "No fue posible cargar la configuración de ventas."); }\n        finally { setCargandoVentas(false); }\n    }\n\n    async function guardarVentasConfig() {\n        setGuardandoVentas(true); setMensajeVentas("");\n        try { const { data } = await api.put("/configuracion-ventas", ventasConfig); if (!data?.ok) throw new Error(data?.mensaje || "No fue posible guardar la configuración."); setVentasConfig((actual) => ({ ...actual, ...(data.data || {}) })); setMensajeVentas("Configuración de ventas guardada correctamente."); }\n        catch (error) { setMensajeVentas(error.response?.data?.mensaje || error.message || "No fue posible guardar la configuración."); }\n        finally { setGuardandoVentas(false); }\n    }\n\n    function cambiarVentas(campo, valor) { setVentasConfig((actual) => ({ ...actual, [campo]: valor })); }'''
s=s.replace(needle,insert,1)
old='''                        <details style={{ marginTop: "8px" }}>
                            <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>💰 Ventas y recaudos</summary>
                            <p style={{ color: "#4b5563", marginBottom: 0 }}>El registro de recaudo y el ranking quincenal permanecen activos. Sus reglas editables se agregarán después de crear la tabla de configuración correspondiente.</p>
                        </details>'''
new='''                        <details style={{ marginTop: "8px" }} onToggle={(e) => { if (e.currentTarget.open && !mensajeVentas && !cargandoVentas) cargarVentasConfig(); }}>
                            <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>💰 Ventas y recaudos</summary>
                            {cargandoVentas ? <p>Cargando configuración...</p> : <div style={{ display: "grid", gap: "10px" }}>
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Moneda<select value={ventasConfig.moneda} onChange={(e) => cambiarVentas("moneda", e.target.value)} style={input}><option value="USD">USD</option><option value="COP">COP</option><option value="EUR">EUR</option></select></label>
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Símbolo de moneda<input value={ventasConfig.simbolo_moneda} onChange={(e) => cambiarVentas("simbolo_moneda", e.target.value)} maxLength="5" style={input} /></label>
                                {[['permitir_recaudo','Permitir registrar recaudo'],['permitir_recaudo_cero','Permitir recaudo en cero'],['recaudo_no_supera_venta','Impedir recaudo mayor al valor de venta'],['ranking_activo','Activar ranking quincenal'],['ranking_visible_asesores','Mostrar ranking a asesores']].map(([campo, etiqueta]) => <label key={campo} style={{ color: "#4b5563" }}><input type="checkbox" checked={Boolean(ventasConfig[campo])} onChange={(e) => cambiarVentas(campo, e.target.checked)} /> {etiqueta}</label>)}
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Criterio del ranking<select value={ventasConfig.criterio_ranking} onChange={(e) => cambiarVentas("criterio_ranking", e.target.value)} style={input}><option value="RECAUDO">Mayor recaudo</option><option value="VALOR_VENDIDO">Mayor valor vendido</option><option value="CANTIDAD_VENTAS">Mayor cantidad de ventas</option></select></label>
                                <button type="button" onClick={guardarVentasConfig} disabled={guardandoVentas} style={{ justifySelf: "start", padding: "10px 16px", background: "#245b3a", color: "#fff", border: 0, borderRadius: "7px", fontWeight: "bold" }}>{guardandoVentas ? "Guardando..." : "Guardar ventas y recaudos"}</button>
                                {mensajeVentas && <p style={{ color: mensajeVentas.includes("correctamente") ? "#198754" : "#c0392b", fontWeight: "bold" }}>{mensajeVentas}</p>}
                            </div>}
                        </details>'''
if old not in s: raise SystemExit('sales placeholder not found')
s=s.replace(old,new,1)
p.write_text(s)
