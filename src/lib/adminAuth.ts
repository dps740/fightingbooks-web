import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = ['david.smith@epsilon-three.com', 'davidpatricksmith@hotmail.com'];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

export async function isAdminUserFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) return false;

    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user?.email) return false;

    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

export async function authorizeAdminRequest(
  authorizationHeader: string | null,
  bodyAdminKey?: string | null,
): Promise<boolean> {
  const validSecrets = [
    process.env.ADMIN_SECRET,
    // Legacy fallbacks kept for internal admin tooling compatibility.
    'fightingbooks-admin-2026',
    'fightingbooks-admin-2024',
    'fightingbooks-admin',
  ].filter((value): value is string => Boolean(value));

  if (authorizationHeader) {
    for (const secret of validSecrets) {
      if (authorizationHeader === `Bearer ${secret}`) {
        return true;
      }
    }
  }

  if (bodyAdminKey) {
    for (const secret of validSecrets) {
      if (bodyAdminKey === secret) {
        return true;
      }
    }
  }

  return isAdminUserFromCookies();
}
