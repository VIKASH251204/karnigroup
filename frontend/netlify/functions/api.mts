import type { Config } from '@netlify/functions';
import { login, logout, admin, AuthError, verifyRequestOrigin } from '@netlify/identity';
import { sql, eq } from 'drizzle-orm';
import { getStore } from '@netlify/blobs';
import { db } from '../../db/index.js';
import { siteVisitPhotos, siteVisits } from '../../db/schema.js';
import { authenticate, requireAdmin } from '../../server/auth.js';
import { HttpError, badRequest, forbidden, notFound, ok, paging, readJson, unauthorized } from '../../server/http.js';
import { loadData, dashboard, report } from '../../server/data.js';
import { mutate } from '../../server/mutations.js';

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const [resource, rawId, action, rawExtra] = url.pathname.replace(/^\/api\/?/, '').split('/');
    const method = req.method;
    // Opening the login endpoint in a browser must not enter protected API routing.
    if (resource === 'auth' && rawId === 'login' && !action && !rawExtra) {
      if (method === 'GET' || method === 'HEAD') {
        return new Response(null, { status: 303, headers: { Location: '/login', 'Cache-Control': 'no-store' } });
      }
      if (method !== 'POST') {
        return Response.json({ message: 'Use POST with email and password to sign in, or open /login.' }, {
          status: 405, headers: { Allow: 'GET, HEAD, POST', 'Cache-Control': 'no-store' },
        });
      }
    }
    if (!['GET','HEAD','OPTIONS'].includes(method)) verifyRequestOrigin(req);
    if (resource === 'health' && method === 'GET') {
      await db.execute(sql`select 1`);
      return ok({ status: 'ok', database: 'connected' });
    }
    if (resource === 'auth' && rawId === 'login' && !action && !rawExtra && method === 'POST') {
      const body = await readJson(req);
      if (typeof body.email !== 'string' || !body.email.trim() || typeof body.password !== 'string' || !body.password) throw badRequest('Email and password are required');
      await login(body.email.trim(), body.password);
      return ok({ message: 'Signed in' });
    }
    const me = await authenticate(req);
    if (resource === 'auth') {
      if (rawId === 'logout' && method === 'POST') { await logout(); return ok({ message: 'Signed out' }); }
      if (rawId === 'change-password' && method === 'POST') {
        const body = await readJson(req);
        const data = await loadData(me), user = data.users.find(u => u.id === me.id)!;
        if (typeof body.oldPassword !== 'string' || typeof body.newPassword !== 'string' || body.newPassword.length < 8) throw badRequest('A new password of at least 8 characters is required');
        const identity = await login(user.email, body.oldPassword);
        await admin.updateUser(identity.id, { password: body.newPassword });
        return ok({ message: 'Password changed successfully' });
      }
      if (rawId === 'me' && method === 'GET') return ok((await loadData(me)).users.find(u => u.id === me.id));
      throw notFound();
    }
    if (resource === 'photos' && rawId && method === 'GET') {
      const [photo] = await db.select().from(siteVisitPhotos).where(eq(siteVisitPhotos.filePath, `/api/photos/${rawId}`));
      if (!photo) throw notFound();
      const [visit] = await db.select().from(siteVisits).where(eq(siteVisits.id, photo.siteVisitId));
      if (!visit || (!me.isAdmin && visit.createdById !== me.id)) throw forbidden();
      const data = await getStore('site-photos').get(rawId, { type: 'arrayBuffer' });
      if (!data) throw notFound();
      const extension = rawId.split('.').pop();
      return new Response(data, { headers: { 'Content-Type': extension === 'jpg' ? 'image/jpeg' : extension === 'png' ? 'image/png' : 'image/webp',
        'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (resource === 'dashboard' && method === 'GET') {
      if (!['admin','associate'].includes(rawId)) throw notFound();
      if (rawId === 'admin') requireAdmin(me);
      return ok(dashboard(await loadData(me), me, url, rawId === 'admin'));
    }
    if (resource === 'reports' && method === 'GET') {
      if (!['sales','commissions'].includes(rawId)) throw notFound();
      return ok(report(await loadData(me), me, url, rawId));
    }
    const resources = ['users','persons','plots','sales','payments','commissions','sitevisits'];
    if (!resources.includes(resource)) throw notFound();
    const id = rawId ? Number(rawId) : null;
    if (rawId && (!Number.isSafeInteger(id) || id! < 1)) throw notFound();
    if (method !== 'GET') {
      const multipart = req.headers.get('content-type')?.includes('multipart/form-data');
      const body = method === 'DELETE' || multipart ? {} : await readJson(req);
      return ok(await mutate(resource, id, action, rawExtra ? Number(rawExtra) : null, req, me, body), method === 'POST' && !id ? 201 : 200);
    }
    if (action) throw notFound();
    const data = await loadData(me);
    let rows: any[] = data[resource as keyof typeof data];
    if (!me.isAdmin) {
      if (resource === 'users') {
        const parent = data.users.find(u => u.id === me.id)?.parentUserId;
        rows = rows.filter(u => u.id === me.id || u.parentUserId === me.id || (parent && (u.id === parent || u.parentUserId === parent)));
      }
      if (resource === 'sales' || (resource === 'persons' && (id || url.searchParams.get('view') !== 'clients'))) rows = rows.filter(r => r.registeredById === me.id);
      if (resource === 'payments') rows = rows.filter(p => data.sales.some(s => s.id === p.saleId && s.registeredById === me.id));
      if (resource === 'commissions') rows = rows.filter(c => c.userId === me.id);
      if (resource === 'sitevisits') rows = rows.filter(v => v.createdById === me.id);
    }
    if (id) {
      if (resource === 'users' && !me.isAdmin && id !== me.id) throw forbidden();
      const row = rows.find(r => r.id === id); if (!row) throw notFound(); return ok(row);
    }
    const owner = Number(url.searchParams.get('registeredBy'));
    if (me.isAdmin && owner && ['persons','sales'].includes(resource)) rows = rows.filter(r => r.registeredById === owner);
    if (resource === 'persons') {
      const view = url.searchParams.get('view');
      if (view === 'team') rows = rows.filter(p => p.registeredById === (me.isAdmin && owner ? owner : me.id));
      if (view === 'clients') rows = rows.filter(p => data.sales.some(s => s.personId === p.id && s.status !== 'Cancelled' && (me.isAdmin ? !owner || s.registeredById === owner : s.registeredById === me.id)));
    }
    for (const key of ['status','role','saleId']) {
      const value = url.searchParams.get(key); if (value) rows = rows.filter(r => String(r[key]) === value);
    }
    const search = url.searchParams.get('search')?.trim().toLowerCase();
    if (search) rows = rows.filter(r => ['fullName','phone','email','plotNo','project','clientName'].some(k => String(r[k] ?? '').toLowerCase().includes(search)));
    rows.sort((a,b) => resource === 'users' ? a.fullName.localeCompare(b.fullName) : b.id - a.id);
    if (['users','plots'].includes(resource)) return ok(rows);
    const { page, pageSize, offset } = paging(url);
    return ok({ items: rows.slice(offset, offset + pageSize), total: rows.length, page, pageSize });
  } catch (error) {
    if (error instanceof HttpError) return ok({ message: error.message }, error.status);
    if (error instanceof AuthError) return ok({ message: error.status === 400 || error.status === 401 ? 'Invalid email or password, or email is not confirmed.' : 'Unable to complete account operation.' }, error.status === 400 ? 401 : error.status ?? 503);
    const code = (error as any)?.code ?? (error as any)?.cause?.code;
    if (code === '23505') return ok({ message: 'This record already exists.' }, 409);
    if (code === '23503') return ok({ message: 'This record has linked data, or a linked record no longer exists.' }, 409);
    if (['22001','22P02','23502'].includes(code)) return ok({ message: 'Some fields contain invalid or missing values.' }, 400);
    // Never log request bodies, account details, database URLs or raw provider errors.
    console.error('API request failed', { category: error instanceof Error ? error.name : 'UnknownError' });
    return ok({ message: 'The service is temporarily unavailable. Please try again.' }, 503);
  }
};
export const config: Config = { path: ['/api', '/api/*'] };
