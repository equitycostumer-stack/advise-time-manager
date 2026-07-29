import { useEffect, useState } from "react";
import logo from "../assets/Logo.png";

export default function Header() {

    const [fechaHora, setFechaHora] = useState(new Date());

    useEffect(() => {

        const intervalo = setInterval(() => {

            setFechaHora(new Date());

        }, 1000);

        return () => clearInterval(intervalo);

    }, []);

    return (

        <>

            <div className="header">

                <img
                    src={logo}
                    alt="Equity Line"
                    className="logo"
                />

                <h1 className="title">

                    EQUITY LINE

                </h1>

                <h2 className="subtitle">

                    Professional Services

                </h2>

                <hr />

                <h2 className="sectionTitle">

                    Control de Tiempo y Bienestar

                </h2>

                <div className="clock">

                    {fechaHora.toLocaleTimeString("es-US")}

                </div>

                <div className="date">

                    {fechaHora.toLocaleDateString("es-US", {

                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"

                    })}

                </div>

            </div>

        </>

    );

}