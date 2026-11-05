const db = require("../config/db");

let migracionGeneroEnCurso;

function asegurarColumnaGeneroAsesores() {
    if (!migracionGeneroEnCurso) {
        migracionGeneroEnCurso = db.query(
            "ALTER TABLE asesores ADD COLUMN IF NOT EXISTS genero VARCHAR(12)"
        ).catch((error) => {
            migracionGeneroEnCurso = null;
            throw error;
        });
    }
    return migracionGeneroEnCurso;
}

module.exports = { asegurarColumnaGeneroAsesores };
