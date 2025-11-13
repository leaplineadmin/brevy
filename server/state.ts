// OAuth state utilities (per brief specification)
import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-dev-secret';

export function encodeState(payload: { draftId?: string; returnTo?: string; ts?: number }, secret: string = SESSION_SECRET) {
  const data = { ...payload, ts: Date.now() };
  const raw = JSON.stringify(data);
  const sig = crypto.createHmac("sha256", secret).update(raw).digest("base64url");
  const token = Buffer.from(raw).toString("base64url") + "." + sig;
  return token;
}

export function decodeState(token: string, secret: string = SESSION_SECRET) {
  try {
    const [rawB64, sig] = token.split(".");
    if (!rawB64 || !sig) throw new Error("STATE_FORMAT");
    
    const raw = Buffer.from(rawB64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("base64url");
    
    if (expected !== sig) throw new Error("STATE_SIG");
    
    const data = JSON.parse(raw);
    if (Date.now() - (data.ts ?? 0) > STATE_TTL_MS) throw new Error("STATE_EXPIRED");
    
    return data as { draftId?: string; returnTo?: string; ts: number };
  } catch (error) {
    throw error;
  }
}