# Product Requirement Document (PRD): Metnum Visualizer

**Nama Proyek:** Metnum Visualizer (Pencari Akar Persamaan Non-Linier)  
**Tautan Repo:** [github.com/MrEuwn/metnum-web](https://github.com/MrEuwn/metnum-web)  
**Tautan Live:** [metnum-web.vercel.app](https://metnum-web.vercel.app)  
**Status Saat Ini:** Production (v1.1) — React 18, Vite 6, Vercel  
**Tujuan Dokumen:** Digunakan sebagai dasar evaluasi, audit UX/UI, dan perbaikan arsitektur lanjutan oleh AI/Reviewer.

---

## 1. Executive Summary & Problem Statement

### 1.1 Latar Belakang Masalah
Pada mata kuliah Metode Numerik dan Struktur Data, mahasiswa sering kali hanya melihat kode algoritma pencari akar secara statis atau hanya melihat output tabel di konsol terminal Python. Hal ini menyulitkan pemahaman mengenai:
1. Hubungan langsung antara baris kode Python yang sedang dieksekusi dengan mutasi nilai variabel internalnya (`a`, `b`, `c`, `x0`, `x1`, `f(c)`).
2. Representasi geometris dari masing-masing metode (misal: bagaimana garis tali busur Regula Falsi atau garis singgung Newton-Raphson memotong sumbu x).
3. Mengapa satu metode lebih cepat konvergen daripada metode lain (analisis orde konvergensi dan kelemahan titik stagnan).

### 1.2 Solusi
Sebuah aplikasi visualizer berbasis web interaktif yang mereplikasi eksekusi kode Python `metode_numerik.py` baris demi baris, lengkap dengan visualisasi grafik kurva $f(x)$, inspeksi variabel lokal secara live, pencerminan konsol STDOUT Python yang identik 100%, serta fitur bedah kode modular berbasis akordeon untuk presentasi akademik.

---

## 2. Pengguna Sasaran & Skenario Penggunaan

* **Target Pengguna:** Mahasiswa Teknik Informatika / Ilmu Komputer, Dosen Pengampu, Audiens Presentasi Tugas Kelompok.
* **Skenario Utama (Presentasi Kelas):**
  * Presenter memilih algoritma dan memasukkan fungsi non-linier.
  * Presenter menekan *Play/Maju* untuk menunjukkan langkah eksekusi baris per baris.
  * Mahasiswa/Dosen dapat melihat tab *Bedah Struktur Kode* untuk menyorot blok logika tertentu secara instan di editor kiri.
  * Membandingkan hasil grafik dan kecepatan langkah konvergensi antar 4 metode.

---

## 3. Tech Stack & Arsitektur Sistem

* **Frontend Framework:** React 18 (Functional Components, Hooks)
* **Build Tool:** Vite 6
* **Syntax Highlighter:** `prism-react-renderer` (Theme: VS Dark dengan kustomisasi status eksekusi)
* **Grafik Visualizer:** HTML5 Canvas API (Custom 2D cartesian coordinate projection system, tanpa dependensi library chart berat seperti Chart.js/D3)
* **Math Parser:** JavaScript Dynamic Function Sandboxing (mendukung sintaks Python seperti `**` untuk pangkat, fungsi trigonometri `sin/cos/tan`, eksponensial `exp`, dan logaritma `log`)
* **Styling:** Custom CSS modular dengan desain dark mode akademik (Palet Navy `#070b14`, Card Surface `#0d1424`, Cyan `#38bdf8`, Green `#34d399`)
* **Deployment:** Vercel Hosting via Git Integration (`main` branch)

---

## 4. Fitur Utama & Spesifikasi Fungsional

### 4.1 Modul Interpreter & Sinkronisasi Eksekusi (Engine)
1. **Paritas 100% dengan Python:**
   - Evaluasi $f(x)$ dinamis.
   - Aproksimasi turunan numerik terpusat $f'(x) \approx \frac{f(x+h) - f(x-h)}{2h}$ dengan $h = 10^{-6}$.
   - Format angka presisi 6 desimal menggunakan logika pembulatan *round-half-even* (banker's rounding) khas Python, bukan standar IEEE `toFixed()` bawaan JavaScript.
2. **Timeline Playback Controller:**
   - Kontrol Play / Pause, Step Maju, Step Mundur, Lompat ke Awal, Lompat ke Akhir.
   - Pengatur tempo kecepatan: Lambat (1000ms), Sedang (550ms), Cepat (250ms), Kilat (90ms).
   - Pintasan papan ketik: `Space` (Play/Pause), `Arrow Right` (Maju), `Arrow Left` (Mundur), `R` (Reset).

### 4.2 Dukungan 4 Metode Numerik
1. **Metode Biseksi:**
   - Metode tertutup. Kriteria Bolzano $f(a) \cdot f(b) < 0$. Pembagian selang $c = (a+b)/2$.
2. **Metode Regula Falsi:**
   - Metode tertutup. Interpolasi linier $c = \frac{a \cdot f(b) - b \cdot f(a)}{f(b) - f(a)}$.
3. **Metode Newton-Raphson:**
   - Metode terbuka. Proyeksi gradien $x_1 = x_0 - \frac{f(x_0)}{f'(x_0)}$. Proteksi turunan singular $|t| < 10^{-12}$.
4. **Metode Secant:**
   - Metode terbuka. Tali busur $x_2 = x_1 - \frac{f(x_1)(x_1 - x_0)}{f(x_1) - f(x_0)}$. Proteksi pembagian nol.

### 4.3 Multi-Deck Panel Kanan (Context & Inspection)
1. **Tab 1: Status & Terminal:**
   - Menampilkan Call Stack aktif (misal: `main › biseksi`).
   - Variabel lokal realtime (`a`, `b`, `c`, `iterasi`, `f(c)`).
   - Evaluasi sub-fungsi yang dipanggil pada baris tersebut (misal: $f(c) = 1.250000$).
   - Terminal emulator mereplikasi output `print()` Python persis sesuai format aslinya.
2. **Tab 2: Bedah Struktur Kode:**
   - Daftar modul akordeon (8 modul pembahasan).
   - Mengklik modul akan otomatis memfokuskan dan menyorot baris terkait di panel editor kiri.
3. **Tab 3: Teori & Karakteristik:**
   - Ringkasan ilmiah: Orde konvergensi, syarat keberlakuan, rumus iterasi utama, kelebihan, dan batasan komputasi.

### 4.4 Visualisasi Kartesius & Jejak Iterasi
1. Pemetaan kurva $f(x)$ adaptif terhadap rentang nilai $[lo, hi]$ yang dieksplorasi metode.
2. Penandaan sumbu $y = 0$.
3. Sebaran titik iterasi dengan gradasi opasitas lintasan konvergensi.
4. Garis vertikal putus-putus dan label pada akar yang ditemukan ($x^*$).
5. Strip metrik akhir (Estimasi akar, nilai residu $|f(x^*)|$, total langkah, status konvergensi).
6. Tabel data komputasi per iterasi yang dapat di-scroll.

---

## 5. Pedoman Desain UI/UX (Design Principles)

* **Restrained & Professional:** Tidak menggunakan styling berlebihan atau gradien warna-warni acak. Maksimal 2 warna aksen utama (Electric Cyan untuk fokus, Emerald Green untuk konvergensi/sukses).
* **High Signal-to-Noise Ratio:** Informasi disajikan padat dan jelas (Dense UI layout khas IDE profesional).
* **Keyboard-First Experience:** Memudahkan presenter beralih langkah hanya menggunakan keyboard laptop saat presentasi.
* **Zero AI-Slop Aesthetics:** Menghindari kartu-kartu kosong tanpa fungsi atau animasi lambat yang membuang waktu.

---

## 6. Bahan Diskusi & Pertanyaan Saran untuk Claude

Saat menyerahkan dokumen ini ke Claude, mintalah saran spesifik pada area-area berikut:
1. **Peningkatan UX Interaktif:** Apakah ada elemen visual interaktif tambahan pada grafik kartesius (misalnya: animasi garis singgung tangen untuk Newton-Raphson atau garis tali busur untuk Regula Falsi di Canvas) yang bisa memperjelas konsep?
2. **Arsitektur State & Reaktivitas:** Bagaimana cara mengoptimalkan state timeline playback agar lebih modular jika di masa depan ditambahkan metode lain (seperti Metode Iterasi Titik Tetap)?
3. **Mode Presentasi (Slide/Focus Mode):** Fitur apa yang bisa ditambahkan untuk transisi mulus saat presentasi di proyektor kelas (misal: toggle fullscreen focus, zoom diagram, pointer highlight)?
4. **Validasi Matematika Ekstrem:** Penanganan kasus divergen, asimtot vertikal, atau fungsi periodik berosilasi tinggi pada rendering canvas.
