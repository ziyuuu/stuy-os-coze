const SALT = "study-os-coze-auth";
export const COOKIE_NAME = "study_os_token";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecret(): string {
  const password = process.env.ACCESS_PASSWORD;
  if (!password) return SALT;
  return `${SALT}:${password}`;
}

function toBase64Url(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toHex(data: ArrayBuffer): string {
  return Array.from(new Uint8Array(data), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function hmacSign(message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSecret());
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", key, encoder.encode(message));
}

/** 签名：base64url(timestamp.hex_hmac) */
export async function signToken(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacSign(ts);
  const payload = `${ts}.${toHex(sig)}`;
  return toBase64Url(new TextEncoder().encode(payload));
}

/** 验证签名 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const payloadBytes = fromBase64Url(token);
    const payload = new TextDecoder().decode(payloadBytes);
    const [ts, sig] = payload.split(".");
    if (!ts || !sig) return false;

    const age = Date.now() - parseInt(ts, 10);
    if (age < 0 || age > MAX_AGE_SECONDS * 1000) return false;

    const expectedSig = await hmacSign(ts);
    const expectedHex = toHex(expectedSig);

    return constantTimeEqual(hexToBytes(sig), hexToBytes(expectedHex));
  } catch {
    return false;
  }
}

/** 生成 Set-Cookie header 值 */
export async function authCookieHeader(): Promise<string> {
  return `${COOKIE_NAME}=${await signToken()}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}
