# preloved-market-
Marketplace barang bekas — project study club webdev. Beli &amp; jual barang preloved dengan mudah.

## Supabase

Project Supabase dibuat tim backend (branch `backend`). Koneksinya ada di **`KosSpace/supabase.js`** — cukup ubah di sana kalau URL/key berganti.

| File | Fungsi |
|---|---|
| `KosSpace/supabase.js` | Koneksi Supabase, cek sesi login, navbar Masuk/Daftar → Nama/Keluar |
| `KosSpace/auth.js` | Masuk & daftar (`masuk.html`) |
| `KosSpace/produk.js` | Ambil barang dari tabel `products` (beranda, katalog, detail) |
| `KosSpace/tambah-produk.js` | Simpan barang baru ke tabel `products` |
| `supabase/02-storage-foto.sql` | Bucket foto produk — jalankan sekali di SQL Editor Supabase |

Catatan:
- Daftar/masuk wajib email `@student.unsika.ac.id`. Untuk tes pakai Gmail, set `WAJIB_EMAIL_UNSIKA = false` di `supabase.js`.
- Isi kolom DB tetap format backend (`Kitchen`, `Bekas - layak pakai`); di tampilan diubah jadi `Dapur`, `Baik`, dst.
