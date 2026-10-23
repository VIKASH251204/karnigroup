import { eq, getTableColumns } from 'drizzle-orm';
import { db } from '../db/index.js';
import * as t from '../db/schema.js';
import type { AuthUser } from './auth.js';
import { dateRange } from './http.js';

export async function loadData(me: AuthUser) {
  const { passwordHash: _password, ...userColumns } = getTableColumns(t.users);
  const [users, persons, plots, sales, payments, commissions, visits, photos] = await Promise.all([
    db.select(userColumns).from(t.users), db.select().from(t.persons), db.select().from(t.plots),
    db.select().from(t.sales), db.select().from(t.payments), db.select().from(t.commissions),
    db.select().from(t.siteVisits), db.select().from(t.siteVisitPhotos),
  ]);
  const name = (id: number | null) => users.find(u => u.id === id)?.fullName ?? null;
  const saleDtos = sales.map(s => {
    const paid = payments.filter(p => p.saleId === s.id);
    const receivedAmount = sum(paid.filter(p => p.status === 'Approved'), 'amount');
    return { ...s, clientName: persons.find(p => p.id === s.personId)?.fullName ?? '',
      plotNo: plots.find(p => p.id === s.plotId)?.plotNo ?? '', registeredByName: name(s.registeredById),
      receivedAmount, pendingAmount: Math.max(0, s.dealAmount - receivedAmount),
      advanceAmount: sum(paid.filter(p => p.paymentType === 'Advance' && p.status === 'Pending'), 'amount') };
  });
  const personDtos = persons.map(p => {
    const deals = sales.filter(s => s.personId === p.id && s.status !== 'Cancelled');
    return { ...p, registeredByName: name(p.registeredById), saleCount: deals.length, totalBusiness: sum(deals, 'dealAmount') };
  });
  const userDtos = users.map(({ identityId: _identity, ...u }) => {
    const deals = sales.filter(s => s.registeredById === u.id && s.status !== 'Cancelled');
    return { ...u, parentName: name(u.parentUserId), totalRegistered: persons.filter(p => p.registeredById === u.id).length,
      plotsSold: deals.length, revenue: sum(deals, 'dealAmount') };
  });
  const paymentDtos = payments.map(p => ({ ...p, clientName: saleDtos.find(s => s.id === p.saleId)?.clientName ?? '',
    plotNo: saleDtos.find(s => s.id === p.saleId)?.plotNo ?? '', verifiedByName: name(p.verifiedById) }));
  const commissionDtos = commissions.map(c => ({ ...c, userName: name(c.userId),
    clientName: saleDtos.find(s => s.id === c.saleId)?.clientName ?? null,
    plotNo: saleDtos.find(s => s.id === c.saleId)?.plotNo ?? null }));
  const visitDtos = visits.map(v => ({ ...v, clientName: persons.find(p => p.id === v.personId)?.fullName ?? '',
    clientPhone: persons.find(p => p.id === v.personId)?.phone ?? null,
    plotNo: plots.find(p => p.id === v.plotId)?.plotNo ?? null, createdByName: name(v.createdById),
    photos: photos.filter(p => p.siteVisitId === v.id).map(p => ({ ...p, uploadedByName: name(p.uploadedById) })) }));
  return { users: userDtos, persons: personDtos, plots, sales: saleDtos, payments: paymentDtos,
    commissions: commissionDtos, sitevisits: visitDtos };
}
export type Data = Awaited<ReturnType<typeof loadData>>;
export const sum = <T>(rows: T[], key: keyof T): number => Math.round(rows.reduce((n, row) => n + Number(row[key] ?? 0), 0) * 100) / 100;
export function monthly(sales: Data['sales']) {
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, index) => {
    const rows = sales.filter(s => s.saleDate.getUTCMonth() === index);
    return { month, plotsSold: rows.length, revenue: sum(rows, 'dealAmount') };
  });
}
export function collection(sales: Data['sales']) {
  const received = sum(sales, 'receivedAmount'), pending = sum(sales, 'pendingAmount');
  return { received, pending, advance: sum(sales, 'advanceAmount'),
    receivedPercent: received + pending ? Math.round(received / (received + pending) * 100) : 0 };
}
export function performance(data: Data, sales: Data['sales']) {
  return data.users.map(u => ({ userId: u.id, adminName: u.fullName,
    plotsSold: sales.filter(s => s.registeredById === u.id).length,
    revenue: sum(sales.filter(s => s.registeredById === u.id), 'dealAmount'),
    commission: sum(data.commissions.filter(c => c.userId === u.id), 'amount'),
  })).sort((a,b) => b.revenue - a.revenue).map((u,i) => ({ ...u, rank: i + 1 }));
}
export function report(data: Data, me: AuthUser, url: URL, kind: string) {
  const { from, to } = dateRange(url);
  const inWindow = (date: Date) => date >= from && date <= to;
  const sales = data.sales.filter(s => s.status !== 'Cancelled' && inWindow(s.saleDate) && (me.isAdmin || s.registeredById === me.id));
  const commissions = data.commissions.filter(c => (me.isAdmin || c.userId === me.id) && inWindow(c.requestedAt));
  if (kind === 'commissions') return { from, to, total: sum(commissions, 'amount'),
    pending: sum(commissions.filter(c => c.status === 'Pending'), 'amount'),
    approved: sum(commissions.filter(c => c.status === 'Approved'), 'amount'),
    paid: sum(commissions.filter(c => c.status === 'Paid'), 'amount'),
    byUser: data.users.map(u => { const rows = commissions.filter(c => c.userId === u.id); return {
      name: u.fullName, total: sum(rows, 'amount'), pending: sum(rows.filter(c => c.status === 'Pending'), 'amount'),
      paid: sum(rows.filter(c => c.status === 'Paid'), 'amount') }; }).filter(u => u.total > 0),
  };
  return { from, to, totalDeals: sales.length, totalRevenue: sum(sales, 'dealAmount'),
    totalReceived: sum(sales, 'receivedAmount'), totalPending: sum(sales, 'pendingAmount'), plotsSold: sales.length,
    monthly: monthly(sales), byMember: performance(data, sales).filter(u => u.plotsSold > 0) };
}
export function dashboard(data: Data, me: AuthUser, url: URL, admin: boolean) {
  const { from, to } = dateRange(url);
  const owned = data.sales.filter(s => (admin || s.registeredById === me.id) && s.status !== 'Cancelled');
  const sales = owned.filter(s => s.saleDate >= from && s.saleDate <= to);
  const payment = collection(sales);
  const recentSales = [...owned].sort((a,b) => +b.saleDate - +a.saleDate).slice(0,5);
  if (admin) return { totalAdmins: data.users.length, activeAdmins: data.users.filter(u => u.status === 'Active').length,
    totalRegistered: data.persons.length, totalPlotsSold: sales.length, totalRevenue: sum(sales, 'dealAmount'),
    totalReceived: payment.received, totalPending: payment.pending, totalAdvance: payment.advance, receivedPercent: payment.receivedPercent,
    salesRevenueOverview: monthly(sales), paymentCollection: payment,
    topAdmins: performance(data, sales).filter(u => u.plotsSold > 0).slice(0,5), recentSales,
    pendingCommissions: data.commissions.filter(c => c.status === 'Pending').sort((a,b) => +b.requestedAt - +a.requestedAt).slice(0,5) };
  const commissions = data.commissions.filter(c => c.userId === me.id);
  const persons = data.persons.filter(p => p.registeredById === me.id);
  return { myRank: performance(data, data.sales.filter(s => s.status !== 'Cancelled' && s.saleDate >= from && s.saleDate <= to)).find(u => u.userId === me.id)?.rank ?? 0,
    totalUsers: data.users.filter(u => u.status === 'Active').length, totalRegistered: persons.length,
    totalPlotsSold: sales.length, totalCommission: sum(commissions, 'amount'),
    pendingCommission: sum(commissions.filter(c => c.status === 'Pending'), 'amount'),
    approvedCommission: sum(commissions.filter(c => ['Approved','Paid'].includes(c.status)), 'amount'),
    salesOverview: monthly(sales), paymentStatus: payment, recentPersons: persons.sort((a,b) => +b.createdAt - +a.createdAt).slice(0,5), recentSales };
}
