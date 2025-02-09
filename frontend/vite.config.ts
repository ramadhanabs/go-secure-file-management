import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { visualizer } from "rollup-plugin-visualizer"
import viteCompression from "vite-plugin-compression"

export default defineConfig({
  plugins: [
    react(),

    // Compression (Gzip & Brotli)
    viteCompression({
      algorithm: "brotliCompress",
      verbose: true,
    }),
    viteCompression({
      algorithm: "gzip",
      verbose: true,
    }),

    // Bundle size visualizer (optional, remove in production)
    visualizer({ filename: "stats.html", open: false }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    target: "esnext",
    minify: "terser", // Use Terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true, // Remove debugger statements
      },
      output: {
        comments: false, // Remove comments
      },
    },
    cssCodeSplit: true, // Optimize CSS splitting
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor" // Create a vendor chunk for dependencies
          }
        },
      },
    },
    assetsInlineLimit: 0, // Disable inlining assets to reduce bundle size
    chunkSizeWarningLimit: 500, // Increase limit to prevent warnings
  },

  // Define production environment variables
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  server: {
    strictPort: true,
    host: true, // Needed for VPS deployments
  },

  preview: {
    port: 4173, // Custom preview port
  },
})
