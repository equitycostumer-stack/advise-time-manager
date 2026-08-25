const ResumenJornadaService = require("../services/ResumenJornadaService");
const horariosRepository = require("../repositories/horariosRepository");
const movimientosRepository = require("../repositories/movimientosRepository");
const { registrarIncidencia } = require("../controllers/incidenciasController");

// Mocks de dependencias externas
jest.mock("../repositories/horariosRepository");
jest.mock("../repositories/movimientosRepository");
jest.mock("../controllers/incidenciasController");

describe("ResumenJornadaService - Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Fijar el tiempo "ahora" para pruebas deterministas cuando la jornada esté abierta
        jest.useFakeTimers().setSystemTime(new Date("2026-08-25T17:00:00-05:00"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // ======================================================
    // CÁLCULO DE TIEMPOS Y PRODUCTIVIDAD
    // ======================================================
    describe("calcularTiempos", () => {
        it("debe calcular correctamente los tiempos con jornada cerrada (con almuerzo excluido)", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "ALMUERZO_INICIO", fecha_hora: "2026-08-25 12:00:00" },
                { tipo: "ALMUERZO_FIN", fecha_hora: "2026-08-25 13:00:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 17:00:00" }
            ];

            const tiempos = ResumenJornadaService.calcularTiempos(movimientos);

            const unaHora = 60 * 60 * 1000;
            expect(tiempos.tiempoAlmuerzo).toBe(1 * unaHora);
            expect(tiempos.tiempoTrabajado).toBe(8 * unaHora); // 4h antes + 4h después de almuerzo
            expect(tiempos.tiempoProductivo).toBe(8 * unaHora);
        });

        it("debe descontar pausas (break, baño, reuniones) del tiempo productivo", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "BREAK_INICIO", fecha_hora: "2026-08-25 10:00:00" }, // 15m break
                { tipo: "BREAK_FIN", fecha_hora: "2026-08-25 10:15:00" },
                { tipo: "BANO_INICIO", fecha_hora: "2026-08-25 11:00:00" }, // 10m baño
                { tipo: "BANO_FIN", fecha_hora: "2026-08-25 11:10:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 12:00:00" }
            ];

            const tiempos = ResumenJornadaService.calcularTiempos(movimientos);

            const quinceMin = 15 * 60 * 1000;
            const diezMin = 10 * 60 * 1000;
            const cuatroHoras = 4 * 60 * 60 * 1000;

            expect(tiempos.tiempoBreak).toBe(quinceMin);
            expect(tiempos.tiempoBano).toBe(diezMin);
            expect(tiempos.tiempoTrabajado).toBe(cuatroHoras);
            // Productivo = Trabajado (4h) - Break (15m) - Baño (10m)
            expect(tiempos.tiempoProductivo).toBe(cuatroHoras - quinceMin - diezMin);
        });

        it("debe acumular tiempo hasta el momento actual si la jornada no ha cerrado", () => {
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" }
            ];
            // Hora actual configurada en `beforeEach`: 17:00:00 (9 horas transcurridas)

            const tiempos = ResumenJornadaService.calcularTiempos(movimientos);

            const nueveHoras = 9 * 60 * 60 * 1000;
            expect(tiempos.tiempoTrabajado).toBe(nueveHoras);
            expect(tiempos.tiempoProductivo).toBe(nueveHoras);
        });
    });

    // ======================================================
    // CÁLCULO DE RETRASO
    // ======================================================
    describe("calcularRetraso", () => {
        it("debe detectar llegada tarde y calcular los minutos de retraso exactos", async () => {
            // Horario oficial: 08:00:00
            horariosRepository.obtenerHorarioDia.mockResolvedValue({ hora_entrada: "08:00:00" });

            // Entrada del asesor: 08:25:00 (Martes)
            const horaEntrada = "2026-08-25 08:25:00";

            const resultado = await ResumenJornadaService.calcularRetraso(horaEntrada);

            expect(resultado).toEqual({
                llego_tarde: 1,
                minutos_retraso: 25
            });
            expect(horariosRepository.obtenerHorarioDia).toHaveBeenCalledWith("MARTES");
        });

        it("debe retornar 0 minutos de retraso si el asesor llega a tiempo o antes", async () => {
            horariosRepository.obtenerHorarioDia.mockResolvedValue({ hora_entrada: "08:00:00" });

            const horaEntrada = "2026-08-25 07:55:00";

            const resultado = await ResumenJornadaService.calcularRetraso(horaEntrada);

            expect(resultado).toEqual({
                llego_tarde: 0,
                minutos_retraso: 0
            });
        });
    });

    // ======================================================
    // FLUJO COMPLETO (actualizar)
    // ======================================================
    describe("actualizar", () => {
        it("debe persistir el resumen y registrar una incidencia si el asesor llegó tarde", async () => {
            const asesorId = 101;
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:15:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 17:00:00" }
            ];

            movimientosRepository.obtenerMovimientosDelDia.mockResolvedValue(movimientos);
            movimientosRepository.obtenerResumenDia.mockResolvedValue({ id: 50 });
            horariosRepository.obtenerHorarioDia.mockResolvedValue({ hora_entrada: "08:00:00" });
            registrarIncidencia.mockResolvedValue(true);

            await ResumenJornadaService.actualizar(asesorId);

            // Verifica registro de incidencia
            expect(registrarIncidencia).toHaveBeenCalledWith(
                asesorId,
                "LLEGADA TARDE",
                "ALTA",
                "15 minutos de retraso"
            );

            // Verifica persistencia en DB
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

        it("debe ignorar marcas previas a la última ENTRADA registrada", async () => {
            const asesorId = 102;
            const movimientos = [
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 07:00:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 07:30:00" },
                // Segunda entrada (jornada válida a procesar)
                { tipo: "ENTRADA", fecha_hora: "2026-08-25 08:00:00" },
                { tipo: "SALIDA", fecha_hora: "2026-08-25 16:00:00" }
            ];

            movimientosRepository.obtenerMovimientosDelDia.mockResolvedValue(movimientos);
            movimientosRepository.obtenerResumenDia.mockResolvedValue({ id: 51 });
            horariosRepository.obtenerHorarioDia.mockResolvedValue({ hora_entrada: "08:00:00" });

            await ResumenJornadaService.actualizar(asesorId);

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