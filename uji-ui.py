# Uji UI metnum-web (build lokal) dengan Playwright headless.
# Jalankan: python uji-ui.py   (server: npx vite preview --port 4173)
import json, sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
KASUS = [
    # (tab, f(x), {param}, harapan_kunci)
    ("Biseksi", "x**2 - 2", {"a": "1", "b": "2"}, "akar"),
    ("Newton-Raphson", "x**2 - 2", {"x0": "0"}, "turunan"),
    ("Secant", "x**3 - x - 2", {"x0": "1", "x1": "2"}, "akar"),
    ("Regula Falsi", "x**10 - 1", {"a": "0", "b": "1.3"}, "akar"),
    ("Biseksi", "x^2 - 2", {"a": "1", "b": "2"}, "xor"),
    ("Biseksi", "x**0.5 - 2", {"a": "-1", "b": "9"}, "domain"),
    ("Newton-Raphson", "x**2 + 1", {"x0": "1"}, "tidakkonvergen"),
    ("Biseksi", "-x**2 + 4", {"a": "0", "b": "3"}, "minus"),
    ("Biseksi", "-(x**2) + 4", {"a": "0", "b": "3"}, "akar"),
    ("Biseksi", "foo(x)", {"a": "1", "b": "2"}, "foo"),
]

def jalankan(p, tab, expr, params):
    p.click(f"button.algo-tab-btn:has-text('{tab}')")
    p.fill("#fxInput", expr)
    for k, v in params.items():
        p.fill(f"#input-{k}", v)
    p.click("button.btn-primary-action")
    p.wait_for_timeout(800)
    if p.eval_on_selector_all(".error-banner", "els => els.length > 0"):
        return  # gagal input: tak ada langkah untuk dimajukan
    p.wait_for_selector("button.btn-playback:has-text('Akhir'):not([disabled])", timeout=15000)
    p.click("button.btn-playback:has-text('Akhir')")
    p.wait_for_timeout(300)

def baca(p):
    galat = p.eval_on_selector_all(".error-banner", "els => els.map(e => e.innerText.trim()).join(' | ')")
    badge = p.inner_text(".status-text")
    akhir = p.eval_on_selector_all(
        ".metric-label", "els => els.map((e,i) => e.innerText.trim())")
    vals = p.eval_on_selector_all(".metric-val", "els => els.map(e => e.innerText.trim())")
    status_akhir = dict(zip(akhir, vals)).get("Status Akhir")
    glow = p.eval_on_selector_all(".metric-chip.metric-root-hero", "els => els.map(e => e.className.includes('converged-glow'))")
    term = p.eval_on_selector_all(".term-text", "els => els.map(e => e.innerText.trim())")
    return {"galat": galat, "badge": badge, "status_akhir": status_akhir, "glow": glow, "terminal_akhir": term[-1] if term else ""}

hasil = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    p = b.new_page(viewport={"width": 1440, "height": 900})
    p.goto(URL, wait_until="load")
    for tab, expr, params, kunci in KASUS:
        jalankan(p, tab, expr, params)
        d = baca(p)
        d.update({"tab": tab, "fx": expr, "params": params, "catatan": kunci})
        hasil.append(d)
        print(json.dumps(d, ensure_ascii=False))
    b.close()

json.dump(hasil, open("uji-ui-hasil.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
