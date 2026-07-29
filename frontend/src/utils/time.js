export function formatSeconds(total){

    const hours = Math.floor(total / 3600);

    const minutes = Math.floor((total % 3600)/60);

    const seconds = total % 60;

    return [

        hours.toString().padStart(2,"0"),

        minutes.toString().padStart(2,"0"),

        seconds.toString().padStart(2,"0")

    ].join(":");

}