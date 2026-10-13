# Fungsi persamaan f(x) dinamis menggunakan eval
persamaan = ""


def f(x):
    # Menggunakan matematika bawaan Python (contoh: x**2 - 4*x - 1)
    return eval(persamaan, {"__builtins__": {}}, {"x": x})


# f(x) di turunin ke f'(x)
def df(x, h=1e-6):
    return (f(x + h) - f(x - h)) / (2 * h)  # rumus turunan


# Fungsi untuk menghitung nilai mutlak (abs) secara manual
def mutlak(x):
    return x if x >= 0 else -x


def regulafalsi(toleransi, maks_iterasi):
    a = float(input("Masukkan batas bawah (a): "))
    b = float(input("Masukkan batas atas (b): "))

    if f(a) * f(b) >= 0:
        print("Metode Regulafalsi gagal: f(a) dan f(b) harus memiliki tanda berbeda.")
        return

    c = a
    iterasi = 1

    print("\nIterasi\t        a\t        b\t        c\t     f(c)")
    print("-" * 67)

    while iterasi <= maks_iterasi:
        c = (a * f(b) - b * f(a)) / (f(b) - f(a))
        print(f"{iterasi:7d}\t{a:.6f}\t{b:.6f}\t{c:.6f}\t{f(c):.6f}")

        if mutlak(f(c)) < toleransi:
            print(f"\nAkar ditemukan pada x = {c:.6f} setelah {iterasi} iterasi.")
            return

        if f(c) * f(a) < 0:
            b = c
        else:
            a = c

        iterasi += 1

    print(f"\nMetode tidak konvergen setelah {maks_iterasi} iterasi. Akar mendekati x = {c:.6f}")


def biseksi(toleransi, maks_iterasi):
    a = float(input("Masukkan batas bawah (a): "))
    b = float(input("Masukkan batas atas (b): "))

    if f(a) * f(b) >= 0:
        print("Metode biseksi gagal: f(a) dan f(b) harus memiliki tanda berbeda.")
        return

    c = a
    iterasi = 1

    print("\nIterasi\t        a\t        b\t        c\t     f(c)")
    print("-" * 67)

    while iterasi <= maks_iterasi:
        c = (a + b) / 2.0
        print(f"{iterasi:7d}\t{a:.6f}\t{b:.6f}\t{c:.6f}\t{f(c):.6f}")

        if mutlak(f(c)) < toleransi or (b - a) / 2.0 < toleransi:
            print(f"\nAkar ditemukan pada x = {c:.6f} setelah {iterasi} iterasi.")
            return

        if f(c) * f(a) < 0:
            b = c
        else:
            a = c

        iterasi += 1

    print(f"\nMetode tidak konvergen setelah {maks_iterasi} iterasi. Akar mendekati x = {c:.6f}")


def newtonraphson(toleransi, maks_iterasi):
    x0 = float(input("Masukkan tebakan awal (x0): "))

    iterasi = 1
    print("\nIterasi\t        x_n\t     f(x_n)\t    f'(x_n) [Aproksimasi]")
    print("-" * 65)

    while iterasi <= maks_iterasi:
        # hiitung auto
        t = df(x0)
        fx = f(x0)

        print(f"{iterasi:7d}\t{x0:.6f}\t{fx:.6f}\t{t:.6f}")

        #  akar sudah ditemukan?
        if mutlak(fx) < toleransi:
            print(f"\nAkar ditemukan pada x = {x0:.6f} setelah {iterasi} iterasi.")
            return

        # Memeriksa apakah turunan ke kecilan
        if mutlak(t) < 1e-12:
            print("Metode gagal: Turunan terlalu mendekati nol.")
            return

        # Rumus raphson
        x1 = x0 - fx / t

        # memperbarui nilai tebak
        x0 = x1
        iterasi += 1

    #  batas iterasi tercapai
    print(
        f"\nMetode tidak konvergen setelah {maks_iterasi} iterasi. "
        f"Akar mendekati x = {x0:.6f}"
    )


def secant(toleransi, maks_iterasi):
    x0 = float(input("Masukkan tebakan awal (x0): "))
    x1 = float(input("Masukkan tebakan kedua (x1): "))

    iterasi = 1

    print("\nIterasi\t       x0\t       x1\t       x2\t     f(x2)")
    print("-" * 75)

    while iterasi <= maks_iterasi:
        fx0 = f(x0)
        fx1 = f(x1)

        # Mencegah pembagian dengan nol
        if fx1 - fx0 == 0:
            print("Metode Secant gagal: f(x1) - f(x0) = 0.")
            return

        # Rumus metode Secant
        x2 = x1 - fx1 * (x1 - x0) / (fx1 - fx0)
        fx2 = f(x2)

        print(
            f"{iterasi:7d}\t{x0:.6f}\t{x1:.6f}"
            f"\t{x2:.6f}\t{fx2:.6f}"
        )

        # Kriteria berhenti
        if mutlak(fx2) < toleransi or mutlak(x2 - x1) < toleransi:
            print(
                f"\nAkar ditemukan pada x = {x2:.6f} "
                f"setelah {iterasi} iterasi."
            )
            return

        # Memperbarui tebakan
        x0 = x1
        x1 = x2

        iterasi += 1

    print(
        f"\nBatas iterasi tercapai. "
        f"Perkiraan akar terakhir x = {x2:.6f}"
    )


# Main program
if __name__ == "__main__":
    toleransi = 0.00001
    maks_iterasi = 100

    print("=== PROGRAM PENCARI AKAR PERSAMAAN NON-LINIER ===")
    persamaan = input("Masukkan fungsi f(x) (contoh: x**2 - 4*x - 1): ")

    print("\nPilih metode numerik:")
    print("1. Biseksi")
    print("2. Regula Falsi")
    print("3. Newton-Raphson")
    print("4. Secant")
    metode = int(input("Masukkan pilihan (1/2/3/4): "))

    match metode:
        case 1:
            biseksi(toleransi, maks_iterasi)
        case 2:
            regulafalsi(toleransi, maks_iterasi)
        case 3:
            newtonraphson(toleransi, maks_iterasi)
        case 4:
            secant(toleransi, maks_iterasi)
        case _:
            print("Pilihan metode tidak valid.")