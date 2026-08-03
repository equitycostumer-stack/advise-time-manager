// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// RESET PASSWORD ADMIN
// ======================================================

const bcrypt = require("bcryptjs");

// ======================================================
// CONTRASEÑA NUEVA
// ======================================================

const password = "Admin123*";

// ======================================================
// GENERAR HASH
// ======================================================

(async () => {

    try {

        const hash = await bcrypt.hash(password, 10);

        console.log("");

        console.log("====================================");

        console.log("Nueva contraseña:");

        console.log(password);

        console.log("");

        console.log("Hash:");

        console.log(hash);

        console.log("");

        console.log("SQL:");

        console.log(`
UPDATE usuarios
SET password='${hash}'
WHERE usuario='admin';
`);

        console.log("====================================");

    } catch (error) {

        console.error(error);

    }

})();