jest.mock("../repositories/ventasRepository", () => ({
    crearVenta: jest.fn(),
    obtenerVentasDelDia: jest.fn(),
    obtenerVentasPorAsesor: jest.fn(),
    obtenerResumenVentasDelDia: jest.fn(),
    obtenerResumenVentasPorAsesor: jest.fn(),
    obtenerResumenVentasPorAsesorPeriodo: jest.fn(),
    listarVentasAdmin: jest.fn(),
    obtenerVentaPorId: jest.fn(),
    actualizarVentaAdmin: jest.fn(),
    anularVenta: jest.fn()
}));
jest.mock("../repositories/movimientosRepository", () => ({
    obtenerAsesor: jest.fn()
}));
jest.mock("../repositories/configuracionVentasRepository", () => ({
    obtener: jest.fn()
}));

const ventasRepository = require("../repositories/ventasRepository");
const movimientosRepository = require("../repositories/movimientosRepository");
const configuracionVentasRepository = require("../repositories/configuracionVentasRepository");
const ventasService = require("./ventasService");

const asesor = { id: 7, nombre: "Asesora de prueba", activo: true };
const usuario = { id: 3, rol: "ASESOR", asesor_id: 7 };

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-11-03T18:00:00.000Z"));
    jest.clearAllMocks();
    configuracionVentasRepository.obtener.mockResolvedValue(null);
    movimientosRepository.obtenerAsesor.mockResolvedValue(asesor);
    ventasRepository.crearVenta.mockResolvedValue(123);
});

afterEach(() => {
    jest.useRealTimers();
});

describe("ventasService fechas de venta", () => {
    test("usa la hora del servidor de Bogotá para una venta de hoy", () => {
        const fecha = ventasService.resolverFechaVenta({
            fecha_venta: "2026-11-03",
            hora_venta: "01:15"
        });

        expect(fecha).toEqual({
            fechaHora: "2026-11-03 13:00:00",
            retroactiva: false,
            motivo: null
        });
    });

    test("rechaza fechas futuras", () => {
        expect(() => ventasService.resolverFechaVenta({ fecha_venta: "2026-11-04" }))
            .toThrow("No se pueden registrar ventas con una fecha futura.");
    });

    test("requiere hora válida y motivo para ventas anteriores", () => {
        expect(() => ventasService.resolverFechaVenta({
            fecha_venta: "2026-11-02",
            motivo_registro_retroactivo: "Registro tardío"
        })).toThrow("Para una venta anterior, indique la hora efectiva en formato HH:MM.");

        expect(() => ventasService.resolverFechaVenta({
            fecha_venta: "2026-11-02",
            hora_venta: "09:30"
        })).toThrow("Debe indicar un motivo de entre 5 y 500 caracteres.");
    });

    test("resuelve fecha/hora de Bogotá y envía el motivo al repositorio al registrar retroactivamente", async () => {
        const resultado = await ventasService.registrarVenta({
            asesor_id: 7,
            valor: 1200,
            recaudo: 300,
            fecha_venta: "2026-11-02",
            hora_venta: "09:30",
            motivo_registro_retroactivo: "Venta reportada tarde",
            usuario
        });

        expect(ventasRepository.crearVenta).toHaveBeenCalledWith(
            7,
            null,
            1200,
            300,
            "2026-11-02 09:30:00",
            null,
            usuario,
            "Venta reportada tarde"
        );
        expect(resultado.retroactiva).toBe(true);
        expect(resultado.fecha_hora).toBe("2026-11-02 09:30:00");
    });
});
