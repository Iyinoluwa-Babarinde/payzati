import { createClient } from './client';

// In-memory cache to guarantee 0ms instant tab switching and zero UI lockup
let cachedUser: any = null;
let cachedCompany: any = null;
let cachedEmployee: any = null;

const DEFAULT_DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo-employer@payzati.com',
  user_metadata: {
    role: 'employer',
    full_name: 'Demo Employer',
    company_name: 'Payzati Global Inc.',
    country: 'Nigeria',
  },
};

const DEFAULT_DEMO_COMPANY = {
  id: 'demo-company-id',
  name: 'Payzati Global Inc.',
  country: 'Nigeria',
};

const DEFAULT_DEMO_EMPLOYEE = {
  id: 'demo-emp-id',
  name: 'Tunde Adeyemi',
  email: 'demo-employee@payzati.com',
  country: 'Nigeria',
  currency: 'NGN',
  salary: 850000,
  status: 'active',
  wallet_address: 'https://ilp.interledger-test.dev/da071cb6',
  companies: { name: 'Payzati Global Inc.' },
};

export async function getUserProfile() {
  if (cachedUser) return cachedUser;

  try {
    const supabase = createClient();
    // Fast timeout race (120ms): if user has an active session it uses it, otherwise instantly falls back
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 120));
    const authPromise = supabase.auth.getUser().catch(() => null);

    const result: any = await Promise.race([authPromise, timeoutPromise]);
    if (result?.data?.user) {
      cachedUser = result.data.user;
      return cachedUser;
    }
  } catch {
    // Offline or network timeout
  }

  cachedUser = DEFAULT_DEMO_USER;
  return cachedUser;
}

export async function getCompany() {
  if (cachedCompany) return cachedCompany;

  try {
    const supabase = createClient();
    const user = await getUserProfile();
    const companyName = user?.user_metadata?.company_name || 'Payzati Global Inc.';
    const country = user?.user_metadata?.country || 'Nigeria';

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('name', companyName)
      .limit(1);

    if (error || !data || data.length === 0) {
      cachedCompany = { id: 'demo-company-id', name: companyName, country };
      return cachedCompany;
    }

    cachedCompany = data[0];
    return cachedCompany;
  } catch {
    cachedCompany = DEFAULT_DEMO_COMPANY;
    return cachedCompany;
  }
}

export async function getEmployeeProfile() {
  if (cachedEmployee) return cachedEmployee;

  try {
    const supabase = createClient();
    const user = await getUserProfile();
    const email = user?.email;

    if (!email) {
      cachedEmployee = DEFAULT_DEMO_EMPLOYEE;
      return cachedEmployee;
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*, companies(name)')
      .eq('email', email)
      .maybeSingle();

    if (error || !employee) {
      cachedEmployee = DEFAULT_DEMO_EMPLOYEE;
      return cachedEmployee;
    }

    cachedEmployee = employee;
    return cachedEmployee;
  } catch {
    cachedEmployee = DEFAULT_DEMO_EMPLOYEE;
    return cachedEmployee;
  }
}

export function clearProfileCache() {
  cachedUser = null;
  cachedCompany = null;
  cachedEmployee = null;
}
