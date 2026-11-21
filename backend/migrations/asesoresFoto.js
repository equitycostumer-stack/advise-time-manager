const db = require("../config/db");

let migracionFotoEnCurso;

function asegurarColumnaFotoAsesores() {
    if (!migracionFotoEnCurso) {
        migracionFotoEnCurso = db.query(
            "ALTER TABLE asesores ADD COLUMN IF NOT EXISTS foto_data TEXT"
        ).catch((error) => {
            migracionFotoEnCurso = null;
            throw error;
        });
    }
    return migracionFotoEnCurso;
}

module.exports = { asegurarColumnaFotoAsesores };
