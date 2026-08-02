const bcrypt = require("bcrypt");

(async () => {

    const password = "Admin123*";

    const hash = await bcrypt.hash(password, 10);

    console.log("");
    console.log("==================================");
    console.log("PASSWORD ORIGINAL:");
    console.log(password);
    console.log("");
    console.log("HASH:");
    console.log(hash);
    console.log("==================================");
    console.log("");

})();