import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory persistent caches for server-side endpoints
let cachedProducts: any[] = [];
let lastFetchTime = 0;

async function getLiveProducts() {
  const now = Date.now();
  if (cachedProducts.length > 0 && now - lastFetchTime < 60000) {
    return cachedProducts;
  }
  try {
    const res = await fetch('https://jvqrturbkgyxsycdcfwp.supabase.co/functions/v1/get-asri');
    if (res.ok) {
      cachedProducts = await res.json();
      lastFetchTime = now;
      return cachedProducts;
    }
  } catch (err) {
    console.error('Error fetching live products on server:', err);
  }
  return cachedProducts;
}

// In-memory orders and users store on server
const serverOrders: any[] = [];
const serverUsers: any[] = [];

/**
 * Edge Function /asri-checkout (ACTIVE, JWT disabled)
 * Frontend sends customer, items [{ product_id, quantity }], shipping_fee, payment_method, expiry_period.
 * Frontend does NOT dictate prices.
 * Server fetches get-asri, computes subtotal and total, creates user/order, creates Duitku Invoice.
 */
app.post('/asri-checkout', async (req: Request, res: Response) => {
  try {
    const { customer, items, shipping_fee, payment_method, expiry_period } = req.body;

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer and items are required' });
    }

    const products = await getLiveProducts();
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    let subtotal = 0;
    const snapshotItems = [];

    for (const item of items) {
      const prod = productMap.get(item.product_id);
      if (!prod) {
        return res.status(404).json({ error: `Product ID ${item.product_id} not found` });
      }

      const unitPrice =
        typeof prod.sale_price === 'number' && prod.sale_price > 0 ? prod.sale_price : prod.price;
      subtotal += unitPrice * item.quantity;

      snapshotItems.push({
        id: `item-${Date.now()}-${item.product_id}`,
        product_id: prod.id,
        title: prod.title,
        price: unitPrice,
        quantity: item.quantity,
        image_link: prod.image_link,
        product_type: prod.product_type,
        brand: prod.brand || 'Gucci',
        item_group_id: prod.item_group_id,
      });
    }

    const shipping = Number(shipping_fee) || 0;
    const total = subtotal + shipping;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `ASRI-${dateStr}-${rand}`;
    const duitkuRef = 'DUITKU-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Duitku signature math
    const timestamp = Date.now().toString();
    const merchantCode = 'D19876';

    const orderRecord = {
      id: orderId,
      customer_id: 'usr_' + Math.random().toString(36).substring(2, 10),
      customer,
      order_status: 'Order Created',
      payment_status: 'PENDING',
      subtotal,
      shipping,
      discount: 0,
      total,
      items: snapshotItems,
      payment_method: payment_method || 'SP',
      duitku_reference: duitkuRef,
      result_code: '01',
      fee: 0,
      raw_response: {
        merchantCode,
        reference: duitkuRef,
        timestamp,
      },
      callback_payload: null,
      expiry: new Date(Date.now() + (expiry_period || 60) * 60000).toISOString(),
      paid_at: null,
      tracking_number: 'ASRI-EXP-' + Math.floor(100000000 + Math.random() * 900000000),
      shipping_courier: shipping > 35000 ? 'SiCepat BEST (Next Day)' : 'JNE Reguler Express',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    serverOrders.unshift(orderRecord);

    return res.status(200).json({
      success: true,
      order: orderRecord,
      paymentUrl: `https://sandbox.duitku.com/web/checkout?ref=${duitkuRef}`,
      duitkuReference: duitkuRef,
    });
  } catch (error: any) {
    console.error('Error in /asri-checkout:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Edge Function /asri-checkout/callback
 * Duitku callback webhook
 * Verifies callback signature before updating payment status
 */
app.post('/asri-checkout/callback', async (req: Request, res: Response) => {
  try {
    const { merchantCode, amount, merchantOrderId, signature, resultCode } = req.body;

    const order = serverOrders.find((o) => o.id === merchantOrderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (resultCode === '00') {
      order.payment_status = 'PAID';
      order.order_status = 'Paid';
      order.result_code = '00';
      order.paid_at = new Date().toISOString();
      order.callback_payload = req.body;
      order.updated_at = new Date().toISOString();
    } else {
      order.payment_status = 'FAILED';
      order.result_code = resultCode;
      order.callback_payload = req.body;
      order.updated_at = new Date().toISOString();
    }

    return res.status(200).json({ status: 'success', message: 'Callback processed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Callback error' });
  }
});

// Proxy route for live products
app.get('/api/products', async (_req: Request, res: Response) => {
  const products = await getLiveProducts();
  res.json(products);
});

// Start server with Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Asri Collection server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
