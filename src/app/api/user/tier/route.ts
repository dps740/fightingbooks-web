import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  UserTier,
  getAccessibleAnimals,
  getUpgradeOptions,
  getTierInfo,
  canAccessCyoa,
  FREE_ANIMALS,
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
        cyoaMatchups: [], // No CYOA for unregistered
        canUpgradeTo: getUpgradeOptions(tier),
        isAuthenticated: false,
      });
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Invalid token, treat as unregistered
      const tier: UserTier = 'unregistered';
      return NextResponse.json({
        tier,
        ...getTierInfo(tier),
        animals: getAccessibleAnimals(tier),
        cyoaMatchups: [],
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

    // Admin gets tier3, otherwise default to 'free' if no tier set
    const tier: UserTier = isAdmin ? 'tier3' : (profile?.tier as UserTier) || 'free';
    const tierInfo = getTierInfo(tier);
    const accessibleAnimals = getAccessibleAnimals(tier);

    // Build list of accessible CYOA matchups
    // For efficiency, we describe this as rules rather than enumerating all combinations
    let cyoaAccess: string;
    if (tier === 'free') {
      cyoaAccess = 'lion-vs-tiger';
    } else if (tier === 'tier2') {
      cyoaAccess = 'all-real';
    } else if (tier === 'tier3') {
      cyoaAccess = 'all';
    } else {
      cyoaAccess = 'none';
    }

    return NextResponse.json({
      tier,
      ...tierInfo,
      animals: accessibleAnimals,
      cyoaAccess,
      canUpgradeTo: getUpgradeOptions(tier),
      isAuthenticated: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Tier fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
