import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // TypeScript 6 与当前 Vite 插件类型组合会在此处触发 TS2321。
  // 运行时插件配置保持不变。
  // @ts-expect-error TS2321: Excessive stack depth comparing Vite plugin types.
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
      "/vela-api": {
        target: "http://10.2.1.16:31119",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vela-api/, "/api/v1"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
