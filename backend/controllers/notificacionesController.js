const db = require("../config/db");

const crearNotificacion = (

    titulo,

    mensaje,

    destinatario

) => {

    const sql = `

        INSERT INTO notificaciones

        (

            titulo,

            mensaje,

            destinatario

        )

        VALUES (?, ?, ?)

    `;

    db.query(

        sql,

        [

            titulo,

            mensaje,

            destinatario

        ],

        (err) => {

            if (err) {

                console.error(

                    "Error creando notificación:",

                    err

                );

            }

        }

    );

};

module.exports = {

    crearNotificacion

};