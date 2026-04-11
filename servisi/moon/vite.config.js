import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const POI_PATH = path.resolve('./public/data/poiData.json');

export default defineConfig({
  plugins: [
    {
      name: 'save-poi-api',
      configureServer(server) {
        server.middlewares.use('/api/save-poi', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end('Method Not Allowed');
          }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              // Validate it's valid JSON before writing
              JSON.parse(body);
              fs.writeFileSync(POI_PATH, body, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 400;
              res.end(JSON.stringify({ ok: false, error: e.message }));
            }
          });
        });
      }
    }
  ]
});
