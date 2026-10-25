/* auth.js — login/daftar untuk masuk.html
   Koneksi Supabase ada di supabase.js (dimuat sebelum file ini). */

const db = window.db;

// Cek domain di sini HANYA untuk pesan error yang ramah.
// Penolakan sungguhan harus di sisi database (trigger/RLS) — tanya BE.
const DOMAIN_UNSIKA = ['student.unsika.ac.id'];

const pesan = document.getElementById('pesan-auth');
function tampilPesan(teks) { pesan.textContent = teks; pesan.hidden = !teks; }
function emailUnsika(email) {
  if (!WAJIB_EMAIL_UNSIKA) return true;
  const d = String(email).trim().toLowerCase().split('@')[1] || '';
  return DOMAIN_UNSIKA.includes(d);
}
// Setelah masuk/daftar: kembali ke halaman asal (?next=tambah-produk.html), default beranda.
// Hanya nama file .html lokal yang diizinkan, supaya tidak bisa diarahkan ke situs lain.
function keBeranda() {
  const next = new URLSearchParams(location.search).get('next') || '';
  location.href = /^[a-z0-9-]+\.html$/.test(next) ? next : 'index.html';
}

// Pesan Supabase (bahasa Inggris) -> bahasa Indonesia
function pesanRamah(error) {
  const t = (error && error.message) || '';
  if (t.includes('Invalid login credentials')) return 'Email atau kata sandi salah.';
  if (t.includes('Email not confirmed')) return 'Email belum diverifikasi. Cek inbox email kamu.';
  if (t.includes('already registered')) return 'Email ini sudah terdaftar. Silakan masuk.';
  if (t.includes('Password should be')) return 'Kata sandi terlalu pendek (minimal 6 karakter).';
  return 'Gagal: ' + t;
}

// Sudah login? Langsung ke beranda.
ambilSesi().then(sesi => { if (sesi) keBeranda(); });

// ===== Masuk dengan email + sandi =====
document.getElementById('panel-masuk').addEventListener('submit', async e => {
  e.preventDefault();
  tampilPesan('');
  const f = new FormData(e.target);
  const email = String(f.get('email')).trim(), sandi = f.get('sandi');
  if (!emailUnsika(email)) return tampilPesan('Gunakan email mahasiswa UNSIKA (@student.unsika.ac.id).');
  if (!db) return tampilPesan('Tidak bisa terhubung ke server. Coba muat ulang halaman.');
  tampilPesan('Memproses...');
  try {
    const { error } = await db.auth.signInWithPassword({ email, password: sandi });
    if (error) return tampilPesan(pesanRamah(error));
    keBeranda();
  } catch (err) {
    console.error(err);
    tampilPesan('Tidak bisa menghubungi server. Periksa koneksi internet.');
  }
});

// ===== Daftar =====
document.getElementById('panel-daftar').addEventListener('submit', async e => {
  e.preventDefault();
  tampilPesan('');
  const f = new FormData(e.target);
  const email = String(f.get('email')).trim();
  const nama = String(f.get('nama') || '').trim();
  if (!emailUnsika(email)) return tampilPesan('Gunakan email mahasiswa UNSIKA (@student.unsika.ac.id).');
  if (!db) return tampilPesan('Tidak bisa terhubung ke server. Coba muat ulang halaman.');
  tampilPesan('Memproses...');
  try {
    const { data, error } = await db.auth.signUp({
      email,
      password: f.get('sandi'),
      // "username" ikut diisi supaya cocok dengan kode branch backend
      options: { data: { nama, username: nama, wa: f.get('wa') } }
    });
    if (error) return tampilPesan(pesanRamah(error));
    if (data.session) return keBeranda(); // "Confirm email" dimatikan di Supabase
    tampilPesan('Pendaftaran berhasil. Cek email kamu untuk verifikasi, lalu masuk.');
  } catch (err) {
    console.error(err);
    tampilPesan('Tidak bisa menghubungi server. Periksa koneksi internet.');
  }
});

// ===== Masuk dengan Google =====
// Butuh provider Google diaktifkan di Supabase (Authentication > Providers).
document.getElementById('btn-google').addEventListener('click', async () => {
  tampilPesan('');
  if (!db) return tampilPesan('Tidak bisa terhubung ke server.');
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: location.origin + location.pathname.replace(/[^/]*$/, 'index.html'),
      // Sarankan akun Google kampus hanya kalau WAJIB_EMAIL_UNSIKA = true (hanya tampilan, bukan pengaman)
      queryParams: WAJIB_EMAIL_UNSIKA ? { hd: 'student.unsika.ac.id' } : {}
    }
  });
  if (error) tampilPesan('Login Google belum aktif. Minta BE mengaktifkan provider Google di Supabase.');
});
