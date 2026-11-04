const mockDb = {
    query: jest.fn(),
    pool: { connect: jest.fn() }
};

jest.mock("../config/db", () => mockDb);

const ventasRepository = require("./ventasRepository");

function prepararCliente({ fallaAuditoria = false } = {}) {
    const venta = {
        id: 123,
        asesor_id: 7,
        cliente_id: "CLI-4",
        valor: 1200,
        recaudo: 300,
        fecha_hora: "2026-11-02 09:30:00",
        observacion: null,
        estado: "ACTIVA"
    };
    const client = {
        query: jest.fn(async (sql) => {
            if (sql.includes("INSERT INTO ventas (") && sql.includes("RETURNING id")) {
                return { rows: [venta] };
            }
            if (sql.includes("INSERT INTO ventas_cambios_auditoria") && fallaAuditoria) {
                throw new Error("fallo de auditoría de prueba");
            }
            return { rows: [] };
        }),
        release: jest.fn()
    };
    mockDb.pool.connect.mockResolvedValue(client);
    return { client, venta };
}

beforeEach(() => {
    jest.clearAllMocks();
});

describe("ventasRepository.crearVenta retroactiva", () => {
    test("crea la venta y guarda motivo, usuario y metadata en la misma transacción", async () => {
        const { client, venta } = prepararCliente();
        const usuario = { id: 3, rol: "ASESOR", asesor_id: 7 };

        const id = await ventasRepository.crearVenta(
            7, "CLI-4", 1200, 300, "2026-11-02 09:30:00", null,
            usuario, "Venta reportada tarde"
        );

        expect(id).toBe(venta.id);
        expect(client.query.mock.calls[0][0]).toBe("BEGIN");
        const auditoria = client.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO ventas_cambios_auditoria"));
        expect(auditoria[0]).toContain("'EDICION'");
        expect(auditoria[1][0]).toBe(venta.id);
        expect(JSON.parse(auditoria[1][1])).toMatchObject({ tipo_evento: "REGISTRO_RETROACTIVO" });
        expect(auditoria[1][2]).toBe("Venta reportada tarde");
        expect(auditoria[1][3]).toBe(usuario.id);
        expect(client.query.mock.calls.at(-1)[0]).toBe("COMMIT");
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test("revierte la creación si no se puede guardar la auditoría", async () => {
        const { client } = prepararCliente({ fallaAuditoria: true });

        await expect(ventasRepository.crearVenta(
            7, null, 1200, 300, "2026-11-02 09:30:00", null,
            { id: 3 }, "Venta reportada tarde"
        )).rejects.toThrow("fallo de auditoría de prueba");

        expect(client.query.mock.calls.at(-1)[0]).toBe("ROLLBACK");
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});
