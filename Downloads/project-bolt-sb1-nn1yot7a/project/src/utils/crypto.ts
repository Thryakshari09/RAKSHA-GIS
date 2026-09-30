const enc = new TextEncoder();
const dec = new TextDecoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltHex = bufToHex(salt.buffer);
  const hashHex = bufToHex(hash);
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = hexToBuf(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return bufToHex(hash) === hashHex;
}

const SESSION_KEY = 'vaultly_session';

export type SessionRole = 'owner' | 'member';

export interface SessionPayload {
  userId: string;
  role: SessionRole;
  familyMemberId?: string;
  issued: number;
}

export function createSession(userId: string, role: SessionRole = 'owner', familyMemberId?: string): void {
  const payload: SessionPayload = { userId, role, familyMemberId, issued: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function getSession(): SessionPayload | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed.role) parsed.role = 'owner';
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
