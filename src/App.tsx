/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CartItem, OrderRecord, Product } from './types';
import { fetchProducts } from './services/productService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { DuitkuSimulatorModal } from './components/DuitkuSimulatorModal';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TrackingPage } from './pages/TrackingPage';
import { LiveChatPage } from './pages/LiveChatPage';
import { AdminPage } from './pages/AdminPage';
import { Loader2 } from 'lucide-react';

const CART_STORAGE_KEY = 'asri_cart_items';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [simulatorOrder, setSimulatorOrder] = useState<OrderRecord | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Load products from live API
  const loadData = async (forceRefresh = false) => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProducts(forceRefresh);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.warn('Failed to persist cart', err);
    }
  }, [cart]);

  // Cart handlers
  const handleAddToCart = (product: Product, quantityOrEvent?: any) => {
    let qty = 1;
    if (typeof quantityOrEvent === 'number') {
      qty = quantityOrEvent;
    } else if (quantityOrEvent && quantityOrEvent.stopPropagation) {
      quantityOrEvent.stopPropagation();
    }

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.product.id === product.id);
      if (existing) {
        return prevCart.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + qty } : it
        );
      }
      return [...prevCart, { product, quantity: qty }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleCheckoutSuccess = (order: OrderRecord) => {
    // Clear cart on successful order creation
    setCart([]);
  };

  const handleOpenSimulator = (order: OrderRecord) => {
    setSimulatorOrder(order);
    setIsSimulatorOpen(true);
  };

  const handlePaymentSuccess = (updatedOrder: OrderRecord) => {
    setIsSimulatorOpen(false);
    navigate(`/tracking?orderId=${encodeURIComponent(updatedOrder.id)}`);
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const isAdminPage = location.pathname === '/admin';
  const hideBottomNav =
    isAdminPage ||
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/product/');

  if (isLoadingProducts && products.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5]">
        <Loader2 className="w-8 h-8 text-[#C85A32] animate-spin mb-3" />
        <h2 className="font-serif text-base font-bold text-stone-900 tracking-wider">
          ASRI COLLECTION
        </h2>
        <p className="text-xs text-stone-500 mt-1">Mengambil data katalog mewah dari get-asri...</p>
      </div>
    );
  }

  return (
    <>
      {/* Top Header (hidden on admin page) */}
      {!isAdminPage && (
        <Header
          cartCount={totalCartCount}
          openCart={() => setIsCartOpen(true)}
          openSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Main View Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Routes>
          <Route
            path="/"
            element={<HomePage products={products} onAddToCart={handleAddToCart} />}
          />
          <Route
            path="/clothes"
            element={
              <CatalogPage
                category="clothes"
                products={products}
                onAddToCart={handleAddToCart}
              />
            }
          />
          <Route
            path="/bag"
            element={
              <CatalogPage
                category="bag"
                products={products}
                onAddToCart={handleAddToCart}
              />
            }
          />
          <Route
            path="/shoes"
            element={
              <CatalogPage
                category="shoes"
                products={products}
                onAddToCart={handleAddToCart}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage products={products} onAddToCart={handleAddToCart} />
            }
          />
          <Route
            path="/checkout"
            element={
              <CheckoutPage
                items={cart}
                onCheckoutSuccess={handleCheckoutSuccess}
                onOpenSimulator={handleOpenSimulator}
              />
            }
          />
          <Route
            path="/tracking"
            element={<TrackingPage onOpenSimulator={handleOpenSimulator} />}
          />
          <Route path="/livechat" element={<LiveChatPage />} />
          <Route
            path="/admin"
            element={
              <AdminPage
                products={products}
                onProductsUpdated={() => loadData(true)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation (only on main pages, no admin button) */}
      {!hideBottomNav && <BottomNav unreadChatCount={0} />}

      {/* Global Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          navigate('/checkout');
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(product) => {
          navigate(`/product/${product.id}`);
        }}
      />

      <DuitkuSimulatorModal
        isOpen={isSimulatorOpen}
        order={simulatorOrder}
        onClose={() => setIsSimulatorOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}
