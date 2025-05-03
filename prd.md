# Proje Tanım Dokümanı (PRD) - İnteraktif 3D Web Deneyimi

## 1. Amaç

Bruno Simon'un açık kaynak kodlu interaktif 3D web deneyimi temel alınarak, kullanıcıların özelleştirilebilir araçlarla etkileşim kurabileceği, uzamsal ses deneyimi yaşayabileceği ve yeni içeriklerin (bina, yol, nesne vb.) eklenebileceği geliştirilebilir bir platform oluşturulacaktır.

## 2. Temel Özellikler ve Görevler

### 2.1 Uzamsal Ses Entegrasyonu
**Amaç:** Kullanıcının etrafındaki ses kaynaklarını yön, uzaklık ve derinlik hissiyle algılayabilmesi.
**Görevler:**
- [ ] Web Audio API veya Resonance Audio entegrasyonunu araştır ve uygula.
- [ ] Ses kaynaklarını (örneğin: ortam sesleri, araç motoru) sahne üzerindeki 3D konumlara yerleştir.
- [ ] Araç hareket ettikçe motor sesinin konumunu ve şiddetini dinamik olarak güncelle.
- [ ] Kullanılacak ses dosyalarını belirle (.ogg/.mp3), optimize et ve projeye ekle.

### 2.2 Araç Değiştirme Sistemi
**Amaç:** Kullanıcının farklı araçlar arasında geçiş yapabilmesi (örneğin: araba, bisiklet, forklift vb.).
**Görevler:**
- [x] Araç varlıklarını (prefab) yönetecek bir `VehicleManager` sınıfı oluştur.
- [ ] Her araç için ayrı fiziksel özellikler (hız, ivme vb.) ve 3D modeller tanımla.
- [x] UI üzerinde araç seçimi için bir dropdown menü veya buton grubu oluştur.
- [x] Klavye kısayolu (örneğin: V tuşu) ile araç değiştirme fonksiyonelliği ekle.
- [x] Araç değiştirildiğinde mevcut aracın sahneden düzgünce kaldırılmasını ve yenisinin yüklenmesini (instantiate) sağla.

### 2.3 Harita Kullanılabilirliği (Navigasyon)
**Amaç:** Kullanıcının harita üzerinde kolayca yön bulması ve etkileşimli öğeleri tanıyabilmesi.
**Görevler:**
- [ ] Mini-map veya tam ekran harita için bir canvas UI bileşeni oluştur.
- [ ] Harita üzerinde önemli noktaları (binalar, görevler vb.) ikonlarla göster.
- [ ] Kullanıcının mevcut konumunu harita üzerinde gösteren bir işaretleyici ("You are here") ekle.
- [ ] Klavye kontrollerini ve harita kullanımını açıklayan bir UI yardım penceresi tasarla ve uygula.

### 2.4 Bina İçi Giriş Sistemi
**Amaç:** Kullanıcıların belirli binaların içine girip keşif yapabilmesi.
**Görevler:**
- [ ] İçine girilebilecek binaların iç mekanlarını detaylı olarak modelle.
- [ ] Bina giriş noktalarına (kapılar) etkileşim (interact) tetikleyicileri ekle (örneğin: Raycaster kullanarak kapı tespiti).
- [ ] Etkileşim kurulduğunda kamera pozisyonunu ve kontrolünü otomatik olarak bina içine geçir.
- [ ] Bina içi için farklı kamera davranışları (örn: daha yavaş hareket) ve özel ışıklandırma ayarları yap.

### 2.5 Yeni Yapı Ekleme Sistemi
**Amaç:** Platformun ölçeklenebilirliğini sağlamak ve yeni içerik eklemeyi kolaylaştırmak.
**Görevler:**
- [ ] `.blend` veya `.blend1` formatındaki 3D modellerin (yapılar, nesneler) dinamik olarak yüklenebilmesini sağla.
- [ ] Yeni eklenen yapıların metadata'larını (isim, konum, açıklama, etkileşim tipi vb.) tanımlamak için bir JSON yapısı veya benzeri bir konfigürasyon sistemi oluştur.
- [ ] (Opsiyonel) Yapıların dünya içinde konumlandırılması ve yerleştirilmesi için basit bir editör arayüzü veya admin paneli geliştir.

### 2.6 Kamera Açısı Yönetimi
**Amaç:** Kullanıcının oyun deneyimini farklı bakış açılarından yaşayabilmesi.
**Görevler:**
- [x] 3. şahıs takip (Third-person follow) kamera modunu uygula.
- [x] Serbest dolaşım (Free camera / Spectator) modunu uygula.
- [x] FPS (First-person) kamera modunu (araç içinden veya yaya olarak) uygula.
- [x] Kullanıcının belirlenen bir tuş (örneğin: C tuşu) ile bu kamera modları arasında geçiş yapmasını sağla.
- [x] Her kamera modu için dönüş hızları, sınırlar ve yumuşatma gibi ayarlanabilir parametreler ekle.

## 3. Teknik Altyapı
- **Rendering:** Three.js (Mevcut proje altyapısı)
- **Model Formatları:** `.blend` / `.blend1`
- **Ses:** Web Audio API / Resonance Audio
- **UI:** HTML/CSS + WebGL UI katmanı veya overlay sistemi

---

## #yapılacaklar

*Bu bölüme projenin ilerleyişine göre tamamlanması gereken görevler eklenecektir.*

- [ ] Araç değiştirme sistemine yeni araç tipleri ekle (bisiklet, forklift vb.)
- [ ] Uzamsal ses entegrasyonunu tamamla
- [ ] Harita sistemi geliştir
- [ ] Bina içi giriş sistemini geliştir

## #yapılanlar

*Bu bölüme tamamlanan görevler veya ulaşılan kilometre taşları eklenecektir.*

- [x] Araç değiştirme için VehicleManager sınıfı oluşturuldu
- [x] Araç seçimi için UI (dropdown menü) eklendi
- [x] Klavye kısayoluyla araç değiştirme eklendi (V tuşu)
- [x] Kamera modları eklendi (3. şahıs, 1. şahıs, serbest)
- [x] Kamera modu seçimi için UI eklendi
- [x] 1. şahıs kamera modu RC araç kamerası olarak geliştirildi (kaput üzeri, viraj eğimleri, hıza bağlı görüş açısı efektleri)
- [x] RC kamera moduna motor titreşim simülasyonu eklendi
- [x] RC kamera konumu tam kaput üzerine yerleştirildi
