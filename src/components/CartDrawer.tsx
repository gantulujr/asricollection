import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { CartItem } from '../types';
import { formatRupiah, parseNumericPrice } from '../services/productService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => {
    const saleNum = parseNumericPrice(item.product.sale_price);
    const regNum = parseNumericPrice(item.product.price);
    const price = saleNum > 0 ? saleNum : regNum;
    return acc + price * item.quantity;
  }, 0);

  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel constrained to mobile width */}
      <div className="relative w-full max-w-[420px] bg-[#FAF8F5] h-full shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAE4DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-800 stroke-[1.8]" />
            <h2 className="font-serif text-lg font-bold text-stone-900">
              Tas Belanja ({totalItemCount})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-400">
                <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
              </div>
              <p className="font-serif text-base font-semibold text-stone-800">
                Tas Belanja Anda Kosong
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-[220px]">
                Pilihlah koleksi pakaian, tas, atau sepatu eksklusif untuk mulai berbelanja.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C85A32] transition-colors"
              >
                Jelajahi Produk
              </button>
            </div>
          ) : (
            items.map((item) => {
              const saleNum = parseNumericPrice(item.product.sale_price);
              const regNum = parseNumericPrice(item.product.price);
              const unitPrice = saleNum > 0 ? saleNum : regNum;

              return (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-white p-3 border border-[#EAE4DC] shadow-2xs"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-stone-100 shrink-0 overflow-hidden border border-stone-100">
                    <img
                      src={item.product.image_link}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                        {item.product.brand || 'ASRI'} · {item.product.product_type}
                      </span>
                      <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">
                        {item.product.title}
                      </h4>
                      <p className="font-mono text-xs font-bold text-stone-900 tabular-nums mt-0.5">
                        {formatRupiah(unitPrice)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100">
                      <div className="flex items-center border border-stone-200 bg-stone-50">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          aria-label="Kurang satu"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-semibold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          aria-label="Tambah satu"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-[#EAE4DC] shadow-lg">
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-stone-600">Subtotal</span>
              <span className="font-mono font-bold text-stone-900 text-base tabular-nums">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Biaya pengiriman dan metode pembayaran dihitung saat checkout.
            </p>
            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="w-full py-3.5 bg-stone-900 hover:bg-[#C85A32] text-white font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
