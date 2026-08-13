import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch (e) {
    // Network or Supabase offline fallback
  }

  const demoRole = request.cookies.get('payzati_demo_role')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isEmployerRoute = request.nextUrl.pathname.startsWith('/employer');
  const isEmployeeRoute = request.nextUrl.pathname.startsWith('/employee');
  const isProtectedRoute = isEmployerRoute || isEmployeeRoute;

  const isAuthenticated = !!user || !!demoRole;
  const activeRole = user?.user_metadata?.role || demoRole || 'employer';

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  if (isAuthenticated) {
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = activeRole === 'employee' ? '/employee/dashboard' : '/employer/dashboard';
      return NextResponse.redirect(url);
    }

    // Role boundary protection
    if (isEmployerRoute && activeRole !== 'employer') {
      const url = request.nextUrl.clone();
      url.pathname = '/employee/dashboard';
      return NextResponse.redirect(url);
    }

    if (isEmployeeRoute && activeRole !== 'employee') {
      const url = request.nextUrl.clone();
      url.pathname = '/employer/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
