/* katalog.js — filter, urutan, dan tampilan daftar barang di katalog.html */
(function () {
  const $ = s => document.querySelector(s);
  const form = $('#form-filter');
  const grid = $('#grid-katalog');
  const urutan = $('#urutan');
  const rupiah = n => 'Rp' + n.toLocaleString('id-ID');
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = t => String(t).toLowerCase().replace(/\s+/g, '-');   // "Sangat Baik" -> "sangat-baik"
  const WARNA = { 'sangat-baik': 'dot--teal', 'baik': 'dot--blue', 'cukup': 'dot--orange' };
  const JUDUL = { furniture: 'Furnitur Kos', elektronik: 'Elektronik Kos', dapur: 'Perabot Dapur', lainnya: 'Barang Lainnya' };
  const PER_HALAMAN = 12;

  const ambil = nama => [...form.querySelectorAll(`input[name="${nama}"]:checked`)].map(i => i.value);
  const angka = nama => { const v = form.elements[nama].value; return v === '' ? null : Number(v); };

  function kartu(p) {
    const gambar = p.img
      ? `<img src="${esc(p.img)}" alt="${esc(p.nama)}" loading="lazy">`
      : `<svg viewBox="0 0 96 96" aria-hidden="true"><rect x="8" y="8" width="80" height="80" rx="20" fill="#e4dcff"/><path d="M8 74 L40 40 L66 66 L88 48 V68 a20 20 0 0 1 -20 20 H28 a20 20 0 0 1 -20 -14Z" fill="#3a1fff"/></svg>`;
    return `
      <article class="card">
        <a href="detail-produk.html?id=${encodeURIComponent(p.id)}" class="card__link">
          <div class="card__img${p.img ? '' : ' card__img--empty'}">${gambar}</div>
          <div class="card__body">
            <h3>${esc(p.nama)}</h3>
            <p class="price-tag">${rupiah(p.harga)}</p>
          </div>
          <div class="card__meta">
            <span>${p.jarak ? 'Jarak ' + esc(p.jarak) : esc(p.penjual)}</span>
            <span class="dot ${WARNA[slug(p.kondisi)] || 'dot--blue'}">${esc(p.kondisi)}</span>
          </div>
        </a>
      </article>`;
  }

  function render() {
    const kat = ambil('kategori'), kon = ambil('kondisi');
    let min = angka('harga_min'), maks = angka('harga_maks');
    if (min !== null && maks !== null && min > maks) [min, maks] = [maks, min];

    const hasil = window.PRODUK.filter(p =>
      (!kat.length || kat.includes(slug(p.kategori))) &&
      (!kon.length || kon.includes(slug(p.kondisi))) &&
      (min === null || p.harga >= min) &&
      (maks === null || p.harga <= maks)
    );

    if (urutan.value === 'termurah') hasil.sort((a, b) => a.harga - b.harga);
    else if (urutan.value === 'termahal') hasil.sort((a, b) => b.harga - a.harga);
    // "Terbaru": data dari Supabase sudah diurutkan created_at terbaru di produk.js

    $('#judul-katalog').textContent = kat.length === 1 ? JUDUL[kat[0]] : 'Semua Barang Kos';
    $('#jumlah').textContent = hasil.length;
    $('#pagination').hidden = hasil.length <= PER_HALAMAN;

    grid.innerHTML = hasil.length
      ? hasil.map(kartu).join('')
      : `<div class="empty" style="grid-column:1/-1;padding:40px 0;text-align:center">
           <h2>Barang tidak ditemukan</h2>
           <p>Coba ubah filter atau rentang harga kamu.</p>
           <button type="button" class="btn btn--outline" id="hapus-filter">Hapus Semua Filter</button>
         </div>`;
  }

  function kosongkan() {
    form.querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = false; });
    form.elements.harga_min.value = '';
    form.elements.harga_maks.value = '';
    render();
  }

  form.addEventListener('submit', e => { e.preventDefault(); render(); });   // cegah reload halaman
  form.addEventListener('reset', e => { e.preventDefault(); kosongkan(); }); // Reset = kosongkan semua
  form.addEventListener('change', render);                                    // centang langsung berlaku
  form.addEventListener('input', e => { if (e.target.type === 'number') render(); });
  urutan.addEventListener('change', render);
  grid.addEventListener('click', e => { if (e.target.id === 'hapus-filter') kosongkan(); });

  grid.innerHTML = '<p style="grid-column:1/-1;padding:40px 0;text-align:center">Memuat barang...</p>';
  window.produkSiap.then(render);
})();
