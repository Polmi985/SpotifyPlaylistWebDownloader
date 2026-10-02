import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import downloaderRouter from './routes/downloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Downloader API Routes
app.use('/api/downloader', downloaderRouter);

// Static frontend serving in production
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 60px auto; padding: 24px; background: #131518; color: #eee; border-radius: 12px; border: 1px solid #333;">
        <h2 style="color: #10b981; margin-top: 0;">🎵 Melodia Downloader API Server</h2>
        <p>The backend server is running on port ${process.env.PORT || 5000}.</p>
        <p>Frontend production build was not found in <code>dist/</code>.</p>
        <hr style="border: 0; border-top: 1px solid #333; margin: 16px 0;" />
        <p><strong>Development:</strong> Run <code>npm run dev</code> to start both frontend & backend with hot reload.</p>
        <p><strong>Production:</strong> Run <code>npm run build</code> followed by <code>npm start</code>.</p>
      </div>
    `);
  });
}

const PORT = parseInt(process.env.PORT || '5000', 10);
let serverInstance = null;

export function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      return resolve(serverInstance);
    }
    try {
      serverInstance = app.listen(port, () => {
        console.log(`\n🎵 Melodia Web Server running at http://localhost:${port}`);
        console.log(`📡 API endpoint: http://localhost:${port}/api/downloader\n`);
        resolve(serverInstance);
      });
      serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use, assuming server is running.`);
          resolve(null);
        } else {
          reject(err);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Auto start if executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer();
}

export { app };