/* script.js — khusus beranda (index.html) */
(function () {
  // ===== Data barang: dari produk.js =====
  const PRODUK = window.PRODUK.filter(p => p.beranda !== false);

  const $ = (s, el = document) => el.querySelector(s);
  const rupiah = n => 'Rp' + n.toLocaleString('id-ID');
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const grid = $('#productGrid');
  const emptyMsg = $('#emptyMsg');
  const form = $('#searchForm');
  const input = $('#searchInput');
  const lihatSemua = $('#lihatSemua');

  let kataKunci = '';
  let kategori = '';

  // ===== Render barang =====
  function render() {
    const q = kataKunci.trim().toLowerCase();
    const hasil = PRODUK.filter(p =>
      (!kategori || p.kategori === kategori) &&
      (!q || (p.nama + ' ' + p.kategori).toLowerCase().includes(q))
    );

    grid.innerHTML = hasil.map(p => `
      <article class="product">
        <a href="detail-produk.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.nama)}, ${rupiah(p.harga)}">
          ${p.baru ? '<span class="tag-baru">BARU</span>' : ''}
          <img src="${esc(p.img)}" alt="${esc(p.nama)}" loading="lazy">
          <div class="product-body">
            <h3>${esc(p.nama)}</h3>
            <p class="price">${rupiah(p.harga)}</p>
            <div class="meta"><span>Jarak ${esc(p.jarak)}</span><span>${esc(p.kondisi)}</span></div>
          </div>
        </a>
      </article>`).join('');

    emptyMsg.hidden = hasil.length > 0;

    // tombol "Lihat Semua" berubah jadi "Hapus Filter" saat ada filter
    const aktif = q || kategori;
    lihatSemua.innerHTML = aktif ? 'Hapus Filter &times;' : 'Lihat Semua &rarr;';
    lihatSemua.setAttribute('href', aktif ? '#katalog' : 'katalog.html');
  }

  lihatSemua.addEventListener('click', e => {
    if (kataKunci || kategori) {
      e.preventDefault();
      kataKunci = ''; kategori = ''; input.value = '';
      render();
    }
  });

  // ===== Pencarian =====
  form.addEventListener('submit', e => {
    e.preventDefault();
    kataKunci = input.value;
    kategori = '';
    render();
    $('#katalog').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.textContent.trim();
      form.requestSubmit();
    });
  });

  // ===== Kategori =====
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      kategori = card.dataset.kategori;
      kataKunci = ''; input.value = '';
      render(); // anchor #katalog yang melakukan scroll
    });
  });

  // ===== Menu mobile =====
  const burger = $('#burger');
  const navLinks = $('#navLinks');
  function tutupMenu() {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Buka menu');
  }
  burger.addEventListener('click', () => {
    const buka = !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', buka);
    burger.setAttribute('aria-expanded', String(buka));
    burger.setAttribute('aria-label', buka ? 'Tutup menu' : 'Buka menu');
  });
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) tutupMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tutupMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 700) tutupMenu(); });

  // ===== Tandai menu aktif saat scroll =====
  const tautan = [...navLinks.querySelectorAll('a[href^="#"]')];
  const seksi = tautan.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entri => {
      entri.forEach(en => {
        if (!en.isIntersecting) return;
        tautan.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    seksi.forEach(s => io.observe(s));
  }

  render();
})();
