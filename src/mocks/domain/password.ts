/** Hash de senha com PBKDF2-SHA256 (Web Crypto). Senhas nunca são guardadas em claro (ADR-0010). */
const ITERATIONS = 100_000
const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer | Uint8Array) =>
  Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

export function createSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: ITERATIONS },
    key,
    256,
  )
  return toHex(bits)
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  return (await hashPassword(password, salt)) === expectedHash
}
