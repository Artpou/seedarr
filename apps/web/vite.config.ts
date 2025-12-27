import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { lingui } from "@lingui/vite-plugin";

const config = defineConfig({
  envDir: "../../",
  plugins: [
    TanStackRouterVite(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    viteReact({
      plugins: [["@lingui/swc-plugin", {}]],
    }),
    lingui(),
  ],
});

export default config;