const mockRepository = {
    obtenerActivos: jest.fn(),
    obtenerActivosParaAdministracion: jest.fn(),
    actualizarGenero: jest.fn()
};

jest.mock("../repositories/asesoresRepository", () => mockRepository);

const controller = require("./asesoresController");

function crearRespuesta() {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
}

beforeEach(() => jest.clearAllMocks());

describe("asesoresController.actualizarGenero", () => {
    test("rechaza valores distintos a masculino, femenino o sin definir", async () => {
        const res = crearRespuesta();
        await controller.actualizarGenero({ params: { id: "4" }, body: { genero: "OTRO" } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(mockRepository.actualizarGenero).not.toHaveBeenCalled();
    });

    test("normaliza y guarda el valor femenino declarado", async () => {
        const res = crearRespuesta();
        mockRepository.actualizarGenero.mockResolvedValue({ id: 4, nombre: "Odeilys Marin", genero: "FEMENINO" });

        await controller.actualizarGenero({ params: { id: "4" }, body: { genero: "femenino" } }, res);

        expect(mockRepository.actualizarGenero).toHaveBeenCalledWith(4, "FEMENINO");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
    });

    test("permite dejar el género sin definir", async () => {
        const res = crearRespuesta();
        mockRepository.actualizarGenero.mockResolvedValue({ id: 9, genero: null });

        await controller.actualizarGenero({ params: { id: "9" }, body: { genero: "" } }, res);

        expect(mockRepository.actualizarGenero).toHaveBeenCalledWith(9, null);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
