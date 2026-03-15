
---

# 📁 FILE: DEPLOYMENT.md

```markdown
# 🚀 AUTOLIVE - PANDUAN DEPLOYMENT (PUBLISHING)

## 📋 DAFTAR ISI
1. [Pilihan Hosting](#pilihan-hosting)
2. [Deploy ke VPS (DigitalOcean/AWS)](#deploy-ke-vps)
3. [Deploy ke Heroku](#deploy-ke-heroku)
4. [Deploy ke Railway](#deploy-ke-railway)
5. [Konfigurasi Domain](#konfigurasi-domain)
6. [SSL/HTTPS](#sslhttps)
7. [Monitoring](#monitoring)
8. [Scaling](#scaling)
9. [Maintenance](#maintenance)

---

## 1. 🏠 PILIHAN HOSTING

### Perbandingan Layanan Hosting

| Penyedia | Harga/bulan | RAM | CPU | Storage | Cocok untuk |
|----------|-------------|-----|-----|---------|-------------|
| **DigitalOcean** | $6 - $40 | 1-8 GB | 1-4 Core | 25-160 GB | Production skala kecil-menengah |
| **AWS EC2** | $8 - $50 | 1-8 GB | 1-4 Core | 30-200 GB | Enterprise |
| **Google Cloud** | $10 - $60 | 1-8 GB | 1-4 Core | 30-200 GB | Enterprise |
| **Heroku** | $7 - $50 | 512 MB - 2.5 GB | Variabel | 512 MB - 10 GB | Mudah, cepat deploy |
| **Railway** | $5 - $20 | 1-4 GB | 1-2 Core | 10-100 GB | Termudah untuk pemula |
| **Vercel** | $20 - $50 | - | - | - | Khusus frontend saja |

### Rekomendasi:
- **Pemula**: Railway atau Heroku
- **Menengah**: DigitalOcean
- **Professional**: AWS atau Google Cloud

---

## 2. 🖥️ DEPLOY KE VPS (DIGITALOCEAN)

### Step 1: Setup VPS di DigitalOcean

```bash
# 1. Buka https://digitalocean.com
# 2. Register dan login
# 3. Klik "Create Droplet"
# 4. Pilih:
#    - Ubuntu 22.04 LTS
#    - Plan: Basic
#    - CPU: Regular with SSD
#    - Price: $6/month atau $12/month
#    - Datacenter: Pilih yang terdekat (Singapore)
#    - Authentication: SSH key atau Password
# 5. Klik "Create Droplet"
# 6. Tunggu 1-2 menit
# 7. Catat IP address (contoh: 159.89.123.456)
