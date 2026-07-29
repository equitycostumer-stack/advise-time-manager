export default function StatusCard({ estado }) {

    return (

        <div className="estado">

            <h3>
                Estado actual
            </h3>

            <h2>
                {estado}
            </h2>

            <h3>
                Tiempo trabajado
            </h3>

            <p
                style={{
                    margin: "0",
                    fontSize: "14px",
                    color: "#666"
                }}
            >
                El tiempo de jornada aparece en el contador de abajo.
            </p>

        </div>

    );

}