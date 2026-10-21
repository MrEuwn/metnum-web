// Fuzz num6 JS vs Python f"{x:.6f}". Jalankan: node src/cek/fuzz-num6.mjs
// Keluaran Python ditulis ke file (spawnSync punya batas buffer 1 MB).
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { num6 } from "../engine.js";

const N = 160000;
const vals = [];
let s = 12345n;
const rnd = () => ((s = (s * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn) >> 11n);
for (let i = 0; i < N; i++) {
  const r = Number(rnd() % 1000000000n) / 1e9;
  const mag = Math.pow(10, Math.floor(r * 20) - 10);
  vals.push((r - 0.5) * 2 * mag);
}
vals.push(1.4140625, 0.0078125, 0.0000005, -0.0000005, 2.5e-6, 1.5e-6, -23593708.6134035, 0.0000015, 1234567.5e-6, 1e21, 1e-21, 0, -0);

const inF = "fuzz-in.json", outF = "fuzz-out.txt";
const py = `
import json
vals = json.load(open("${inF}"))
open("${outF}", "w", encoding="utf8").write("\\n".join(f"{x:.6f}" for x in vals))
`;
writeFileSync(inF, JSON.stringify(vals));
execFileSync("python", ["-c", py], { stdio: "inherit" });
const pyv = readFileSync(outF, "utf8").split(/\r?\n/);
let bad = 0;
for (let i = 0; i < vals.length; i++) {
  const j = num6(vals[i]);
  if (j !== pyv[i]) {
    if (bad < 10) console.log(`BEDA ${vals[i]}  js=${j}  py=${pyv[i]}`);
    bad++;
  }
}
unlinkSync(inF);
unlinkSync(outF);
console.log(`${vals.length - bad}/${vals.length} sama dengan Python`);
process.exit(bad ? 1 : 0);

/* Catatan: |n| >= 1e21 -> toFixed() JS memakai notasi eksponen (1e+21),
   Python menulis 1000000000000000000000.000000. Di luar rentang tabel iterasi,
   sengaja dibiarkan agar kode tetap ringkas. */
