require("dotenv").config();
const { Resend } = require("resend");

// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// SERVICIO DE ENVÍO DE CORREOS (RESEND)
// ======================================================

const resend = new Resend(process.env.RESEND_API_KEY);

const TEST_MODE =
    String(process.env.EMAIL_TEST_MODE).toLowerCase() === "true";

// ======================================================
// ENVIAR ALERTA DE EXCESO DE TIEMPO
// ======================================================

async function enviarAlertaExceso({
    asesorNombre,
    tipoPausa,
    duracionMinutos,
    limiteMinutos
}) {

    const destinatariosReales = [
        process.env.COACH_EMAIL,
        process.env.JEFA_EMAIL
    ].filter(Boolean);

    if (!destinatariosReales.length) {
        console.error("⚠️ No hay destinatarios configurados para el correo de alerta.");
        return;
    }

    // ==================================================
    // MODO PRUEBA: redirigir todo a un solo correo
    // ==================================================

    const destinatariosFinales =
        TEST_MODE && process.env.EMAIL_TEST_ADDRESS
            ? [process.env.EMAIL_TEST_ADDRESS]
            : destinatariosReales;

    if (TEST_MODE) {

        console.log("=================================");
        console.log("⚠️ MODO PRUEBA ACTIVO");
        console.log("Destinatarios reales (Coach/Jefa):", destinatariosReales.join(", "));
        console.log("Enviando en su lugar a:", destinatariosFinales.join(", "));
        console.log("=================================");

    }

    const exceso = duracionMinutos - limiteMinutos;

    const asunto =
        `🚨 Exceso de tiempo - ${asesorNombre} (${tipoPausa})` +
        (TEST_MODE ? " [PRUEBA]" : "");

    const cuerpo = `
El asesor ${asesorNombre} excedió el límite de tiempo permitido.

Tipo: ${tipoPausa}
Duración real: ${duracionMinutos} minutos
Límite permitido: ${limiteMinutos} minutos
Exceso: ${exceso} minutos

${TEST_MODE ? `(Destinatarios reales en producción: ${destinatariosReales.join(", ")})\n\n` : ""}EQUITY LINE PROFESSIONAL SERVICES
Sistema de Control de Tiempo y Asistencia
    `;

    try {

        const resultado = await resend.emails.send({
            from: "EQUITY LINE - Alertas <onboarding@resend.dev>",
            to: destinatariosFinales,
            subject: asunto,
            text: cuerpo
        });

        console.log("✅ Correo de alerta enviado a:", destinatariosFinales.join(", "));
        console.log("Resultado Resend:", resultado);

    } catch (error) {

        console.error("❌ Error enviando correo de alerta:", error.message);

    }

}

module.exports = {
    enviarAlertaExceso
};