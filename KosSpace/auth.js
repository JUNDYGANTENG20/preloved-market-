/* auth.js — login/daftar untuk masuk.html
   MODE DEMO: selama SUPABASE_URL / SUPABASE_ANON_KEY masih kosong, form hanya
   pindah ke beranda (tanpa kirim data apa pun ke URL). Isi dua nilai di bawah
   setelah project Supabase dari tim siap. */

const SUPABASE_URL = '';       // contoh: https://xxxx.supabase.co
const SUPABASE_ANON_KEY = '';  // anon key (aman ditaruh di FE; keamanan lewat RLS)

// Cek domain di sini HANYA untuk pesan error yang ramah.
// Penolakan sungguhan harus di sisi database (trigger/RLS) — tanya BE.
const DOMAIN_UNSIKA = ['student.unsika.ac.id'];

const db = (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const pesan = document.getElementById('pesan-auth');
function tampilPesan(teks) { pesan.textContent = teks; pesan.hidden = !teks; }
function emailUnsika(email) {
  const d = String(email).trim().toLowerCase().split('@')[1] || '';
  return DOMAIN_UNSIKA.includes(d);
}
function keBeranda() { location.href = 'index.html'; }

// ===== Masuk dengan email + sandi =====
document.getElementById('panel-masuk').addEventListener('submit', async e => {
  e.preventDefault();
  tampilPesan('');
  const f = new FormData(e.target);
  const email = f.get('email'), sandi = f.get('sandi');
  if (!emailUnsika(email)) return tampilPesan('Gunakan email mahasiswa UNSIKA (@student.unsika.ac.id).');
  if (!db) return keBeranda(); // mode demo
  const { error } = await db.auth.signInWithPassword({ email, password: sandi });
  if (error) return tampilPesan('Email atau kata sandi salah.');
  keBeranda();
});

// ===== Daftar =====
document.getElementById('panel-daftar').addEventListener('submit', async e => {
  e.preventDefault();
  tampilPesan('');
  const f = new FormData(e.target);
  const email = f.get('email');
  if (!emailUnsika(email)) return tampilPesan('Gunakan email mahasiswa UNSIKA (@student.unsika.ac.id).');
  if (!db) return keBeranda(); // mode demo
  const { error } = await db.auth.signUp({
    email,
    password: f.get('sandi'),
    options: { data: { nama: f.get('nama'), wa: f.get('wa') } }
  });
  if (error) return tampilPesan('Gagal mendaftar: ' + error.message);
  tampilPesan('Cek email kamu untuk verifikasi, lalu masuk.');
});

// ===== Masuk dengan Google =====
document.getElementById('btn-google').addEventListener('click', async () => {
  tampilPesan('');
  if (!db) return tampilPesan('Login Google belum aktif (Supabase belum dihubungkan).');
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: location.origin + '/index.html',
      queryParams: { hd: 'student.unsika.ac.id' } // hanya tampilan, bukan pengaman
    }
  });
  if (error) tampilPesan('Gagal login dengan Google.');
});
