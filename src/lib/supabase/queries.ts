import { createClient } from './client';

export async function getUserProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCompany() {
  const supabase = createClient();
  const user = await getUserProfile();
  if (!user) return null;

  const companyName = user.user_metadata?.company_name || 'My Company';
  const country = user.user_metadata?.country || 'Nigeria';

  // First, try to find the company by name
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('name', companyName);

  let company = data?.[0];

  // If multiple exist (from the duplicate bug), pick the one with a token if possible
  if (data && data.length > 1) {
    company = data.find((c: any) => c.ilp_grant_token) || data[0];
  }

  if (!company) {
    // Create it only if truly not found
    const { data: newCompany } = await supabase
      .from('companies')
      .insert({ name: companyName, country })
      .select()
      .single();
    company = newCompany;
  }

  return company;
}

export async function getEmployeeProfile() {
  const supabase = createClient();
  const user = await getUserProfile();
  if (!user) return null;

  const email = user.email;

  // We find the employee record by email
  const { data: employee, error } = await supabase
    .from('employees')
    .select('*, companies(name)')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('[Supabase] Error fetching employee:', error.message);
  }

  return employee;
}
