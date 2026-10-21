// Uji regresi input fungsi sendiri. Jalankan: node src/cek/uji-input.mjs
import assert from "node:assert/strict";
import { METODE, buatF, num6 } from "../engine.js";

const melempar = (fn, pola, ket) => assert.throws(fn, pola, ket);

// 1. ^ bukan pangkat
melempar(() => buatF("x^2 - 2"), /\*\*/, "x^2 harus ditolak dengan petunjuk **");
// 2. minus unary sebelum pangkat: pesan harus memberi solusi
melempar(() => buatF("-x**2 + 4"), /-\(x\*\*2\)/);
assert.equal(buatF("-(x**2) + 4")(3), -5);
// 3. nama tak dikenal & sintaks salah -> pesan Indonesia, bukan crash
melempar(() => buatF("foo(x)"), /tidak bisa dievaluasi/);
melempar(() => buatF("2x - 4"), /Sintaks f\(x\)/);
// 4. NaN/Infinity tidak boleh lolos diam-diam
const akar = buatF("x**0.5 - 2");
melempar(() => akar(-1), /tidak terdefinisi/);
melempar(() => METODE.biseksi.hitung(akar, { a: -1, b: 9 }, 1e-5, 100), /tidak terdefinisi/);
// 5. batas iterasi habis harus ditandai tidakKonvergen (dipakai badge UI)
const r = METODE.newtonraphson.hitung(buatF("x**2 + 1"), { x0: 1 }, 1e-5, 100);
assert.equal(r.hasil.tidakKonvergen, true);
// 6. pembulatan = f"{x:.6f}" Python (round-half-even pada tie eksak)
for (const [v, py] of [[1.4140625, "1.414062"], [0.0078125, "0.007812"], [0.0000005, "0.000000"],
  [-0.0000005, "-0.000000"], [2.5e-6, "0.000003"], [1.5e-6, "0.000002"], [-23593708.6134035, "-23593708.613403"], [4.236068, "4.236068"]])
  assert.equal(num6(v), py, `num6(${v})`);

console.log("semua uji input lulus");
