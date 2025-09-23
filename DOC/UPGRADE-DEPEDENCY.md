# TODO LIST: Upgrade Dependencies

## Checklist Eksekusi

### Prioritas Tinggi

#### 1. Upgrade react-syntax-highlighter
- **Versi saat ini:** 5.8.0
- **Versi terbaru:** 15.6.6
- **Perbedaan:** 10 major versions tertinggal
- **Alasan penting:** Menggunakan highlight.js@9.12.0 yang deprecated dan core-js@2.6.12 yang deprecated
- **Status:** [x] Selesai
- **Langkah:**
  - [x] `npm install react-syntax-highlighter@latest`
  - [x] Periksa kompatibilitas dengan kode yang ada
  - [x] Run `npm run build` - Berhasil tanpa error

#### 2. Upgrade core-js
- **Versi saat ini:** 2.6.12
- **Versi terbaru:** 3.45.1
- **Perbedaan:** 1 major version tertinggal
- **Alasan penting:** Versi lama tidak lagi dipelihara dan bisa menyebabkan masalah performa
- **Status:** [x] Selesai
- **Langkah:**
  - [x] `npm install core-js@latest`
  - [x] Periksa apakah perlu update polyfill configuration
  - [x] Run `npm run build` - Berhasil tanpa error

### Prioritas Sedang

#### 3. Upgrade highlight.js
- **Versi saat ini:** 9.12.0
- **Versi terbaru:** 11.11.1
- **Perbedaan:** 2 major versions tertinggal
- **Alasan penting:** Versi deprecated, kemungkinan sudah tidak support fitur terbaru
- **Status:** [x] Selesai
- **Langkah:**
  - [x] `npm install highlight.js@latest`
  - [x] Periksa kompatibilitas dengan react-syntax-highlighter
  - [x] Run `npm run build` - Berhasil tanpa error

#### 4. Upgrade glob
- **Versi saat ini:** 7.2.3
- **Versi terbaru:** 11.0.3
- **Perbedaan:** 4 major versions tertinggal
- **Alasan penting:** Digunakan oleh testing framework, performa dan security issue
- **Status:** [x] Selesai
- **Langkah:**
  - [x] `npm install glob@latest`
  - [x] Periksa apakah ts-jest masih kompatibel
  - [x] Run `npm run build` - Berhasil tanpa error

### Prioritas Rendah

#### 5. Atasi inflight dependency
- **Versi saat ini:** 1.0.6
- **Status:** Deprecated tapi versi sama dengan terbaru
- **Alasan penting:** Memory leak issue
- **Status:** [x] Selesai (masih ada tapi tidak bisa diupgrade manual)
- **Langkah:**
  - [x] Cek status inflight setelah upgrade dependencies
  - [x] Inflight masih ada tapi berasal dari test-exclude → glob@7.2.3
  - [x] Run `npm run build` - Berhasil tanpa error
  - **Catatan:** Inflight masih ada karena merupakan dependency lama dari test-exclude, tidak bisa diupgrade manual tanpa update ts-jest

## Progress Tracker
- Total items: 5
- Selesai: 5
- Progress: 100%

## Hasil Akhir
✅ **Semua upgrade dependencies selesai!**
- react-syntax-highlighter: 5.8.0 → 15.6.6
- core-js: 2.6.12 → 3.45.1
- highlight.js: 9.12.0 → 11.11.1
- glob: 7.2.3 → 11.0.3
- inflight: Masih ada tapi tidak bisa diupgrade manual

**Build berhasil** - Tidak ada error setelah semua upgrade

## Catatan
- ts-jest sudah menggunakan versi terbaru (29.4.4)
- Lakukan upgrade satu per satu dan test setiap langkah
- Backup package.json dan package-lock.json sebelum memulai
- Perhatikan breaking changes pada major version upgrade