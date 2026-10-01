export interface Product {
  id: string;
  title: string;
  price: number | string;
  product_type: string;
  created_at?: string;
  updated_at?: string;
  item_group_id?: string;
  description?: string;
  availability?: string;
  condition?: string;
  sale_price?: number | string | null;
  link?: string;
  image_link?: string;
  additional_image_link?: string;
  brand?: string;
  color?: string;
  size?: string;
  gender?: string;
  inventory?: number;
}

export interface ProductInput {
  item_group_id: string;
  title: string;
  description: string;
  availability: string;
  condition: string;
  price: string | number;
  sale_price?: string | number | null;
  link?: string;
  image_link?: string;
  additional_image_link?: string;
  product_type?: string;
  brand?: string;
}

export type OrderStatus =
  | 'Order Created'
  | 'Payment Pending'
  | 'Paid'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface CustomerData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  notes?: string;
}

export interface UserRecord {
  id: string; // 8 characters lowercase + numbers
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItemSnapshot {
  id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_link: string;
  product_type: string;
  brand: string;
  item_group_id?: string;
}

export interface OrderRecord {
  id: string; // ASRI-xxxx
  customer_id: string;
  customer: CustomerData;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItemSnapshot[];
  payment_method: string;
  duitku_reference: string;
  result_code: string;
  fee: number;
  raw_response: any;
  callback_payload: any;
  expiry: string;
  paid_at: string | null;
  tracking_number?: string;
  shipping_courier: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: string;
  read: boolean;
}

export type ActivePage =
  | 'home'
  | 'clothes'
  | 'bag'
  | 'shoes'
  | 'livechat'
  | 'product-detail'
  | 'checkout'
  | 'tracking'
  | 'admin';

export type AdminTab = 'orders' | 'products' | 'chat';
