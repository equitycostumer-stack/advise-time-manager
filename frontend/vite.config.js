import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite 8 utiliza Rolldown. Separamos dependencias estables
// para mejorar caché y reducir el bundle principal.
export default defineConfig({
    plugins: [react()],
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
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
