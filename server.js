const express = require('express');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON and text bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ limit: '1mb', type: 'text/*' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'qrcode-api', timestamp: new Date().toISOString() });
});

/**
 * POST /qrcode
 * 
 * Aceita VCARD (ou qualquer texto) e retorna um QR Code PNG.
 * 
 * Body pode ser:
 *   - JSON:  { "data": "BEGIN:VCARD\n..." }
 *   - JSON:  { "vcard": "BEGIN:VCARD\n..." }
 *   - Texto puro: "BEGIN:VCARD\n..."
 * 
 * Query params opcionais:
 *   - width (default: 400)
 *   - margin (default: 2)
 *   - dark (default: 000000)
 *   - light (default: FFFFFF)
 *   - format (default: png, opções: png, svg)
 */
app.post('/qrcode', async (req, res) => {
  try {
    // Extrair o conteúdo do body
    let content;
    if (typeof req.body === 'string') {
      content = req.body;
    } else if (req.body && (req.body.data || req.body.vcard)) {
      content = req.body.data || req.body.vcard;
    } else {
      return res.status(400).json({ 
        error: 'Envie o conteúdo no body como JSON {"data": "..."} ou {"vcard": "..."} ou texto puro.' 
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo vazio.' });
    }

    // Parâmetros opcionais
    const width = parseInt(req.query.width) || 400;
    const margin = parseInt(req.query.margin) || 2;
    const dark = `#${(req.query.dark || '000000').replace('#', '')}`;
    const light = `#${(req.query.light || 'FFFFFF').replace('#', '')}`;
    const format = req.query.format || 'png';

    if (format === 'svg') {
      // Retornar SVG
      const svg = await QRCode.toString(content, {
        type: 'svg',
        width,
        margin,
        color: { dark, light }
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    // Retornar PNG (padrão)
    const pngBuffer = await QRCode.toBuffer(content, {
      type: 'png',
      width,
      margin,
      errorCorrectionLevel: 'M',
      color: { dark, light }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="qrcode.png"');
    res.setHeader('Content-Length', pngBuffer.length);
    res.send(pngBuffer);

  } catch (err) {
    console.error('Erro ao gerar QR Code:', err.message);
    res.status(500).json({ error: 'Falha ao gerar QR Code.', details: err.message });
  }
});

/**
 * GET /qrcode?data=...
 * 
 * Versão GET para testes rápidos no navegador.
 */
app.get('/qrcode', async (req, res) => {
  try {
    const content = req.query.data;
    if (!content) {
      return res.status(400).json({ 
        error: 'Passe o conteúdo via query param: /qrcode?data=seu_texto' 
      });
    }

    const width = parseInt(req.query.width) || 400;
    const margin = parseInt(req.query.margin) || 2;

    const pngBuffer = await QRCode.toBuffer(content, {
      type: 'png',
      width,
      margin,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(pngBuffer);

  } catch (err) {
    res.status(500).json({ error: 'Falha ao gerar QR Code.', details: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QR Code API rodando na porta ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Gerar:  POST http://localhost:${PORT}/qrcode`);
});
