// Basis data bedah struktur kode & teori matematis metode numerik
export const BEDAH_KODE = [
  {
    id: "eval_fx",
    judul: "1. Evaluasi Dinamis & Sandboxing f(x)",
    baris: [1, 7],
    tag: "Fungsi Dasar",
    ringkasan: "Eksekusi ekspresi matematika masukan pengguna secara dinamis dan aman.",
    detail:
      "Variabel global 'persamaan' menyimpan string rumus fungsi. Fungsi f(x) mengevaluasi rumus ini pada runtime menggunakan built-in 'eval()'. Untuk mencegah injeksi kode berbahaya (arbitrary code execution), kamus lingkungan global dibatasi secara ketat dengan '__builtins__': {}, sehingga hanya variabel 'x' yang dapat diakses selama evaluasi matematika berlangsung.",
  },
  {
    id: "df_turunan",
    judul: "2. Aproksimasi Turunan Numerik df(x)",
    baris: [10, 13],
    tag: "Kalkulus Numerik",
    ringkasan: "Metode selisih terpusat (central difference) berorde O(h²).",
    detail:
      "Menghitung turunan pertama f'(x) tanpa memerlukan turunan analitik simbolik. Menggunakan rumus selisih terpusat: f'(x) ≈ [f(x + h) - f(x - h)] / (2h) dengan perturbation step h = 10⁻⁶. Pendekatan ini memiliki galat pemotongan (truncation error) sebesar O(h²), yang jauh lebih akurat dan stabil dibandingkan selisih maju (forward difference) yang berorde O(h).",
  },
  {
    id: "mutlak_manual",
    judul: "3. Fungsi Nilai Mutlak Manual",
    baris: [15, 18],
    tag: "Utilitas",
    ringkasan: "Pengganti fungsi bawaan abs() untuk evaluasi galat toleransi.",
    detail:
      "Fungsi mandiri 'mutlak(x)' mengembalikan nilai non-negatif dari x menggunakan percabangan ternary 'x if x >= 0 else -x'. Fungsi ini digunakan pada seluruh kriteria penghentian iterasi (stopping criteria) untuk membandingkan residu |f(x)| dan selisih langkah |x_baru - x_lama| terhadap nilai ambang toleransi.",
  },
  {
    id: "metode_regulafalsi",
    judul: "4. Metode Regula Falsi (Posisi Palsu)",
    baris: [20, 50],
    tag: "Bracketing Method",
    ringkasan: "Pencarian akar dengan interpolasi linier tali busur pada selang bertanda beda.",
    detail:
      "Metode tertutup yang memanfaatkan kemiringan tali busur antara titik (a, f(a)) dan (b, f(b)). Rumus pembaruan: c = [a·f(b) - b·f(a)] / [f(b) - f(a)]. Sebelum iterasi, divalidasi syarat Bolzano f(a)·f(b) < 0. Jika terpenuhi, selang dipersempit berdasarkan tanda f(c)·f(a): jika negatif maka b = c, jika positif maka a = c. Konvergensi lebih cepat daripada biseksi pada fungsi non-linier halus, namun rentan stagnan pada salah satu batas selang jika kurva sangat cembung/cekung.",
  },
  {
    id: "metode_biseksi",
    judul: "5. Metode Biseksi (Bagi Dua)",
    baris: [52, 82],
    tag: "Bracketing Method",
    ringkasan: "Pembagian selang secara berulang menjadi dua bagian sama besar.",
    detail:
      "Metode tertutup paling andal berdasarkan Teorema Nilai Antara (Intermediate Value Theorem). Menghitung titik tengah c = (a + b) / 2. Galat pada tiap langkah dijamin berkurang tepat separuh: galat_n = (b - a) / 2ⁿ. Berhenti ketika |f(c)| < toleransi atau panjang setengah selang (b - a)/2 < toleransi. Keunggulan utama: selalu konvergen (guaranteed convergence) selama f(x) kontinu pada selang [a, b].",
  },
  {
    id: "metode_newton",
    judul: "6. Metode Newton-Raphson",
    baris: [84, 120],
    tag: "Open Method",
    ringkasan: "Pelacakan akar melalui perpotongan garis singgung fungsi dengan sumbu x.",
    detail:
      "Metode terbuka yang menggunakan titik tebakan awal x₀ dan gradien kurva f'(x₀). Garis singgung pada titik (x₀, f(x₀)) diproyeksikan ke sumbu x: x₁ = x₀ - f(x₀) / f'(x₀). Menawarkan kecepatan konvergensi kuadratik (orde 2) di dekat akar. Disertai mekanisme proteksi: jika turunan aproksimasi |t| < 10⁻¹², metode segera dihentikan untuk mencegah pembagian dengan nol (division by zero / singularity).",
  },
  {
    id: "metode_secant",
    judul: "7. Metode Secant (Tali Busur)",
    baris: [122, 167],
    tag: "Open Method",
    ringkasan: "Aproksimasi gradien garis singgung menggunakan dua tebakan titik awal.",
    detail:
      "Mengeliminasi kebutuhan perhitungan turunan f'(x) pada Newton-Raphson dengan mendekati kemiringan kurva melalui dua titik tebakan (x₀ dan x₁): x₂ = x₁ - f(x₁)·(x₁ - x₀) / [f(x₁) - f(x₀)]. Memiliki orde konvergensi superlinier (rasio emas ≈ 1.618). Kriteria terminasi mengevaluasi |f(x₂)| < toleransi atau perpindahan langkah |x₂ - x₁| < toleransi, dengan proteksi pembagian nol jika f(x₁) = f(x₀).",
  },
  {
    id: "main_cli",
    judul: "8. Alur Program Utama (Main Driver CLI)",
    baris: [170, 194],
    tag: "Alur Eksekusi",
    ringkasan: "Inisialisasi toleransi, batas iterasi, dan pemilihan metode melalui match-case.",
    detail:
      "Blok '__main__' menetapkan parameter konvergensi default: toleransi galat ε = 0.00001 (10⁻⁵) dan batas maksimum iterasi = 100. Pengguna diminta menginput fungsi f(x) serta memilih metode 1–4. Aliran kendali dieksekusi secara elegan memanfaatkan konstruksi kontrol 'match-case' Python 3.10+ untuk memanggil fungsi numerik yang bersesuaian.",
  },
];

// Preset fungsi populer untuk demonstrasi presentasi
export const PRESET_FUNGSI = [
  {
    nama: "Polinomial Kuadratik",
    expr: "x**2 - 4*x - 1",
    deskripsi: "Akar positif di x ≈ 4.236068 (Standar uji tugas)",
    params: {
      biseksi: { a: 4, b: 5 },
      regulafalsi: { a: 4, b: 5 },
      newtonraphson: { x0: 5 },
      secant: { x0: 5, x1: 4 },
    },
  },
  {
    nama: "Polinomial Kubik",
    expr: "x**3 - x - 2",
    deskripsi: "Akar tunggal di x ≈ 1.521380",
    params: {
      biseksi: { a: 1, b: 2 },
      regulafalsi: { a: 1, b: 2 },
      newtonraphson: { x0: 2 },
      secant: { x0: 2, x1: 1.5 },
    },
  },
  {
    nama: "Kubik Dua Suku",
    expr: "x**3 + x**2 - 3*x - 3",
    deskripsi: "Akar irasional di x = √3 ≈ 1.732051",
    params: {
      biseksi: { a: 1, b: 2 },
      regulafalsi: { a: 1, b: 2 },
      newtonraphson: { x0: 2 },
      secant: { x0: 2, x1: 1 },
    },
  },
  {
    nama: "Fungsi Transenden Sinus",
    expr: "sin(x) - x/2",
    deskripsi: "Akar bukan nol di x ≈ 1.895494",
    params: {
      biseksi: { a: 1, b: 2.5 },
      regulafalsi: { a: 1, b: 2.5 },
      newtonraphson: { x0: 2 },
      secant: { x0: 1, x1: 2.5 },
    },
  },
  {
    nama: "Fungsi Eksponensial",
    expr: "exp(-x) - x",
    deskripsi: "Nilai konstanta Dottie / omega di x ≈ 0.567143",
    params: {
      biseksi: { a: 0, b: 1 },
      regulafalsi: { a: 0, b: 1 },
      newtonraphson: { x0: 1 },
      secant: { x0: 0, x1: 1 },
    },
  },
];