/* tambah-produk.js — simpan barang baru / ubah barang ke tabel "products".
   tambah-produk.html          -> mode Tambah
   tambah-produk.html?id=123   -> mode Ubah (butuh supabase/05-edit-hapus-produk.sql)
   Foto diupload ke Storage bucket BUCKET_FOTO; kalau gagal, pakai foto bawaan. */
(function () {
  const FOTO_DEFAULT = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=75&auto=format&fit=crop';
  const form = document.getElementById('form-produk');
  const tombol = document.getElementById('tombol-kirim');
  const status = document.getElementById('status-produk');
  const inputFoto = form.elements['foto-utama'];
  const idEdit = new URLSearchParams(location.search).get('id');
  let user = null;
  let produkLama = null;

  function tampil(teks, galat) {
    status.textContent = teks;
    status.style.color = galat ? '#c0392b' : '#0f6b5c';
    status.hidden = !teks;
  }

  // Wajib login
  ambilSesi().then(async sesi => {
    if (!sesi) { location.replace('masuk.html'); return; }
    user = sesi.user;
    const nama = namaTampil(user);
    document.getElementById('nama-user').textContent = nama;
    document.getElementById('avatar-user').textContent =
      nama.split(/\s+/).map(k => k[0]).slice(0, 2).join('').toUpperCase();
    if (idEdit) await siapkanModeUbah();
  });

  // Mode Ubah: isi form dengan data lama
  async function siapkanModeUbah() {
    document.title = 'Ubah Produk - Panel Penjual Kosspace';
    document.getElementById('judul-form').textContent = 'Ubah Produk';
    tombol.textContent = 'Simpan Perubahan';
    inputFoto.required = false;
    tampil('Memuat data barang...');

    const { data, error } = await window.db.from('products').select('*').eq('id', idEdit).maybeSingle();
    if (error || !data) { tampil('Barang tidak ditemukan.', true); tombol.disabled = true; return; }
    if (data.user_id !== user.id) { tampil('Ini bukan barang kamu.', true); tombol.disabled = true; return; }
    produkLama = data;

    // Pisahkan "Lama pakai: ..." dari deskripsi
    let desk = data.description || '', lama = '';
    const m = desk.match(/^Lama pakai: (.*)\n\n([\s\S]*)$/);
    if (m) { lama = m[1]; desk = m[2]; }

    form.elements.nama.value = data.name;
    form.elements.kategori.value = data.category;
    form.elements.harga.value = Number(data.price);
    form.elements.kondisi.value = data.condition;
    form.elements.lama_pakai.value = lama;
    form.elements.deskripsi.value = desk;
    const label = inputFoto.closest('.drop').querySelector('b');
    if (label) label.textContent = 'Ganti Foto (opsional)';
    tampil('');
  }

  async function uploadFoto(file) {
    if (!file || !file.size) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran foto maksimal 5MB.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await window.db.storage.from(BUCKET_FOTO).upload(path, file, { contentType: file.type });
    if (error) {
      console.warn('Upload foto gagal (bucket "' + BUCKET_FOTO + '" sudah dibuat?).', error);
      return null;
    }
    return window.db.storage.from(BUCKET_FOTO).getPublicUrl(path).data.publicUrl;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!user) { location.replace('masuk.html'); return; }

    const f = new FormData(form);
    const harga = Number(f.get('harga'));
    if (!Number.isFinite(harga) || harga < 0) return tampil('Masukkan harga yang valid.', true);

    const lama = String(f.get('lama_pakai') || '').trim();
    const deskripsi = String(f.get('deskripsi')).trim();

    tombol.disabled = true;
    tampil('Menyimpan barang...');
    try {
      const fotoBaru = await uploadFoto(f.get('foto-utama'));
      const isian = {
        name: String(f.get('nama')).trim(),
        description: lama ? `Lama pakai: ${lama}\n\n${deskripsi}` : deskripsi,
        price: harga,
        category: String(f.get('kategori')),
        condition: String(f.get('kondisi')),
        image_url: fotoBaru || (produkLama ? produkLama.image_url : FOTO_DEFAULT),
        seller_name: namaTampil(user)
      };

      let error, data;
      if (produkLama) {
        ({ data, error } = await window.db.from('products').update(isian).eq('id', produkLama.id).select('id'));
        if (!error && !data.length) {
          tampil('Belum bisa mengubah. Jalankan supabase/05-edit-hapus-produk.sql di Supabase.', true);
          return;
        }
      } else {
        ({ error } = await window.db.from('products').insert({ ...isian, user_id: user.id }));
      }
      if (error) {
        console.error('Gagal menyimpan barang:', error);
        tampil('Gagal menyimpan barang. Buka Console (F12) untuk detailnya.', true);
        return;
      }
      tampil(produkLama ? 'Perubahan tersimpan!' : 'Barang berhasil disimpan!');
      setTimeout(() => { location.href = 'dashboard-penjual.html'; }, 800);
    } catch (err) {
      console.error(err);
      tampil(err.message || 'Tidak bisa terhubung ke server.', true);
    } finally {
      tombol.disabled = false;
    }
  });
})();
