import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static(__dirname));

// Dynamic QR Code generation endpoint
app.get('/api/qr', async (req, res) => {
  try {
    const text = String(req.query.text || 'https://github.com/AzRaF-18/aurix-get-yours-now');
    const darkColor = String(req.query.dark || '#e61937');
    const lightColor = String(req.query.light || '#0d0d12');
    const width = Math.min(Math.max(parseInt(req.query.width, 10) || 320, 160), 800);

    const qrDataUrl = await QRCode.toDataURL(text, {
      width,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor
      }
    });

    res.json({ success: true, dataUrl: qrDataUrl, text });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`AURIX-X running at http://${HOST}:${PORT}`);
});
