import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: 'https://projects.christian-f-brinkmann.de/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 51073,
    allowedHosts: ['projects.christian-f-brinkmann.de', 'christian-f-brinkmann.de'],
  },
});
