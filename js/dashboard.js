// ======================================================
// dashboard.js — halaman dashboard
// Fitur: sidebar, daftar UMKM (Read), tambah (Create), edit (Update),
// hapus (Delete). Login memakai Supabase Auth. Butuh common.js.
// Role admin: admin boleh edit dan hapus semua data (butuh is_admin() dari 01-supabase-lengkap.sql).
// ======================================================

// Penjaga login: cek sesi Supabase Auth.
// Belum login langsung ditendang ke halaman login.
async function mulai() {
  const sesi = await ambilSesi();
  if (!sesi) {
    location.replace("login.html");
    return;
  }
  // Tanya database: apakah user ini admin? (fungsi is_admin() dari 01-supabase-lengkap.sql)
  // Kalau fungsi itu belum ada, rpc() mengembalikan error dan hasilnya dianggap bukan admin.
  const { data: hasilAdmin } = await supabaseClient.rpc("is_admin");
  mulaiDashboard(sesi.user, hasilAdmin === true);
}
mulai();

function mulaiDashboard(user, admin) {
  // Lolos cek login, baru tampilkan halaman (sebelumnya disembunyikan CSS)
  document.body.classList.remove("belum-dicek");

  const nama = namaTampil(user);
  document.querySelector("#nama-user").textContent = admin ? nama + " (admin)" : nama;
  document.querySelector("#avatar-user").textContent = nama.charAt(0).toUpperCase();

  const formUmkm = document.querySelector("#form-umkm");
  const statusForm = document.querySelector("#status-form");
  const tubuhTabel = document.querySelector("#tubuh-tabel");
  const statistik = document.querySelector("#statistik");
  const jumlahUmkm = document.querySelector("#jumlah-umkm");
  const judulHalaman = document.querySelector("#judul-halaman");
  const judulForm = document.querySelector("#judul-form");
  const tombolSimpan = document.querySelector("#tombol-simpan");
  const sidebar = document.querySelector("#sidebar");
  const lapisanSidebar = document.querySelector("#lapisan-sidebar");
  const toast = document.querySelector("#toast");

  // idDiedit = null artinya form sedang mode "Tambah".
  // Kalau berisi angka id, form sedang mode "Edit" untuk baris itu.
  let idDiedit = null;
  // Salinan data terakhir dari Supabase, dipakai saat tombol Edit diklik
  let dataTerakhir = [];

  // ---------- Sidebar: ganti tampilan (Daftar / Tambah) ----------
  function bukaTampilan(tampilan) {
    document.querySelectorAll(".view").forEach((view) => {
      view.hidden = view.id !== "view-" + tampilan;
    });
    document.querySelectorAll(".menu-item[data-view]").forEach((tombol) => {
      tombol.classList.toggle("aktif", tombol.dataset.view === tampilan);
    });
    if (tampilan === "daftar") {
      judulHalaman.textContent = "Daftar UMKM";
    } else {
      judulHalaman.textContent = idDiedit ? "Edit UMKM" : "Tambah UMKM";
    }
    tutupSidebar();
  }

  // Klik menu "Tambah UMKM" selalu membuka form kosong (mode Tambah)
  document.querySelectorAll(".menu-item[data-view]").forEach((tombol) => {
    tombol.addEventListener("click", () => {
      if (tombol.dataset.view === "tambah") selesaiEdit();
      bukaTampilan(tombol.dataset.view);
    });
  });

  // ---------- Sidebar di layar HP: buka / tutup ----------
  function tutupSidebar() {
    sidebar.classList.remove("terbuka");
    lapisanSidebar.classList.remove("tampil");
  }

  document.querySelector("#tombol-menu").addEventListener("click", () => {
    sidebar.classList.add("terbuka");
    lapisanSidebar.classList.add("tampil");
  });
  lapisanSidebar.addEventListener("click", tutupSidebar);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") tutupSidebar();
  });

  // ---------- Logout ----------
  // signOut() menghapus sesi login di Supabase.
  document.querySelector("#tombol-logout").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    location.replace("index.html");
  });

  // ---------- Toast: pesan singkat yang hilang sendiri ----------
  let waktuToast;
  function tampilToast(pesan) {
    toast.textContent = pesan;
    toast.classList.add("tampil");
    clearTimeout(waktuToast);
    waktuToast = setTimeout(() => toast.classList.remove("tampil"), 3500);
  }

  // ---------- Read: ringkasan + tabel daftar UMKM ----------
  function renderStatistik(data) {
    const hitung = (kategori) => data.filter((umkm) => umkm.kategori === kategori).length;
    const kartu = [
      ["fa-store", "Total UMKM", data.length],
      ["fa-utensils", "Kuliner", hitung("Kuliner")],
      ["fa-shirt", "Fashion", hitung("Fashion")],
      ["fa-hands", "Kerajinan", hitung("Kerajinan")],
    ];
    statistik.innerHTML = kartu
      .map(
        ([ikon, label, jumlah]) => `
        <div class="stat">
          <span class="stat-ikon"><i class="fa-solid ${ikon}" aria-hidden="true"></i></span>
          <div><strong>${jumlah}</strong><span>${label}</span></div>
        </div>`,
      )
      .join("");
  }

  // Tombol Edit/Hapus untuk baris milik user yang login, atau semua baris kalau admin.
  // Baris lain diberi tanda strip. Ini hanya tampilan: yang menolak sungguhan adalah RLS.
  function htmlAksi(umkm) {
    if (!admin && umkm.user_id !== user.id) {
      return `<span class="aksi-kosong" title="Bukan datamu">—</span>`;
    }
    const id = escapeHtml(umkm.id);
    return `
      <button type="button" class="tombol-kecil" data-aksi="edit" data-id="${id}">Edit</button>
      <button type="button" class="tombol-kecil tombol-bahaya" data-aksi="hapus" data-id="${id}">Hapus</button>`;
  }

  async function muatTabel() {
    if (!konfigurasiSiap()) {
      tubuhTabel.innerHTML = `<tr><td colspan="8" class="galat">Isi SUPABASE_URL dan SUPABASE_KEY dulu di js/common.js.</td></tr>`;
      return;
    }

    tubuhTabel.innerHTML = `<tr><td colspan="8">Memuat data...</td></tr>`;

    const { data, error } = await supabaseClient
      .from("umkm")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Gagal mengambil data:", error);
      tubuhTabel.innerHTML = `<tr><td colspan="8" class="galat">Gagal mengambil data. Buka Console (F12).</td></tr>`;
      return;
    }

    dataTerakhir = data;
    renderStatistik(data);
    jumlahUmkm.textContent = data.length + " usaha";
    tubuhTabel.innerHTML = data
      .map(
        (umkm, urutan) => `
        <tr>
          <td class="nomor">${urutan + 1}</td>
          <td><img class="foto-kecil" src="${escapeHtml(umkm.foto)}" alt="" loading="lazy" /></td>
          <td><strong>${escapeHtml(umkm.nama)}</strong><small>${escapeHtml(umkm.alamat)}</small></td>
          <td><span class="pil">${escapeHtml(umkm.kategori)}</span></td>
          <td>${escapeHtml(umkm.jam)}</td>
          <td>${escapeHtml(umkm.wa)}</td>
          <td>${escapeHtml(umkm.dibuat_oleh)}</td>
          <td class="aksi">${htmlAksi(umkm)}</td>
        </tr>`,
      )
      .join("");
  }

  // ---------- Form: pesan status + mode Tambah / Edit ----------
  function tampilStatus(pesan, jenis) {
    statusForm.textContent = pesan;
    statusForm.className = "status status-" + jenis; // "ok" atau "galat"
  }

  // Menerjemahkan error dari aturan database jadi pesan yang mudah dibaca.
  // 23514 = melanggar batas/format kolom, P0001 = pesan dari trigger (mis. batas jumlah data).
  function pesanError(error, cadangan) {
    if (error.code === "P0001") return error.message;
    if (error.code === "23514") {
      return "Isian ditolak database: cek panjang teks dan pastikan link foto diawali https://";
    }
    return cadangan;
  }

  // Mengembalikan form ke mode Tambah (kosong)
  function selesaiEdit() {
    idDiedit = null;
    formUmkm.reset();
    statusForm.textContent = "";
    statusForm.className = "status";
    judulForm.textContent = "Tambah UMKM baru";
    tombolSimpan.textContent = "Simpan";
  }

  // Mengisi form dengan data baris yang mau diedit
  function mulaiEdit(id) {
    const umkm = dataTerakhir.find((item) => String(item.id) === String(id));
    if (!umkm) return;

    idDiedit = umkm.id;
    document.querySelector("#nama").value = umkm.nama;
    document.querySelector("#kategori").value = umkm.kategori;
    document.querySelector("#alamat").value = umkm.alamat;
    document.querySelector("#jam").value = umkm.jam;
    document.querySelector("#wa").value = umkm.wa;
    document.querySelector("#foto").value = umkm.foto === FOTO_DEFAULT ? "" : umkm.foto;

    judulForm.textContent = "Edit UMKM";
    tombolSimpan.textContent = "Simpan perubahan";
    statusForm.textContent = "";
    statusForm.className = "status";
    bukaTampilan("tambah");
  }

  // Delete: konfirmasi dulu, baru hapus HANYA baris dengan id itu
  async function hapusUmkm(id) {
    const umkm = dataTerakhir.find((item) => String(item.id) === String(id));
    if (!umkm) return;
    if (!confirm(`Hapus "${umkm.nama}"? Data yang dihapus tidak bisa dikembalikan.`)) return;

    // .eq("id", id) WAJIB. Tanpa filter ini, yang terhapus bisa seluruh tabel.
    // .select() di belakang membuat Supabase mengembalikan baris yang benar-benar terhapus.
    const { data, error } = await supabaseClient
      .from("umkm")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Gagal menghapus:", error);
      tampilToast("Gagal menghapus. Buka Console (F12).");
      return;
    }

    // RLS yang menolak TIDAK menghasilkan error, cuma 0 baris yang terhapus.
    if (data.length === 0) {
      tampilToast("Tidak ada data yang terhapus. Kamu bukan pemilik data ini.");
      return;
    }

    tampilToast("UMKM berhasil dihapus.");
    await muatTabel();
  }

  // Satu pendengar untuk semua tombol Edit/Hapus di tabel.
  // Tabel digambar ulang tiap data dimuat, jadi pendengar dipasang di <tbody>
  // (induknya), bukan di tiap tombol. Cara ini disebut event delegation.
  tubuhTabel.addEventListener("click", (event) => {
    const tombol = event.target.closest("button[data-aksi]");
    if (!tombol) return;

    if (tombol.dataset.aksi === "edit") mulaiEdit(tombol.dataset.id);
    if (tombol.dataset.aksi === "hapus") hapusUmkm(tombol.dataset.id);
  });

  document.querySelector("#tombol-batal").addEventListener("click", () => {
    selesaiEdit();
    bukaTampilan("daftar");
  });

  // ---------- Create (tambah) dan Update (edit) ----------
  formUmkm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Cek sesi lagi sebelum menulis data, jaga-jaga sesi sudah habis
    const sesi = await ambilSesi();
    if (!sesi) {
      location.replace("login.html");
      return;
    }

    if (!konfigurasiSiap()) {
      tampilStatus("Isi SUPABASE_URL dan SUPABASE_KEY dulu di js/common.js.", "galat");
      return;
    }

    const isian = {
      nama: document.querySelector("#nama").value.trim(),
      kategori: document.querySelector("#kategori").value,
      alamat: document.querySelector("#alamat").value.trim(),
      jam: document.querySelector("#jam").value.trim(),
      wa: document.querySelector("#wa").value.trim(),
      foto: document.querySelector("#foto").value.trim() || FOTO_DEFAULT,
    };

    if (isian.nama === "" || isian.alamat === "" || isian.jam === "" || isian.wa === "") {
      tampilStatus("Nama, alamat, jam, dan WA wajib diisi.", "galat");
      return;
    }

    if (idDiedit === null) {
      // ----- Create: insert() menerima array of object -----
      // user_id diisi id user yang login (dicek RLS), dibuat_oleh diisi nama
      const { error } = await supabaseClient.from("umkm").insert([
        { ...isian, user_id: user.id, dibuat_oleh: namaTampil(user) },
      ]);

      if (error) {
        console.error("Gagal menyimpan data:", error);
        tampilStatus(pesanError(error, "Gagal menyimpan. Buka Console (F12) untuk detailnya."), "galat");
        return;
      }
      tampilToast("UMKM berhasil ditambahkan!");
    } else {
      // ----- Update: ubah HANYA baris dengan id yang sedang diedit -----
      const { data, error } = await supabaseClient
        .from("umkm")
        .update(isian)
        .eq("id", idDiedit)
        .select();

      if (error) {
        console.error("Gagal mengubah data:", error);
        tampilStatus(pesanError(error, "Gagal mengubah. Buka Console (F12) untuk detailnya."), "galat");
        return;
      }

      // RLS yang menolak tidak menghasilkan error, cuma 0 baris yang berubah.
      if (data.length === 0) {
        tampilStatus("Tidak ada data yang berubah. Kamu bukan pemilik data ini.", "galat");
        return;
      }
      tampilToast("Perubahan berhasil disimpan.");
    }

    selesaiEdit();
    bukaTampilan("daftar"); // kembali ke daftar supaya hasilnya langsung kelihatan
    await muatTabel(); // muat ulang tabel + ringkasan
  });

  muatTabel();
}
