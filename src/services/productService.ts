import { Product, ProductInput } from '../types';

const BASE_URL = 'https://jvqrturbkgyxsycdcfwp.supabase.co/functions/v1';
const ENDPOINT = `${BASE_URL}/asri`;
const CACHE_KEY = 'asri_products_cache';

let memoryCache: Product[] | null = null;

export function parseNumericPrice(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return 'Rp 0';
  const num = typeof amount === 'number' ? amount : parseNumericPrice(amount);
  return 'Rp ' + num.toLocaleString('id-ID');
}

function normalizeProduct(p: any): Product {
  const image =
    p.image_link ||
    (p.additional_image_link ? p.additional_image_link.split(',')[0].trim() : '');

  return {
    ...p,
    image_link: image,
    product_type: p.product_type || (p.item_group_id?.includes('TAS') ? 'Tas' : 'Clothing'),
    brand: p.brand || 'Gucci',
    availability: p.availability || 'in stock',
    condition: p.condition || 'new',
  };
}

/**
 * 1. GET — List Produk
 * GET /asri
 */
export async function fetchProducts(forceRefresh = false): Promise<Product[]> {
  if (!forceRefresh && memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  // Try localStorage cache first for immediate UI responsiveness
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed.map(normalizeProduct);
        }
      }
    } catch (e) {
      console.warn('Error reading product cache from localStorage', e);
    }
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      const normalized = data.map(normalizeProduct);
      memoryCache = normalized;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(normalized));
      } catch (err) {
        // quota exceeded
      }
      return normalized;
    }
  } catch (err) {
    console.error('Error fetching live products from /asri, falling back to cache if available', err);
    if (memoryCache && memoryCache.length > 0) {
      return memoryCache;
    }
  }

  return memoryCache || [];
}

/**
 * 2. GET — Detail Produk
 * GET /asri?id=abc12345
 */
export async function fetchProductDetail(id: string): Promise<Product> {
  const res = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product detail: ${res.status}`);
  }

  const data = await res.json();
  return normalizeProduct(data);
}

/**
 * 3. POST — Insert Produk
 * POST /asri
 * Content-Type: application/json
 */
export async function createProduct(payload: ProductInput): Promise<Product> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menambah produk: ${res.status} ${errText}`);
  }

  const created = await res.json();
  const normalized = normalizeProduct(created);

  // Update in-memory and local cache
  if (memoryCache) {
    memoryCache = [normalized, ...memoryCache];
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
    } catch (e) {
      // ignore
    }
  }

  return normalized;
}

/**
 * 4. PATCH — Update Produk
 * PATCH /asri?id=abc12345
 * Content-Type: application/json
 */
export async function updateProduct(
  id: string,
  payload: Partial<ProductInput>
): Promise<Product> {
  const res = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengubah produk: ${res.status} ${errText}`);
  }

  const updated = await res.json();
  const normalized = normalizeProduct(updated);

  // Update in-memory and local cache
  if (memoryCache) {
    memoryCache = memoryCache.map((p) => (p.id === id ? { ...p, ...normalized } : p));
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
    } catch (e) {
      // ignore
    }
  }

  return normalized;
}

/**
 * 5. DELETE — Hapus Produk
 * DELETE /asri?id=abc12345
 */
export async function deleteProduct(id: string): Promise<{ id: string; deleted: boolean }> {
  const res = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menghapus produk: ${res.status} ${errText}`);
  }

  const result = await res.json();

  // Remove from in-memory and local cache
  if (memoryCache) {
    memoryCache = memoryCache.filter((p) => p.id !== id);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache));
    } catch (e) {
      // ignore
    }
  }

  return result;
}

export function parseAdditionalImages(product: Product): string[] {
  const images: string[] = [];
  if (product.image_link) {
    images.push(product.image_link);
  }
  if (product.additional_image_link) {
    const split = product.additional_image_link
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0 && !images.includes(url));
    images.push(...split);
  }
  return images;
}

export function filterProductsByCategory(products: Product[], category: string): Product[] {
  const cat = category.toLowerCase().trim();
  if (cat === 'home' || cat === 'all' || !cat) {
    return products;
  }
  if (cat === 'clothes' || cat === 'clothing') {
    return products.filter((p) => {
      const t = (p.product_type || '').toLowerCase();
      return t.includes('cloth') || t.includes('pakaian') || t.includes('baju');
    });
  }
  if (cat === 'bag' || cat === 'bags') {
    return products.filter((p) => {
      const t = (p.product_type || '').toLowerCase();
      return t === 'tas' || t.includes('bag');
    });
  }
  if (cat === 'shoes') {
    return products.filter((p) => {
      const t = (p.product_type || '').toLowerCase();
      return t.includes('shoe') || t.includes('sepatu');
    });
  }
  return products.filter((p) => (p.product_type || '').toLowerCase() === cat);
}
