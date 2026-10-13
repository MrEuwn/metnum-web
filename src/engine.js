/* ---------- helper format, harus sama dengan f-string Python ---------- */
// Python membulatkan .5 ke angka genap (round-half-even); toFixed() JS menjauh dari nol.
export function num6(v) {
  const n = Number(v);
  const k = n * 1e6;
  const r = Math.round(k);
  const pecahan = Math.abs(k % 1);
  if (Math.abs(pecahan - 0.5) < 1e-9) {
    const fl = Math.floor(k);
    const m = fl % 2 === 0 ? fl : fl + 1;
    const t = m < 0 ? "-" : "";
    const a = Math.abs(m);
    return `${t}${Math.floor(a / 1e6)}.${String(a % 1e6).padStart(6, "0")}`;
  }
  return n.toFixed(6);
}
const pad7 = (n) => String(n).padStart(7);
const TAB = "\t";

/* ---------- f(x): eval ekspresi gaya Python di browser ---------- */
export function buatF(sumber) {
  const bersih = String(sumber).replace(/\bmath\./g, "");
  let fn;
  try {
    fn = new Function(
      "x",
      `"use strict";
const {sin,cos,tan,asin,acos,atan,atan2,sinh,cosh,tanh,exp,log,log10,log2,sqrt,cbrt,abs,sign,pow,floor,ceil,round,hypot}=Math;
const pi=Math.PI, e=Math.E;
return (${bersih});`
    );
  } catch (e) {
    throw new Error(`Sintaks f(x) tidak dikenali: ${e.message}. Ingat: pangkat di Python pakai ** (bukan ^).`);
  }
  const uji = fn(0.5);
  if (typeof uji !== "number") throw new Error("f(x) harus menghasilkan sebuah angka.");
  return fn;
}

const mutlak = (x) => (x >= 0 ? x : -x);
const df = (f, x, h = 1e-6) => (f(x + h) - f(x - h)) / (2 * h);

/* ---------- main program (baris 170-194) ---------- */
export function jejakMain({ metodeKey, label, expr, metode }) {
  const ev = [];
  const v = {};
  const p = (line, o = {}) => ev.push({ line, stack: ["main"], vars: { ...v }, ...o });

  p(170);
  v.toleransi = 0.00001;
  p(171);
  v.maks_iterasi = 100;
  p(172);
  p(174, { output: "=== PROGRAM PENCARI AKAR PERSAMAAN NON-LINIER ===" });
  p(175, { panggil: [`input → ${expr}`] });
  p(177, { output: "\nPilih metode numerik:" });
  p(178, { output: "1. Biseksi" });
  p(179, { output: "2. Regula Falsi" });
  p(180, { output: "3. Newton-Raphson" });
  p(181, { output: "4. Secant" });
  v.metode = metode;
  p(182, { panggil: [`input → ${metode}`] });
  p(184, { panggil: [`match ${metode} → case ${metode}: ${label}`] });
  p(185 + (metode - 1) * 2, { catatan: `cocok dengan case ${metode}` });
  p(186 + (metode - 1) * 2, { catatan: `panggil ${label}(toleransi, maks_iterasi)` });
  return ev;
}

/* ---------- Biseksi (baris 52-81) ---------- */
function hitungBiseksi(f, { a, b }, tol, maks) {
  const ev = [];
  const v = {};
  const res = { fokus: [a, b], riwayat: [] };
  const S = ["main", "biseksi"];
  const p = (line, o = {}) => ev.push({ line, stack: S, vars: { ...v }, ...o });

  p(53, { panggil: [`input → a = ${a}`] });
  p(54, { panggil: [`input → b = ${b}`] });
  v.a = a;
  v.b = b;
  const fa0 = f(a);
  const fb0 = f(b);
  p(56, { panggil: [`f(a) = ${num6(fa0)}`, `f(b) = ${num6(fb0)}`], kilat: [7] });
  if (fa0 * fb0 >= 0) {
    p(57, { output: "Metode biseksi gagal: f(a) dan f(b) harus memiliki tanda berbeda." });
    p(58);
    return { events: ev, hasil: { ...res, gagal: true, pesan: "f(a) dan f(b) sama tanda" } };
  }
  v.c = a;
  p(60);
  v.iterasi = 1;
  p(61);
  p(63, { output: "\nIterasi" + TAB + "        a" + TAB + "        b" + TAB + "        c" + TAB + "     f(c)" });
  p(64, { output: "-".repeat(67) });

  let iterasi = 1;
  let c = a;
  while (iterasi <= maks) {
    p(66);
    c = (a + b) / 2.0;
    v.c = c;
    p(67);
    const fc = f(c);
    v["f(c)"] = fc;
    p(68, {
      output: `${pad7(iterasi)}${TAB}${num6(a)}${TAB}${num6(b)}${TAB}${num6(c)}${TAB}${num6(fc)}`,
      panggil: [`f(c) = ${num6(fc)}`],
      kilat: [7],
    });
    res.riwayat.push({ a, b, c });
    res.fokus.push(a, b, c);
    p(70, { panggil: [`mutlak(f(c)) = ${num6(mutlak(fc))}`, `(b-a)/2 = ${num6((b - a) / 2)}`], kilat: [16] });
    if (mutlak(fc) < tol || (b - a) / 2.0 < tol) {
      p(71, { output: `\nAkar ditemukan pada x = ${num6(c)} setelah ${iterasi} iterasi.` });
      p(72);
      return { events: ev, hasil: { ...res, akar: c, iterasi } };
    }
    const fa = f(a);
    p(74, { panggil: [`f(c)*f(a) = ${num6(fc * fa)}`], kilat: [7] });
    if (fc * fa < 0) {
      b = c;
      v.b = c;
      p(75);
    } else {
      a = c;
      v.a = c;
      p(77);
    }
    iterasi += 1;
    v.iterasi = iterasi;
    p(79);
  }
  p(81, { output: `\nMetode tidak konvergen setelah ${maks} iterasi. Akar mendekati x = ${num6(c)}` });
  return { events: ev, hasil: { ...res, akar: c, iterasi: maks, tidakKonvergen: true } };
}

/* ---------- Regula Falsi (baris 20-49) ---------- */
function hitungRegulafalsi(f, { a, b }, tol, maks) {
  const ev = [];
  const v = {};
  const res = { fokus: [a, b], riwayat: [] };
  const S = ["main", "regulafalsi"];
  const p = (line, o = {}) => ev.push({ line, stack: S, vars: { ...v }, ...o });

  p(21, { panggil: [`input → a = ${a}`] });
  p(22, { panggil: [`input → b = ${b}`] });
  v.a = a;
  v.b = b;
  const fa0 = f(a);
  const fb0 = f(b);
  p(24, { panggil: [`f(a) = ${num6(fa0)}`, `f(b) = ${num6(fb0)}`], kilat: [7] });
  if (fa0 * fb0 >= 0) {
    p(25, { output: "Metode Regulafalsi gagal: f(a) dan f(b) harus memiliki tanda berbeda." });
    p(26);
    return { events: ev, hasil: { ...res, gagal: true, pesan: "f(a) dan f(b) sama tanda" } };
  }
  v.c = a;
  p(28);
  v.iterasi = 1;
  p(29);
  p(31, { output: "\nIterasi" + TAB + "        a" + TAB + "        b" + TAB + "        c" + TAB + "     f(c)" });
  p(32, { output: "-".repeat(67) });

  let iterasi = 1;
  let c = a;
  while (iterasi <= maks) {
    p(34);
    const fb = f(b);
    const fai = f(a);
    c = (a * fb - b * fai) / (fb - fai);
    v.c = c;
    p(35, { panggil: [`f(b) = ${num6(fb)}`, `f(a) = ${num6(fai)}`], kilat: [7] });
    const fc = f(c);
    v["f(c)"] = fc;
    p(36, {
      output: `${pad7(iterasi)}${TAB}${num6(a)}${TAB}${num6(b)}${TAB}${num6(c)}${TAB}${num6(fc)}`,
      panggil: [`f(c) = ${num6(fc)}`],
      kilat: [7],
    });
    res.riwayat.push({ a, b, c });
    res.fokus.push(a, b, c);
    p(38, { panggil: [`mutlak(f(c)) = ${num6(mutlak(fc))}`], kilat: [16] });
    if (mutlak(fc) < tol) {
      p(39, { output: `\nAkar ditemukan pada x = ${num6(c)} setelah ${iterasi} iterasi.` });
      p(40);
      return { events: ev, hasil: { ...res, akar: c, iterasi } };
    }
    const fa = f(a);
    p(42, { panggil: [`f(c)*f(a) = ${num6(fc * fa)}`], kilat: [7] });
    if (fc * fa < 0) {
      b = c;
      v.b = c;
      p(43);
    } else {
      a = c;
      v.a = c;
      p(45);
    }
    iterasi += 1;
    v.iterasi = iterasi;
    p(47);
  }
  p(49, { output: `\nMetode tidak konvergen setelah ${maks} iterasi. Akar mendekati x = ${num6(c)}` });
  return { events: ev, hasil: { ...res, akar: c, iterasi: maks, tidakKonvergen: true } };
}

/* ---------- Newton-Raphson (baris 84-119) ---------- */
function hitungNewton(f, { x0 }, tol, maks) {
  const ev = [];
  const v = {};
  const res = { fokus: [x0], riwayat: [] };
  const S = ["main", "newtonraphson"];
  const p = (line, o = {}) => ev.push({ line, stack: S, vars: { ...v }, ...o });

  p(85, { panggil: [`input → x0 = ${x0}`] });
  v.x0 = x0;
  v.iterasi = 1;
  p(87);
  p(88, { output: "\nIterasi" + TAB + "        x_n" + TAB + "     f(x_n)" + TAB + "    f'(x_n) [Aproksimasi]" });
  p(89, { output: "-".repeat(65) });

  let iterasi = 1;
  while (iterasi <= maks) {
    p(91);
    const t = df(f, x0);
    v.t = t;
    p(93, { panggil: [`df(x0) = ${num6(t)}`], kilat: [12, 7] });
    const fx = f(x0);
    v["f(x0)"] = fx;
    p(94, { panggil: [`f(x0) = ${num6(fx)}`], kilat: [7] });
    p(96, { output: `${pad7(iterasi)}${TAB}${num6(x0)}${TAB}${num6(fx)}${TAB}${num6(t)}` });
    res.riwayat.push({ x0, fx, t });
    res.fokus.push(x0);
    p(99, { panggil: [`mutlak(f(x_n)) = ${num6(mutlak(fx))}`], kilat: [16] });
    if (mutlak(fx) < tol) {
      p(100, { output: `\nAkar ditemukan pada x = ${num6(x0)} setelah ${iterasi} iterasi.` });
      p(101);
      return { events: ev, hasil: { ...res, akar: x0, iterasi } };
    }
    p(104, { panggil: [`mutlak(f'(x_n)) = ${num6(mutlak(t))}`], kilat: [16] });
    if (mutlak(t) < 1e-12) {
      p(105, { output: "Metode gagal: Turunan terlalu mendekati nol." });
      return { events: ev, hasil: { ...res, gagal: true, pesan: "turunan ≈ 0" } };
    }
    const x1 = x0 - fx / t;
    v.x1 = x1;
    p(109);
    x0 = x1;
    v.x0 = x0;
    p(112);
    iterasi += 1;
    v.iterasi = iterasi;
    p(113);
  }
  p(116, { output: `\nMetode tidak konvergen setelah ${maks} iterasi. Akar mendekati x = ${num6(x0)}` });
  return { events: ev, hasil: { ...res, akar: x0, iterasi: maks, tidakKonvergen: true } };
}

/* ---------- Secant (baris 122-166) ---------- */
function hitungSecant(f, { x0, x1 }, tol, maks) {
  const ev = [];
  const v = {};
  const res = { fokus: [x0, x1], riwayat: [] };
  const S = ["main", "secant"];
  const p = (line, o = {}) => ev.push({ line, stack: S, vars: { ...v }, ...o });

  p(123, { panggil: [`input → x0 = ${x0}`] });
  p(124, { panggil: [`input → x1 = ${x1}`] });
  v.x0 = x0;
  v.x1 = x1;
  v.iterasi = 1;
  p(126);
  p(128, { output: "\nIterasi" + TAB + "       x0" + TAB + "       x1" + TAB + "       x2" + TAB + "     f(x2)" });
  p(129, { output: "-".repeat(75) });

  let iterasi = 1;
  let x2 = x0;
  while (iterasi <= maks) {
    p(131);
    const fx0 = f(x0);
    v["f(x0)"] = fx0;
    p(132, { panggil: [`f(x0) = ${num6(fx0)}`], kilat: [7] });
    const fx1 = f(x1);
    v["f(x1)"] = fx1;
    p(133, { panggil: [`f(x1) = ${num6(fx1)}`], kilat: [7] });
    p(136, { panggil: [`f(x1)-f(x0) = ${num6(fx1 - fx0)}`] });
    if (fx1 - fx0 === 0) {
      p(137, { output: "Metode Secant gagal: f(x1) - f(x0) = 0." });
      p(138);
      return { events: ev, hasil: { ...res, gagal: true, pesan: "pembagian nol" } };
    }
    x2 = x1 - (fx1 * (x1 - x0)) / (fx1 - fx0);
    v.x2 = x2;
    p(141);
    const fx2 = f(x2);
    v["f(x2)"] = fx2;
    p(142, { panggil: [`f(x2) = ${num6(fx2)}`], kilat: [7] });
    p(144, { output: `${pad7(iterasi)}${TAB}${num6(x0)}${TAB}${num6(x1)}${TAB}${num6(x2)}${TAB}${num6(fx2)}` });
    res.riwayat.push({ x0, x1, x2, fx2 });
    res.fokus.push(x0, x1, x2);
    p(150, { panggil: [`mutlak(f(x2)) = ${num6(mutlak(fx2))}`, `mutlak(x2-x1) = ${num6(mutlak(x2 - x1))}`], kilat: [16] });
    if (mutlak(fx2) < tol || mutlak(x2 - x1) < tol) {
      p(151, { output: `\nAkar ditemukan pada x = ${num6(x2)} setelah ${iterasi} iterasi.` });
      p(155);
      return { events: ev, hasil: { ...res, akar: x2, iterasi } };
    }
    x0 = x1;
    v.x0 = x0;
    p(158);
    x1 = x2;
    v.x1 = x1;
    p(159);
    iterasi += 1;
    v.iterasi = iterasi;
    p(161);
  }
  p(163, { output: `\nBatas iterasi tercapai. Perkiraan akar terakhir x = ${num6(x2)}` });
  return { events: ev, hasil: { ...res, akar: x2, iterasi: maks, tidakKonvergen: true } };
}

export const METODE = {
  biseksi: {
    label: "Biseksi",
    nomor: 1,
    barisDef: 52,
    masukan: ["a", "b"],
    default: { a: 4, b: 5 },
    rumus: "c = (a + b) / 2",
    tipe: "Tertutup (Bracketing)",
    orde: "Linier (Orde 1)",
    syarat: "f(a) · f(b) < 0 (Bolzano)",
    deskripsi: "Membagi dua selang berulang kali; mengeliminasi setengah interval di setiap iterasi secara deterministik.",
    kelebihan: "Pasti konvergen jika akar terkurung dalam [a, b]. Stabil dan tidak rentan singularitas.",
    kekurangan: "Laju konvergensi relatif lambat dibandingkan metode terbuka.",
    hitung: hitungBiseksi,
  },
  regulafalsi: {
    label: "Regula Falsi",
    nomor: 2,
    barisDef: 20,
    masukan: ["a", "b"],
    default: { a: 4, b: 5 },
    rumus: "c = (a·f(b) − b·f(a)) / (f(b) − f(a))",
    tipe: "Tertutup (Bracketing)",
    orde: "Superlinier / Linier",
    syarat: "f(a) · f(b) < 0 (Bolzano)",
    deskripsi: "Menghubungkan f(a) dan f(b) dengan garis lurus (interpolasi linier); titik potong sumbu x menjadi tebakan berikutnya.",
    kelebihan: "Umumnya lebih cepat daripada biseksi pada kurva mulus karena memperhitungkan besar nilai f(x).",
    kekurangan: "Dapat mengalami stagnasi satu titik batas (one-sided stagnation) pada kurva dengan kelengkungan tinggi.",
    hitung: hitungRegulafalsi,
  },
  newtonraphson: {
    label: "Newton-Raphson",
    nomor: 3,
    barisDef: 84,
    masukan: ["x0"],
    default: { x0: 5 },
    rumus: "x₁ = x₀ − f(x₀) / f′(x₀)",
    tipe: "Terbuka (Open Method)",
    orde: "Kuadratik (Orde 2)",
    syarat: "f′(x₀) ≠ 0 dan tebakan awal cukup dekat",
    deskripsi: "Memproyeksikan garis singgung (tangen) f(x) ke sumbu x untuk menemukan akar secara sangat cepat.",
    kelebihan: "Konvergensi sangat cepat (kuadratik, jumlah digit presisi berlipat ganda setiap iterasi).",
    kekurangan: "Dapat divergen jika titik belok atau turunan mendekati nol (|f'| ≈ 0). Memerlukan turunan f'(x).",
    hitung: hitungNewton,
  },
  secant: {
    label: "Secant",
    nomor: 4,
    barisDef: 122,
    masukan: ["x0", "x1"],
    default: { x0: 5, x1: 4 },
    rumus: "x₂ = x₁ − f(x₁)·(x₁ − x₀) / (f(x₁) − f(x₀))",
    tipe: "Terbuka (Open Method)",
    orde: "Superlinier (Orde ≈ 1.618)",
    syarat: "f(x₁) ≠ f(x₀) (pembagian bukan nol)",
    deskripsi: "Mirip Newton-Raphson tetapi turunan f'(x) diganti oleh kemiringan tali busur dari dua titik tebakan berturutan.",
    kelebihan: "Tidak memerlukan turunan simbolik maupun aproksimasi diferensial. Tetap sangat cepat.",
    kekurangan: "Bisa divergen jika kedua nilai fungsi sama f(x₁) = f(x₀) atau tebakan awal terlalu jauh.",
    hitung: hitungSecant,
  },
};