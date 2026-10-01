import React, { useState } from 'react';
import { X, CheckCircle2, QrCode, Copy, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatRupiah } from '../services/productService';
import { simulateDuitkuPaymentSuccess } from '../services/orderStorage';
import { DUITKU_CONFIG } from '../services/duitkuService';

interface DuitkuSimulatorModalProps {
  isOpen: boolean;
  order: OrderRecord | null;
  onClose: () => void;
  onPaymentSuccess: (updatedOrder: OrderRecord) => void;
}

export const DuitkuSimulatorModal: React.FC<DuitkuSimulatorModalProps> = ({
  isOpen,
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const vaNumber =
    order.raw_response?.vaNumber ||
    `70012${order.customer.phone.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0')}`;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // Simulate real server callback with cryptographic HMAC verification
      const res = await simulateDuitkuPaymentSuccess(order);
      if (res.success && res.order) {
        setTimeout(() => {
          setIsProcessing(false);
          onPaymentSuccess(res.order);
        }, 1000);
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Gagal memproses simulasi pembayaran');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodTitle = () => {
    if (order.payment_method === 'SP') return 'Duitku QRIS (All Banks & Wallets)';
    if (order.payment_method === 'BC') return 'BCA Virtual Account';
    if (order.payment_method === 'M2') return 'Mandiri Virtual Account';
    if (order.payment_method === 'BR') return 'BRI Virtual Account';
    if (order.payment_method === 'VC') return 'Credit Card / Visa Mastercard';
    if (order.payment_method === 'SA') return 'ShopeePay Instant';
    return 'Duitku Payment Gateway';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-[440px] bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Duitku Sandbox Banner */}
        <div className="bg-amber-500 text-stone-950 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
            <span>DUITKU SANDBOX ENVIRONMENT</span>
          </div>
          <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5">DEV SIMULATOR</span>
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-stone-500">
              Payment Gateway
            </span>
            <h3 className="font-serif text-base font-bold text-stone-900">{getMethodTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-4 space-y-4">
          <div className="bg-[#FAF8F5] border border-[#EAE4DC] p-3 flex justify-between items-center">
            <div>
              <p className="text-[11px] text-stone-500">Total Tagihan Pembayaran</p>
              <p className="font-mono text-lg font-bold text-stone-900 tabular-nums">
                {formatRupiah(order.total)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-stone-400">Order ID</p>
              <p className="font-mono text-xs font-semibold text-stone-800">{order.id}</p>
            </div>
          </div>

          {/* Payment Method Specific Content */}
          {order.payment_method === 'SP' ? (
            /* QRIS View */
            <div className="text-center p-3 border border-stone-200 bg-white">
              <div className="w-44 h-44 mx-auto border-2 border-stone-900 p-2 flex items-center justify-center bg-white shadow-xs">
                {/* Visual QR Code Representation */}
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 p-2 relative">
                  <QrCode className="w-32 h-32 text-stone-900" />
                  <span className="text-[8px] font-mono tracking-tighter text-stone-600 bg-white px-1 border border-stone-300 mt-1">
                    ASRI · DUITKU QRIS
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-600 mt-3 font-medium">
                Pindai QRIS menggunakan aplikasi m-Banking atau E-Wallet pilihan Anda
              </p>
            </div>
          ) : order.payment_method.endsWith('VA') || ['BC', 'M2', 'BR'].includes(order.payment_method) ? (
            /* Virtual Account View */
            <div className="p-3 border border-stone-200 bg-white space-y-2">
              <span className="text-xs text-stone-500">Nomor Virtual Account:</span>
              <div className="flex items-center justify-between p-2.5 bg-stone-100 border border-stone-200">
                <span className="font-mono text-base font-bold text-stone-900 tracking-wider">
                  {vaNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(vaNumber)}
                  className="flex items-center gap-1 text-xs text-[#C85A32] font-semibold hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Lakukan transfer tepat sesuai nominal yang tertera ke nomor VA di atas.
              </p>
            </div>
          ) : (
            /* Card or E-Wallet View */
            <div className="p-3 border border-stone-200 bg-white space-y-2 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-700 stroke-[1.5]" />
              <p className="text-xs font-semibold text-stone-900">
                Simulasi Pembayaran Terverifikasi
              </p>
              <p className="text-[11px] text-stone-500">
                Duitku 3D Secure / E-Wallet token telah diterbitkan dengan referensi:{' '}
                <span className="font-mono font-medium text-stone-800">
                  {order.duitku_reference}
                </span>
              </p>
            </div>
          )}

          {/* Duitku Verification Note */}
          <div className="text-[11px] text-stone-600 bg-stone-50 p-2.5 border-l-2 border-[#C85A32] space-y-1">
            <p className="font-semibold text-stone-800">Verifikasi Callback Duitku:</p>
            <p>
              Menekan tombol di bawah akan memicu callback Duitku dengan validasi signature{' '}
              <code className="bg-stone-200 px-1 font-mono text-[10px]">HMAC_SHA256</code> ke backend
              dan mengubah status pesanan menjadi <span className="font-bold text-emerald-700">PAID</span>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Simulation Action Button */}
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#C85A32] hover:bg-[#A34827] text-white font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memvalidasi Signature Callback...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulasi Bayar Berhasil (Duitku Callback)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
