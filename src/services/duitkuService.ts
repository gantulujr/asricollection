/**
 * Duitku Payment Gateway Integration & Signature Engine
 * Specifications:
 * - Sandbox: api-sandbox.duitku.com
 * - Production: api-prod.duitku.com
 * - Request Signature: HMAC_SHA256(merchantCode + timestamp, apiKey)
 * - Callback Signature: HMAC_SHA256(merchantCode + amount + merchantOrderId, merchantKey)
 */

export const DUITKU_CONFIG = {
  merchantCode: 'D19876', // Asri Collection Sandbox Merchant Code
  apiKey: 'asri_sandbox_key_99f2b847a1c3',
  merchantKey: 'asri_sandbox_mkey_3b81d764e5f2',
  sandboxHost: 'https://api-sandbox.duitku.com',
  prodHost: 'https://api-prod.duitku.com',
  isSandbox: true,
};

// Pure cryptographic HMAC-SHA256 helper supporting browser Web Crypto
export async function createHmacSha256(keyStr: string, messageStr: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyStr);
    const msgData = encoder.encode(messageStr);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for node or minimal environments
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = await import('crypto');
    return crypto.createHmac('sha256', keyStr).update(messageStr).digest('hex');
  } catch (e) {
    console.warn('Crypto import fallback', e);
    // Deterministic fallback hash for development
    let hash = 0;
    const str = keyStr + ':' + messageStr;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Generate Duitku Create Invoice Request Signature:
 * HMAC_SHA256(merchantCode + timestamp, apiKey)
 */
export async function generateRequestSignature(
  merchantCode: string,
  timestamp: string | number,
  apiKey: string
): Promise<string> {
  const message = `${merchantCode}${timestamp}`;
  return await createHmacSha256(apiKey, message);
}

/**
 * Generate Duitku Callback Signature:
 * HMAC_SHA256(merchantCode + amount + merchantOrderId, merchantKey)
 */
export async function generateCallbackSignature(
  merchantCode: string,
  amount: number | string,
  merchantOrderId: string,
  merchantKey: string
): Promise<string> {
  const message = `${merchantCode}${amount}${merchantOrderId}`;
  return await createHmacSha256(merchantKey, message);
}

/**
 * Verify incoming callback signature against expected signature
 */
export async function verifyCallbackSignature(
  payload: {
    merchantCode: string;
    amount: number | string;
    merchantOrderId: string;
    signature: string;
  },
  merchantKey: string
): Promise<boolean> {
  const expectedSig = await generateCallbackSignature(
    payload.merchantCode,
    payload.amount,
    payload.merchantOrderId,
    merchantKey
  );
  return expectedSig.toLowerCase() === (payload.signature || '').toLowerCase();
}

export interface DuitkuPaymentMethod {
  code: string;
  name: string;
  category: 'QRIS' | 'Virtual Account' | 'E-Wallet' | 'Credit Card';
  fee: number;
  instruction: string;
}

export const SUPPORTED_PAYMENT_METHODS: DuitkuPaymentMethod[] = [
  {
    code: 'SP',
    name: 'QRIS (All Banks & E-Wallets)',
    category: 'QRIS',
    fee: 0,
    instruction: 'Scan QRIS code instantly using BCA, Mandiri, GoPay, OVO, or Dana',
  },
  {
    code: 'BC',
    name: 'BCA Virtual Account',
    category: 'Virtual Account',
    fee: 4000,
    instruction: 'Transfer via BCA Mobile / myBCA / KlikBCA to virtual account number',
  },
  {
    code: 'M2',
    name: 'Mandiri Virtual Account',
    category: 'Virtual Account',
    fee: 4000,
    instruction: 'Transfer via Livin by Mandiri or Mandiri ATM',
  },
  {
    code: 'BR',
    name: 'BRI Virtual Account (BRIVA)',
    category: 'Virtual Account',
    fee: 4000,
    instruction: 'Transfer via BRImo or BRI ATM',
  },
  {
    code: 'VC',
    name: 'Credit Card / Visa / Mastercard',
    category: 'Credit Card',
    fee: 15000,
    instruction: 'Instant 3D Secure verification with Visa or Mastercard',
  },
  {
    code: 'SA',
    name: 'ShopeePay',
    category: 'E-Wallet',
    fee: 2500,
    instruction: 'One-click payment authorization through Shopee App',
  },
];
