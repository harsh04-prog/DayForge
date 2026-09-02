import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.SECRET_KEY ||
  process.env.NEXTAUTH_SECRET ||
  'dayforge_super_secure_jwt_secret_2026_prod';

export interface AuthTokenPayload {
  sub: string;
  userId: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_onboarded: boolean;
}

export interface VaultPayload {
  id: number;
  email: string;
  username: string;
  full_name: string;
  hashed_password: string;
  is_active: boolean;
  is_onboarded: boolean;
  created_at: string;
}

export interface UserDataVaultPayload {
  userId: number;
  habits?: any[];
  todos?: any[];
  habit_logs?: any[];
  profile?: any;
  user_settings?: any;
  user_challenges?: any[];
  user_challenge_logs?: any[];
  version: number;
  timestamp: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function createAccessToken(
  user: { id: number; email?: string; username?: string; full_name?: string; is_active?: boolean; is_onboarded?: boolean },
  expiresIn: string = '30d'
): string {
  const payload: AuthTokenPayload = {
    sub: String(user.id),
    userId: user.id,
    email: (user.email || '').toLowerCase().trim(),
    username: (user.username || '').toLowerCase().trim(),
    full_name: user.full_name || '',
    is_active: user.is_active ?? true,
    is_onboarded: user.is_onboarded ?? false,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const uid = decoded.userId || (decoded.sub ? parseInt(decoded.sub, 10) : null);
    if (!uid) return null;
    return {
      sub: String(uid),
      userId: uid,
      email: (decoded.email || '').toLowerCase().trim(),
      username: (decoded.username || '').toLowerCase().trim(),
      full_name: decoded.full_name || '',
      is_active: decoded.is_active ?? true,
      is_onboarded: decoded.is_onboarded ?? false,
    };
  } catch {
    return null;
  }
}

export function createVaultToken(vault: VaultPayload): string {
  return jwt.sign(vault, JWT_SECRET, { expiresIn: '60d' });
}

export function verifyVaultToken(token: string): VaultPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.id || !decoded.email || !decoded.hashed_password) return null;
    return {
      id: decoded.id,
      email: decoded.email.toLowerCase().trim(),
      username: decoded.username.toLowerCase().trim(),
      full_name: decoded.full_name || '',
      hashed_password: decoded.hashed_password,
      is_active: decoded.is_active ?? true,
      is_onboarded: decoded.is_onboarded ?? false,
      created_at: decoded.created_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function createUserDataVaultToken(payload: UserDataVaultPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '60d' });
}

export function verifyUserDataVaultToken(token: string): UserDataVaultPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return null;
    return {
      userId: Number(decoded.userId),
      habits: Array.isArray(decoded.habits) ? decoded.habits : [],
      todos: Array.isArray(decoded.todos) ? decoded.todos : [],
      habit_logs: Array.isArray(decoded.habit_logs) ? decoded.habit_logs : [],
      profile: decoded.profile || null,
      user_settings: decoded.user_settings || null,
      user_challenges: Array.isArray(decoded.user_challenges) ? decoded.user_challenges : [],
      user_challenge_logs: Array.isArray(decoded.user_challenge_logs) ? decoded.user_challenge_logs : [],
      version: decoded.version || 1,
      timestamp: decoded.timestamp || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx !== -1) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

export function getAuthUserFromRequest(request: Request): AuthTokenPayload | null {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const verified = verifyAccessToken(token);
      if (verified) return verified;
    }

    const cookies = parseCookies(request);
    const sessionCookie =
      cookies.dayforge_session ||
      cookies['__Secure-dayforge_session'] ||
      cookies.dayforge_token ||
      cookies.token;
    if (sessionCookie) {
      const verified = verifyAccessToken(sessionCookie);
      if (verified) return verified;
    }

    return null;
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: Request): number | null {
  const user = getAuthUserFromRequest(request);
  return user ? user.userId : null;
}

export function getVaultFromRequest(request: Request): VaultPayload | null {
  try {
    const cookies = parseCookies(request);
    if (cookies.dayforge_vault) {
      return verifyVaultToken(cookies.dayforge_vault);
    }
    return null;
  } catch {
    return null;
  }
}

export function getUserVaultDataFromRequest(request: Request): UserDataVaultPayload | null {
  try {
    const headerVault = request.headers.get('x-dayforge-vault-data');
    if (headerVault) {
      const verified = verifyUserDataVaultToken(headerVault);
      if (verified) return verified;
    }

    const cookies = parseCookies(request);
    if (cookies.dayforge_data_vault) {
      const verified = verifyUserDataVaultToken(cookies.dayforge_data_vault);
      if (verified) return verified;
    }

    return null;
  } catch {
    return null;
  }
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  vaultPayload?: VaultPayload | null
): NextResponse {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  };

  response.cookies.set('dayforge_session', accessToken, cookieOptions);

  if (vaultPayload) {
    const vaultToken = createVaultToken(vaultPayload);
    response.cookies.set('dayforge_vault', vaultToken, cookieOptions);
  }

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  const isProd = process.env.NODE_ENV === 'production';
  const clearOptions = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProd,
    maxAge: 0,
  };
  response.cookies.set('dayforge_session', '', clearOptions);
  response.cookies.set('dayforge_vault', '', clearOptions);
  response.cookies.set('dayforge_data_vault', '', clearOptions);
  return response;
}
