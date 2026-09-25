import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Yaraav To Do — renderer build config
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Keep predictable (unhashed) asset names so the Electron main
        // process can reference the packaged logo path for the splash screen.
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
