require("dotenv").config();
const nodemailer = require("nodemailer");

// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// SERVICIO DE ENVÍO DE CORREOS
// ======================================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// ======================================================
// ENVIAR ALERTA DE EXCESO DE TIEMPO
// ======================================================

async function enviarAlertaExceso({
    asesorNombre,
    tipoPausa,
    duracionMinutos,
    limiteMinutos
}) {

    const destinatarios = [
        process.env.COACH_EMAIL,
        process.env.JEFA_EMAIL
    ].filter(Boolean).join(",");

    if (!destinatarios) {
        console.error("⚠️ No hay destinatarios configurados para el correo de alerta.");
        return;
    }

    const exceso = duracionMinutos - limiteMinutos;

    const asunto =
        `🚨 Exceso de tiempo - ${asesorNombre} (${tipoPausa})`;

    const cuerpo = `
El asesor ${asesorNombre} excedió el límite de tiempo permitido.

Tipo: ${tipoPausa}
Duración real: ${duracionMinutos} minutos
Límite permitido: ${limiteMinutos} minutos
Exceso: ${exceso} minutos

EQUITY LINE PROFESSIONAL SERVICES
Sistema de Control de Tiempo y Asistencia
    `;

    try {

        await transporter.sendMail({
            from: `"EQUITY LINE - Alertas" <${process.env.GMAIL_USER}>`,
            to: destinatarios,
            subject: asunto,
            text: cuerpo
        });

        console.log("✅ Correo de alerta enviado a:", destinatarios);

    } catch (error) {

        console.error("❌ Error enviando correo de alerta:", error.message);

    }

}

module.exports = {
    enviarAlertaExceso
};