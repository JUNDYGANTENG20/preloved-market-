/* app.js — dipakai semua halaman Kosspace */

// 1) Foto gagal dimuat -> tampilkan placeholder Kosspace (SVG, tanpa file tambahan)
function buatPlaceholder(img) {
  const lebar = img.clientWidth || 400;
  const alt = (img.alt || '').slice(0, 30).replace(/[&<>"']/g, '');
  const teks = lebar >= 120 && alt
    ? '<text x="200" y="226" text-anchor="middle" font-family="Plus Jakarta Sans,system-ui,sans-serif" font-size="17" font-weight="700" fill="#0f6b5c">' + alt + '</text>'
    : '';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">'
    + '<rect width="400" height="300" fill="#e3efea"/>'
    + '<g transform="translate(0,-14)">'
    + '<path d="M150 118l50-26 50 26-50 26z" fill="#9bc21b"/>'
    + '<path d="M150 118v62l50 28v-66z" fill="#16251f"/>'
    + '<path d="M250 118v62l-50 28v-66z" fill="#0f6b5c"/>'
    + '</g>' + teks + '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function pakaiFallback(img) {
  if (img.dataset.fb) return;
  img.dataset.fb = '1';
  img.src = buatPlaceholder(img);
}
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG') pakaiFallback(e.target);
}, true);
document.querySelectorAll('img').forEach(img => {
  if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) pakaiFallback(img);
});

// 2) Input file: tampilkan nama file; batasi KTM maks 2MB
document.querySelectorAll('.drop input[type="file"]').forEach(input => {
  const label = input.closest('.drop').querySelector('b');
  const awal = label.textContent;
  input.addEventListener('change', () => {
    const file = input.files[0];
    input.setCustomValidity('');
    if (file && input.name === 'ktm' && file.size > 2 * 1024 * 1024) {
      input.setCustomValidity('Ukuran file maksimal 2MB.');
      input.reportValidity();
      input.value = '';
      label.textContent = awal;
      return;
    }
    label.textContent = file ? file.name : awal;
  });
});
