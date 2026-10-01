import React, { useState, useMemo } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah } from '../services/productService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.product_type && p.product_type.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [query, products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-start">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-[500px] mx-auto bg-white shadow-2xl flex flex-col max-h-[85%] z-10">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#EAE4DC] flex items-center gap-3 bg-[#FAF8F5]">
          <Search className="w-5 h-5 text-stone-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pakaian, tas, sepatu, atau brand..."
            autoFocus
            className="flex-1 bg-transparent text-stone-900 placeholder:text-stone-400 text-sm focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-950 font-medium"
            >
              Batal
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scroll">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-stone-400">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
              <p className="text-xs">Ketik kata kunci untuk mencari koleksi desainer Asri</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {['Gucci', 'Tas', 'Clothing', 'Shoes', 'Wallet'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs bg-stone-100 text-stone-700 hover:bg-stone-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-stone-500">
              <p className="text-sm font-medium">Tidak ada hasil ditemukan</p>
              <p className="text-xs text-stone-400 mt-1">
                Coba gunakan kata kunci umum seperti 'tas' atau 'gucci'
              </p>
            </div>
          ) : (
            filtered.map((product) => {
              const price =
                typeof product.sale_price === 'number' && product.sale_price > 0
                  ? product.sale_price
                  : product.price;

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-2.5 border border-transparent hover:border-[#EAE4DC] hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <img
                    src={product.image_link}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] tracking-wider uppercase text-stone-400 font-medium">
                      {product.brand || 'ASRI'} · {product.product_type}
                    </span>
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {product.title}
                    </h4>
                    <p className="font-mono text-xs font-bold text-stone-900 tabular-nums">
                      {formatRupiah(price)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
