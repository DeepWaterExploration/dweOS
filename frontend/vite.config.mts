import react from "@vitejs/plugin-react";
import { PluginOption, defineConfig } from "vite";

// https://stackoverflow.com/a/75689907
const fullReloadAlways: PluginOption = {
    name: "full-reload-always",
    handleHotUpdate({ server }) {
        server.ws.send({ type: "full-reload" });
        return [];
    },
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), fullReloadAlways],
});
