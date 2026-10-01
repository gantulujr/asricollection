import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  cartCount: number;
  openCart: () => void;
  openSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ cartCount, openCart, openSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isMainPage = ['/', '/clothes', '/bag', '/shoes', '/livechat'].includes(location.pathname);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/clothes') return 'Pakaian & Busana';
    if (path === '/bag') return 'Tas & Dompet';
    if (path === '/shoes') return 'Sepatu & Footwear';
    if (path === '/livechat') return 'Asri Concierge';
    if (path === '/checkout') return 'Checkout Pesanan';
    if (path.startsWith('/tracking')) return 'Lacak Pesanan';
    if (path.startsWith('/product/')) return 'Detail Koleksi';
    if (path === '/admin') return 'Admin Portal';
    return 'ASRI COLLECTION';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE4DC] select-none">
      {/* Left Slot */}
      <div className="flex items-center gap-2 min-w-[70px]">
        {!isMainPage ? (
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 active:scale-95 transition-all"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-stone-700">
            <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
            <span className="text-[11px] font-medium tracking-widest uppercase text-stone-500">
              JAKARTA
            </span>
          </div>
        )}
      </div>

      {/* Center Wordmark / Page Title */}
      <div className="flex-1 text-center truncate px-2">
        {location.pathname === '/' ? (
          <button
            onClick={() => navigate('/')}
            className="inline-block hover:opacity-85 transition-opacity"
          >
            <span className="font-serif text-lg font-bold tracking-[0.16em] text-stone-900 uppercase">
              ASRI COLLECTION
            </span>
          </button>
        ) : (
          <span className="font-serif text-base font-semibold text-stone-900 tracking-wide truncate">
            {getPageTitle()}
          </span>
        )}
      </div>

      {/* Right Slot: Actions */}
      <div className="flex items-center justify-end gap-1 min-w-[70px]">
        <button
          onClick={openSearch}
          className="w-9 h-9 flex items-center justify-center rounded-full text-stone-700 hover:text-stone-950 hover:bg-stone-200/50 active:scale-95 transition-all"
          aria-label="Cari Produk"
        >
          <Search className="w-4 h-4 stroke-[2]" />
        </button>

        <button
          onClick={openCart}
          className="relative w-9 h-9 flex items-center justify-center rounded-full text-stone-800 hover:text-stone-950 hover:bg-stone-200/50 active:scale-95 transition-all"
          aria-label="Keranjang Belanja"
        >
          <ShoppingBag className="w-4 h-4 stroke-[2]" />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 bg-[#C85A32] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
