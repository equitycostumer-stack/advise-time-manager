// Limitador sencillo para proteger el endpoint de inicio de sesión.
// En despliegues con varias instancias se recomienda complementarlo con un
// limitador distribuido en el proveedor o Redis.
const ventanas = new Map();
const LIMITE = 10;
const DURACION_MS = 60 * 1000;

module.exports = function rateLimitLogin(req, res, next) {
    const ip = String(req.ip || req.headers["x-forwarded-for"] || "desconocida").split(",")[0].trim();
    const ahora = Date.now();
    const actual = ventanas.get(ip);
    if (!actual || ahora - actual.inicio >= DURACION_MS) {
        ventanas.set(ip, { inicio: ahora, intentos: 1 });
        return next();
    }
    if (actual.intentos >= LIMITE) {
        const espera = Math.ceil((DURACION_MS - (ahora - actual.inicio)) / 1000);
        res.set("Retry-After", String(espera));
        return res.status(429).json({ ok: false, mensaje: "Demasiados intentos. Espera un momento e inténtalo nuevamente." });
    }
    actual.intentos += 1;
    return next();
};
