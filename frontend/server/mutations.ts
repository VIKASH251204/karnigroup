import { admin } from '@netlify/identity';
import { getDatabase } from '@netlify/database';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as t from '../db/schema.js';
import { requireAdmin, type AuthUser } from './auth.js';
import { badRequest, forbidden, notFound, toDate, trimOrNull } from './http.js';
import { loadData } from './data.js';
import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';

const required = (value: unknown, name: string, max = 150) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw badRequest(`Valid ${name} is required (max ${max} characters)`);
  return value.trim();
};
const choice = (value: unknown, values: string[], fallback?: string): string => {
  if ((value === undefined || value === '') && fallback) return fallback;
  if (typeof value !== 'string' || !values.includes(value)) throw badRequest(`Expected one of: ${values.join(', ')}`);
  return value;
};
const number = (value: unknown, name: string, positive = false) => {
  if (value === null || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || (positive && Number(value) <= 0)) throw badRequest(`Invalid ${name}`);
  return Number(value);
};
const idValue = (value: unknown, name: string) => {
  const n = number(value, name, true); if (!Number.isSafeInteger(n)) throw badRequest(`Invalid ${name}`); return n;
};
async function exists(table: any, id: number) {
  const [row] = await db.select().from(table).where(eq(table.id, id));
  if (!row) throw badRequest('Linked record not found');
  return row;
}
export async function mutate(resource: string, id: number | null, action: string | undefined, extraId: number | null, req: Request, me: AuthUser, body: Record<string, any>) {
  const deleting = req.method === 'DELETE';
  if (!['POST','PUT','DELETE'].includes(req.method)) throw badRequest('Unsupported method');
  if (resource === 'sitevisits' && action === 'photos') {
    if (!id) throw notFound();
    const visit = await exists(t.siteVisits, id);
    if (!me.isAdmin && visit.createdById !== me.id) throw forbidden();
    if (deleting) {
      requireAdmin(me);
      if (!extraId) throw notFound();
      const [photo] = await db.select().from(t.siteVisitPhotos).where(and(eq(t.siteVisitPhotos.id, extraId), eq(t.siteVisitPhotos.siteVisitId, id)));
      if (!photo) throw notFound();
      await db.delete(t.siteVisitPhotos).where(eq(t.siteVisitPhotos.id, extraId));
      await getStore('site-photos').delete(photo.filePath.split('/').pop()!);
      return { message: 'Photo deleted' };
    }
    if (req.method !== 'POST') throw notFound();
    const form = await req.formData();
    const files = form.getAll('files').filter((f): f is File => typeof f !== 'string');
    if (!files.length || files.length > 10) throw badRequest('Upload 1–10 photos');
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (files.some(f => !allowed.includes(f.type) || f.size > 4_000_000)) throw badRequest('Use JPG, PNG or WebP photos under 4 MB');
    for (const file of files) {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const key = `${randomUUID()}.${extension}`;
      await getStore('site-photos').set(key, await file.arrayBuffer());
      try {
        await db.insert(t.siteVisitPhotos).values({ siteVisitId: id, filePath: `/api/photos/${key}`,
          caption: trimOrNull(form.get('caption'))?.slice(0,200), uploadedById: me.id });
      } catch (error) { await getStore('site-photos').delete(key); throw error; }
    }
    return (await loadData(me)).sitevisits.find(v => v.id === id);
  }
  // Associates can register clients and add visits. All remaining writes require an administrator.
  if (!(req.method === 'POST' && !id && ['persons','sitevisits'].includes(resource))) requireAdmin(me);
  const tables = { users: t.users, persons: t.persons, plots: t.plots, sales: t.sales,
    payments: t.payments, commissions: t.commissions, sitevisits: t.siteVisits };
  const table = tables[resource as keyof typeof tables];
  if (!table) throw notFound();
  let current: any = null;
  if (id) {
    const [row] = await db.select().from(table).where(eq(table.id, id));
    if (!row) throw notFound();
    current = row;
  }
  if ((req.method === 'PUT' || deleting) && !current) throw notFound();
  if (req.method === 'POST' && id) throw notFound();
  if (resource === 'sales') {
    if (!deleting) {
      idValue(body.personId, 'client'); idValue(body.plotId, 'plot');
      number(body.dealAmount, 'deal amount', true); toDate(body.saleDate, 'sale date');
      choice(body.status, ['InProgress','Completed','Cancelled'], 'InProgress');
    }
    const client = await getDatabase().pool.connect();
    try {
      await client.query('BEGIN');
      const target = deleting ? current.plotId : Number(body.plotId);
      const plotIds = [...new Set([target, ...(current ? [current.plotId] : [])])].sort((a,b) => a-b);
      const locked = await client.query('SELECT * FROM plots WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [plotIds]);
      const plot = locked.rows.find((p: any) => p.id === target);
      if (!plot) throw badRequest('Plot not found');
      if (deleting) {
        await client.query('DELETE FROM commissions WHERE sale_id = $1', [id]);
        await client.query('DELETE FROM sales WHERE id = $1', [id]);
      } else {
        const status = body.status || 'InProgress';
        const occupied = await client.query("SELECT id FROM sales WHERE plot_id = $1 AND status <> 'Cancelled' AND id <> $2", [target, id ?? 0]);
        if (status !== 'Cancelled' && (occupied.rows.length || (plot.status === 'Blocked') || (!current && plot.status === 'Sold'))) throw badRequest('Plot is not available');
        if (current) {
          await client.query('UPDATE sales SET person_id=$1, plot_id=$2, deal_amount=$3, sale_date=$4, status=$5 WHERE id=$6',
            [body.personId, target, body.dealAmount, toDate(body.saleDate, 'sale date'), status, id]);
        } else {
          const inserted = await client.query('INSERT INTO sales (person_id,plot_id,deal_amount,sale_date,status,registered_by_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [body.personId,target,body.dealAmount,toDate(body.saleDate,'sale date'),status,me.id]);
          id = inserted.rows[0].id;
        }
        const sellerId = current?.registeredById ?? me.id;
        const seller = await client.query('SELECT commission_rate FROM users WHERE id=$1', [sellerId]);
        const rate = Number(seller.rows[0].commission_rate);
        const amount = Math.round(Number(body.dealAmount)*rate)/100;
        if (!current && status !== 'Cancelled') await client.query('INSERT INTO commissions (user_id,sale_id,amount,rate) VALUES ($1,$2,$3,$4)', [sellerId,id,amount,rate]);
        if (current) {
          const settled = await client.query("SELECT id FROM commissions WHERE sale_id=$1 AND status IN ('Approved','Paid')", [id]);
          if (settled.rows.length && (status === 'Cancelled' || Number(body.dealAmount) !== current.dealAmount)) throw badRequest('Resolve approved or paid commissions before changing this sale');
          await client.query("UPDATE commissions SET amount=$1, status=$2 WHERE sale_id=$3 AND status IN ('Pending','Rejected')", [amount,status === 'Cancelled' ? 'Rejected' : 'Pending',id]);
        }
      }
      for (const plotId of plotIds) await client.query("UPDATE plots SET status=CASE WHEN EXISTS (SELECT 1 FROM sales WHERE plot_id=$1 AND status <> 'Cancelled') THEN 'Sold' ELSE 'Available' END WHERE id=$1", [plotId]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  } else if (deleting) {
    if (resource === 'users') {
      if (id === me.id) throw badRequest('You cannot delete your own account');
      const data = await loadData(me);
      if (data.persons.some(p => p.registeredById === id) || data.sales.some(s => s.registeredById === id)
        || data.commissions.some(c => c.userId === id || c.approvedById === id)
        || data.sitevisits.some(v => v.createdById === id || v.photos.some(p => p.uploadedById === id))
        || data.payments.some(p => p.verifiedById === id)) throw badRequest('User has linked business data. Block the account instead.');
      if (current.identityId) await admin.deleteUser(current.identityId);
    }
    const photos = resource === 'sitevisits' ? await db.select().from(t.siteVisitPhotos).where(eq(t.siteVisitPhotos.siteVisitId,id!)) : [];
    await db.delete(table).where(eq(table.id, id!));
    for (const photo of photos) await getStore('site-photos').delete(photo.filePath.split('/').pop()!);
  } else {
    let values: any;
    if (resource === 'persons') values = {
      fullName: required(body.fullName, 'name',120), phone: required(body.phone,'phone',20),
      email: trimOrNull(body.email), address: trimOrNull(body.address), idProofNumber: trimOrNull(body.idProofNumber),
      notes: trimOrNull(body.notes), status: choice(body.status,['Active','Inactive'],'Active'),
      ...(!current ? { registeredById: me.id } : {}),
    };
    if (resource === 'plots') {
      const status = choice(body.status,['Available','Sold','Blocked'],'Available');
      if (current && current.status !== status) {
        const linked = await db.select().from(t.sales).where(eq(t.sales.plotId,id!));
        if (linked.some(s => s.status !== 'Cancelled')) throw badRequest('Update the linked sale before changing plot status');
      }
      values = { plotNo: required(body.plotNo,'plot number',30), project: required(body.project,'project',100),
        block: trimOrNull(body.block), sizeSqFt: number(body.sizeSqFt,'size',true), price: number(body.price,'price',true), status };
    }
    if (resource === 'sitevisits') {
      const person = await exists(t.persons,idValue(body.personId,'client'));
      if (!me.isAdmin && person.registeredById !== me.id) throw forbidden();
      if (body.plotId) await exists(t.plots,idValue(body.plotId,'plot'));
      values = { personId: person.id, plotId: body.plotId || null, visitDate: toDate(body.visitDate,'visit date'),
        notes: trimOrNull(body.notes), status: choice(body.status,['Scheduled','Completed','Cancelled'],'Completed'),
        ...(!current ? { createdById: me.id } : {}) };
    }
    if (resource === 'payments') {
      if (current) {
        if (action !== 'verify') throw notFound();
        values = { status: choice(body.status,['Approved','Rejected']), verifiedById: me.id, verifiedAt: new Date(),
          ...(body.notes !== undefined ? { notes: trimOrNull(body.notes) } : {}) };
      } else {
        await exists(t.sales,idValue(body.saleId,'sale'));
        values = { saleId: body.saleId, amount: number(body.amount,'amount',true),
          paymentType: choice(body.paymentType,['Advance','Received'],'Received'), method: required(body.method,'payment method',20),
          paidAt: toDate(body.paidAt,'payment date'), notes: trimOrNull(body.notes), status: 'Pending' };
      }
    }
    if (resource === 'commissions') {
      if (!current || !['approve','pay','reject'].includes(action ?? '')) throw notFound();
      if (action === 'pay' && current.status !== 'Approved') throw badRequest('Approve the commission before paying it');
      if (current.status === 'Paid') throw badRequest('Paid commissions cannot be changed');
      values = { status: action === 'approve' ? 'Approved' : action === 'pay' ? 'Paid' : 'Rejected', approvedById: me.id, approvedAt: new Date() };
    }
    if (resource === 'users') {
      const email = required(body.email,'email').toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('Invalid email');
      const fullName = required(body.fullName,'name',120);
      const phone = required(body.phone,'phone',20);
      const role = choice(body.role,['Admin','Associate']);
      const status = choice(body.status,['Active','Blocked'],'Active');
      if (id === me.id && (role !== 'Admin' || status !== 'Active')) throw badRequest('You cannot remove your own administrator access');
      const password = body.password;
      if ((!current || password) && (typeof password !== 'string' || password.length < 8)) throw badRequest('Password must be at least 8 characters');
      if (body.parentUserId) {
        if (Number(body.parentUserId) === id) throw badRequest('A user cannot report to themselves');
        await exists(t.users,idValue(body.parentUserId,'parent user'));
      }
      const rate = number(body.commissionRate ?? 5,'commission rate');
      if (rate > 100) throw badRequest('Commission rate must be between 0 and 100');
      const duplicate = await db.select({id:t.users.id}).from(t.users).where(eq(t.users.email,email));
      if (duplicate.some(u => u.id !== id)) throw badRequest('Email already registered');
      let identityId = current?.identityId;
      if (identityId) await admin.updateUser(identityId, { email, ...(password ? { password } : {}),
        app_metadata: { roles: [role.toLowerCase()] }, user_metadata: { full_name: fullName } });
      else {
        const identity = await admin.createUser({ email, password, data: {
          app_metadata: { roles: [role.toLowerCase()] }, user_metadata: { full_name: fullName } } });
        identityId = identity.id;
        await admin.updateUser(identityId, { confirm: true });
      }
      values = { identityId, fullName, email, phone, role, status,
        parentUserId: body.parentUserId || null, commissionRate: rate, designation: trimOrNull(body.designation),
        ...(!current ? {passwordHash:''} : {}) };
    }
    if (!values) throw notFound();
    if (current) await db.update(table).set(values).where(eq(table.id,id!));
    else { const [row] = await db.insert(table).values(values).returning({id:table.id}); id = row.id; }
  }
  if (deleting) return { message: 'Record deleted' };
  const data = await loadData(me);
  return data[resource as keyof typeof data].find(row => row.id === id);
}
