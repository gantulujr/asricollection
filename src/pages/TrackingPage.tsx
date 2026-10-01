import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { OrderRecord, OrderStatus } from '../types';
import { formatRupiah } from '../services/productService';
import { getOrders, getOrderById } from '../services/orderStorage';

interface TrackingPageProps {
  onOpenSimulator?: (order: OrderRecord) => void;
}

const TIMELINE_STAGES: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  {
    status: 'Order Created',
    label: 'Order Dibuat',
    desc: 'Pesanan telah berhasil dicatat ke sistem',
    icon: CheckCircle2,
  },
  {
    status: 'Payment Pending',
    label: 'Menunggu Pembayaran',
    desc: 'Menunggu konfirmasi pembayaran via Duitku',
    icon: Clock,
  },
  {
    status: 'Paid',
    label: 'Pembayaran Terkonfirmasi',
    desc: 'Duitku webhook callback terverifikasi',
    icon: ShieldCheck,
  },
  {
    status: 'Processing',
    label: 'Diproses Kurator',
    desc: 'Pemeriksaan autentikasi fisik produk',
    icon: Package,
  },
  {
    status: 'Packed',
    label: 'Dikemas Rapi',
    desc: 'Pengemasan luxury box berstempel segel resmi',
    icon: Package,
  },
  {
    status: 'Shipped',
    label: 'Dalam Pengiriman',
    desc: 'Diserahkan ke kurator ekspedisi berasuransi',
    icon: Truck,
  },
  {
    status: 'Delivered',
    label: 'Pesanan Diterima',
    desc: 'Paket telah sampai di alamat tujuan',
    icon: Home,
  },
];

export const TrackingPage: React.FC<TrackingPageProps> = ({ onOpenSimulator }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [searchQuery, setSearchQuery] = useState(urlOrderId || '');
  const [activeOrder, setActiveOrder] = useState<OrderRecord | null>(null);
  const [allOrders, setAllOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    const orders = getOrders();
    setAllOrders(orders);

    if (urlOrderId) {
      const found = getOrderById(urlOrderId);
      if (found) {
        setActiveOrder(found);
        setSearchQuery(found.id);
        return;
      }
    }

    if (orders.length > 0) {
      setActiveOrder(orders[0]);
      setSearchQuery(orders[0].id);
    }
  }, [urlOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = getOrderById(searchQuery.trim());
    setActiveOrder(found || null);
    if (found) {
      setSearchParams({ orderId: found.id });
    }
  };

  const getStageIndex = (status: OrderStatus) => {
    return TIMELINE_STAGES.findIndex((s) => s.status === status);
  };

  const currentStageIdx = activeOrder ? getStageIndex(activeOrder.order_status) : -1;

  return (
    <div className="flex-1 overflow-y-auto pb-12 bg-[#FAF8F5] custom-scroll">
      {/* Header Search */}
      <div className="p-4 bg-white border-b border-[#EAE4DC] space-y-3">
        <div>
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C85A32]">
            LIVE TRACKING
          </span>
          <h1 className="font-serif text-lg font-bold text-stone-900">Lacak Status Pesanan</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Masukkan Order ID atau referensi Duitku untuk memantau progres pengiriman.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: ASRI-20261001-XXXX"
              className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 uppercase"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C85A32] transition-colors"
          >
            Lacak
          </button>
        </form>

        {/* Quick Recent Order Switcher */}
        {allOrders.length > 1 && (
          <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-[11px] custom-scroll">
            <span className="text-stone-400 shrink-0">Pesanan Lain:</span>
            {allOrders.slice(0, 4).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setActiveOrder(o);
                  setSearchQuery(o.id);
                  setSearchParams({ orderId: o.id });
                }}
                className={`px-2 py-0.5 font-mono text-[10px] shrink-0 border transition-colors ${
                  activeOrder?.id === o.id
                    ? 'border-[#C85A32] bg-[#FAF8F5] text-[#C85A32] font-semibold'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                }`}
              >
                {o.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Order View */}
      {activeOrder ? (
        <div className="p-4 space-y-4">
          {/* Status Overview Card */}
          <div className="bg-white border border-[#EAE4DC] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-400">Order ID</p>
                <p className="font-mono text-sm font-bold text-stone-900">{activeOrder.id}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Dibuat pada{' '}
                  {new Date(activeOrder.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                    activeOrder.payment_status === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeOrder.payment_status === 'PAID' ? 'LUNAS (PAID)' : 'MENUNGGU PEMBAYARAN'}
                </span>
                <span className="text-[10px] font-medium text-stone-600">
                  {activeOrder.order_status}
                </span>
              </div>
            </div>

            {/* If pending payment, prompt simulator */}
            {activeOrder.payment_status === 'PENDING' && onOpenSimulator && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 flex items-center justify-between">
                <p className="text-xs text-amber-900 font-medium">
                  Pesanan menunggu pembayaran Duitku.
                </p>
                <button
                  onClick={() => onOpenSimulator(activeOrder)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold uppercase tracking-wider"
                >
                  Buka Simulator
                </button>
              </div>
            )}
          </div>

          {/* 7-Stage Visual Progress Timeline */}
          <div className="bg-white border border-[#EAE4DC] p-4">
            <h3 className="font-serif text-sm font-bold text-stone-900 mb-4">
              Timeline Pengiriman & Status
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {TIMELINE_STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                const IconComponent = stage.icon;

                return (
                  <div key={stage.status} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-[#C85A32] text-white ring-4 ring-[#C85A32]/20'
                          : isPassed
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-100 text-stone-400 border border-stone-200'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <h4
                          className={`text-xs font-semibold ${
                            isCurrent
                              ? 'text-[#C85A32]'
                              : isPassed
                              ? 'text-stone-900'
                              : 'text-stone-400'
                          }`}
                        >
                          {stage.label}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-[#C85A32] uppercase tracking-wider">
                            Status Saat Ini
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping & Recipient Details */}
          <div className="bg-white border border-[#EAE4DC] p-4 space-y-3">
            <h3 className="font-serif text-sm font-bold text-stone-900">Informasi Pengiriman</h3>

            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-400">Kurir Ekspedisi:</span>
                <span className="font-semibold text-stone-800">
                  {activeOrder.shipping_courier}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Nomor Resi:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {activeOrder.tracking_number || 'Sedang dipersiapkan'}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-100">
                <span className="text-stone-400 block mb-0.5">Alamat Tujuan:</span>
                <p className="font-medium text-stone-800">
                  {activeOrder.customer.full_name} ({activeOrder.customer.phone})
                </p>
                <p className="text-stone-600 mt-0.5">
                  {activeOrder.customer.address}, {activeOrder.customer.city},{' '}
                  {activeOrder.customer.postal_code}
                </p>
              </div>
            </div>
          </div>

          {/* Product Items Snapshot */}
          <div className="bg-white border border-[#EAE4DC] p-4 space-y-3">
            <h3 className="font-serif text-sm font-bold text-stone-900">Daftar Produk Pesanan</h3>

            <div className="space-y-2.5">
              {activeOrder.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-2 border-b border-stone-100 last:border-0">
                  <img
                    src={item.image_link}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover bg-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                      {item.brand} · {item.product_type}
                    </span>
                    <h5 className="text-xs font-semibold text-stone-900 truncate">
                      {item.title}
                    </h5>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-stone-500">
                        {item.quantity} × {formatRupiah(item.price)}
                      </span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatRupiah(activeOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-mono tabular-nums">{formatRupiah(activeOrder.shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-900 pt-1 border-t border-stone-100">
                <span>Total Pesanan</span>
                <span className="font-mono text-[#C85A32] tabular-nums">
                  {formatRupiah(activeOrder.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-stone-500">
          <p className="font-serif text-sm font-semibold">Pesanan Tidak Ditemukan</p>
          <p className="text-xs text-stone-400 mt-1">
            Harap pastikan nomor Order ID yang Anda masukkan sudah benar.
          </p>
        </div>
      )}
    </div>
  );
};
