# qrcode-api

**Microserviço leve para geração de QR Codes via API REST — feito para rodar como sidecar do n8n em Docker/Easypanel**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#-licença)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#-deploy-com-docker)
[![n8n Compatible](https://img.shields.io/badge/n8n-Compatible-EA4B71?logo=n8n&logoColor=white)](#-integração-com-n8n)
[![Easypanel](https://img.shields.io/badge/Easypanel-Ready-7C3AED)](#opção-a--easypanel-recomendado)
💙🚀 UTIC, em todo lugar!
---

## 🎯 O que é isso?

Uma API REST minimalista que recebe **texto ou VCARD** e retorna um **QR Code como imagem PNG** (ou SVG). Criada para resolver um problema real: gerar QR Codes dentro de workflows n8n **sem depender de APIs externas gratuitas** que têm rate limits e instabilidade.

### Por que esse projeto existe

| Problema | Solução |
|----------|---------|
| APIs gratuitas de QR Code têm rate limits severos e caem em disparos em massa | API própria sem limite — a capacidade depende apenas do seu servidor |
| O Task Runner do n8n v2.x isola o Code node e impede instalar pacotes npm diretamente | Serviço externo isolado — zero risco para o n8n |
| Gerar QR Code com VCARD via URL query param corrompe os dados (quebras de linha, caracteres especiais) | Recebe VCARD no body JSON via POST — sem corrupção |

---

## ✨ Funcionalidades

- ✅ Gera QR Code a partir de **qualquer texto** (VCARD, URL, e-mail, etc.)
- ✅ Saída em **PNG** (padrão) ou **SVG**
- ✅ Customizável: largura, margem, cores, nível de correção de erro
- ✅ Aceita body como **JSON** ou **texto puro**
- ✅ Endpoint GET para **testes rápidos** no navegador
- ✅ Health check integrado (`/health`)
- ✅ Imagem Docker leve (~30MB RAM em execução)
- ✅ Zero dependências externas em runtime — 100% JavaScript puro
- ✅ Pronto para deploy em **Easypanel**, **Docker Compose**, **Railway**, **Render**, etc.

---

## ⚠️ Limitações

| Limitação | Detalhes |
|-----------|----------|
| **Sem autenticação nativa** | A API não tem auth embutida. Projetada para rodar em **rede interna Docker** (não exposta publicamente). Se precisar expor, adicione um reverse proxy com auth ou implemente um header token |
| **Sem persistência** | Não salva QR Codes gerados. Cada requisição gera e retorna o PNG em tempo real. Se precisar cache, implemente externamente |
| **Apenas QR Code** | Não gera outros tipos de código de barras (EAN, Code128, etc.). Focado exclusivamente em QR Code |
| **Sem leitura de QR** | Apenas **gera** QR Codes. Não decodifica/lê imagens de QR existentes |
| **Limite de dados** | QR Codes têm limite natural de ~4.296 caracteres alfanuméricos. VCARDs muito longos podem exceder esse limite |
| **Sem fila de processamento** | Requisições são processadas de forma síncrona. Para cenários de altíssimo volume (>1.000 req/s), considere adicionar uma fila |

---

## 📡 Endpoints

### `POST /qrcode`

Gera um QR Code a partir de texto ou VCARD.

**Headers:**
```
Content-Type: application/json
```

**Body** (qualquer um dos formatos):
```json
{ "vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nTEL:5599999999\nEND:VCARD" }
```
```json
{ "data": "https://meusite.com.br" }
```
Ou texto puro com `Content-Type: text/plain`.

**Query params opcionais:**

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| `width` | `400` | Largura em pixels |
| `margin` | `2` | Margem ao redor do QR Code |
| `dark` | `000000` | Cor dos módulos (hex, sem #) |
| `light` | `FFFFFF` | Cor de fundo (hex, sem #) |
| `format` | `png` | Formato de saída: `png` ou `svg` |

**Resposta:** Imagem PNG binária (`Content-Type: image/png`)

**Exemplo com parâmetros:**
```bash
curl -X POST "http://localhost:3000/qrcode?width=600&dark=1a1a2e&light=eaeaea" \
  -H "Content-Type: application/json" \
  -d '{"data": "https://meusite.com.br"}' \
  --output qrcode.png
```

---

### `GET /qrcode?data=...`

Versão GET para testes rápidos no navegador.

```
http://localhost:3000/qrcode?data=Hello+World
```

---

### `GET /health`

Retorna status da API.

```json
{
  "status": "ok",
  "service": "qrcode-api",
  "timestamp": "2026-02-24T18:30:00.000Z"
}
```

---

## 🚀 Início Rápido

### Pré-requisitos

- **Node.js 18+** (para rodar localmente) ou **Docker** (para container)

### Rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/qrcode-api.git
cd qrcode-api

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start

# 4. Teste
curl http://localhost:3000/health
```

### Rodar com Docker

```bash
# Build
docker build -t qrcode-api .

# Run
docker run -d -p 3000:3000 --name qrcode-api qrcode-api

# Teste
curl http://localhost:3000/health
```

---

## 📦 Deploy

### Opção A — Easypanel (recomendado)

Ideal para quem já roda **n8n no Easypanel**. Ambos ficam na mesma rede Docker interna.

1. Crie um repositório no GitHub com os 3 arquivos (`server.js`, `package.json`, `Dockerfile`)
2. No Easypanel, entre no **mesmo projeto** onde o n8n está
3. Clique em **+ Service → App**
4. Nome do serviço: `qrcode-api`
5. Source: **GitHub** → selecione o próprietário/repositório
6. Branch: Main
6. Build: / **Dockerfile**
7. Port: **3000**
8. Clique em **Deploy**

A URL interna será: `http://qrcode-api:3000`

> ⚠️ **Importante**: O serviço deve estar no **mesmo projeto** do n8n para que a comunicação via rede interna funcione.

### Opção B — Docker Compose

```yaml
services:
  qrcode-api:
    build: .
    ports:
      - "3000:3000"
    restart: always
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### Opção C — Qualquer PaaS

O projeto funciona em qualquer plataforma que suporte Node.js ou Docker:

| Plataforma | Método |
|------------|--------|
| **Railway** | Deploy via GitHub (detecta Dockerfile automaticamente) |
| **Render** | Web Service → Docker |
| **Fly.io** | `fly launch` (detecta Dockerfile) |
| **Coolify** | Similar ao Easypanel |

---

## 🔗 Integração com n8n

Este é o **principal caso de uso** desse projeto. Substitui APIs externas de QR Code em workflows n8n.

### Fluxo típico no n8n

```
Code node (gera VCARD)
  → HTTP Request POST http://qrcode-api:3000/qrcode  ← esta API
      Body: { "vcard": "{{ $json.vcard }}" }
      Response Format: File
  → Extract from File (binaryToProperty)
  → HTTP Request (envia via WhatsApp API)
```

### Configuração do node HTTP Request

| Campo | Valor |
|-------|-------|
| **Method** | `POST` |
| **URL** | `http://qrcode-api:3000/qrcode` |
| **Body Content Type** | `JSON` |
| **JSON Body** | `{ "vcard": "{{ $json.vcard }}" }` |
| **Options → Response Format** | `File` ← **essencial!** |

> 📌 O Response Format **deve ser "File"**, senão o n8n trata o PNG como texto e corrompe os dados.

### Importar via cURL no n8n

No node HTTP Request, clique em **⋮ → Import cURL** e cole:

```bash
curl -X POST http://qrcode-api:3000/qrcode -H "Content-Type: application/json" -d '{"vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nTEL:5599999999\nEND:VCARD"}'
```

Depois configure manualmente: **Options → Response → Response Format: File**

---

## 🧪 Testando

### Via cURL

```bash
# Gerar QR Code de um VCARD
curl -X POST http://localhost:3000/qrcode \
  -H "Content-Type: application/json" \
  -d '{"vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nTEL:5599999999\nEND:VCARD"}' \
  --output qrcode.png

# Gerar QR Code de uma URL
curl -X POST http://localhost:3000/qrcode \
  -H "Content-Type: application/json" \
  -d '{"data": "https://meusite.com.br"}' \
  --output qrcode_url.png

# Gerar QR Code SVG
curl -X POST "http://localhost:3000/qrcode?format=svg" \
  -H "Content-Type: application/json" \
  -d '{"data": "teste"}' \
  --output qrcode.svg

# Health check
curl http://localhost:3000/health
```

### Via navegador

```
http://localhost:3000/qrcode?data=Hello+World
http://localhost:3000/health
```

### Via n8n (console do Easypanel)

Acesse o console do n8n no Easypanel e execute:

```bash
wget -qO- http://qrcode-api:3000/health
```

Se retornar `{"status":"ok",...}` → a comunicação interna está funcionando.

---

## 🏗️ Estrutura do Projeto

```
qrcode-api/
├── server.js        # Aplicação Express com endpoints
├── package.json     # Dependências (express + qrcode)
├── Dockerfile       # Imagem Docker otimizada (node:20-alpine)
└── README.md        # Esta documentação
```

### Dependências

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| [express](https://www.npmjs.com/package/express) | ^4.21.0 | Framework HTTP minimalista |
| [qrcode](https://www.npmjs.com/package/qrcode) | ^1.5.4 | Gerador de QR Code (100% JS puro, sem deps nativas) |

---

## 🔧 Variáveis de Ambiente

| Variável | Default | Descrição |
|----------|---------|-----------|
| `PORT` | `3000` | Porta do servidor HTTP |

---

## 🐛 Troubleshooting

### Erros comuns no n8n

| Erro | Causa | Solução |
|------|-------|---------|
| `ECONNREFUSED ::1:3000` | URL usa `localhost` (aponta para o próprio container n8n) | Troque para `http://qrcode-api:3000` (nome do serviço) |
| `getaddrinfo ENOTFOUND qrcode-api` | n8n não encontra o serviço na rede | Verifique se ambos estão no **mesmo projeto** do Easypanel |
| `400 Bad Request` | Body malformado ou vazio | Verifique `Content-Type: application/json` e formato do body |
| QR Code gerado mas conteúdo vazio | VCARD enviado via URL query param (GET) com caracteres especiais | Use **POST** com body JSON |
| PNG corrompido no envio | Response Format não está como "File" no HTTP Request | Configure **Options → Response → Response Format: File** |

## 📝 Licença

MIT License — use livremente em projetos pessoais e comerciais.

---

## 📊 Resumo

| | |
|---|---|
| **Linguagem** | Node.js (JavaScript) |
| **Framework** | Express |
| **Imagem Docker** | ~50MB (alpine) |
| **RAM em execução** | ~30MB |
| **Dependências** | 2 (express + qrcode) |
| **Endpoints** | 3 (POST /qrcode, GET /qrcode, GET /health) |
| **Formatos de saída** | PNG, SVG |
| **Autenticação** | Nenhuma (rede interna) |
| **Compatível com** | n8n, Easypanel, Docker, qualquer HTTP client |

---

**Pronto para gerar QR Codes sem depender de APIs externas? Faça o deploy agora!** 🚀
