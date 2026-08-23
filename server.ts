import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with generous payload limit for photos
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      app: 'SIMPEL SARPRAS SMA Negeri 1 Tejakula',
      timestamp: new Date().toISOString(),
    });
  });

  // Proxy endpoint to communicate with Google Apps Script Web App without browser CORS issues
  app.post('/api/google-sheets/sync', async (req, res) => {
    const { webhookUrl, action, data } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL Webhook Google Apps Script belum dikonfigurasi.',
      });
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action || 'sync',
          payload: data,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json().catch(() => ({
        status: 'success',
        rawText: 'OK',
      }));

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error forwarding to Google Apps Script:', error);
      return res.status(502).json({
        success: false,
        message: 'Gagal terhubung ke Google Apps Script: ' + (error.message || 'Network Error'),
      });
    }
  });

  // Vite development middleware vs production static file serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIMPEL SARPRAS server running on http://localhost:${PORT}`);
  });
}

startServer();
