import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getAuthUserFromRequest,
  setAuthCookies,
  createAccessToken,
  getUserVaultDataFromRequest,
  createUserDataVaultToken,
} from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    let user = db.getUserById(authUser.userId);
    if (!user) {
      // Auto-reconcile user into local serverless instance
      user = db.syncUserFromToken(authUser);
    }

    if (!user || !user.is_active) {
      return NextResponse.json({ detail: 'User not found or inactive' }, { status: 401 });
    }

    // Reconcile client's vault data if local instance has missing data
    const userVault = getUserVaultDataFromRequest(request);
    if (userVault && Number(userVault.userId) === Number(user.id)) {
      db.syncUserDataFromVault(user.id, userVault);
    }

    const profile = db.getProfileByUserId(user.id);
    const settings = db.getSettingsByUserId(user.id);
    const refreshedToken = createAccessToken(user, '30d');

    const latestVaultData = db.getUserVaultData(user.id);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at,
      profile,
      settings,
      vault_token: vaultToken,
    });

    res.headers.set('x-dayforge-vault-token', vaultToken);

    return setAuthCookies(res, refreshedToken, {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at,
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
