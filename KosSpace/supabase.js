/* supabase.js — koneksi Supabase untuk SEMUA halaman Kosspace.
   Diambil dari branch backend (js/common.js) supaya main & backend
   memakai project Supabase yang SAMA.

   Urutan <script> di HTML wajib:
     1. CDN supabase-js
     2. supabase.js  (file ini)
     3. file halaman (produk.js, auth.js, dst.)                       */

// ---------- 1. Koneksi (project Supabase buatan tim backend) ----------
// Publishable/anon key memang boleh ada di frontend; keamanan data diatur RLS.
const SUPABASE_URL = 'https://kpjklhcslqmxzccuwjvl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vkR8Ps_fuj7tUS614U4Jcw_XimPsXRT';

// Nama bucket Storage untuk foto produk (lihat supabase/02-storage-foto.sql)
const BUCKET_FOTO = 'produk-foto';

// true = daftar/masuk hanya boleh pakai email @student.unsika.ac.id
// (set false sementara kalau tim mau tes pakai Gmail)
const WAJIB_EMAIL_UNSIKA = false;

window.db = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;
if (!window.db) console.error('Library supabase-js belum dimuat. Cek urutan <script>.');

// ---------- 2. Sesi login ----------
async function ambilSesi() {
  if (!window.db) return null;
  const { data } = await window.db.auth.getSession();
  return data.session;
}

// Nama tampil: metadata "nama" (form main) / "username" (form backend) / depan email
function namaTampil(user) {
  const m = user.user_metadata || {};
  return m.nama || m.username || (user.email || '').split('@')[0];
}

// ---------- 3. Menyamakan data DB (format backend) dengan format main ----------
// DB backend: kategori "Kitchen", kondisi "Baru" / "Bekas - seperti baru" / "Bekas - layak pakai"
// Tampilan main: kategori "Dapur", kondisi "Sangat Baik" / "Baik" / "Cukup"
const KATEGORI_KE_TAMPIL = { Kitchen: 'Dapur' };
const KATEGORI_KE_DB = { Dapur: 'Kitchen' };
const KONDISI_KE_TAMPIL = {
  'Baru': 'Sangat Baik',
  'Bekas - seperti baru': 'Sangat Baik',
  'Bekas - layak pakai': 'Baik'
};

// Satu baris tabel products -> bentuk objek yang dipakai katalog/beranda/detail
function produkDariDb(row) {
  const kondisiAsli = row.condition || '';
  const kondisi = KONDISI_KE_TAMPIL[kondisiAsli] || kondisiAsli || 'Baik';
  const kategori = KATEGORI_KE_TAMPIL[row.category] || row.category || 'Lainnya';
  const umurHari = row.created_at ? (Date.now() - new Date(row.created_at)) / 864e5 : 99;
  return {
    id: String(row.id),
    userId: row.user_id,
    nama: row.name,
    namaLengkap: row.name,
    harga: Number(row.price) || 0,
    kategori,
    img: row.image_url || '',
    jarak: '',                       // belum ada kolomnya di DB
    kondisi,
    usia: kondisiAsli,               // label asli dari DB, mis. "Bekas - layak pakai"
    tersedia: true,
    baru: umurHari <= 7,             // dipasang ≤ 7 hari lalu → badge BARU
    penjual: row.seller_name || 'Penjual',
    rating: null,                    // belum ada tabel ulasan
    deskripsi: row.description || '',
    poin: ['Kondisi: ' + (kondisiAsli || kondisi), 'Kategori: ' + kategori],
    createdAt: row.created_at
  };
}

// ---------- 4. Navbar: ganti tombol Masuk/Daftar kalau sudah login ----------
// Semua link "masuk.html" jadi nama user (ke dashboard penjual),
// semua link "masuk.html#daftar" jadi tombol Keluar.
async function renderNavbarAuth() {
  const sesi = await ambilSesi();
  if (!sesi) return;
  const nama = namaTampil(sesi.user).split(/\s+/)[0]; // nama depan saja biar navbar tidak turun baris

  document.querySelectorAll('a[href="masuk.html"]').forEach(a => {
    a.textContent = nama;
    a.href = 'dashboard-penjual.html';
    a.title = 'Dashboard penjual';
  });
  document.querySelectorAll('a[href="masuk.html#daftar"]').forEach(a => {
    a.textContent = 'Keluar';
    a.href = '#';
    a.addEventListener('click', async e => {
      e.preventDefault();
      await window.db.auth.signOut();
      location.reload();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderNavbarAuth);
} else {
  renderNavbarAuth();
}
