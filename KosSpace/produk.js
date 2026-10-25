/* produk.js — SATU-SATUNYA sumber data barang (dipakai beranda, katalog, detail).
   Sekarang data diambil dari tabel "products" di Supabase (butuh supabase.js).
   PRODUK_CONTOH di bawah hanya cadangan kalau Supabase gagal dihubungi. */
const PRODUK_CONTOH = [
  { id: 'rice-cooker-philips-2l', nama: 'Rice Cooker Philips 2L', namaLengkap: 'Rice Cooker Philips 2L HD3119/30',
    harga: 150000, kategori: 'Elektronik', img: 'images/rice-cooker.png', jarak: '2 km', kondisi: 'Sangat Baik', usia: 'Bekas · 1 tahun',
    tersedia: true, baru: true, penjual: 'Teddy', rating: 4.9,
    deskripsi: 'Dijual rice cooker Philips kapasitas 2 liter, kondisi masih sangat bagus karena baru dipakai sekitar 1 tahun. Fungsi normal 100%, tidak ada bagian yang rusak, dan lapisan anti lengket masih mulus. Dijual karena mau pindah kos.',
    poin: ['Kapasitas: 2 liter', 'Kelengkapan: unit rice cooker, sendok nasi, kabel power', 'Minus: ada sedikit baret di bagian luar'] },

  { id: 'meja-belajar-minimalis', nama: 'Meja Belajar Minimalis', namaLengkap: 'Meja Belajar Minimalis',
    harga: 200000, kategori: 'Furniture', img: 'images/meja-belajar.png', jarak: '4 km', kondisi: 'Baik', usia: 'Bekas',
    tersedia: true, baru: true, penjual: 'Teddy', rating: 4.8,
    deskripsi: 'Meja belajar minimalis, kondisi bagus dan kokoh. (Deskripsi contoh — ganti dengan data asli.)',
    poin: ['Kondisi: baik', 'Lokasi: sekitar UNSIKA'] },

  { id: 'kipas-angin-miyako', nama: 'Kipas Angin Miyako', namaLengkap: 'Kipas Angin Miyako',
    harga: 100000, kategori: 'Elektronik', img: 'images/kipas.png', jarak: '1 km', kondisi: 'Baik', usia: 'Bekas',
    tersedia: true, penjual: 'Teddy', rating: 4.7,
    deskripsi: 'Kipas angin Miyako, masih berfungsi normal. (Deskripsi contoh — ganti dengan data asli.)',
    poin: ['Kondisi: baik', 'Lokasi: sekitar UNSIKA'] },

  { id: 'rak-buku', nama: 'Rak Buku', namaLengkap: 'Rak Buku',
    harga: 75000, kategori: 'Furniture', img: 'images/rak-buku.png', jarak: '4 km', kondisi: 'Baik', usia: 'Bekas',
    tersedia: true, penjual: 'Teddy', rating: 4.8,
    deskripsi: 'Rak buku kondisi bagus. (Deskripsi contoh — ganti dengan data asli.)',
    poin: ['Kondisi: baik', 'Lokasi: sekitar UNSIKA'] },

  { id: 'kursi-kerja-nyaman', nama: 'Kursi Kerja Nyaman', namaLengkap: 'Kursi Kerja Nyaman',
    harga: 350000, kategori: 'Furniture', img: '', jarak: '2 km', kondisi: 'Cukup', usia: 'Bekas',
    tersedia: true, beranda: false, penjual: 'Teddy', rating: 4.5,
    deskripsi: 'Kursi kerja nyaman. (Deskripsi contoh — ganti dengan data asli.)',
    poin: ['Kondisi: cukup', 'Lokasi: sekitar UNSIKA'] }
];

window.PRODUK = [];
window.cariProduk = id => window.PRODUK.find(p => p.id === id);

// Halaman lain menunggu ini:  window.produkSiap.then(list => { ... })
window.produkSiap = (async function muatProduk() {
  try {
    if (!window.db) throw new Error('Supabase belum siap');
    const { data, error } = await window.db
      .from('products')
      .select('id, user_id, name, description, price, category, condition, image_url, seller_name, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    window.PRODUK = data.map(produkDariDb);
  } catch (err) {
    console.error('Gagal memuat produk dari Supabase, pakai data contoh:', err);
    window.PRODUK = PRODUK_CONTOH;
  }
  return window.PRODUK;
})();
