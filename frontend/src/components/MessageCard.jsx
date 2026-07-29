export default function MessageCard({ mensaje }) {

    return (

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

    );

}