import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "localhost",
      "*.ngrok-free.app", // This will allow any ngrok-free.app subdomain
      "1823-2409-40d1-1a-cab0-f404-7b13-97ce-dd8c.ngrok-free.app",
    ],
  },
  assetsInclude: ["**/*.glb"],
  // Optional: Configure HTTPS if needed for geolocation
  // https: true,
});
