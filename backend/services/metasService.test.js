const metasService = require("./metasService");

const metaValida = {
    asesor_id: 1,
    periodo_tipo: "QUINCENA",
    periodo_inicio: "2026-11-01",
    periodo_fin: "2026-11-15",
    meta_ventas: 0,
    meta_recaudo: 0
};

describe("metasService.validar", () => {
    test("acepta el cero explícito como meta válida", () => {
        expect(metasService.validar(metaValida)).toMatchObject({
            meta_ventas: 0,
            meta_recaudo: 0
        });
    });

    test.each([null, undefined, "", "   "])("rechaza meta_ventas ausente o vacía (%s)", (valor) => {
        expect(() => metasService.validar({ ...metaValida, meta_ventas: valor }))
            .toThrow("Ingrese una meta de ventas; use 0 si no desea fijar una meta.");
    });

    test.each([null, undefined, "", "   "])("rechaza meta_recaudo ausente o vacía (%s)", (valor) => {
        expect(() => metasService.validar({ ...metaValida, meta_recaudo: valor }))
            .toThrow("Ingrese una meta de recaudo; use 0 si no desea fijar una meta.");
    });
});
