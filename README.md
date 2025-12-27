# Voice Analyzer Projesi

Bu proje, ses dosyalarını analiz eden, duygu durumu ve konuşmacı ayrıştırma (diarization) gibi işlemler yapan kapsamlı bir ses analiz uygulamasıdır. Modern bir React frontend ve güçlü bir FastAPI backend'den oluşur.

## Proje Yapısı

Proje iki ana bölümden oluşmaktadır:

- **Frontend:** React, Vite ve Tailwind alternatifi özel CSS ile geliştirilmiş kullanıcı arayüzü.
- **Backend:** FastAPI ve SQLite kullanan, ses işleme ve analiz API'si.

## Hızlı Başlangıç (Local Kurulum)

Projeyi yerel makinenizde çalıştırmak için hem Frontend hem de Backend servislerini ayağa kaldırmanız gerekmektedir.

### Gereksinimler

- **Node.js**: Frontend için gereklidir (v16+ tavsiye edilir).
- **Python**: Backend için gereklidir (v3.8+ tavsiye edilir).

### 1. Backend Kurulumu ve Çalıştırma

Backend servisi API isteklerini karşılar ve ses işleme görevlerini yürütür.

```bash
cd backend
python -m venv venv
# Windows için: venv\Scripts\activate
# Mac/Linux için: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Detaylı bilgi için [Backend README](backend/README.md) dosyasına bakabilirsiniz.

### 2. Frontend Kurulumu ve Çalıştırma

Frontend arayüzü tarayıcı üzerinden uygulamayı kullanmanızı sağlar.

```bash
cd frontend
npm install
npm run dev
```

Detaylı bilgi için [Frontend README](frontend/README.md) dosyasına bakabilirsiniz.

## Kullanım

Her iki servis de çalıştıktan sonra tarayıcınızdan `http://localhost:5173` (veya terminalde belirtilen port) adresine giderek uygulamayı kullanmaya başlayabilirsiniz.
