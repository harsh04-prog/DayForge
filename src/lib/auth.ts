import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.SECRET_KEY ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'dayforge-super-secret-key-2026-build-habits-level-yourself';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function createAccessToken(userId: number, expiresIn: string = '7d'): string {
  return jwt.sign({ sub: String(userId), userId }, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyAccessToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string; userId?: number };
    const uid = decoded.userId || (decoded.sub ? parseInt(decoded.sub, 10) : null);
    if (!uid) return null;
    return { userId: uid };
  } catch {
    return null;
  }
}

export function getUserIdFromRequest(request: Request): number | null {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.substring(7).trim();
    if (!token) return null;
    const res = verifyAccessToken(token);
    return res ? res.userId : null;
  } catch {
    return null;
  }
}
