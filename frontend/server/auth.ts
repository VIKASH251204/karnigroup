import { getUser } from '@netlify/identity';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { forbidden, unauthorized } from './http.js';

export interface AuthUser { id: number; role: string; name: string; isAdmin: boolean }

export async function authenticate(_req: Request): Promise<AuthUser> {
  const identity = await getUser();
  if (!identity?.email) throw unauthorized();
  let [user] = await db.select().from(users).where(eq(users.identityId, identity.id));
  if (!user) {
    // Only an administrator invited and assigned a role in Netlify may bootstrap an account.
    if (!identity.roles?.some(role => role.toLowerCase() === 'admin')) {
      throw forbidden('Your account is not linked to the panel. Contact your administrator.');
    }
    [user] = await db.insert(users).values({
      identityId: identity.id, email: identity.email.toLowerCase(),
      fullName: identity.name || identity.email, passwordHash: '', role: 'Admin',
    }).onConflictDoNothing({ target: users.identityId }).returning();
    if (!user) [user] = await db.select().from(users).where(eq(users.identityId, identity.id));
  }
  if (!user || user.status !== 'Active') throw forbidden('Your account has been blocked. Contact your administrator.');
  return { id: user.id, role: user.role, name: user.fullName, isAdmin: user.role === 'Admin' };
}

export function requireAdmin(user: AuthUser) {
  if (!user.isAdmin) throw forbidden('Admin access required');
}
