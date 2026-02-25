# qrcode-api

**Microserviço leve para geração de QR Codes via API REST — feito para rodar como sidecar do n8n em Docker/Easypanel**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#-licença)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](#-deploy-com-docker)
[![n8n Compatible](https://img.shields.io/badge/n8n-Compatible-EA4B71?logo=n8n&logoColor=white)](#-integração-com-n8n)
[![Easypanel](https://img.shields.io/badge/Easypanel-Ready-7C3AED)](#opção-a--easypanel-recomendado)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](#-changelog)

###### 💙🚀 UTIC, em todo lugar!
---

## 🎯 O que é isso?

Uma API REST minimalista que recebe **texto ou VCARD** e retorna um **QR Code como imagem PNG** (ou SVG). Criada para resolver um problema real: gerar QR Codes, principalmente, dentro de workflows n8n **sem depender de APIs externas gratuitas** que têm rate limits e instabilidade.

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
- ✅ **Autenticação por token** opcional via variável de ambiente `API_TOKEN` *(v1.1.0)*

---

## 🔐 Autenticação *(v1.1.0)*

A API suporta **autenticação por token** configurável via variável de ambiente. A autenticação é **opcional** — se não configurada, a API funciona em modo aberto (retrocompatível com v1.0.0).

### Como funciona

```
Requisição chega
  │
  ├── GET /health ──────────────▶ Sempre público (sem auth)
  │
  └── POST /qrcode ou GET /qrcode
        │
        ├── API_TOKEN não definido ──▶ Permite (modo aberto)
        │
        └── API_TOKEN definido
              │
              ├── Sem header Authorization ──────▶ 401 Token não fornecido
              ├── Token incorreto ───────────────▶ 403 Token inválido
              └── Token correto ─────────────────▶ 200 QR Code gerado
```

### Header de autenticação

```
Authorization: Bearer seu-token-aqui
```

A API também aceita o token sem o prefixo `Bearer`:
```
Authorization: seu-token-aqui
```

### Respostas de autenticação

| Cenário | Status | Resposta |
|---------|--------|----------|
| Token não enviado | `401` | `{"error": "Token não fornecido..."}` |
| Token incorreto | `403` | `{"error": "Token inválido."}` |
| Token correto | `200` | QR Code (PNG ou SVG) |
| Auth desativada (sem `API_TOKEN`) | `200` | QR Code sem verificação |

### Gerar um token seguro

No console do Easypanel ou terminal local:

```bash
openssl rand -hex 32
```

Resultado exemplo:
```
a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4asb6c7h8e5f6a1
```

### Exemplo de requisição com autenticação

```bash
curl -X POST http://qrcode-api:3000/qrcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a3f8b2c1d4e5f6a7b8c9..." \
  -d '{"vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nEND:VCARD"}' \
  --output qrcode.png
```

---

## ⚠️ Limitações

| Limitação | Detalhes |
|-----------|----------|
| **Sem persistência** | Não salva QR Codes gerados. Cada requisição gera e retorna o PNG em tempo real. Se precisar cache, implemente externamente |
| **Apenas QR Code** | Não gera outros tipos de código de barras (EAN, Code128, etc.). Focado exclusivamente em QR Code |
| **Sem leitura de QR** | Apenas **gera** QR Codes. Não decodifica/lê imagens de QR existentes |
| **Limite de dados** | QR Codes têm limite natural de ~4.296 caracteres alfanuméricos. VCARDs muito longos podem exceder esse limite |
| **Sem fila de processamento** | Requisições são processadas de forma síncrona. Para cenários de altíssimo volume, considere adicionar uma fila |

---

## 📡 Endpoints

### `POST /qrcode`

Gera um QR Code a partir de texto ou VCARD.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>   ← somente se API_TOKEN estiver definido
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

> ⚠️ Se a autenticação estiver ativa, o GET também exige o header `Authorization`.

---

### `GET /health`

Retorna status da API. **Sempre público** (sem autenticação).

```json
{
  "status": "ok",
  "service": "qrcode-api",
  "version": "1.1.0",
  "auth": "enabled",
  "timestamp": "2026-02-24T18:30:00.000Z"
}
```

O campo `auth` indica `"enabled"` ou `"disabled"` conforme a configuração de `API_TOKEN`.

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

# 3. Inicie o servidor (modo aberto, sem autenticação)
npm start

# 4. Ou com autenticação ativada
API_TOKEN=meu-token-secreto npm start

# 5. Teste
curl http://localhost:3000/health
```

### Rodar com Docker

```bash
# Build
docker build -t qrcode-api .

# Run sem autenticação (modo aberto)
docker run -d -p 3000:3000 --name qrcode-api qrcode-api

# Run com autenticação
docker run -d -p 3000:3000 -e API_TOKEN=meu-token-secreto --name qrcode-api qrcode-api

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
7. Build: / **Dockerfile**
8. Port: **3000**
9. *(Opcional)* Na aba **Environment**, adicione a variável `API_TOKEN` com um token seguro
10. Clique em **Deploy**

A URL interna será: `http://qrcode-api:3000`

> ⚠️ **Importante**: O serviço deve estar no **mesmo projeto** do n8n para que a comunicação via rede interna funcione.

### Opção B — Docker Compose

```yaml
services:
  qrcode-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_TOKEN=seu-token-seguro-aqui   # remova esta linha para modo aberto
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

Em todas, configure a variável de ambiente `API_TOKEN` se quiser ativar autenticação.

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

#### Modo aberto (sem autenticação)

| Campo | Valor |
|-------|-------|
| **Method** | `POST` |
| **URL** | `http://qrcode-api:3000/qrcode` |
| **Body Content Type** | `JSON` |
| **JSON Body** | `{ "vcard": "{{ $json.vcard }}" }` |
| **Options → Response Format** | `File` ← **essencial!** |

#### Com autenticação (API_TOKEN ativo)

Mesma configuração acima, **mais**:

| Campo | Valor |
|-------|-------|
| **Authentication** | `Generic Credential Type` |
| **Generic Auth Type** | `Header Auth` |
| **Credential** | `qrcode-api-token` (criar conforme abaixo) |

**Criando a credencial Header Auth no n8n:**

1. Vá em **Settings → Credentials → + Add Credential**
2. Busque por: **Header Auth**
3. Preencha:
   - **Name**: `qrcode-api-token`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer seu-token-aqui`
4. Clique em **Save**
5. No node HTTP Request, selecione esta credencial

> 📌 O Response Format **deve ser "File"**, senão o n8n trata o PNG como texto e corrompe os dados.

### Importar via cURL no n8n

No node HTTP Request, clique em **⋮ → Import cURL** e cole:

```bash
curl -X POST http://qrcode-api:3000/qrcode -H "Content-Type: application/json" -d '{"vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nTEL:5599999999\nEND:VCARD"}'
```

Depois configure manualmente: **Options → Response → Response Format: File** e a autenticação (se ativa).

---

## 🧪 Testando

### Via cURL

```bash
# Gerar QR Code de um VCARD (modo aberto)
curl -X POST http://localhost:3000/qrcode \
  -H "Content-Type: application/json" \
  -d '{"vcard": "BEGIN:VCARD\nVERSION:4.0\nFN:JOAO SILVA\nTEL:5599999999\nEND:VCARD"}' \
  --output qrcode.png

# Gerar QR Code com autenticação
curl -X POST http://localhost:3000/qrcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-token-aqui" \
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

# Health check (sempre público)
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
# Verificar se a API está acessível e com auth ativa
wget -qO- http://qrcode-api:3000/health
```

Se retornar `{"status":"ok","auth":"enabled",...}` → a comunicação interna está funcionando e a auth está ativa.

---

## 🏗️ Estrutura do Projeto

```
qrcode-api/
├── server.js        # Aplicação Express com endpoints e autenticação
├── package.json     # Dependências (express + qrcode)
├── Dockerfile       # Imagem Docker otimizada (node:20-alpine)
├── LICENSE          # Licença MIT
├── .gitignore       # Arquivos ignorados pelo Git
└── README.md        # Esta documentação
```

### Dependências

| Pacote | Versão | Descrição |
|--------|--------|-----------|
| [express](https://www.npmjs.com/package/express) | ^4.21.0 | Framework HTTP minimalista |
| [qrcode](https://www.npmjs.com/package/qrcode) | ^1.5.4 | Gerador de QR Code (100% JS puro, sem deps nativas) |

> O módulo `crypto` usado na autenticação é built-in do Node.js — não é uma dependência externa.

---

## 🔧 Variáveis de Ambiente

| Variável | Default | Obrigatório | Descrição |
|----------|---------|-------------|-----------|
| `PORT` | `3000` | Não | Porta do servidor HTTP |
| `API_TOKEN` | *(vazio)* | Não | Token de autenticação. Se definido, ativa auth em todos os endpoints (exceto `/health`). Se não definido, API funciona em modo aberto |

---

## 🐛 Troubleshooting

### Erros comuns no n8n

| Erro | Causa | Solução |
|------|-------|---------|
| `ECONNREFUSED ::1:3000` | URL usa `localhost` (aponta para o próprio container n8n) | Troque para `http://qrcode-api:3000` (nome do serviço) |
| `getaddrinfo ENOTFOUND qrcode-api` | n8n não encontra o serviço na rede | Verifique se ambos estão no **mesmo projeto** do Easypanel |
| `401 - Token não fornecido` | Auth está ativa mas o n8n não está enviando o token | Configure a credencial Header Auth no node HTTP Request |
| `403 - Token inválido` | Token enviado pelo n8n não confere com o `API_TOKEN` do serviço | Verifique se o token na credencial do n8n é idêntico ao da variável de ambiente no Easypanel |
| `400 Bad Request` | Body malformado ou vazio | Verifique `Content-Type: application/json` e formato do body |
| QR Code gerado mas conteúdo vazio | VCARD enviado via URL query param (GET) com caracteres especiais | Use **POST** com body JSON |
| PNG corrompido no envio | Response Format não está como "File" no HTTP Request | Configure **Options → Response → Response Format: File** |

---

## 📋 Changelog

### v1.1.0 — Autenticação por Token
- Autenticação via header `Authorization: Bearer <token>`
- Configurável via variável de ambiente `API_TOKEN`
- Se `API_TOKEN` não for definido, funciona em modo aberto (retrocompatível com v1.0.0)
- Health check (`/health`) sempre público, agora exibe campos `auth` e `version`
- Comparação de token segura contra timing attacks (`crypto.timingSafeEqual`)

### v1.0.0 — Release Inicial
- Geração de QR Code via POST (JSON ou texto puro) e GET
- Saída em PNG e SVG
- Parâmetros customizáveis (largura, margem, cores)
- Health check integrado
- Dockerfile otimizado (node:20-alpine)

---

## 📝 Licença

MIT License — use livremente em projetos pessoais e comerciais.

---

## 📊 Resumo

| | |
|---|---|
| **Versão** | 1.1.0 |
| **Linguagem** | Node.js (JavaScript) |
| **Framework** | Express |
| **Imagem Docker** | ~50MB (alpine) |
| **RAM em execução** | ~30MB |
| **Dependências** | 2 (express + qrcode) |
| **Endpoints** | 3 (POST /qrcode, GET /qrcode, GET /health) |
| **Formatos de saída** | PNG, SVG |
| **Autenticação** | Token via header (opcional, v1.1.0) |
| **Compatível com** | n8n, Easypanel, Docker, qualquer HTTP client |

---

**Pronto para gerar QR Codes sem depender de APIs externas? Faça o deploy agora!** 🚀
