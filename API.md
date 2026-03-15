# 📡 API DOCUMENTATION - AUTOLIVE PLATFORM

## 📋 DAFTAR ISI
1. [Pendahuluan](#pendahuluan)
2. [Cara Menggunakan API](#cara-menggunakan-api)
3. [Autentikasi (Login/Register)](#autentikasi)
4. [Manajemen Channel YouTube/TikTok](#manajemen-channel)
5. [Pencarian Konten Viral](#pencarian-viral)
6. [Download Video](#download-video)
7. [Edit Video](#edit-video)
8. [Upload Video](#upload-video)
9. [Workflow Automasi](#workflow-automasi)
10. [Analytics & Statistik](#analytics)
11. [Laporan (Reports)](#laporan)
12. [AI Services](#ai-services)
13. [Webhook (Notifikasi)](#webhook)
14. [Error Handling](#error-handling)
15. [FAQ](#faq)

---

## 1. 📖 PENDAHULUAN

### Apa itu API?
API adalah **jalur komunikasi** antara aplikasi kamu dengan server Autolive. 
Dengan API, kamu bisa menyuruh server Autolive melakukan berbagai tugas seperti:
- Mencari video viral
- Mendownload video
- Mengupload ke YouTube/TikTok
- Dan lain-lain

### Base URL (Alamat Server)
```javascript
// GANTI URL INI SESUAI KEBUTUHAN:
const BASE_URL = {
  development: 'http://localhost:3000/api',    // 🔧 Untuk coding di komputer sendiri
  staging: 'https://staging-api.autolive.com/api', // 🧪 Untuk testing
  production: 'https://api.autolive.com/api'      // 🚀 Untuk beneran dipakai
};

// Pilih salah satu:
const API_URL = BASE_URL.development; // Ganti sesuai kebutuhan
