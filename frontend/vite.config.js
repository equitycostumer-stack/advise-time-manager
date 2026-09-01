import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 8 utiliza Rolldown. Estos grupos separan dependencias estables
// del código de la aplicación para mejorar caché y carga incremental.
export default defineConfig({
    plugins: [react()],
    build: {
        rolldownOptions: {
            output: {
                advancedChunks: {
                    groups: [
                        {
                            name: "react-vendor",
                            test: /node_modules[\\/](react|react-dom|scheduler)([\\/]|$)/
                        },
                        {
                            name: "export-vendor",
                            test: /node_modules[\\/](docx|xlsx|file-saver)([\\/]|$)/
                        }
                    ]
                }
            }
        }
    }
});
