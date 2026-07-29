import { useEffect, useState } from "react";

function Clock() {

    const [time, setTime] = useState(new Date());

    useEffect(() => {

        const interval = setInterval(() => {

            setTime(new Date());

        },1000);

        return ()=>clearInterval(interval);

    },[]);

    return(

        <div style={{textAlign:"center"}}>

            <h2 style={{
                color:"#0B5ED7",
                marginBottom:"5px"
            }}>

                {time.toLocaleTimeString()}

            </h2>

            <p style={{
                color:"#555"
            }}>

                {time.toLocaleDateString()}

            </p>

        </div>

    )

}

export default Clock;