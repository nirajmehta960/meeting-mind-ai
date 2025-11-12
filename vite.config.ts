import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync, existsSync } from "fs";

// Copy PDF.js worker to public directory (Vite will serve it at /pdf.worker.min.mjs)
const pdfWorkerSrc = path.resolve(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const pdfWorkerDest = path.resolve(__dirname, "public/pdf.worker.min.mjs");

// Always copy the worker file to ensure it's up to date
if (existsSync(pdfWorkerSrc)) {
  try {
    copyFileSync(pdfWorkerSrc, pdfWorkerDest);
    console.log("✓ Copied PDF.js worker to public directory");
  } catch (error) {
    console.warn("Failed to copy PDF.js worker:", error);
  }
} else {
  console.warn("PDF.js worker file not found in node_modules");
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
