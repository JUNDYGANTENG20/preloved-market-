// ======================================================
// common.js — dipakai semua halaman
// Isinya: koneksi Supabase, sesi login (Supabase Auth), dan navbar.
// ======================================================

// ---------- 1. Koneksi Supabase ----------
// GANTI dua nilai ini dengan milik project Supabase kamu sendiri.
const SUPABASE_URL = "https://kpjklhcslqmxzccuwjvl.supabase.co";
const SUPABASE_KEY = "sb_publishable_vkR8Ps_fuj7tUS614U4Jcw_XimPsXRT  ";

// Library Supabase (dari CDN di HTML) menyediakan window.supabase
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL.trim(), SUPABASE_KEY.trim());

// true kalau URL dan key sudah diganti (bukan nilai contoh di atas)
function konfigurasiSiap() {
  return (
    !SUPABASE_URL.includes("xxxxxxxxxxxx") && !SUPABASE_KEY.includes("ISI_KEY")
  );
}

// ---------- 2. Pengaman teks ----------
// Mengubah karakter berbahaya (< > " ') jadi teks biasa, supaya data dari
// form tidak bisa menyisipkan kode HTML/JavaScript ke halaman.
function escapeHtml(teks) {
  return String(teks ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Foto bawaan kalau pengguna tidak mengisi kolom foto
const FOTO_DEFAULT =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&q=60&auto=format&fit=crop";

// ---------- 3. Sesi login (Supabase Auth) ----------
// Mengembalikan sesi kalau sudah login, atau null kalau belum.
// Sesi disimpan Supabase di browser dan diperbarui otomatis.
async function ambilSesi() {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

// Nama yang ditampilkan: bagian email sebelum tanda @
function namaTampil(user) {
  return user.user_metadata?.username || (user.email || "").split("@")[0];
}

// ---------- 4. Navbar ----------
// Menampilkan aksi yang sesuai dengan sesi Supabase.
async function renderNavbarAuth() {
  const tempat = document.querySelector("#auth-navbar");
  if (!tempat) return;

  const sesi = await ambilSesi();
  const tombolMenu = tempat.querySelector("#burger");
  const markupAuth = sesi
    ? `<span class="auth-username">${escapeHtml(namaTampil(sesi.user))}</span>
       <button type="button" class="btn btn-outline auth-logout">Logout</button>`
    : `<a href="login.html" class="btn btn-outline">Masuk</a>
       <a href="login.html" class="btn btn-solid">Daftar</a>`;

  tempat.innerHTML = markupAuth;
  if (tombolMenu) tempat.append(tombolMenu);

  const tombolLogout = tempat.querySelector(".auth-logout");
  if (tombolLogout) {
    tombolLogout.addEventListener("click", async () => {
      tombolLogout.disabled = true;
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error("Logout gagal:", error);
        tombolLogout.disabled = false;
        window.alert("Logout gagal. Coba lagi.");
        return;
      }
      await renderNavbarAuth();
    });
  }
}

renderNavbarAuth();
