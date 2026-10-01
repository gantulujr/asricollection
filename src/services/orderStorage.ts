import {
  CustomerData,
  OrderRecord,
  OrderStatus,
  UserRecord,
} from '../types';
import {
  DUITKU_CONFIG,
  generateCallbackSignature,
  generateRequestSignature,
  verifyCallbackSignature,
} from './duitkuService';
import { fetchProducts, parseNumericPrice } from './productService';

const USERS_STORAGE_KEY = 'asri_collection_users';
const ORDERS_STORAGE_KEY = 'asri_collection_orders';

// Helper to generate 8-character lowercase + alphanumeric user ID
export function generateUserId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateOrderId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ASRI-${dateStr}-${rand}`;
}

export function getUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUser(user: UserRecord): void {
  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.phone === user.phone || u.id === user.id);
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...user, updated_at: new Date().toISOString() };
  } else {
    users.unshift(user);
  }
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Failed to persist users in localStorage', err);
  }
}

export function getOrders(): OrderRecord[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    const orders: OrderRecord[] = raw ? JSON.parse(raw) : [];
    if (orders.length === 0) {
      // Seed initial sample order for instant demo & tracking preview
      const sample = createInitialSampleOrder();
      saveOrder(sample);
      return [sample];
    }
    return orders;
  } catch {
    return [];
  }
}

export function getOrderById(orderId: string): OrderRecord | null {
  const orders = getOrders();
  return (
    orders.find(
      (o) => o.id.toLowerCase() === orderId.toLowerCase() || o.duitku_reference === orderId
    ) || null
  );
}

export function saveOrder(order: OrderRecord): void {
  const orders = getOrders().filter((o) => o.id !== order.id);
  orders.unshift(order);
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.warn('Failed to persist orders in localStorage', err);
  }
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): OrderRecord | null {
  const order = getOrderById(orderId);
  if (!order) return null;

  order.order_status = newStatus;
  order.updated_at = new Date().toISOString();

  // If status is Shipped, ensure tracking number is present
  if (newStatus === 'Shipped' && !order.tracking_number) {
    order.tracking_number = 'ASRI-EXP-' + Math.floor(100000000 + Math.random() * 900000000);
  }

  saveOrder(order);
  return order;
}

export interface CheckoutPayload {
  customer: CustomerData;
  items: { product_id: string; quantity: number }[];
  shipping_fee: number;
  payment_method: string;
  expiry_period?: number; // minutes
}

export interface CheckoutResponse {
  success: boolean;
  order: OrderRecord;
  paymentUrl: string;
  duitkuReference: string;
  qrString?: string;
  vaNumber?: string;
  message?: string;
}

/**
 * Server-authoritative Checkout Engine:
 * - Frontend does NOT dictate item prices
 * - Resolves actual price, availability, and inventory from get-asri
 * - Calculates subtotal and total
 * - Generates Duitku Create Invoice HMAC_SHA256 signature
 * - Persists User & Order
 */
export async function executeCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const products = await fetchProducts();
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Calculate snapshot & subtotal authoritatively from server product list
  const snapshotItems: OrderRecord['items'] = [];
  let subtotal = 0;

  for (const item of payload.items) {
    const prod = productMap.get(item.product_id);
    if (!prod) {
      throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
    }

    const saleNum = parseNumericPrice(prod.sale_price);
    const regNum = parseNumericPrice(prod.price);
    const unitPrice = saleNum > 0 ? saleNum : regNum;

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    snapshotItems.push({
      id: `item-${Date.now()}-${item.product_id}`,
      product_id: prod.id,
      title: prod.title,
      price: unitPrice,
      quantity: item.quantity,
      image_link: prod.image_link || '',
      product_type: prod.product_type || 'Koleksi',
      brand: prod.brand || 'Asri Luxury',
      item_group_id: prod.item_group_id,
    });
  }

  const shipping = Number(payload.shipping_fee) || 0;
  const discount = 0;
  const total = subtotal + shipping - discount;

  // Create or resolve customer user
  const now = new Date().toISOString();
  let user = getUsers().find((u) => u.phone === payload.customer.phone);
  if (!user) {
    user = {
      id: generateUserId(),
      full_name: payload.customer.full_name,
      email: payload.customer.email,
      phone: payload.customer.phone,
      created_at: now,
      updated_at: now,
    };
  } else {
    user.full_name = payload.customer.full_name;
    user.email = payload.customer.email;
    user.updated_at = now;
  }
  saveUser(user);

  const orderId = generateOrderId();
  const timestamp = Date.now().toString();
  const expiryDate = new Date(Date.now() + (payload.expiry_period || 60) * 60 * 1000).toISOString();

  // Compute Duitku Request Signature: HMAC_SHA256(merchantCode + timestamp, apiKey)
  const reqSignature = await generateRequestSignature(
    DUITKU_CONFIG.merchantCode,
    timestamp,
    DUITKU_CONFIG.apiKey
  );

  const duitkuRef = 'DUITKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();

  // Synthetic payment details for Sandbox simulator
  let vaNumber: string | undefined;
  let qrString: string | undefined;

  if (payload.payment_method === 'SP') {
    qrString = `00020101021226670014ID.LINKAJA.WWW01189360091800000000000215${DUITKU_CONFIG.merchantCode}51450015ID.OR.GPN.WWW0215${duitkuRef}520458125303360540${total}5802ID5915ASRI COLLECTION6007JAKARTA6304D1B9`;
  } else if (payload.payment_method.endsWith('VA') || ['BC', 'M2', 'BR'].includes(payload.payment_method)) {
    const bankPrefix = payload.payment_method === 'BC' ? '70012' : payload.payment_method === 'M2' ? '88880' : '10223';
    vaNumber = `${bankPrefix}${payload.customer.phone.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0')}`;
  }

  const newOrder: OrderRecord = {
    id: orderId,
    customer_id: user.id,
    customer: payload.customer,
    order_status: 'Order Created',
    payment_status: 'PENDING',
    subtotal,
    shipping,
    discount,
    total,
    items: snapshotItems,
    payment_method: payload.payment_method,
    duitku_reference: duitkuRef,
    result_code: '01', // Pending
    fee: 0,
    raw_response: {
      merchantCode: DUITKU_CONFIG.merchantCode,
      reference: duitkuRef,
      timestamp,
      signature: reqSignature,
      paymentUrl: `https://sandbox.duitku.com/web/checkout?ref=${duitkuRef}`,
      vaNumber,
      qrString,
    },
    callback_payload: null,
    expiry: expiryDate,
    paid_at: null,
    tracking_number: 'ASRI-EXP-' + Math.floor(100000000 + Math.random() * 900000000),
    shipping_courier: payload.shipping_fee > 35000 ? 'SiCepat BEST (Next Day)' : 'JNE Reguler Express',
    created_at: now,
    updated_at: now,
  };

  saveOrder(newOrder);

  return {
    success: true,
    order: newOrder,
    paymentUrl: `https://sandbox.duitku.com/web/checkout?ref=${duitkuRef}`,
    duitkuReference: duitkuRef,
    vaNumber,
    qrString,
  };
}

/**
 * Handle Duitku Callback Verification:
 * Validates HMAC_SHA256(merchantCode + amount + merchantOrderId, merchantKey)
 * before marking order as PAID.
 */
export async function handleDuitkuCallback(payload: {
  merchantCode: string;
  amount: number | string;
  merchantOrderId: string;
  signature: string;
  resultCode: string;
  reference?: string;
}): Promise<{ success: boolean; message: string; order?: OrderRecord }> {
  const isValid = await verifyCallbackSignature(payload, DUITKU_CONFIG.merchantKey);

  if (!isValid) {
    console.error('Invalid Duitku Callback Signature rejected');
    return {
      success: false,
      message: 'Signature callback tidak valid. Akses ditolak.',
    };
  }

  const order = getOrderById(payload.merchantOrderId);
  if (!order) {
    return {
      success: false,
      message: `Order dengan ID ${payload.merchantOrderId} tidak ditemukan.`,
    };
  }

  // Update order according to resultCode ('00' = Success)
  if (payload.resultCode === '00') {
    order.payment_status = 'PAID';
    order.order_status = 'Paid';
    order.result_code = '00';
    order.paid_at = new Date().toISOString();
    order.callback_payload = payload;
    order.updated_at = new Date().toISOString();
    saveOrder(order);

    return {
      success: true,
      message: 'Pembayaran Duitku berhasil diverifikasi.',
      order,
    };
  } else {
    order.payment_status = 'FAILED';
    order.result_code = payload.resultCode;
    order.callback_payload = payload;
    order.updated_at = new Date().toISOString();
    saveOrder(order);

    return {
      success: false,
      message: `Status pembayaran tidak berhasil: ${payload.resultCode}`,
      order,
    };
  }
}

/**
 * Create a mock completed callback payload with a valid HMAC-SHA256 signature
 * for sandbox simulation.
 */
export async function simulateDuitkuPaymentSuccess(
  order: OrderRecord
): Promise<{ success: boolean; message: string; order: OrderRecord }> {
  const sig = await generateCallbackSignature(
    DUITKU_CONFIG.merchantCode,
    order.total,
    order.id,
    DUITKU_CONFIG.merchantKey
  );

  const callbackData = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    amount: order.total,
    merchantOrderId: order.id,
    signature: sig,
    resultCode: '00',
    reference: order.duitku_reference,
  };

  const res = await handleDuitkuCallback(callbackData);
  if (!res.success || !res.order) {
    throw new Error(res.message);
  }

  return {
    success: true,
    message: 'Simulasi pembayaran Duitku berhasil. Pesanan berstatus PAID.',
    order: res.order,
  };
}

function createInitialSampleOrder(): OrderRecord {
  const now = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
  return {
    id: 'ASRI-20261001-DEMO',
    customer_id: 'usr7k9b2',
    customer: {
      full_name: 'Jessica Maharani',
      email: 'jessica.m@example.com',
      phone: '081288992233',
      address: 'Jl. Senopati No. 42, Kebayoran Baru',
      city: 'Jakarta Selatan',
      postal_code: '12190',
    },
    order_status: 'Processing',
    payment_status: 'PAID',
    subtotal: 9950000,
    shipping: 40000,
    discount: 0,
    total: 9990000,
    items: [
      {
        id: 'item-demo-1',
        product_id: '2e0c2fa6',
        title: 'GG Emblem mini wallet',
        price: 9950000,
        quantity: 1,
        image_link:
          'https://media.gucci.com/style/DarkGray_Center_0_0_490x490/1730792709/820692_FAD6L_9758_001_080_0000_Light-GG-Emblem-mini-wallet.jpg',
        product_type: 'Tas',
        brand: 'Gucci',
        item_group_id: 'ASRI-TAS-001',
      },
    ],
    payment_method: 'SP',
    duitku_reference: 'DUITKU-DEMO-9912',
    result_code: '00',
    fee: 0,
    raw_response: { status: 'mock_initial' },
    callback_payload: { resultCode: '00', status: 'verified' },
    expiry: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    paid_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    tracking_number: 'ASRI-EXP-882910492',
    shipping_courier: 'SiCepat BEST (Next Day)',
    created_at: now,
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  };
}
