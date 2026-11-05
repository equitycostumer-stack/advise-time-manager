const mockDb = { query: jest.fn() };

jest.mock("../config/db", () => mockDb);

const { asegurarColumnaGeneroAsesores } = require("./asesoresGenero");

beforeEach(() => jest.clearAllMocks());

test("asegura la columna una sola vez en llamadas concurrentes o repetidas", async () => {
    let completar;
    mockDb.query.mockReturnValue(new Promise((resolve) => { completar = resolve; }));

    const primera = asegurarColumnaGeneroAsesores();
    const segunda = asegurarColumnaGeneroAsesores();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    expect(mockDb.query).toHaveBeenCalledWith("ALTER TABLE asesores ADD COLUMN IF NOT EXISTS genero VARCHAR(12)");

    completar({ rows: [] });
    await Promise.all([primera, segunda]);
    await asegurarColumnaGeneroAsesores();
    expect(mockDb.query).toHaveBeenCalledTimes(1);
});
