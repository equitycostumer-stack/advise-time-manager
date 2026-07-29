export default function AdvisorSelect({
    asesores,
    asesor,
    setAsesor
}) {

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