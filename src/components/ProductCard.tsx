import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah, parseNumericPrice } from '../services/productService';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelect,
}) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const saleNum = parseNumericPrice(product.sale_price);
  const regNum = parseNumericPrice(product.price);
  const displayPrice = saleNum > 0 ? saleNum : regNum;
  const isSale = saleNum > 0 && saleNum < regNum;

  const categoryLabel = (product.product_type || 'Koleksi').toUpperCase();
  const brandLabel = (product.brand || 'ASRI').toUpperCase();

  const handleClick = () => {
    if (onSelect) {
      onSelect(product);
    }
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col bg-white border border-[#EAE4DC] overflow-hidden cursor-pointer transition-all duration-200 hover:border-stone-400 active:scale-[0.99]"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center">
        {!imageError && product.image_link ? (
          <img
            src={product.image_link}
            alt={product.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-100 text-stone-400">
            <Sparkles className="w-8 h-8 mb-2 stroke-[1.2] text-stone-300" />
            <span className="text-[11px] font-medium tracking-wide uppercase text-stone-500">
              {brandLabel}
            </span>
          </div>
        )}

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product, e);
          }}
          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-stone-900/90 hover:bg-[#C85A32] text-white flex items-center justify-center shadow-md active:scale-90 transition-all opacity-95 group-hover:opacity-100"
          aria-label="Tambah ke Keranjang"
          title="Tambah ke Keranjang"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Product Content */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Metadata Kicker */}
          <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-stone-500 font-medium mb-1">
            <span>{brandLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{categoryLabel}</span>
          </div>

          {/* Title */}
          <h3 className="text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2 min-h-[36px]">
            {product.title}
          </h3>
        </div>

        {/* Price & Stock */}
        <div className="mt-2 pt-2 border-t border-stone-100 flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="font-mono text-[13px] font-bold text-stone-900 tabular-nums">
              {formatRupiah(displayPrice)}
            </span>
            {isSale && (
              <span className="font-mono text-[10px] text-stone-400 line-through tabular-nums">
                {formatRupiah(product.price)}
              </span>
            )}
          </div>

          <span className="text-[10px] font-medium text-emerald-700 tracking-tight">
            {product.availability === 'in stock' || (typeof product.inventory === 'number' && product.inventory > 0)
              ? 'Tersedia'
              : 'Stok Terbatas'}
          </span>
        </div>
      </div>
    </div>
  );
};
