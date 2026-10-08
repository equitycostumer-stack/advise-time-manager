import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdvisorSelect({ asesores = [], asesor, setAsesor }) {
    const { usuario } = useAuth();
    const [abierto, setAbierto] = useState(false);
    const esAsesorRestringido = usuario?.rol === "ASESOR";
    const seleccionado = asesores.find((item) => String(item.id) === String(asesor));

    useEffect(() => {
        if (esAsesorRestringido && usuario?.asesor_id && asesor !== String(usuario.asesor_id)) {
            setAsesor(String(usuario.asesor_id));
        }
    }, [esAsesorRestringido, usuario, asesor, setAsesor]);

    function elegir(item) {
        setAsesor(String(item.id));
        setAbierto(false);
    }

    return (
        <div className="advisor-dropdown">
            <button
                type="button"
                className="advisor-trigger"
                onClick={() => !esAsesorRestringido && setAbierto((visible) => !visible)}
                disabled={esAsesorRestringido}
                aria-expanded={abierto}
                aria-haspopup="listbox"
            >
                <span>Asesores</span>
                <strong>›</strong>
            </button>
            {abierto && !esAsesorRestringido && (
                <div className="advisor-options" role="listbox" aria-label="Asesores disponibles">
                    {asesores.length === 0 ? (
                        <div className="advisor-empty">No hay asesores disponibles</div>
                    ) : asesores.map((item) => (
                        <button type="button" role="option" aria-selected={String(item.id) === String(asesor)} key={item.id} onClick={() => elegir(item)}>
                            {item.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
