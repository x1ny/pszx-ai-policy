import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://10.2.1.16:32096",
        changeOrigin: true,
      },
      "/login": {
        target: "http://10.2.1.16:32096",
        changeOrigin: true,
      },
      "/captchaImage": {
        target: "http://10.2.1.16:32096",
        changeOrigin: true,
      },
      "/vela": {
        target: "http://10.2.1.16:31119",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vela/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
