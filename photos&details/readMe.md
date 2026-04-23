# 🌲 ForestGuard DAO — Quick Overview

**ForestGuard DAO**, orman ve tarım arazilerini sensör verileriyle **otonom yöneten** ve işleri **kripto ile ödüllendiren** Web3 tabanlı bir platformdur.

---

## 🚀 Nasıl Çalışır?

1. **Arazi Kaydı**
   - Arazi sahibi konum, isim ve alan bilgisi girerek sistemde arazi oluşturur.
   - Araziye bütçe (MON token) yatırır.

2. **Veri Toplama (Off-chain)**
   - Open-Meteo gibi ücretsiz API’lerden:
     - 🌡️ Sıcaklık
     - 💧 Nem
     - 🌬️ Rüzgar
     - ☀️ UV
     - 🌫️ Hava kalitesi
   - Veriler sürekli çekilir ve analiz edilir.

3. **Akıllı Analiz → İş Oluşturma**
   - Kurallara göre otomatik görev üretilir:
     - Nem düşük → **Sulama görevi**
     - Rüzgar yüksek → **Yangın riski kontrolü**
     - UV yüksek → **Koruma/izleme**
   - Görevler blockchain’e yazılır.

4. **Görev Sistemi**
   - Kullanıcılar görevleri görür ve başvurur.
   - İlk gelen alır (FCFS).
   - Görevi tamamlayan kullanıcı kanıt (foto) gönderir.

5. **Onay & Ödeme**
   - Görev onaylanınca:
     - 💰 %95 → Çalışan
     - 🏢 %5 → Platform
   - Tüm ödemeler **akıllı kontratlarla otomatik** yapılır.

6. **İtibar Sistemi**
   - Tamamlanan görev → puan
   - Rank sistemi:
     - Bronze → Diamond
   - Yüksek rank = daha erken ve iyi işler

---

## 🧠 Sistem Bileşenleri

### On-chain (Monad Testnet)
- `ForestRegistry` → Arazi & bütçe yönetimi
- `TaskManager` → Görev oluşturma & atama
- `ReputationSystem` → Puan & rank
- `PaymentSplitter` → Ödeme & komisyon

### Off-chain
- Sensör API’leri (Open-Meteo)
- Veri analizi (Next.js API routes)

### Frontend
- Dashboard (rol bazlı)
- Sensör paneli
- Görev listesi
- Profil & kazanç takibi

---

## ⚙️ Temel Özellikler

- 🌍 Gerçek zamanlı çevresel veri kullanımı  
- 🤖 Otomatik görev üretimi  
- 💸 Trustless ödeme sistemi  
- 📊 Şeffaf ve değiştirilemez kayıtlar  
- 🏆 Gamified itibar sistemi  

---

## 🎯 Amaç

- Çevresel sürdürülebilirliği artırmak  
- Arazi yönetimini otomatikleştirmek  
- Katılımcılara ekonomik teşvik sağlamak  

---

## 🧩 Kısaca

**Veri → Analiz → Görev → Çalışma → Ödeme → İtibar**

ForestGuard DAO, fiziksel dünyadaki işleri **blockchain ile koordine eden** bir sistemdir.