export interface DemoTransaction {
  id: string;
  employee_id?: string;
  employee_name?: string;
  type: 'payroll' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  status: 'completed' | 'pending';
  description: string;
  receipt: string;
  mode?: 'live' | 'simulated';
  quoteId?: string;
  outgoingPaymentUrl?: string;
  notice?: string;
  created_at: string;
}

export const DEFAULT_DEMO_TEAM = [
  {
    id: 'emp-amara',
    name: 'Amara Okafor',
    email: 'amara@payzati.com',
    role: 'Product Engineer',
    country: 'Canada',
    currency: 'CAD',
    salary: 6500,
    wallet_address: 'https://ilp.interledger-test.dev/amara',
    status: 'active',
  },
  {
    id: 'emp-tunde',
    name: 'Tunde Adeyemi',
    email: 'tunde@payzati.com',
    role: 'Backend Engineer',
    country: 'Nigeria',
    currency: 'NGN',
    salary: 1250000,
    wallet_address: 'https://ilp.interledger-test.dev/amara',
    status: 'active',
  },
  {
    id: 'emp-amina',
    name: 'Amina Ochieng',
    email: 'amina@payzati.com',
    role: 'Brand Designer',
    country: 'Kenya',
    currency: 'KES',
    salary: 185000,
    wallet_address: 'https://ilp.interledger-test.dev/amara',
    status: 'active',
  },
  {
    id: 'emp-kwame',
    name: 'Kwame Mensah',
    email: 'kwame@payzati.com',
    role: 'QA Specialist',
    country: 'Ghana',
    currency: 'GHS',
    salary: 16450,
    wallet_address: 'https://ilp.interledger-test.dev/amara',
    status: 'active',
  },
];

const STORAGE_KEY = 'payzati_live_txs';
const TEAM_STORAGE_KEY = 'payzati_live_team';
export const INITIAL_TESTNET_BALANCE_USD = 10000000; // $10,000,000 USD funded in $ilp.interledger-test.dev/payzati

export function getLiveTreasuryBalance(): number {
  const txs = getStoredTransactions();
  const totalOutUSD = txs.reduce((sum, tx) => {
    const amt = Math.abs(Number(tx.amount || 0));
    const rate =
      tx.currency === 'CAD' ? 1.38 :
      tx.currency === 'NGN' ? 1550 :
      tx.currency === 'KES' ? 129.5 :
      tx.currency === 'GHS' ? 15.5 :
      tx.currency === 'GBP' ? 0.79 :
      tx.currency === 'EUR' ? 0.92 : 1;
    return sum + amt / rate;
  }, 0);
  return Math.max(0, Math.round((INITIAL_TESTNET_BALANCE_USD - totalOutUSD) * 100) / 100);
}

function emitSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('payzati:sync'));
  }
}

export function getStoredTeam(): any[] {
  if (typeof window === 'undefined') return DEFAULT_DEMO_TEAM;
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_TEAM;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_TEAM;
  } catch {
    return DEFAULT_DEMO_TEAM;
  }
}

export function saveStoredTeam(team: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    emitSync();
  } catch {
    // Ignore storage quota errors
  }
}

export function getStoredTransactions(): DemoTransaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendStoredTransaction(tx: DemoTransaction) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredTransactions();
    const deduped = [tx, ...existing.filter((t) => t.id !== tx.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    emitSync();
  } catch {
    // Ignore storage quota errors
  }
}
