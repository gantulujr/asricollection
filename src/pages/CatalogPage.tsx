import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { filterProductsByCategory, parseNumericPrice } from '../services/productService';

interface CatalogPageProps {
  category?: 'clothes' | 'bag' | 'shoes';
  products: Product[];
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onSelectProduct?: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  category: propCategory,
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const location = useLocation();

  // Resolve category from prop or pathname
  const activeCategory: 'clothes' | 'bag' | 'shoes' = useMemo(() => {
    if (propCategory) return propCategory;
    if (location.pathname.includes('clothes')) return 'clothes';
    if (location.pathname.includes('bag')) return 'bag';
    if (location.pathname.includes('shoes')) return 'shoes';
    return 'clothes';
  }, [propCategory, location.pathname]);

  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const categoryTitle =
    activeCategory === 'clothes'
      ? 'Koleksi Busana & Pakaian'
      : activeCategory === 'bag'
      ? 'Koleksi Tas & Dompet'
      : 'Koleksi Sepatu & Footwear';

  const categoryDesc =
    activeCategory === 'clothes'
      ? 'Pilihan busana mewah original untuk gaya kasual maupun formal elegan.'
      : activeCategory === 'bag'
      ? 'Koleksi tas jinjing, tote bag, selempang, dan dompet desainer ternama.'
      : 'Sepatu, heels, sneakers, dan sandal eksklusif berkualitas premium.';

  // Filter products by category
  const categoryProducts = useMemo(() => {
    return filterProductsByCategory(products, activeCategory);
  }, [products, activeCategory]);

  // Extract available brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    categoryProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [categoryProducts]);

  // Sort and sub-filter
  const processedProducts = useMemo(() => {
    let result = [...categoryProducts];

    if (brandFilter !== 'all') {
      result = result.filter((p) => p.brand === brandFilter);
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const pa = parseNumericPrice(a.sale_price) || parseNumericPrice(a.price);
        const pb = parseNumericPrice(b.sale_price) || parseNumericPrice(b.price);
        return pa - pb;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const pa = parseNumericPrice(a.sale_price) || parseNumericPrice(a.price);
        const pb = parseNumericPrice(b.sale_price) || parseNumericPrice(b.price);
        return pb - pa;
      });
    }

    return result;
  }, [categoryProducts, brandFilter, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto pb-8 custom-scroll">
      {/* Category Header */}
      <div className="px-4 pt-5 pb-4 bg-white border-b border-[#EAE4DC]">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C85A32]">
          ASRI CATALOG
        </span>
        <h1 className="font-serif text-xl font-bold text-stone-900 mt-0.5">{categoryTitle}</h1>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{categoryDesc}</p>

        {/* Filter & Sort Bar */}
        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-stone-100">
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            {processedProducts.length} Produk
          </span>

          <div className="flex items-center gap-2">
            {/* Brand Filter */}
            {brands.length > 1 && (
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="text-xs bg-[#FAF8F5] border border-stone-200 px-2 py-1.5 text-stone-700 focus:outline-none"
              >
                <option value="all">Semua Brand</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-[#FAF8F5] border border-stone-200 px-2 py-1.5 text-stone-700 focus:outline-none"
            >
              <option value="featured">Pilihan Teratas</option>
              <option value="price-asc">Harga: Terendah</option>
              <option value="price-desc">Harga: Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        {processedProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <p className="font-serif text-sm font-semibold">Belum ada produk untuk kategori ini</p>
            <p className="text-xs text-stone-400 mt-1">Silakan periksa kembali beberapa saat lagi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {processedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
