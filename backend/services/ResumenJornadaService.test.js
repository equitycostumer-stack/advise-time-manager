const movimientosRepository = require("../repositories/movimientosRepository");
const { registrarIncidencia } = require("../controllers/incidenciasController");
const resumenJornadaService = require("./resumenJornadaService");

jest.mock("../repositories/movimientosRepository");
jest.mock("../controllers/incidenciasController");

describe("ResumenJornadaService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(new Date("2026-08-25T17:00:00-05:00"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("calcularTiempos", () => {
        it("calcula los tiempos con almuerzo excluido del tiempo trabajado", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "ALMUERZO_INICIO", fecha_hora: "2026-08-25 12:00:00" },
                { tipo: "ALMUERZO_FIN", fecha_hora: "2026-08-25 13:00:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 17:00:00" }
            ];

            const tiempos = resumenJornadaService.calcularTiempos(movimientos);
            const unaHora = 60 * 60 * 1000;

            expect(tiempos.tiempoAlmuerzo).toBe(unaHora);
            expect(tiempos.tiempoTrabajado).toBe(8 * unaHora);
            expect(tiempos.tiempoProductivo).toBe(8 * unaHora);
        });

        it("descuenta break, baño y reunión del tiempo productivo", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "BREAK_INICIO", fecha_hora: "2026-08-25 10:00:00" },
                { tipo: "BREAK_FIN", fecha_hora: "2026-08-25 10:15:00" },
                { tipo: "BANO_INICIO", fecha_hora: "2026-08-25 11:00:00" },
                { tipo: "BANO_FIN", fecha_hora: "2026-08-25 11:10:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 12:00:00" }
            ];

            const tiempos = resumenJornadaService.calcularTiempos(movimientos);
            const quinceMinutos = 15 * 60 * 1000;
            const diezMinutos = 10 * 60 * 1000;
            const cuatroHoras = 4 * 60 * 60 * 1000;

            expect(tiempos.tiempoBreak).toBe(quinceMinutos);
            expect(tiempos.tiempoBano).toBe(diezMinutos);
            expect(tiempos.tiempoTrabajado).toBe(cuatroHoras);
            expect(tiempos.tiempoProductivo).toBe(cuatroHoras - quinceMinutos - diezMinutos);
        });

        it("acumula tiempo hasta el momento actual si la jornada sigue abierta", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" }
            ];

            const tiempos = resumenJornadaService.calcularTiempos(movimientos);

            expect(tiempos.tiempoTrabajado).toBe(9 * 60 * 60 * 1000);
            expect(tiempos.tiempoProductivo).toBe(9 * 60 * 60 * 1000);
        });
    });

    describe("calcularRetraso", () => {
        it("detecta una llegada tarde usando el horario persistido del día", async () => {
            movimientosRepository.obtenerHorarioDelDia.mockResolvedValue({
                hora_entrada: "08:00:00",
                tolerancia_minutos: 0
            });

            const resultado = await resumenJornadaService.calcularRetraso(
                "2026-08-25 08:25:00"
            );

            expect(resultado).toEqual({
                llego_tarde: 1,
                minutos_retraso: 25
            });
            expect(movimientosRepository.obtenerHorarioDelDia).toHaveBeenCalledWith(2);
        });

        it("no marca retraso si la llegada está dentro de la tolerancia", async () => {
            movimientosRepository.obtenerHorarioDelDia.mockResolvedValue({
                hora_entrada: "08:00:00",
                tolerancia_minutos: 10
            });

            const resultado = await resumenJornadaService.calcularRetraso(
                "2026-08-25 08:10:00"
            );

            expect(resultado).toEqual({
                llego_tarde: 0,
                minutos_retraso: 0
            });
        });
    });

    describe("actualizar", () => {
        it("persiste el resumen y registra incidencia si el asesor llegó tarde", async () => {
            const asesorId = 101;
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:15:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 17:00:00" }
            ];

            movimientosRepository.obtenerMovimientosDesdeUltimaEntrada.mockResolvedValue(movimientos);
            movimientosRepository.obtenerResumenPorFecha.mockResolvedValue({ id: 50 });
            movimientosRepository.obtenerHorarioDelDia.mockResolvedValue({
                hora_entrada: "08:00:00",
                tolerancia_minutos: 0
            });
            movimientosRepository.actualizarResumenDia.mockResolvedValue(undefined);

            await resumenJornadaService.actualizar(asesorId);

            expect(registrarIncidencia).toHaveBeenCalledWith(
                asesorId,
                "LLEGADA TARDE",
                "ALTA",
                "15 minutos de retraso"
            );
            expect(movimientosRepository.actualizarResumenDia).toHaveBeenCalledWith(
                50,
                expect.objectContaining({
                    llego_tarde: 1,
                    minutos_retraso: 15,
                    hora_entrada: "2026-08-25 08:15:00",
                    hora_salida: "2026-08-25 17:00:00"
                })
            );
        });

        it("procesa únicamente la jornada devuelta desde la última entrada", async () => {
            const asesorId = 102;
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 16:00:00" }
            ];

            movimientosRepository.obtenerMovimientosDesdeUltimaEntrada.mockResolvedValue(movimientos);
            movimientosRepository.obtenerResumenPorFecha.mockResolvedValue({ id: 51 });
            movimientosRepository.obtenerHorarioDelDia.mockResolvedValue({
                hora_entrada: "08:00:00",
                tolerancia_minutos: 0
            });

            await resumenJornadaService.actualizar(asesorId);

            expect(movimientosRepository.obtenerMovimientosDesdeUltimaEntrada)
                .toHaveBeenCalledWith(asesorId);
            expect(movimientosRepository.obtenerResumenPorFecha)
                .toHaveBeenCalledWith(asesorId, "2026-08-25 08:00:00");
            expect(movimientosRepository.actualizarResumenDia).toHaveBeenCalledWith(
                51,
                expect.objectContaining({
                    hora_entrada: "2026-08-25 08:00:00",
                    hora_salida: "2026-08-25 16:00:00"
                })
            );
        });
    });
});
