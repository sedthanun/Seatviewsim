import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react-router-dom",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "lucide-react",
    ],
  },
  build: { chunkSizeWarningLimit: 1100 },
  test: { include: ["tests/**/*.test.js"] },
});
