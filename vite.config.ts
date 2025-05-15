
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { spawn } from "child_process";

// Plugin to start Flask backend
const startFlaskBackend = () => {
  return {
    name: 'start-flask-backend',
    configureServer() {
      const serverProcess = spawn('node', ['server/start.js'], {
        stdio: 'inherit',
        shell: true
      });

      // Ensure the Flask server is terminated when Vite exits
      process.on('exit', () => {
        serverProcess.kill();
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'development' && startFlaskBackend(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
