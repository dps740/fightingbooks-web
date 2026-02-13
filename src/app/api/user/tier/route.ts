import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  UserTier,
  getAccessibleAnimals,
  getUpgradeOptions,
  getTierInfo,
  canAccessCyoa,
  canAccessTournament,
  normalizeTier,
} from '@/lib/tierAccess';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    // Not authenticated = unregistered
    if (!token) {
      const tier: UserTier = 'unregistered';
      return NextResponse.json({
        tier,
        ...getTierInfo(tier),
        animals: getAccessibleAnimals(tier),
        cyoaAccess: canAccessCyoa(tier),
        tournamentAccess: canAccessTournament(tier),
        canUpgradeTo: getUpgradeOptions(tier),
        isAuthenticated: false,
      });
    }

    const supabase = getSupabase();
    let { data: { user }, error: authError } = await supabase.auth.getUser(token);

    // If access token expired, try refreshing with refresh token
    if (authError || !user) {
      const refreshToken = cookieStore.get('sb-refresh-token')?.value;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (!refreshError && refreshData.session && refreshData.user) {
          user = refreshData.user;
          authError = null;
          cookieStore.set('sb-access-token', refreshData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
          cookieStore.set('sb-refresh-token', refreshData.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }
    }

    if (authError || !user) {
      const tier: UserTier = 'unregistered';
      return NextResponse.json({
        tier,
        ...getTierInfo(tier),
        animals: getAccessibleAnimals(tier),
        cyoaAccess: canAccessCyoa(tier),
        tournamentAccess: canAccessTournament(tier),
        canUpgradeTo: getUpgradeOptions(tier),
        isAuthenticated: false,
      });
    }

    // Admin emails always get full access
    const ADMIN_EMAILS = ['david.smith@epsilon-three.com'];
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    // Get user's tier from users table
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    // Normalize legacy tier values (tier2/tier3/paid → member)
    const rawTier = isAdmin ? 'ultimate' : (profile?.tier || 'unregistered');
    const tier: UserTier = normalizeTier(rawTier);
    const tierInfo = getTierInfo(tier);
    const accessibleAnimals = getAccessibleAnimals(tier);

    return NextResponse.json({
      tier,
      ...tierInfo,
      animals: accessibleAnimals,
      cyoaAccess: canAccessCyoa(tier),
      tournamentAccess: canAccessTournament(tier),
      canUpgradeTo: getUpgradeOptions(tier),
      isAuthenticated: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Tier fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
