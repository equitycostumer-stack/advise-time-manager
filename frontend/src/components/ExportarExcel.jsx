import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ExportarExcel({ asesores }) {

    const exportar = () => {

        const datos = asesores.map(a => ({
            Nombre: a.nombre,
            Estado: a.estado,
            Inicio: a.inicio_estado
                ? new Date(a.inicio_estado).toLocaleString()
                : "",
            Jornada: a.inicio_jornada
                ? new Date(a.inicio_jornada).toLocaleString()
                : ""
        }));

        const hoja = XLSX.utils.json_to_sheet(datos);

        const libro = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            libro,
            hoja,
            "Dashboard"
        );

        const excel = XLSX.write(libro, {
            bookType: "xlsx",
            type: "array"
        });

        const archivo = new Blob(
            [excel],
            {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        );

        saveAs(
            archivo,
            `Dashboard_${new Date().toLocaleDateString()}.xlsx`
        );

    };

    return (

        <button
            onClick={exportar}
            style={{
                background: "#198754",
                color: "#fff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                marginBottom: "20px",
                fontWeight: "bold"
            }}
        >
            📥 Exportar Excel
        </button>

    );

}