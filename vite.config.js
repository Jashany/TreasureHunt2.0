import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "localhost",
      "*.ngrok-free.app", // This will allow any ngrok-free.app subdomain
      "9059-2409-40d1-1a-cab0-c58d-c477-4e51-ca57.ngrok-free.app", // Added specific ngrok host
      "29d7-2409-40d1-1a-cab0-7495-5b89-6b3-24e.ngrok-free.app",
      "b354-2409-40d1-1a-cab0-f404-7b13-97ce-dd8c.ngrok-free.app"
    ],
  },
  // Optional: Configure HTTPS if needed for geolocation
  // https: true,
});
