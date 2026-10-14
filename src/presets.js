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