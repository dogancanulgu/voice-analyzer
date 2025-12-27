# Voice Analyzer Backend

Bu klasör, Voice Analyzer projesinin sunucu tarafı kodlarını içerir. FastAPI kullanılarak geliştirilmiştir ve ses analizi, duygu tespiti ve veritabanı işlemlerini yönetir.

## Özellikler

- **Ses Yükleme & İşleme:** Yüksek performanslı dosya yükleme ve işleme.
- **Duygu Analizi:** Ses verilerinden duygu durumu çıkarımı (Mock/Simüle edilmiş).
- **Speaker Diarization:** Konuşmacı ayrıştırma ve transkript oluşturma.
- **SQLite Veritabanı:** Analiz geçmişini saklama.
- **RESTful API:** Frontend ile haberleşme için optimize edilmiş uç noktalar.

## Gereksinimler

- Python 3.8 veya üzeri
- `pip` paket yöneticisi

## Kurulum

1. **Backend klasörüne gidin:**
   ```bash
   cd backend
   ```

2. **Sanal ortam (Virtual Environment) oluşturun:**
   ```bash
   python -m venv venv
   ```

3. **Sanal ortamı aktif hale getirin:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Bağımlılıkları yükleyin:**
   ```bash
   pip install -r requirements.txt
   ```

## Çalıştırma

Uygulamayı geliştirme modunda başlatmak için aşağıdaki komutu kullanın:

```bash
uvicorn main:app --reload
```

Sunucu varsayılan olarak `http://127.0.0.1:8080` adresinde çalışacaktır.

## API Dokümantasyonu

FastAPI, otomatik olarak etkileşimli API dokümantasyonu oluşturur. Sunucu çalışırken aşağıdaki adreslerden erişebilirsiniz:

- **Swagger UI:** [http://127.0.0.1:8080/docs](http://127.0.0.1:8080/docs)
- **ReDoc:** [http://127.0.0.1:8080/redoc](http://127.0.0.1:8080/redoc)

## API Uç Noktaları (Endpoints)

- `GET /`: API'nin çalışıp çalışmadığını kontrol eder.
- `POST /upload`: Ses dosyası yükler ve analiz başlatır.
- `GET /recordings`: Kayıtlı tüm analizleri listeler.
- `GET /recordings/{recording_id}`: Belirli bir kaydın detaylarını getirir.

## Veritabanı

Proje, verileri saklamak için SQLite veritabanı (`voice_analyzer.db`) kullanır. Uygulama ilk kez çalıştırıldığında veritabanı ve tablolar otomatik olarak oluşturulur.

## Testler

Testleri çalıştırmak için:

```bash
pytest
```
