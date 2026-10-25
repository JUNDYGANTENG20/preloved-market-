// ======================================================
// app.js — halaman utama (Direktori UMKM)
// Butuh common.js (dimuat lebih dulu di index.html).
// ======================================================

// ---------- 1. Data UMKM ----------
// Awalnya kosong, diisi dari Supabase oleh ambilUmkm() di bawah.
let daftarUmkm = [];

// ---------- 2. Render kartu UMKM ke HTML ----------
const gridUmkm = document.querySelector(".grid-umkm");

function renderUmkm(data) {
  gridUmkm.innerHTML = "";
  if (data.length === 0) {
    gridUmkm.innerHTML = `<p class="kosong">Tidak ada UMKM yang cocok.</p>`;
    return;
  }
  data.forEach((umkm) => {
    // Semua data lewat escapeHtml() supaya aman. Teks alt dibuat dari nama.
    gridUmkm.innerHTML += `
      <article class="kartu-umkm">
        <div class="kartu-foto">
          <img src="${escapeHtml(umkm.foto)}" alt="Foto ${escapeHtml(umkm.nama)}" loading="lazy" />
          <span class="badge">${escapeHtml(umkm.kategori)}</span>
        </div>
        <div class="kartu-isi">
          <h3>${escapeHtml(umkm.nama)}</h3>
          <p class="alamat"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> <span>${escapeHtml(umkm.alamat)}</span></p>
          <p class="jam"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(umkm.jam)}</p>
          <p class="wa"><i class="fa-solid fa-phone" aria-hidden="true"></i> ${escapeHtml(umkm.wa)}</p>
        </div>
      </article>
    `;
  });
}

// ---------- 3. Filter kategori + pencarian nama ----------
// Tidak berubah.
const inputCari = document.querySelector(".direktori-cari");
const selectKategori = document.querySelector(".direktori-kategori");

function terapkanFilter() {
  const kataKunci = inputCari.value.toLowerCase().trim();
  const kategoriDipilih = selectKategori.value;
  const hasil = daftarUmkm.filter((umkm) => {
    const namaCocok = umkm.nama.toLowerCase().includes(kataKunci);
    const kategoriCocok = kategoriDipilih === "Semua kategori" || umkm.kategori === kategoriDipilih;
    return namaCocok && kategoriCocok;
  });
  renderUmkm(hasil);
}

inputCari.addEventListener("input", terapkanFilter);
selectKategori.addEventListener("change", terapkanFilter);

// ---------- 4. Ambil data dari Supabase ----------
// Menggantikan renderUmkm(daftarUmkm) langsung dari pertemuan 3.
async function ambilUmkm() {
  // Belum isi URL/key di common.js? Beri pesan jelas, jangan lanjut.
  if (!konfigurasiSiap()) {
    gridUmkm.innerHTML = `<p class="kosong galat">Isi SUPABASE_URL dan SUPABASE_KEY dulu di js/common.js.</p>`;
    return;
  }

  gridUmkm.innerHTML = `<p class="kosong">Memuat data...</p>`;

  // Supabase selalu membalas { data, error }: salah satunya terisi, satunya null
  const { data, error } = await supabaseClient
    .from("umkm")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data:", error);
    gridUmkm.innerHTML = `<p class="kosong galat">Gagal mengambil data. Buka Console (F12) untuk detailnya.</p>`;
    return;
  }

  daftarUmkm = data;
  terapkanFilter(); // tampilkan, sekalian ikut aturan filter yang sedang aktif
}

ambilUmkm();

// ---------- 5. Validasi form kontak ----------
// Tidak berubah. Form kontak sengaja belum dihubungkan ke Supabase.
const formKontak = document.querySelector("#kontak form");

formKontak.addEventListener("submit", (event) => {
  event.preventDefault();
  const nama = document.querySelector("#nama").value;
  const pesan = document.querySelector("#pesan").value;
  if (nama.trim() === "" || pesan.trim() === "") {
    alert("Nama dan pesan tidak boleh kosong!");
    return;
  }
  console.log("Pesan terkirim:", { nama, pesan });
  alert("Terima kasih, " + nama + "! Pesanmu sudah tercatat di console.");
  formKontak.reset();
});
