# 21 - Domain Binding: dev-hub.agentryx.dev (HTTPS)

## 1. Objective
Bind the entire Pixel Factory infrastructure to a professional domain with SSL encryption.

## 2. Actions Completed

### 2.1 DNS Configuration
* **Domain:** `dev-hub.agentryx.dev`
* **A Record:** `34.93.169.217` (this server's public IP)
* **Provider:** Namecheap Advanced DNS

### 2.2 Nginx Reverse Proxy
* **Installed:** Nginx 1.24 on Ubuntu 24.04
* **Config Location:** `/etc/nginx/sites-enabled/dev-hub.agentryx.dev`
* **Routing Map:**

| URL Path | Backend Service | Port |
|----------|----------------|------|
| `https://dev-hub.agentryx.dev/` | Pixel Factory Dashboard (Vite) | 5173 |
| `https://dev-hub.agentryx.dev/n8n/` | n8n Workflow Automation | 5678 |
| `https://dev-hub.agentryx.dev/langfuse/` | LangFuse Agent Tracing | 3000 |
| `https://dev-hub.agentryx.dev/chromadb/` | ChromaDB Vector API | 8000 |

### 2.3 SSL Certificate (Let's Encrypt)
* **Tool:** Certbot with Nginx plugin
* **Certificate Path:** `/etc/letsencrypt/live/dev-hub.agentryx.dev/fullchain.pem`
* **Key Path:** `/etc/letsencrypt/live/dev-hub.agentryx.dev/privkey.pem`
* **Expiry:** 2026-06-27 (auto-renewal enabled via systemd timer)
* **HTTP → HTTPS Redirect:** Automatic (all port 80 traffic is 301 redirected to 443)

### 2.4 Security Features
* Rate limiting: 30 requests/second per IP
* WebSocket support: Enabled on all proxy locations
* Auto-renewal: Certbot timer runs twice daily

---
**End of Document 21**
