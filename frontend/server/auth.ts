import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import type { User } from "../db/schema.js";
import { forbidden, unauthorized } from "./http.js";

// PBKDF2-SHA256, same "salt.key" base64 format as the original .NET API.
const ITERATIONS = 100_000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
  return `${salt.toString("base64")}.${key.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, keyB64] = stored.split(".");
  if (!saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = pbkdf2Sync(password, Buffer.from(saltB64, "base64"), ITERATIONS, expected.length, "sha256");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// ---------- JWT (HS256) ----------
const TOKEN_TTL_SECONDS = 12 * 60 * 60;
let secretPromise: Promise<string> | null = null;

/** Uses JWT_SECRET when configured, otherwise a random secret generated once and kept in Blobs. */
function getSecret(): Promise<string> {
  if (process.env.JWT_SECRET) return Promise.resolve(process.env.JWT_SECRET);
  secretPromise ??= (async () => {
    const store = getStore("app-config");
    const existing = await store.get("jwt-secret", { type: "text" });
    if (existing) return existing;
    const fresh = randomBytes(48).toString("base64url");
    await store.set("jwt-secret", fresh, { onlyIfNew: true });
    return (await store.get("jwt-secret", { type: "text" })) ?? fresh;
  })().catch((err) => {
    secretPromise = null;
    throw err;
  });
  return secretPromise;
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

export interface AuthUser {
  id: number;
  role: string;
  name: string;
  isAdmin: boolean;
}

export async function createToken(user: User): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    sub: String(user.id), email: user.email, name: user.fullName, role: user.role,
    iat: now, exp: now + TOKEN_TTL_SECONDS,
  }));
  const sig = createHmac("sha256", await getSecret()).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export async function authenticate(req: Request): Promise<AuthUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const parts = token.split(".");
  if (parts.length !== 3) throw unauthorized();

  const expected = createHmac("sha256", await getSecret()).update(`${parts[0]}.${parts[1]}`).digest();
  const given = Buffer.from(parts[2], "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw unauthorized();

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw unauthorized();
  }
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw unauthorized("Session expired");

  const id = parseInt(payload.sub, 10);
  if (!id) throw unauthorized();
  return { id, role: payload.role, name: payload.name, isAdmin: payload.role === "Admin" };
}

export function requireAdmin(user: AuthUser) {
  if (!user.isAdmin) throw forbidden("Admin access required");
}
