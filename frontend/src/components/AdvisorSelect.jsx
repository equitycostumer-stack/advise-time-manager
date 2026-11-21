import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdvisorSelect({ asesores = [], asesor, setAsesor }) {
    const { usuario } = useAuth();
    const [abierto, setAbierto] = useState(false);
    const esAsesorRestringido = usuario?.rol === "ASESOR";

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
                        <button className="advisor-option" type="button" role="option" aria-selected={String(item.id) === String(asesor)} key={item.id} onClick={() => elegir(item)}>
                            <span className="advisor-option-avatar" aria-hidden="true">
                                {item.foto_data ? <img src={item.foto_data} alt="" /> : (
                                    <svg viewBox="0 0 24 24">
                                        <circle cx="12" cy="8" r="4" fill="currentColor" />
                                        <path d="M4 21c.4-4.2 3.6-7 8-7s7.6 2.8 8 7H4Z" fill="currentColor" />
                                    </svg>
                                )}
                            </span>
                            <span className="advisor-option-name">{item.nombre}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
