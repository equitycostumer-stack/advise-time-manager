import { useEffect, useState } from "react";

export default function useTimer(active){

    const [seconds, setSeconds] = useState(0);

    useEffect(()=>{

        if(!active) return;

        const interval = setInterval(()=>{

            setSeconds(prev => prev + 1);

        },1000);

        return ()=>clearInterval(interval);

    },[active]);

    return {

        seconds,

        reset:()=>setSeconds(0)

    };

}