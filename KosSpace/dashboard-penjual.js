/* dashboard-penjual.js — panel penjual: produk milik user yang login.
   Butuh supabase.js. Edit/hapus butuh policy dari supabase/05-edit-hapus-produk.sql */
(function () {
  const $ = s => document.querySelector(s);
  const tbody = $('#tubuh-produk');
  const rupiah = n => 'Rp' + Number(n).toLocaleString('id-ID');
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let user = null;
  let produkSaya = [];

  async function mulai() {
    const sesi = await ambilSesi();
    if (!sesi) { location.replace('masuk.html?next=dashboard-penjual.html'); return; }
    user = sesi.user;

    const nama = namaTampil(user);
    $('#nama-user').textContent = nama;
    $('#email-user').textContent = user.email || '';
    $('#avatar-user').textContent = nama.split(/\s+/).map(k => k[0]).slice(0, 2).join('').toUpperCase();

    $('#tombol-keluar').addEventListener('click', async e => {
      e.preventDefault();
      await window.db.auth.signOut();
      location.replace('index.html');
    });

    muatProduk();
  }

  async function muatProduk() {
    tbody.innerHTML = '<tr><td colspan="4">Memuat produk...</td></tr>';
    const { data, error } = await window.db
      .from('products')
      .select('id, user_id, name, description, price, category, condition, image_url, seller_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat produk:', error);
      tbody.innerHTML = '<tr><td colspan="4">Gagal memuat produk. Buka Console (F12).</td></tr>';
      return;
    }

    produkSaya = data.map(produkDariDb);
    $('#stat-produk').textContent = produkSaya.length;

    if (!produkSaya.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px">Belum ada produk. <a href="tambah-produk.html">Tambah produk pertamamu</a>.</td></tr>';
      return;
    }

    tbody.innerHTML = produkSaya.map(p => `
      <tr>
        <td>
          <div class="cell-item">
            ${p.img ? `<img class="thumb-sm" src="${esc(p.img)}" alt="">` : '<span class="thumb-sm" aria-hidden="true"></span>'}
            <div><b><a href="detail-produk.html?id=${encodeURIComponent(p.id)}" style="color:inherit">${esc(p.nama)}</a></b><small>${esc(p.kategori)} · ${esc(p.usia)}</small></div>
          </div>
        </td>
        <td><b>${rupiah(p.harga)}</b></td>
        <td><span class="pill pill--ok">Aktif</span></td>
        <td>
          <a href="tambah-produk.html?id=${encodeURIComponent(p.id)}" class="icon-btn" aria-label="Ubah ${esc(p.nama)}" title="Ubah">&#9998;</a>
          <button type="button" class="icon-btn" data-hapus="${esc(p.id)}" aria-label="Hapus ${esc(p.nama)}" title="Hapus">&#128465;</button>
        </td>
      </tr>`).join('');
  }

  tbody.addEventListener('click', async e => {
    const tombol = e.target.closest('[data-hapus]');
    if (!tombol) return;
    const p = produkSaya.find(x => x.id === tombol.dataset.hapus);
    if (!p || !confirm(`Hapus "${p.nama}"? Tidak bisa dibatalkan.`)) return;

    const { data, error } = await window.db.from('products').delete().eq('id', p.id).select('id');
    if (error) { console.error(error); alert('Gagal menghapus. Buka Console (F12).'); return; }
    if (!data.length) { alert('Belum bisa menghapus. Jalankan supabase/05-edit-hapus-produk.sql di Supabase.'); return; }
    muatProduk();
  });

  mulai();
})();
