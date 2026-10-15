jest.mock("../config/db", () => ({
    query: jest.fn()
}));

const db = require("../config/db");
const { revisarIncidencia, registrarPausaLlamadas } = require("./incidenciasController");

function crearRespuesta() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
}

describe("incidenciasController.revisarIncidencia", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("usa el usuario autenticado como responsable y no el coach del cliente", async () => {
        db.query.mockResolvedValue({ rowCount: 1 });
        const req = {
            params: { id: "15" },
            body: {
                coach: "Identidad manipulada",
                comentario: "Revisión completada"
            },
            usuario: {
                id: 7,
                usuario: "admin.autenticado",
                rol: "ADMINISTRADOR"
            }
        };
        const res = crearRespuesta();

        await revisarIncidencia(req, res);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("revisada_por = $1"),
            ["admin.autenticado", "Revisión completada", "15"]
        );
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            mensaje: "Incidencia revisada correctamente."
        });
    });

    it("rechaza comentarios demasiado largos sin consultar la base de datos", async () => {
        const req = {
            params: { id: "15" },
            body: { comentario: "x".repeat(1001) },
            usuario: { id: 7, usuario: "admin.autenticado" }
        };
        const res = crearRespuesta();

        await revisarIncidencia(req, res);

        expect(db.query).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            mensaje: "El comentario no puede superar los 1000 caracteres."
        });
    });

    it("devuelve 404 cuando la incidencia no existe", async () => {
        db.query.mockResolvedValue({ rowCount: 0 });
        const req = {
            params: { id: "999" },
            body: {},
            usuario: { id: 7, usuario: "admin.autenticado" }
        };
        const res = crearRespuesta();

        await revisarIncidencia(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            mensaje: "Incidencia no encontrada."
        });
    });
});

describe("incidenciasController.registrarPausaLlamadas", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("guarda el comentario enviado por el asesor y devuelve el ID de la pausa", async () => {
        db.query.mockResolvedValue({ rows: [{ id: 42 }] });
        const req = {
            body: {
                asesor_id: 9,
                motivo: "Gestión administrativa",
                comentario: "Atendiendo un trámite presencial"
            }
        };
        const res = crearRespuesta();

        await registrarPausaLlamadas(req, res);

        expect(db.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO incidencias"),
            [9, "Gestión administrativa", expect.any(String), "Auto-registro (asesor)", "Atendiendo un trámite presencial"]
        );
        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            mensaje: "Pausa registrada correctamente.",
            id: 42
        });
    });
});
