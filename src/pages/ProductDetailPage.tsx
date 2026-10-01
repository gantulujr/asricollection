import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Check } from 'lucide-react';
import { Product } from '../types';
import { formatRupiah, parseAdditionalImages, parseNumericPrice } from '../services/productService';

interface ProductDetailPageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  products,
  onAddToCart,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = products.find((p) => p.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <h2 className="font-serif text-base font-bold text-stone-900">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-stone-500 mt-1">
          Koleksi yang Anda cari mungkin sudah tidak tersedia atau link tidak valid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C85A32]"
        >
          Kembali ke Home
        </button>
      </div>
    );
  }

  const images = parseAdditionalImages(product);

  const saleNum = parseNumericPrice(product.sale_price);
  const regNum = parseNumericPrice(product.price);
  const displayPrice = saleNum > 0 ? saleNum : regNum;
  const isSale = saleNum > 0 && saleNum < regNum;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    onAddToCart(product, quantity);
    navigate('/checkout');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Top Breadcrumb Bar */}
      <div className="shrink-0 px-4 py-2.5 flex items-center justify-between border-b border-[#EAE4DC] bg-[#FAF8F5]">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }}
          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
        <span className="text-[11px] font-mono text-stone-500 uppercase">
          SKU: {product.item_group_id || product.id}
        </span>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* Main Image View */}
        <div className="relative aspect-square w-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center border-b border-[#EAE4DC]">
          <img
            src={images[activeImageIndex] || product.image_link}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-300"
          />

          {/* Floating Stock Indicator */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-stone-800 border border-stone-200">
            {product.availability === 'in stock' ? 'Tersedia' : 'Stok Terbatas'}
          </div>
        </div>

        {/* Thumbnail Gallery Navigation */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto border-b border-[#EAE4DC] bg-[#FAF8F5] custom-scroll">
            {images.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-14 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx
                    ? 'border-[#C85A32] shadow-xs scale-102'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${product.title} thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Product Details Section */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
              <span>{product.brand || 'ASRI LUXURY'}</span>
              <span aria-hidden="true">·</span>
              <span>{product.product_type}</span>
            </div>

            <h1 className="font-serif text-xl font-bold text-stone-900 leading-snug">
              {product.title}
            </h1>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold text-stone-900 tabular-nums">
                {formatRupiah(displayPrice)}
              </span>
              {isSale && (
                <span className="font-mono text-sm text-stone-400 line-through tabular-nums">
                  {formatRupiah(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Stepper */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-700">Jumlah Pembelian:</span>
            <div className="flex items-center border border-stone-300">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-mono text-sm"
                aria-label="Kurang satu"
              >
                -
              </button>
              <span className="w-10 text-center font-mono text-sm font-semibold text-stone-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-mono text-sm"
                aria-label="Tambah satu"
              >
                +
              </button>
            </div>
          </div>

          {/* Description & Specs */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <h3 className="font-serif text-sm font-bold text-stone-900">Deskripsi & Spesifikasi</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {product.description ||
                `Karya adiluhung desainer ternama dengan material kelas satu, jahitan presisi, dan proporsi sempurna. Setiap detail mencerminkan dedikasi artisan terhadap kemewahan sejati.`}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
              <div className="p-2 bg-[#FAF8F5] border border-stone-200">
                <span className="text-stone-400 block">Kondisi:</span>
                <span className="font-medium text-stone-800 capitalize">
                  {product.condition || 'New (Baru)'}
                </span>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-stone-200">
                <span className="text-stone-400 block">Kategori:</span>
                <span className="font-medium text-stone-800">{product.product_type}</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C85A32]" />
              <span>Garansi 100% Autentikasi Keaslian Seumur Hidup</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#C85A32]" />
              <span>Pengiriman Cepat Berasuransi Seluruh Wilayah RI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Added Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-4 py-2 text-xs flex items-center gap-2 shadow-xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Berhasil dimasukkan ke tas belanja</span>
        </div>
      )}

      {/* Bottom Action Bar (ALWAYS pinned at the bottom like BottomNav) */}
      <div className="shrink-0 w-full p-3 bg-white/95 backdrop-blur-md border-t border-[#EAE4DC] flex gap-2 shadow-lg select-none z-30">
        <button
          onClick={handleAdd}
          className="flex-1 py-3 border border-stone-900 text-stone-900 font-semibold text-xs uppercase tracking-wider hover:bg-stone-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Tambah Tas</span>
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 py-3 bg-[#C85A32] hover:bg-[#A34827] text-white font-semibold text-xs uppercase tracking-wider shadow-md active:scale-[0.99] transition-all flex items-center justify-center"
        >
          <span>Beli Sekarang</span>
        </button>
      </div>
    </div>
  );
};
