// ======================================================
// login.js — halaman login dan daftar
// Login dan daftar memakai Supabase Auth (email + password). Butuh common.js.
// ======================================================

const formLogin = document.querySelector("#form-login");
const inputUsername = document.querySelector("#username");
const inputEmail = document.querySelector("#email");
const inputPassword = document.querySelector("#password");
const tombolDaftar = document.querySelector("#tombol-daftar");
const pesanLogin = document.querySelector("#pesan-login");

// Sudah login? Kembali ke halaman utama, tidak perlu isi lagi.
ambilSesi().then((sesi) => {
  if (sesi) location.replace("index.html");
});

function tampilPesan(teks, jenis) {
  pesanLogin.textContent = teks;
  pesanLogin.className = "status status-" + jenis; // "ok" atau "galat"
}

// Pesan dari Supabase berbahasa Inggris, yang umum kita terjemahkan.
function pesanRamah(error) {
  const teks = error.message || "";
  if (teks.includes("Invalid login credentials")) return "Email atau password salah.";
  if (teks.includes("Email not confirmed")) return "Email belum dikonfirmasi. Cek inbox emailmu.";
  if (teks.includes("already registered")) return "Email ini sudah terdaftar. Klik Masuk.";
  if (teks.includes("Password should be")) return "Password terlalu pendek (minimal 6 karakter).";
  return "Gagal: " + teks;
}

// Mengambil isian form. Mengembalikan null kalau belum lengkap.
function ambilIsian(perluUsername = false) {
  const username = inputUsername.value.trim();
  const email = inputEmail.value.trim();
  const password = inputPassword.value;

  if (perluUsername && username === "") {
    tampilPesan("Username wajib diisi untuk membuat akun.", "galat");
    inputUsername.focus();
    return null;
  }
  if (email === "" || password === "") {
    tampilPesan("Email dan password wajib diisi.", "galat");
    return null;
  }
  if (perluUsername && username.length > 50) {
    tampilPesan("Username maksimal 50 karakter.", "galat");
    inputUsername.focus();
    return null;
  }
  if (!konfigurasiSiap()) {
    tampilPesan("Isi SUPABASE_URL dan SUPABASE_KEY dulu di js/common.js.", "galat");
    return null;
  }
  return { username, email, password };
}

// ---------- Masuk ----------
formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isian = ambilIsian();
  if (!isian) return;

  tampilPesan("Memproses...", "ok");
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: isian.email,
      password: isian.password,
    });

    if (error) {
      tampilPesan(pesanRamah(error), "galat");
      return;
    }
    location.href = "index.html";
  } catch (error) {
    console.error("Login gagal menghubungi Supabase:", error);
    tampilPesan("Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi.", "galat");
  }
});

// ---------- Daftar ----------
tombolDaftar.addEventListener("click", async () => {
  const isian = ambilIsian(true);
  if (!isian) return;

  tampilPesan("Memproses...", "ok");
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: isian.email,
      password: isian.password,
      options: {
        data: { username: isian.username },
      },
    });

    if (error) {
      tampilPesan(pesanRamah(error), "galat");
      return;
    }

    // Kalau "Confirm email" dimatikan, sesi langsung ada. Kalau aktif, cek email.
    if (data.session) {
      location.href = "index.html";
    } else {
      tampilPesan("Pendaftaran berhasil. Cek email untuk konfirmasi, lalu masuk.", "ok");
    }
  } catch (error) {
    console.error("Pendaftaran gagal menghubungi Supabase:", error);
    tampilPesan("Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi.", "galat");
  }
});
