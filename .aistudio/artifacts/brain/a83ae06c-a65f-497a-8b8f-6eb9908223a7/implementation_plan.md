# Asri Collection — Luxury Fashion E-Commerce Architecture & Implementation Plan

A mobile-first luxury e-commerce platform for "Asri Collection", featuring live luxury catalog integration, server-authoritative checkout with Duitku payment gateway simulation, multi-stage delivery tracking, real-time synchronized live chat, and a 6-digit PIN-protected admin operations console.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during Phase 1 interactive interview and will govern implementation:

- **Confirmed Decision 1 (Payment & Duitku Setup)**: Sandbox mode with an integrated interactive payment simulator for realistic Duitku checkout (QRIS, Virtual Accounts, Credit Card) with strict HMAC-SHA256 signature verification and callback processing.
- **Confirmed Decision 2 (Visual Aesthetic & Palette)**: Warm earthy luxury boutique with soft sand/travertine backdrop (`#F9F7F3`), warm terracotta accents (`#C85A32`), deep obsidian typography (`#1C1917`), and quiet hairline borders (`#E7E2D9`).
- **Confirmed Decision 3 (LiveChat Implementation)**: Real-time synchronized chat persistence allowing instant bidirectional messaging between customer and admin with smart live simulation support.
- **Strict Layout Rule**: `html`, `body`, and `#root` use `height: 100%` with zero viewport height units (`vh`, `dvh`, `svh`, `lvh`). `#root` is styled with `max-w-[500px]`, `flex flex-col`, and `overflow-hidden`, with `<main>` as `flex-1 overflow-y-auto`.

---

### 1. Overview & Core Concept

- **What It Does**: Asri Collection delivers a high-end mobile boutique experience for curating, discovering, purchasing, and tracking authentic designer fashion (Clothes, Bags, Shoes, and Accessories). It bridges a live product feed with secure backend checkout, transparent Duitku payment settlement, customer support chat, and complete merchant fulfillment.
- **Target Audience**: Discerning luxury fashion shoppers seeking designer apparel, bags, and shoes with an intuitive mobile-first checkout and real-time order visibility.
- **Key Value**: Guarantees zero price manipulation through server-authoritative pricing via the live `get-asri` endpoint, instant Duitku invoice generation, step-by-step parcel tracking, and secure merchant order management.

---

### 2. User Experience & Visual Design

#### Key User Flows

1. **Discovery & Exploration (Main Pages)**:
   - **Header**: Minimalist luxury wordmark `ASRI COLLECTION`, search drawer trigger, and interactive cart drawer badge.
   - **Category Navigation**: 5 primary views accessible via the fixed bottom navigation bar:
     - `Home`: Curated hero spotlight, featured arrivals, and brand value statements.
     - `Clothes`: Direct filter on clothing items (`product_type === 'Clothing'`).
     - `Bag`: Direct filter on handbags and wallets (`product_type === 'Tas' || product_type === 'Bags'`).
     - `Shoes`: Footwear collection (`product_type === 'Shoes'`).
     - `LiveChat`: Direct messaging with Asri Concierge / Admin support.
   - **Product Cards**: Zero-pill metadata design. Shows high-res image, subtle brand kicker, title, stock availability indicator, and formatted Indonesian Rupiah pricing (`tabular-nums`).

2. **Product Detail View (`ProductDetailPage`)**:
   - High-fidelity image gallery with swipe/click switching between primary and additional images (`image_link` and `additional_image_link`).
   - Sticky bottom purchase bar with quantity selector, stock counter, and "Add to Bag" / "Buy Now" triggers.

3. **Server-Authoritative Checkout (`CheckoutPage`)**:
   - Customer details input (Full Name, Email, WhatsApp Phone, Delivery Address, City, Postal Code).
   - Dynamic shipping tier selection (Standard JNE/SiCepat vs Express).
   - Payment method selection (Duitku QRIS, BCA VA, Mandiri VA, ShopeePay, Credit Card).
   - Order submission executes `POST /asri-checkout`. The server pulls live prices from `get-asri`, calculates subtotal + shipping, creates user/order, and yields a Duitku payment invoice.
   - In Sandbox mode, users transition smoothly to the Duitku payment simulator with one-click payment execution that triggers `POST /asri-checkout/callback`.

4. **Parcel & Payment Tracking (`TrackingPage`)**:
   - Direct order tracking search and instant order details render.
   - 7-stage visual progress timeline:
     $$\text{Order Created} \to \text{Payment Pending} \to \text{Paid} \to \text{Processing} \to \text{Packed} \to \text{Shipped} \to \text{Delivered}$$
   - Displays snapshot product list, payment receipt status, shipping courier, and customer delivery summary.

5. **Merchant Administration Console (`AdminPage`)**:
   - **Gatekeeper**: 6-digit secure numpad screen. Entering PIN `677677` grants instant access; wrong PIN triggers a shake animation and error toast (PIN is never printed in UI).
   - **Admin Bottom Navigation**:
     - `List Order`: Complete view of all orders, payment statuses, and one-tap controls to update fulfillment status (`Processing`, `Packed`, `Shipped`, `Delivered`).
     - `List Product`: Inventory and availability monitor pulled live from `get-asri`.
     - `LiveChat`: Admin concierge console to read customer inquiries and dispatch replies directly into the synchronized chat store.

#### Visual Identity & Theme Tokens

- **Aesthetic Direction**: Warm earthy luxury editorial (reminiscent of high-end boutique lookbooks).
- **Color Palette (60-30-10 Rule)**:
  - `Canvas (60%)`: Warm Sand / Travertine (`#F9F7F3` / `#F3EFEA`)
  - `Structural Surfaces (30%)`: Crisp Cream (`#FFFFFF`), Soft Clay Hairlines (`#E6E0D6`), Muted Charcoal Slate (`#44403C`)
  - `Accent Budget (10%)`: Terracotta Ochre (`#C85A32` & `#9E3E1C`) for primary CTAs and active states; Forest Emerald (`#2E654D`) for confirmed payments.
- **Typography**:
  - Display / Headings: `Playfair Display` or high-character Serif
  - Body / UI Controls: `Plus Jakarta Sans`
  - Prices & Numbers: Tabular numerals (`font-mono tabular-nums tracking-tight`)
- **Zero-Pill Discipline**: No colored pill badges or capsule enclosures on card metadata; clean typography with `·` dividers.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Authoritative Price Calculation**:
  - *Chosen Approach*: The frontend only sends `{ customer, items: [{ product_id, quantity }], shipping_fee, payment_method }`. The backend edge function fetches canonical prices and inventory from `get-asri` and calculates line totals.
  - *Why*: Eliminates price tampering risks and guarantees inventory validation before invoice creation.
- **Decision 2: Integrated Duitku Payment Gateway & Simulator**:
  - *Chosen Approach*: Implement full Duitku invoice generation with SHA256 request signatures, plus an in-app interactive Duitku sandbox gateway modal with mock callback processing and signature verification.
  - *Why*: Enables end-to-end user testing of real checkout flows without requiring immediate merchant banking credentials.
- **Decision 3: Zero Viewport-Height Units Compliance**:
  - *Chosen Approach*: Strict container geometry with `h-full`, `flex flex-col`, and `overflow-hidden` on `#root` with `max-w-[500px]` and `overflow-y-auto` on `<main>`.
  - *Why*: Avoids mobile browser address bar jumpiness (100vh bugs on iOS/Android WebViews).

---

### 4. Technical Architecture & Data Strategy

#### System Architecture & Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ASRI COLLECTION (Mobile-First)                  │
├────────────────────────────────────────────────────────────────────────┤
│  Top Bar: [ASRI COLLECTION] ────── [Search] ────── [Cart Trigger (N)]  │
├────────────────────────────────────────────────────────────────────────┤
│  Scrollable Main Container (<main class="flex-1 overflow-y-auto">)     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Main Views: Home | Clothes | Bag | Shoes | LiveChat              │  │
│  │ Standalone: ProductDetailPage | CheckoutPage | TrackingPage      │  │
│  │ Admin: PIN Gatekeeper (677677) -> Orders | Catalog | Chat Admin  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────┤
│  Bottom Tab Bar: [Home]  [Clothes]  [Bag]  [Shoes]  [Chat]  [Admin]    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
               API Calls & State Management Layer
                                    │
          ┌─────────────────────────┴────────────────────────┐
          ▼                                                  ▼
┌───────────────────────────────┐           ┌────────────────────────────────┐
│ Supabase Product Feed         │           │ Express / Edge Function Server │
│ GET /functions/v1/get-asri    │           │ POST /asri-checkout            │
│ (Source of Truth)             │           │ POST /asri-checkout/callback   │
└───────────────────────────────┘           └────────────────────────────────┘
                                                             │
                                            ┌────────────────┴───────────────┐
                                            ▼                                ▼
                                ┌──────────────────────┐         ┌───────────────────┐
                                │ asri_collection_users│         │ Duitku Invoice &  │
                                │ asri_collection_order│         │ SHA256 Signatures │
                                └──────────────────────┘         └───────────────────┘
```

#### Core Data Entities

1. **`asri_collection_users`**:
   - `id`: 8-character lowercase + alphanumeric (e.g., `u7k9b2x4`)
   - `full_name`, `email`, `phone` (unique), `created_at`, `updated_at`

2. **`asri_collection_order`**:
   - `id`: Order reference (e.g., `ASRI-20261001-XXXX`)
   - `customer_id`, `customer` (name, email, phone, shipping address)
   - `order_status`: `'Order Created'` | `'Payment Pending'` | `'Paid'` | `'Processing'` | `'Packed'` | `'Shipped'` | `'Delivered'`
   - `payment_status`: `'PENDING'` | `'PAID'` | `'FAILED'` | `'EXPIRED'`
   - `subtotal`, `shipping`, `discount`, `total`
   - `snapshot_items`: Array of product snapshots with title, price, quantity, image
   - `duitku_reference`, `payment_method`, `expiry`, `paid_at`, `timestamps`

3. **`LiveChatMessage`**:
   - `id`, `sender` (`'customer'` | `'admin'`), `text`, `timestamp`, `read`

---

### Implementation Phasing

1. **Phase 1: Shell & Layout Structure**: Setup Tailwind color tokens, font imports, `#root` constraints (`max-w-[500px]`, `h-full`), Top Bar and Bottom Tab Bar navigation.
2. **Phase 2: Product Catalog & Category Views**: Fetch and cache data from `https://jvqrturbkgyxsycdcfwp.supabase.co/functions/v1/get-asri`, map categories (Clothes, Bag, Shoes), build resilient product cards with fallback images and search.
3. **Phase 3: Product Detail & Cart Drawer**: Image carousel, inventory verification, quantity stepper, cart slide-over with subtotal.
4. **Phase 4: Checkout & Duitku Payment Gateway**: Backend edge service handlers (`POST /asri-checkout`, `POST /asri-checkout/callback`), HMAC-SHA256 signature calculations, interactive sandbox payment simulator.
5. **Phase 5: Tracking & Admin Suite**: 7-stage order status timeline, 6-digit numpad PIN entry (`677677`), admin order status switcher, catalog browser, and two-way LiveChat.
6. **Phase 6: Verification & Compilation**: Build verification with zero warnings and pristine mobile UX responsiveness.
