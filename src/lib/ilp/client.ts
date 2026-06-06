import {
  createAuthenticatedClient,
  createUnauthenticatedClient,
  type AuthenticatedClient,
  type UnauthenticatedClient,
} from '@interledger/open-payments';
import crypto from 'crypto';

let authenticatedClient: AuthenticatedClient | null = null;
let unauthenticatedClient: UnauthenticatedClient | null = null;

export function normalizePaymentPointer(pointer: string): string {
  if (!pointer) return '';
  let url = pointer.trim();
  if (url.startsWith('$')) {
    url = 'https://' + url.substring(1);
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

export async function getUnauthenticatedClient(): Promise<UnauthenticatedClient> {
  if (!unauthenticatedClient) {
    unauthenticatedClient = await createUnauthenticatedClient({ validateResponses: false });
  }
  return unauthenticatedClient;
}

export async function getAuthenticatedClient(): Promise<AuthenticatedClient | null> {
  if (authenticatedClient) return authenticatedClient;
  const rawWalletAddress = process.env.PAYZATI_WALLET_ADDRESS;
  const privateKey = process.env.ILP_PRIVATE_KEY;
  const keyId = process.env.ILP_KEY_ID;

  if (!rawWalletAddress || !privateKey || !keyId) {
    console.warn('[ILP] Missing credentials — unable to create authenticated client');
    return null;
  }

  const walletAddress = normalizePaymentPointer(rawWalletAddress);

  try {
    const keyObject = crypto.createPrivateKey({
      key: Buffer.from(privateKey, 'base64'),
      format: 'der',
      type: 'pkcs8'
    });

    authenticatedClient = await createAuthenticatedClient({
      walletAddressUrl: walletAddress,
      privateKey: keyObject,
      keyId,
      validateResponses: false,
    });
    return authenticatedClient;
  } catch (error) {
    console.warn('[ILP] Failed to create authenticated client:', error);
    return null;
  }
}

export function resetClients() {
  authenticatedClient = null;
  unauthenticatedClient = null;
}
