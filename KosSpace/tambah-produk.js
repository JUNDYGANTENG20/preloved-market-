/* tambah-produk.js — simpan barang baru ke tabel "products" di Supabase.
   Butuh supabase.js. Foto diupload ke Storage bucket BUCKET_FOTO;
   kalau bucket belum dibuat, barang tetap tersimpan dengan foto bawaan. */
(function () {
  const FOTO_DEFAULT = 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=75&auto=format&fit=crop';
  const form = document.getElementById('form-produk');
  const tombol = document.getElementById('tombol-kirim');
  const status = document.getElementById('status-produk');
  let user = null;

  function tampil(teks, galat) {
    status.textContent = teks;
    status.style.color = galat ? '#c0392b' : '#0f6b5c';
    status.hidden = !teks;
  }

  // Wajib login
  ambilSesi().then(sesi => {
    if (!sesi) { location.replace('masuk.html'); return; }
    user = sesi.user;
    const nama = namaTampil(user);
    document.getElementById('nama-user').textContent = nama;
    document.getElementById('avatar-user').textContent =
      nama.split(/\s+/).map(k => k[0]).slice(0, 2).join('').toUpperCase();
  });

  async function uploadFoto(file) {
    if (!file || !file.size) return FOTO_DEFAULT;
    if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran foto maksimal 5MB.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await window.db.storage.from(BUCKET_FOTO).upload(path, file, { contentType: file.type });
    if (error) {
      console.warn('Upload foto gagal (bucket "' + BUCKET_FOTO + '" sudah dibuat?). Pakai foto bawaan.', error);
      return FOTO_DEFAULT;
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
      const imageUrl = await uploadFoto(f.get('foto-utama'));
      const { error } = await window.db.from('products').insert({
        user_id: user.id,
        name: String(f.get('nama')).trim(),
        description: lama ? `Lama pakai: ${lama}\n\n${deskripsi}` : deskripsi,
        price: harga,
        category: String(f.get('kategori')),
        condition: String(f.get('kondisi')),
        image_url: imageUrl,
        seller_name: namaTampil(user)
      });
      if (error) {
        console.error('Gagal menyimpan barang:', error);
        tampil('Gagal menyimpan barang. Buka Console (F12) untuk detailnya.', true);
        return;
      }
      tampil('Barang berhasil disimpan!');
      setTimeout(() => { location.href = 'katalog.html'; }, 800);
    } catch (err) {
      console.error(err);
      tampil(err.message || 'Tidak bisa terhubung ke server.', true);
    } finally {
      tombol.disabled = false;
    }
  });
})();
