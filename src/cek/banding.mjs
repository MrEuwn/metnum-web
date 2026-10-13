// Bandingkan keluaran engine JS dengan output asli Python.
// Jalankan: node src/cek/banding.mjs
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { METODE, buatF, jejakMain } from "../engine.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PY = path.join(AKAR, "src", "metode_numerik.py");

// prompt input() tidak dicetak oleh engine JS — buang supaya sebanding
const PROMPT = [
  "Masukkan fungsi f(x) (contoh: x**2 - 4*x - 1): ",
  "Masukkan pilihan (1/2/3/4): ",
  "Masukkan batas bawah (a): ",
  "Masukkan batas atas (b): ",
  "Masukkan tebakan awal (x0): ",
  "Masukkan tebakan kedua (x1): ",
];
function python(expr, nomor, args) {
  const masukan = [expr, String(nomor), ...args.map(String)].join("\n") + "\n";
  let teks = execFileSync("python", [PY], { input: masukan, encoding: "utf8" });
  for (const p of PROMPT) teks = teks.split(p).join("");
  return teks
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);
}

function barisPython(out) {
  const i = out.findIndex((l) => l.startsWith("Metode ") && l.includes("gagal"));
  return i >= 0 ? out.slice(0, i + 1) : out;
}

function js(expr, kunci, args) {
  const m = METODE[kunci];
  const p = {};
  m.masukan.forEach((k, i) => (p[k] = Number(args[i])));
  const fn = buatF(expr);
  const hasil = m.hitung(fn, p, 0.00001, 100);
  const events = [...jejakMain({ label: m.label, expr, metode: m.nomor }), ...hasil.events];
  const teks = events
    .filter((e) => e.output)
    .flatMap((e) => e.output.split("\n"))
    .map((l) => l.trim())
    .filter((l) => l.length);
  return teks;
}

const kasus = [
  ["x**2 - 4*x - 1", "biseksi", [4, 5]],
  ["x**2 - 4*x - 1", "regulafalsi", [4, 5]],
  ["x**2 - 4*x - 1", "newtonraphson", [5]],
  ["x**2 - 4*x - 1", "secant", [5, 4]],
  ["x**3 - x - 2", "biseksi", [1, 2]],
  ["x**3 - x - 2", "regulafalsi", [1, 2]],
  ["x**3 - x - 2", "newtonraphson", [2]],
  ["x**3 - x - 2", "secant", [2, 1.5]],
  ["x**3 + x**2 - 3*x - 3", "biseksi", [1, 2]],
  ["x**3 + x**2 - 3*x - 3", "regulafalsi", [1, 2]],
  ["x**2 - 4*x - 1", "biseksi", [1, 2]], // gagal: tanda sama
];

let gagal = 0;
for (const [expr, kunci, args] of kasus) {
  const a = barisPython(python(expr, METODE[kunci].nomor, args));
  const b = js(expr, kunci, args);
  const sama = a.length === b.length && a.every((l, i) => l === b[i]);
  if (!sama) {
    gagal++;
    console.log(`\nBEDA  ${kunci} ${expr} ${JSON.stringify(args)}`);
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) console.log(`  [${i}] py=${JSON.stringify(a[i])}\n      js=${JSON.stringify(b[i])}`);
    }
  } else {
    console.log(`OK    ${kunci.padEnd(13)} ${expr.padEnd(14)} ${JSON.stringify(args)}  (${a.length} baris)`);
  }
}
console.log(`\n${kasus.length - gagal}/${kasus.length} kasus identik dengan Python`);
process.exit(gagal ? 1 : 0);