# Voice Analyzer Frontend

Bu klasör, Voice Analyzer projesinin kullanıcı arayüzü kodlarını içerir. React ve Vite ile geliştirilmiş olup, modern ve şık bir deneyim sunar.

## Özellikler

- **Modern & Şık Tasarım:** Özel CSS ile hazırlanmış premium arayüz.
- **Kolay Dosya Yükleme:** Sürükle-bırak desteği ile hızlı analiz başlatma.
- **Görselleştirme:** Analiz sonuçlarını grafikler ve listelerle detaylı sunum.
- **İnteraktif Deneyim:** Framer Motion ile zenginleştirilmiş animasyonlar.

## Teknolojiler

- **React:** Kullanıcı arayüzü kütüphanesi.
- **Vite:** Hızlı geliştirme ve build aracı.
- **Framer Motion:** Animasyon kütüphanesi.
- **Lucide React:** İkon seti.
- **Axios:** API istekleri için HTTP istemcisi.
- **React Router:** Sayfa yönlendirmeleri.
- **CSS:** Özel CSS ile özelleştirilmiş tasarım (Tailwind bağımlılığı olmadan).

## Gereksinimler

- Node.js (v16 veya üzeri önerilir)
- npm veya yarn paket yöneticisi

## Kurulum

1. **Frontend klasörüne gidin:**
   ```bash
   cd frontend
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

## Çalıştırma

Geliştirme sunucusunu başlatmak için:

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

## Build (Derleme)

Prodüksiyon için optimize edilmiş build almak isterseniz:

```bash
npm run build
```

Oluşturulan dosyalar `dist` klasöründe yer alacaktır.

## Proje Yapısı

- `src/components`: Yeniden kullanılabilir UI bileşenleri.
- `src/pages`: Uygulama sayfaları.
- `src/assets`: Görseller ve statik dosyalar.
- `src/App.jsx`: Ana uygulama bileşeni ve routing yapılandırması.
- `src/index.css`: Global stil tanımları.
