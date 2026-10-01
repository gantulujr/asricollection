import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  products: Product[];
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onSelectProduct?: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const navigate = useNavigate();
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto pb-8 custom-scroll">
      {/* Editorial Luxury Hero */}
      <section className="relative bg-[#1C1917] text-white px-5 pt-8 pb-10 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C85A32_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col items-start max-w-sm">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#E08A67] font-semibold mb-2">
            AUTUMN / WINTER 2026
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight leading-tight text-[#FAF8F5]">
            Kemewahan Otentik, Dirancang untuk Persona Berkelas.
          </h1>
          <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
            Eksplorasi koleksi busana haute couture, tas eksklusif, dan sepatu desainer original
            dengan jaminan sertifikasi resmi.
          </p>

          <div className="flex items-center gap-2.5 mt-5">
            <button
              onClick={() => navigate('/bag')}
              className="px-4 py-2.5 bg-[#C85A32] hover:bg-[#A34827] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
            >
              Koleksi Tas
            </button>
            <button
              onClick={() => navigate('/clothes')}
              className="px-4 py-2.5 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-wider transition-colors border border-stone-700"
            >
              Pakaian
            </button>
          </div>
        </div>
      </section>

      {/* Category Spotlight Tiles */}
      <section className="px-4 py-6 bg-[#F3EFEA]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm font-bold text-stone-900 tracking-wide uppercase">
            Kategori Utama
          </h2>
          <span className="text-[11px] text-stone-500">Pilihan Eksklusif</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => navigate('/clothes')}
            className="flex flex-col items-center p-3 bg-white border border-[#EAE4DC] hover:border-[#C85A32] transition-colors text-center group"
          >
            <span className="font-serif text-xs font-bold text-stone-900 group-hover:text-[#C85A32]">
              Clothes
            </span>
            <span className="text-[10px] text-stone-500 mt-0.5">Pakaian</span>
          </button>

          <button
            onClick={() => navigate('/bag')}
            className="flex flex-col items-center p-3 bg-white border border-[#EAE4DC] hover:border-[#C85A32] transition-colors text-center group"
          >
            <span className="font-serif text-xs font-bold text-stone-900 group-hover:text-[#C85A32]">
              Bag
            </span>
            <span className="text-[10px] text-stone-500 mt-0.5">Tas & Dompet</span>
          </button>

          <button
            onClick={() => navigate('/shoes')}
            className="flex flex-col items-center p-3 bg-white border border-[#EAE4DC] hover:border-[#C85A32] transition-colors text-center group"
          >
            <span className="font-serif text-xs font-bold text-stone-900 group-hover:text-[#C85A32]">
              Shoes
            </span>
            <span className="text-[10px] text-stone-500 mt-0.5">Sepatu</span>
          </button>
        </div>
      </section>

      {/* Featured Collection Grid */}
      <section className="px-4 pt-6">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C85A32]">
              NEW ARRIVALS
            </span>
            <h2 className="font-serif text-lg font-bold text-stone-900">Koleksi Pilihan Terkini</h2>
          </div>
          <button
            onClick={() => navigate('/clothes')}
            className="text-xs font-semibold text-stone-700 hover:text-[#C85A32] flex items-center gap-1 transition-colors"
          >
            <span>Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Responsive Product Grid */}
        <div className="grid grid-cols-2 gap-3">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Trust & Craftsmanship Pillars */}
      <section className="mt-8 mx-4 p-4 bg-white border border-[#EAE4DC] space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-stone-900">100% Original & Terverifikasi</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Setiap produk melewati autentikasi fisik mendalam oleh kurator ahli Asri.
            </p>
          </div>
        </div>

        <div className="border-t border-stone-100" />

        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-stone-900">Ekspedisi Berasuransi</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Pengiriman aman di seluruh Indonesia dengan pelacakan live dan asuransi total.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
