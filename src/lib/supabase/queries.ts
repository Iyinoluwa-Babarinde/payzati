import { createClient } from './client';

export async function getUserProfile() {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) return data.user;
  } catch (e) {
    console.warn('[Supabase] Network unreachable, using local session');
  }

  // Fallback demo user metadata for seamless offline/demo access
  return {
    id: 'demo-user-id',
    email: 'demo-employer@payzati.com',
    user_metadata: {
      role: 'employer',
      full_name: 'Demo Employer',
      company_name: 'Payzati Demo Corp',
      country: 'Nigeria',
    },
  };
}

export async function getCompany() {
  try {
    const supabase = createClient();
    const user = await getUserProfile();
    if (!user) return { id: 'demo-company-id', name: 'Payzati Demo Corp', country: 'Nigeria' };

    const companyName = user.user_metadata?.company_name || 'Payzati Demo Corp';
    const country = user.user_metadata?.country || 'Nigeria';

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('name', companyName);

    if (error || !data || data.length === 0) {
      return { id: 'demo-company-id', name: companyName, country };
    }

    let company = data[0];
    if (data.length > 1) {
      company = data.find((c: any) => c.ilp_grant_token) || data[0];
    }

    return company;
  } catch (e) {
    console.warn('[Supabase] getCompany fallback:', e);
    return { id: 'demo-company-id', name: 'Payzati Demo Corp', country: 'Nigeria' };
  }
}

export async function getEmployeeProfile() {
  try {
    const supabase = createClient();
    const user = await getUserProfile();
    if (!user) return null;

    const email = user.email;

    const { data: employee, error } = await supabase
      .from('employees')
      .select('*, companies(name)')
      .eq('email', email)
      .maybeSingle();

    if (error || !employee) {
      return {
        id: 'demo-emp-id',
        name: 'Demo Employee',
        email: 'demo-employee@payzati.com',
        country: 'Nigeria',
        currency: 'NGN',
        salary: 850000,
        status: 'active',
        wallet_address: 'https://ilp.interledger-test.dev/demo-employee',
      };
    }

    return employee;
  } catch (e) {
    console.warn('[Supabase] getEmployeeProfile fallback:', e);
    return {
      id: 'demo-emp-id',
      name: 'Demo Employee',
      email: 'demo-employee@payzati.com',
      country: 'Nigeria',
      currency: 'NGN',
      salary: 850000,
      status: 'active',
      wallet_address: 'https://ilp.interledger-test.dev/demo-employee',
    };
  }
}
