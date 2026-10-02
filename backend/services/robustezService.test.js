const metasService = require("./metasService");
const reportesService = require("./reportesService");
const ventasService = require("./ventasService");

describe("validaciones de robustez", () => {
    test("acepta la primera quincena", () => {
        expect(() => metasService.validar({
            asesor_id: 1,
            periodo_tipo: "QUINCENA",
            periodo_inicio: "2026-10-01",
            periodo_fin: "2026-10-15",
            meta_ventas: 10,
            meta_recaudo: 100
        })).not.toThrow();
    });

    test("acepta la segunda quincena de febrero", () => {
        expect(() => metasService.validar({
            asesor_id: 1,
            periodo_tipo: "QUINCENA",
            periodo_inicio: "2026-02-16",
            periodo_fin: "2026-02-28",
            meta_ventas: 10,
            meta_recaudo: 100
        })).not.toThrow();
    });

    test("rechaza una fecha inexistente", () => {
        expect(() => reportesService.validarRango("2026-02-31", "2026-03-01")).toThrow();
        expect(ventasService.validarFechaISO("2026-02-31")).toBe(false);
    });

    test("rechaza reportes mayores a un año", () => {
        expect(() => reportesService.validarRango("2025-01-01", "2026-01-03")).toThrow(/366/);
    });

    test("rechaza metas que no corresponden a una quincena", () => {
        expect(() => metasService.validar({
            asesor_id: 1,
            periodo_tipo: "QUINCENA",
            periodo_inicio: "2026-02-16",
            periodo_fin: "2026-02-27",
            meta_ventas: 10,
            meta_recaudo: 100
        })).toThrow();
    });
});
