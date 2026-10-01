import { ChatMessage } from '../types';

const CHAT_STORAGE_KEY = 'asri_livechat_messages';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'admin',
    text: 'Halo! Selamat datang di Asri Collection Concierge. Ada yang bisa kami bantu seputar koleksi pakaian, tas, atau konfirmasi pesanan Anda hari ini?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: true,
  },
];

export function getChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MESSAGES;
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function sendChatMessage(sender: 'customer' | 'admin', text: string): ChatMessage {
  const current = getChatMessages();
  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender,
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: sender === 'admin',
  };

  const updated = [...current, newMessage];
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    // Trigger storage event for cross-component sync
    window.dispatchEvent(new Event('asri_chat_updated'));
  } catch (err) {
    console.warn('Failed to save chat message', err);
  }

  // If customer sent message, simulate smart concierge reply after 1.5 seconds if admin is away
  if (sender === 'customer') {
    simulateConciergeReply(text);
  }

  return newMessage;
}

function simulateConciergeReply(customerQuery: string) {
  setTimeout(() => {
    const query = customerQuery.toLowerCase();
    let replyText =
      'Terima kasih telah menghubungi kami. Pesan Anda telah kami terima dan tim Asri Collection akan segera merespons dalam beberapa saat.';

    if (query.includes('ongkir') || query.includes('kirim') || query.includes('ekspedisi')) {
      replyText =
        'Pengiriman kami menggunakan JNE Reguler Express dan SiCepat BEST dengan asuransi penuh untuk seluruh produk berharga.';
    } else if (query.includes('asli') || query.includes('ori') || query.includes('authentic')) {
      replyText =
        'Semua produk di Asri Collection 100% original & authentic dengan sertifikat jaminan keaslian serta barcode resmi.';
    } else if (query.includes('bayar') || query.includes('duitku') || query.includes('qris')) {
      replyText =
        'Pembayaran didukung via Duitku Payment Gateway (QRIS instan, Virtual Account BCA/Mandiri/BRI, dan Kartu Kredit berkeamanan tinggi).';
    } else if (query.includes('resi') || query.includes('track') || query.includes('pesanan')) {
      replyText =
        'Anda dapat melacak status pesanan Anda secara langsung di menu Tracking dengan memasukkan Order ID Anda.';
    }

    const current = getChatMessages();
    const autoReply: ChatMessage = {
      id: `msg-admin-${Date.now()}`,
      sender: 'admin',
      text: replyText,
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [...current, autoReply];
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('asri_chat_updated'));
    } catch (err) {
      console.warn('Failed to save auto reply', err);
    }
  }, 1400);
}

export function markMessagesAsRead(): void {
  const current = getChatMessages();
  const updated = current.map((m) => ({ ...m, read: true }));
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('asri_chat_updated'));
  } catch (err) {
    console.warn('Failed to mark messages as read', err);
  }
}
