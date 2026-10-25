/* detail-produk.js — isi halaman detail sesuai ?id= di URL */
window.produkSiap.then(function () {
  const id = new URLSearchParams(location.search).get('id');
  const p = window.cariProduk(id);
  const $ = s => document.getElementById(s);
  const rupiah = n => 'Rp' + n.toLocaleString('id-ID');

  if (!p) {
    $('p-detail').hidden = true;
    $('p-kosong').hidden = false;
    document.title = 'Produk tidak ditemukan - Kosspace';
    return;
  }

  document.title = p.namaLengkap + ' - Kosspace';
  $('p-nama').textContent = p.namaLengkap;
  $('p-harga').textContent = rupiah(p.harga);
  $('p-desk').textContent = p.deskripsi;
  $('p-penjual').textContent = p.penjual;
  $('p-rating').textContent = p.rating ? '\u2605 ' + p.rating.toFixed(1) : 'Belum ada ulasan';
  $('p-avatar').textContent = p.penjual.split(/\s+/).map(k => k[0]).slice(0, 2).join('').toUpperCase();

  $('p-poin').replaceChildren(...p.poin.map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));

  const tags = [p.kategori, p.usia || p.kondisi];
  const ul = $('p-tags');
  tags.forEach(t => { const li = document.createElement('li'); li.className = 'tag'; li.textContent = t; ul.appendChild(li); });
  const st = document.createElement('li');
  st.className = 'tag tag--pin';
  st.textContent = p.tersedia ? 'Tersedia' : 'Terjual';
  ul.appendChild(st);

  // foto: kalau kosong, biarkan app.js menampilkan placeholder
  const foto = $('foto-utama'), thumb = $('thumb-1').querySelector('img');
  foto.alt = p.namaLengkap;
  foto.src = p.img || 'about:blank';
  thumb.src = p.img || 'about:blank';
});
