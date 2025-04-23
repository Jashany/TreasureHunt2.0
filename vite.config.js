import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    allowedHosts: [
      "localhost",
      "*.ngrok-free.app", // This will allow any ngrok-free.app subdomain
      "a257-112-196-126-3.ngrok-free.app", // This will allow a specific ngrok-free.app subdomain
      "e90c-112-196-126-3.ngrok-free.app",
      "880a-2409-40d1-85-39c1-ac11-334c-c571-77e4.ngrok-free.app"
    ],
  },
  assetsInclude: ["**/*.glb"], // Correctly include .glb files as assets
});
