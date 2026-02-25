const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// AUTENTICAÇÃO
// ============================================================
// Se API_TOKEN estiver definido, toda requisição (exceto /health)
// precisa enviar o token no header "Authorization: Bearer <token>"
// Se API_TOKEN NÃO estiver definido, a API funciona sem auth (modo aberto)
// ============================================================
const API_TOKEN = process.env.API_TOKEN || null;

function authMiddleware(req, res, next) {
  // Se não tem token configurado, permite tudo (modo aberto)
  if (!API_TOKEN) return next();

  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Token não fornecido. Envie o header: Authorization: Bearer <token>' 
    });
  }

  // Aceita formato "Bearer <token>" ou apenas "<token>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  // Comparação segura contra timing attacks
  const tokenBuffer = Buffer.from(token);
  const apiTokenBuffer = Buffer.from(API_TOKEN);

  if (tokenBuffer.length !== apiTokenBuffer.length || 
      !crypto.timingSafeEqual(tokenBuffer, apiTokenBuffer)) {
    return res.status(403).json({ error: 'Token inválido.' });
  }

  next();
}

// Parse JSON and text bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ limit: '1mb', type: 'text/*' }));

// Health check (sempre público, sem auth)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'qrcode-api', 
    version: '1.1.0',
    auth: API_TOKEN ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString() 
  });
});

// Aplica autenticação em TODOS os endpoints abaixo
app.use(authMiddleware);

/**
 * POST /qrcode
 * 
 * Aceita VCARD (ou qualquer texto) e retorna um QR Code PNG.
 * 
 * Headers (se auth habilitada):
 *   Authorization: Bearer <token>
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
  console.log(`QR Code API v1.1.0 rodando na porta ${PORT}`);
  console.log(`Autenticação: ${API_TOKEN ? 'ATIVADA' : 'DESATIVADA (modo aberto)'}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Gerar:  POST http://localhost:${PORT}/qrcode`);
});
