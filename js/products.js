// ======================================================
// products.js — katalog barang dan form tambah barang.
// Membutuhkan Supabase client dari common.js.
// ======================================================

const productGrid = document.querySelector("#productGrid");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const addProductLink = document.querySelector("#mulaiJual");
const productDialog = document.querySelector("#productDialog");
const productForm = document.querySelector("#productForm");
const productStatus = document.querySelector("#productStatus");
const saveProductButton = document.querySelector("#saveProduct");

const PRODUCT_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=75&auto=format&fit=crop";
let productList = [];

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderProducts(products) {
  const query = searchInput.value.trim().toLocaleLowerCase("id");
  const matchingProducts = products.filter((product) => {
    const searchableText = `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase("id");
    return searchableText.includes(query);
  });

  productGrid.innerHTML = "";
  if (matchingProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty product-loading">Barang tidak ditemukan. Coba kata kunci lain.</p>';
    return;
  }

  productGrid.innerHTML = matchingProducts
    .map((product) => {
      const imageUrl = product.image_url || PRODUCT_IMAGE_FALLBACK;
      return `
        <article class="product">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <span class="tag-baru">${escapeHtml(product.category)}</span>
          <div class="product-body">
            <h3>${escapeHtml(product.name)}</h3>
            <p class="price">${formatRupiah(product.price)}</p>
            <p class="product-description">${escapeHtml(product.description)}</p>
            <div class="meta">
              <span>${escapeHtml(product.seller_name)}</span>
              <span>${escapeHtml(product.created_at ? new Date(product.created_at).toLocaleDateString("id-ID") : "")}</span>
            </div>
            <span class="product-condition">${escapeHtml(product.condition)}</span>
          </div>
        </article>`;
    })
    .join("");
}

async function loadProducts() {
  if (!konfigurasiSiap()) {
    productGrid.innerHTML = '<p class="empty product-loading">Konfigurasi Supabase belum siap.</p>';
    return;
  }

  productGrid.innerHTML = '<p class="empty product-loading">Memuat barang...</p>';
  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("id, user_id, name, description, price, category, condition, image_url, seller_name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gagal memuat barang:", error);
      productGrid.innerHTML = '<p class="empty product-loading">Gagal memuat barang. Pastikan tabel products sudah dibuat di Supabase.</p>';
      return;
    }

    productList = data;
    renderProducts(productList);
  } catch (error) {
    console.error("Tidak bisa menghubungi server untuk memuat barang:", error);
    productGrid.innerHTML = '<p class="empty product-loading">Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.</p>';
  }
}

function showProductStatus(message, kind = "") {
  productStatus.textContent = message;
  productStatus.className = kind ? `status status-${kind}` : "status";
}

function closeProductDialog() {
  productDialog.close();
  productForm.reset();
  showProductStatus("");
}

addProductLink.addEventListener("click", async (event) => {
  event.preventDefault();
  const sesi = await ambilSesi();
  if (!sesi) {
    location.href = "login.html";
    return;
  }

  productDialog.showModal();
});

document.querySelector("#closeProductDialog").addEventListener("click", closeProductDialog);
document.querySelector("#cancelProduct").addEventListener("click", closeProductDialog);

productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) closeProductDialog();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderProducts(productList);
});

searchInput.addEventListener("input", () => renderProducts(productList));

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const sesi = await ambilSesi();
  if (!sesi) {
    showProductStatus("Sesi login habis. Silakan masuk lagi.", "galat");
    return;
  }

  const formData = new FormData(productForm);
  const imageUrl = String(formData.get("image_url") || "").trim();
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) {
    showProductStatus("URL foto harus menggunakan HTTPS.", "galat");
    return;
  }

  const product = {
    user_id: sesi.user.id,
    name: String(formData.get("name")).trim(),
    description: String(formData.get("description")).trim(),
    price: Number(formData.get("price")),
    category: String(formData.get("category")),
    condition: String(formData.get("condition")),
    image_url: imageUrl || PRODUCT_IMAGE_FALLBACK,
    seller_name: namaTampil(sesi.user),
  };

  if (!Number.isFinite(product.price) || product.price < 0) {
    showProductStatus("Masukkan harga yang valid.", "galat");
    return;
  }

  saveProductButton.disabled = true;
  showProductStatus("Menyimpan barang...", "ok");
  try {
    const { error } = await supabaseClient.from("products").insert(product);
    if (error) {
      console.error("Gagal menambahkan barang:", error);
      showProductStatus("Gagal menyimpan barang. Pastikan tabel dan kebijakan products sudah diterapkan di Supabase.", "galat");
      return;
    }
  } catch (error) {
    console.error("Tidak bisa menghubungi server untuk menyimpan barang:", error);
    showProductStatus("Tidak bisa terhubung ke server. Periksa koneksi internet lalu coba lagi.", "galat");
    return;
  } finally {
    saveProductButton.disabled = false;
  }

  closeProductDialog();
  await loadProducts();
});

loadProducts();
