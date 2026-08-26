import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AdvisorSelect({
    asesores,
    asesor,
    setAsesor
}) {

    const { usuario } = useAuth();

    const esAsesorRestringido = usuario?.rol === "ASESOR";

    // ======================================================
    // Si el usuario logueado es un ASESOR, se autoselecciona
    // y bloquea su propio asesor_id — no puede operar a
    // nombre de otro compañero.
    // ======================================================
    useEffect(() => {

        if (
            esAsesorRestringido &&
            usuario?.asesor_id &&
            asesor !== String(usuario.asesor_id)
        ) {
            setAsesor(String(usuario.asesor_id));
        }

    }, [esAsesorRestringido, usuario, asesor, setAsesor]);

    return (

        <div style={{ marginTop: "25px" }}>

            <label
                style={{
                    fontWeight: "bold",
                    color: "#0B4F8C",
                    fontSize: "18px"
                }}
            >
                Asesor
            </label>

            <select
                className="select"
                value={asesor}
                disabled={esAsesorRestringido}
                onChange={(e) => setAsesor(e.target.value)}
            >

                <option value="">
                    Seleccione un asesor
                </option>

                {asesores.map((item) => (

                    <option
                        key={item.id}
                        value={item.id}
                    >

                        {item.nombre}

                    </option>

                ))}

            </select>

        </div>

    );

}