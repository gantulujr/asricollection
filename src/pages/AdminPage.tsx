import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Delete,
  ShieldCheck,
  Package,
  ShoppingBag,
  MessageSquare,
  Search,
  LogOut,
  Send,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { OrderRecord, OrderStatus, Product, ProductInput, AdminTab, ChatMessage } from '../types';
import { getOrders, updateOrderStatus } from '../services/orderStorage';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  formatRupiah,
} from '../services/productService';
import { getChatMessages, sendChatMessage } from '../services/chatStorage';

interface AdminPageProps {
  products: Product[];
  onProductsUpdated?: () => void;
}

const CORRECT_PIN = '677677';

export const AdminPage: React.FC<AdminPageProps> = ({
  products: initialProducts,
  onProductsUpdated,
}) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // Orders State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Product State (Live from /asri)
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Product Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Form inputs for Add / Edit
  const [formData, setFormData] = useState<{
    item_group_id: string;
    title: string;
    description: string;
    availability: string;
    condition: string;
    price: string;
    sale_price: string;
    link: string;
    additional_image_link: string;
  }>({
    item_group_id: '',
    title: '',
    description: '',
    availability: 'in stock',
    condition: 'new',
    price: '',
    sale_price: '',
    link: '',
    additional_image_link: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProducts(true);
      setProductList(data);
      if (onProductsUpdated) onProductsUpdated();
    } catch (err) {
      console.error('Failed to reload products in admin', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadAdminData = () => {
    const ords = getOrders();
    setOrders(ords);
    if (!selectedOrder && ords.length > 0) {
      setSelectedOrder(ords[0]);
    }
    const msgs = getChatMessages();
    setChatMessages(msgs);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
      loadProducts();
      const interval = setInterval(loadAdminData, 4000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Numpad input handler
  const handleDigitPress = (digit: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError(false);

    if (nextPin.length === 6) {
      if (nextPin === CORRECT_PIN) {
        setTimeout(() => {
          setIsAuthenticated(true);
          setPin('');
        }, 150);
      } else {
        setTimeout(() => {
          setPinError(true);
          setPin('');
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClear = () => {
    setPin('');
    setPinError(false);
  };

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, nextStatus);
    if (updated) {
      setSelectedOrder(updated);
      setOrders(getOrders());
      showToast(`Status order ${orderId} diubah ke ${nextStatus}`);
    }
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim()) return;
    sendChatMessage('admin', adminReplyText.trim());
    setAdminReplyText('');
    setChatMessages(getChatMessages());
  };

  // Open Add Product Modal
  const handleOpenAddModal = () => {
    setFormData({
      item_group_id: `TAS-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      description: '',
      availability: 'in stock',
      condition: 'new',
      price: '599000 IDR',
      sale_price: '',
      link: 'https://asricollection.com/product/',
      additional_image_link: '',
    });
    setProductFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      item_group_id: p.item_group_id || '',
      title: p.title || '',
      description: p.description || '',
      availability: p.availability || 'in stock',
      condition: p.condition || 'new',
      price: typeof p.price === 'string' ? p.price : `${p.price} IDR`,
      sale_price: p.sale_price ? (typeof p.sale_price === 'string' ? p.sale_price : `${p.sale_price} IDR`) : '',
      link: p.link || '',
      additional_image_link: p.additional_image_link || p.image_link || '',
    });
    setProductFormError(null);
  };

  // Submit Product Creation (POST /asri)
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      setProductFormError('Judul dan harga wajib diisi');
      return;
    }

    setIsSubmittingProduct(true);
    setProductFormError(null);

    try {
      const payload: ProductInput = {
        item_group_id: formData.item_group_id || `ASRI-${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        availability: formData.availability,
        condition: formData.condition,
        price: formData.price.trim().toUpperCase().includes('IDR')
          ? formData.price.trim()
          : `${formData.price.trim()} IDR`,
        sale_price: formData.sale_price ? formData.sale_price.trim() : null,
        link: formData.link.trim() || `https://asricollection.com/product/${formData.item_group_id}`,
        additional_image_link: formData.additional_image_link.trim(),
      };

      const newProd = await createProduct(payload);
      setProductList((prev) => [newProd, ...prev]);
      setIsAddModalOpen(false);
      showToast('Produk berhasil ditambahkan ke katalog!');
      if (onProductsUpdated) onProductsUpdated();
    } catch (err: any) {
      setProductFormError(err.message || 'Gagal menyimpan produk baru');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Submit Product Update (PATCH /asri?id=...)
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmittingProduct(true);
    setProductFormError(null);

    try {
      const payload: Partial<ProductInput> = {
        title: formData.title.trim(),
        item_group_id: formData.item_group_id.trim(),
        description: formData.description.trim(),
        availability: formData.availability,
        condition: formData.condition,
        price: formData.price.trim(),
        sale_price: formData.sale_price ? formData.sale_price.trim() : null,
        link: formData.link.trim(),
        additional_image_link: formData.additional_image_link.trim(),
      };

      const updated = await updateProduct(editingProduct.id, payload);
      setProductList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
      showToast('Perubahan produk berhasil disimpan!');
      if (onProductsUpdated) onProductsUpdated();
    } catch (err: any) {
      setProductFormError(err.message || 'Gagal memperbarui produk');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Handle Delete (DELETE /asri?id=...)
  const handleDeleteProduct = async (p: Product) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus produk "${p.title}"?`);
    if (!confirmDelete) return;

    try {
      await deleteProduct(p.id);
      setProductList((prev) => prev.filter((item) => item.id !== p.id));
      showToast(`Produk "${p.title}" telah dihapus.`);
      if (onProductsUpdated) onProductsUpdated();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk');
    }
  };

  // If not logged in, render Numpad Gatekeeper UI
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-[#1C1917] text-white p-6 justify-between select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C85A32]" />
            <span className="text-xs uppercase tracking-widest text-stone-400 font-semibold">
              Admin Portal Security
            </span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-stone-400 hover:text-white uppercase tracking-wider"
          >
            Tutup
          </button>
        </div>

        {/* PIN Indicators */}
        <div className="flex flex-col items-center text-center my-auto">
          <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-[#C85A32]" />
          </div>
          <h2 className="font-serif text-xl font-bold tracking-wide">Masukkan PIN Akses</h2>
          <p className="text-xs text-stone-400 mt-1">
            Gunakan 6-digit PIN keamanan admin untuk membuka portal kendali.
          </p>

          {/* 6 Dots Indicator */}
          <div className="flex gap-3 my-6">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const isFilled = pin.length > index;
              return (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    pinError
                      ? 'bg-rose-500 scale-110'
                      : isFilled
                      ? 'bg-[#C85A32] scale-110 shadow-xs'
                      : 'border border-stone-600 bg-stone-900'
                  }`}
                />
              );
            })}
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 font-medium animate-pulse">
              PIN salah. Akses ditolak.
            </p>
          )}
        </div>

        {/* Numpad 3x4 Grid */}
        <div className="w-full max-w-[280px] mx-auto pb-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigitPress(digit)}
                className="h-14 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-lg font-semibold active:scale-95 transition-all text-stone-100 flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-white active:scale-95 flex items-center justify-center"
            >
              Hapus
            </button>
            <button
              onClick={() => handleDigitPress('0')}
              className="h-14 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-lg font-semibold active:scale-95 transition-all text-stone-100 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-14 rounded-full text-stone-400 hover:text-white active:scale-95 flex items-center justify-center"
              aria-label="Hapus satu angka"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Orders
  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer.full_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.order_status.toLowerCase().includes(orderSearch.toLowerCase())
  );

  // Filtered Products
  const filteredProducts = productList.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.product_type && p.product_type.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.item_group_id && p.item_group_id.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2 text-xs flex items-center gap-2 shadow-2xl animate-fade-in border border-stone-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="shrink-0 px-4 py-3 bg-[#1C1917] text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-[#E08A67] font-semibold">
              ASRI ADMIN CONSOLE
            </span>
          </div>
          <h2 className="font-serif text-sm font-bold text-white">
            {activeTab === 'orders'
              ? 'Daftar Pesanan & Status'
              : activeTab === 'products'
              ? 'Katalog Produk (/asri CRUD)'
              : 'Live Chat Konsumen'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAuthenticated(false);
              navigate('/');
            }}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-white transition-colors"
            title="Keluar ke Toko"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* TAB 1: LIST ORDER */}
        {activeTab === 'orders' && (
          <div className="p-4 space-y-4">
            {/* Search Orders */}
            <div className="relative">
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Cari order ID atau nama customer..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#EAE4DC] focus:outline-none focus:border-stone-900"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>

            {/* Orders Feed */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
                  <p className="text-xs">Belum ada pesanan yang sesuai</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3 bg-white border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#C85A32] shadow-xs'
                          : 'border-[#EAE4DC] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {order.id}
                          </span>
                          <p className="text-xs text-stone-700 font-medium mt-0.5">
                            {order.customer.full_name} · {order.customer.phone}
                          </p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                            order.payment_status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[11px]">
                        <span className="text-stone-500">
                          Status: <strong className="text-stone-800">{order.order_status}</strong>
                        </span>
                        <span className="font-mono font-bold text-[#C85A32] tabular-nums">
                          {formatRupiah(order.total)}
                        </span>
                      </div>

                      {/* If Selected: Show Status Update Controls */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-dashed border-stone-200 space-y-2 bg-[#FAF8F5] -mx-3 -mb-3 p-3">
                          <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-wider">
                            Perbarui Status Progres:
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            {(['Processing', 'Packed', 'Shipped', 'Delivered'] as OrderStatus[]).map(
                              (status) => (
                                <button
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, status);
                                  }}
                                  className={`py-1.5 px-2 border text-center font-medium transition-colors ${
                                    order.order_status === status
                                      ? 'bg-stone-900 text-white border-stone-900'
                                      : 'bg-white border-stone-200 text-stone-700 hover:border-[#C85A32]'
                                  }`}
                                >
                                  {status}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIST PRODUCT (FULL CRUD: GET, POST, PATCH, DELETE) */}
        {activeTab === 'products' && (
          <div className="p-4 space-y-3">
            {/* Header Controls: Search & Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari produk / SKU / tipe..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#EAE4DC] focus:outline-none focus:border-stone-900"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>

              <button
                onClick={handleOpenAddModal}
                className="px-3 py-2 bg-[#C85A32] hover:bg-[#A34827] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
              <span>{filteredProducts.length} Produk aktif di Edge Function /asri</span>
              {isLoadingProducts && <Loader2 className="w-3 h-3 animate-spin text-[#C85A32]" />}
            </div>

            {/* Products List Cards */}
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-stone-500 bg-white border border-[#EAE4DC] p-4">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-stone-300 stroke-[1.5]" />
                  <p className="text-xs">Tidak ada produk ditemukan</p>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-[#EAE4DC] flex items-start gap-3 relative group"
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={p.image_link}
                        alt={p.title}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover bg-stone-100 shrink-0 border border-stone-100"
                      />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 pr-14">
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 uppercase font-medium">
                          <span>{p.item_group_id || p.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{p.availability}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">{p.title}</h4>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="font-mono text-xs font-bold text-stone-900 tabular-nums">
                            {formatRupiah(p.price)}
                          </span>
                          {p.sale_price && (
                            <span className="font-mono text-[10px] text-stone-400 line-through tabular-nums">
                              {formatRupiah(p.sale_price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons: Edit & Delete */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors"
                          title="Ubah Produk (PATCH)"
                          aria-label="Ubah Produk"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p)}
                          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors"
                          title="Hapus Produk (DELETE)"
                          aria-label="Hapus Produk"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LIVECHAT (ADMIN CONSOLE) */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full justify-between">
            <div className="flex-1 p-4 space-y-2.5 overflow-y-auto custom-scroll">
              {chatMessages.map((msg) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] text-stone-400 mb-0.5 px-1 font-medium uppercase">
                      {isAdmin ? 'Anda (Admin)' : 'Customer'}
                    </span>
                    <div
                      className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                        isAdmin
                          ? 'bg-stone-900 text-white rounded-lg'
                          : 'bg-white border border-stone-200 text-stone-900 rounded-lg'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span
                        className={`text-[8px] block text-right mt-1 ${
                          isAdmin ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSendAdminReply}
              className="p-3 bg-white border-t border-[#EAE4DC] flex items-center gap-2"
            >
              <input
                type="text"
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder="Balas customer sebagai Admin Asri..."
                className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
              />
              <button
                type="submit"
                disabled={!adminReplyText.trim()}
                className="w-9 h-9 bg-[#C85A32] text-white flex items-center justify-center disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Admin BottomNav (Required: List Order, List Product, LiveChat) */}
      <nav className="shrink-0 sticky bottom-0 z-30 w-full bg-white border-t border-[#EAE4DC] flex items-center justify-around h-14">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            activeTab === 'orders' ? 'text-[#C85A32] font-semibold' : 'text-stone-500'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-1">List Order</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            activeTab === 'products' ? 'text-[#C85A32] font-semibold' : 'text-stone-500'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-[10px] mt-1">List Product</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] transition-colors ${
            activeTab === 'chat' ? 'text-[#C85A32] font-semibold' : 'text-stone-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] mt-1">LiveChat</span>
        </button>
      </nav>

      {/* MODAL: Tambah Produk Baru (POST /asri) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-[440px] bg-white border border-[#EAE4DC] shadow-2xl overflow-hidden flex flex-col max-h-[90%]">
            <div className="p-4 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C85A32] font-semibold">
                  POST /asri
                </span>
                <h3 className="font-serif text-base font-bold text-stone-900">Tambah Produk Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-4 space-y-3 overflow-y-auto custom-scroll">
              {productFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Produk (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Tas Shoulder Premium"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Item Group ID (SKU) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.item_group_id}
                    onChange={(e) => setFormData({ ...formData, item_group_id: e.target.value })}
                    placeholder="TAS-001"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Harga (Price) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="599000 IDR"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Harga Diskon (Sale Price)
                  </label>
                  <input
                    type="text"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="Opsional, cth: 499000 IDR"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Availability
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                  >
                    <option value="in stock">in stock</option>
                    <option value="out of stock">out of stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tas shoulder wanita dengan desain premium."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Link Gambar Utama / Tambahan
                </label>
                <input
                  type="url"
                  value={formData.additional_image_link}
                  onChange={(e) => setFormData({ ...formData, additional_image_link: e.target.value })}
                  placeholder="https://example.com/tas-1.jpg"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="w-full py-3 bg-[#C85A32] hover:bg-[#A34827] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke POST /asri...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Simpan Produk (POST /asri)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah Produk (PATCH /asri?id=...) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-stone-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-[440px] bg-white border border-[#EAE4DC] shadow-2xl overflow-hidden flex flex-col max-h-[90%]">
            <div className="p-4 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C85A32] font-semibold">
                  PATCH /asri?id={editingProduct.id}
                </span>
                <h3 className="font-serif text-base font-bold text-stone-900">Ubah Data Produk</h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-4 space-y-3 overflow-y-auto custom-scroll">
              {productFormError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nama Produk (Title)
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Harga (Price)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Harga Diskon (Sale Price)
                  </label>
                  <input
                    type="text"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="cth: 599000 IDR"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Availability
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                  >
                    <option value="in stock">in stock</option>
                    <option value="out of stock">out of stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Link Gambar
                </label>
                <input
                  type="url"
                  value={formData.additional_image_link}
                  onChange={(e) => setFormData({ ...formData, additional_image_link: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="w-full py-3 bg-stone-900 hover:bg-[#C85A32] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke PATCH /asri...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan (PATCH /asri)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
