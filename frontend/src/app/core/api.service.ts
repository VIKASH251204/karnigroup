import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  AdminDashboard, Commission, CommissionReport, EmployeeDashboard, PagedResult,
  Payment, Person, PersonRequest, Plot, Sale, SalesReport, SiteVisit, User,
  CreateUserRequest, UpdateUserRequest
} from './models';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private q(params: Record<string, string | number | undefined | null>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  // ---------- Dashboard ----------
  getEmployeeDashboard(from?: string, to?: string) {
    return this.http.get<EmployeeDashboard>(`${API}/dashboard/associate`, { params: this.q({ from, to }) });
  }
  getAdminDashboard(from?: string, to?: string) {
    return this.http.get<AdminDashboard>(`${API}/dashboard/admin`, { params: this.q({ from, to }) });
  }

  // ---------- Persons ----------
  getPersons(opts: { search?: string; status?: string; registeredBy?: number; view?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResult<Person>>(`${API}/persons`, { params: this.q({ ...opts }) });
  }
  getPerson(id: number) {
    return this.http.get<Person>(`${API}/persons/${id}`);
  }
  createPerson(body: PersonRequest) {
    return this.http.post<Person>(`${API}/persons`, body);
  }
  updatePerson(id: number, body: PersonRequest) {
    return this.http.put<Person>(`${API}/persons/${id}`, body);
  }
  deletePerson(id: number) {
    return this.http.delete<{ message: string }>(`${API}/persons/${id}`);
  }

  // ---------- Plots ----------
  getPlots(opts: { search?: string; status?: string } = {}) {
    return this.http.get<Plot[]>(`${API}/plots`, { params: this.q({ ...opts }) });
  }
  createPlot(body: Partial<Plot>) {
    return this.http.post<Plot>(`${API}/plots`, body);
  }
  updatePlot(id: number, body: Partial<Plot>) {
    return this.http.put<Plot>(`${API}/plots/${id}`, body);
  }
  deletePlot(id: number) {
    return this.http.delete<{ message: string }>(`${API}/plots/${id}`);
  }

  // ---------- Sales ----------
  getSales(opts: { search?: string; status?: string; registeredBy?: number; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResult<Sale>>(`${API}/sales`, { params: this.q({ ...opts }) });
  }
  createSale(body: { personId: number; plotId: number; dealAmount: number; saleDate: string; status: string }) {
    return this.http.post<Sale>(`${API}/sales`, body);
  }
  updateSale(id: number, body: { personId: number; plotId: number; dealAmount: number; saleDate: string; status: string }) {
    return this.http.put<Sale>(`${API}/sales/${id}`, body);
  }
  deleteSale(id: number) {
    return this.http.delete<{ message: string }>(`${API}/sales/${id}`);
  }

  // ---------- Payments ----------
  getPayments(opts: { status?: string; saleId?: number; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResult<Payment>>(`${API}/payments`, { params: this.q({ ...opts }) });
  }
  createPayment(body: { saleId: number; amount: number; paymentType: string; method: string; paidAt: string; notes?: string }) {
    return this.http.post<Payment>(`${API}/payments`, body);
  }
  verifyPayment(id: number, status: 'Approved' | 'Rejected', notes?: string) {
    return this.http.put<Payment>(`${API}/payments/${id}/verify`, { status, notes });
  }
  deletePayment(id: number) {
    return this.http.delete<{ message: string }>(`${API}/payments/${id}`);
  }

  // ---------- Commissions ----------
  getCommissions(opts: { status?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResult<Commission>>(`${API}/commissions`, { params: this.q({ ...opts }) });
  }
  approveCommission(id: number) {
    return this.http.put<Commission>(`${API}/commissions/${id}/approve`, {});
  }
  payCommission(id: number) {
    return this.http.put<Commission>(`${API}/commissions/${id}/pay`, {});
  }
  rejectCommission(id: number) {
    return this.http.put<Commission>(`${API}/commissions/${id}/reject`, {});
  }

  // ---------- Site Visits ----------
  getSiteVisits(opts: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
    return this.http.get<PagedResult<SiteVisit>>(`${API}/sitevisits`, { params: this.q({ ...opts }) });
  }
  createSiteVisit(body: { personId: number; plotId: number | null; visitDate: string; notes?: string; status: string }) {
    return this.http.post<SiteVisit>(`${API}/sitevisits`, body);
  }
  updateSiteVisit(id: number, body: { personId: number; plotId: number | null; visitDate: string; notes?: string; status: string }) {
    return this.http.put<SiteVisit>(`${API}/sitevisits/${id}`, body);
  }
  uploadVisitPhotos(id: number, files: File[], caption?: string) {
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);
    if (caption) form.append('caption', caption);
    return this.http.post<SiteVisit>(`${API}/sitevisits/${id}/photos`, form);
  }
  deleteVisitPhoto(visitId: number, photoId: number) {
    return this.http.delete<{ message: string }>(`${API}/sitevisits/${visitId}/photos/${photoId}`);
  }
  deleteSiteVisit(id: number) {
    return this.http.delete<{ message: string }>(`${API}/sitevisits/${id}`);
  }

  // ---------- Users ----------
  getUsers(opts: { role?: string; search?: string } = {}) {
    return this.http.get<User[]>(`${API}/users`, { params: this.q({ ...opts }) });
  }
  getUser(id: number) {
    return this.http.get<User>(`${API}/users/${id}`);
  }
  createUser(body: CreateUserRequest) {
    return this.http.post<User>(`${API}/users`, body);
  }
  updateUser(id: number, body: UpdateUserRequest) {
    return this.http.put<User>(`${API}/users/${id}`, body);
  }
  deleteUser(id: number) {
    return this.http.delete<{ message: string }>(`${API}/users/${id}`);
  }

  // ---------- Reports ----------
  getSalesReport(from?: string, to?: string) {
    return this.http.get<SalesReport>(`${API}/reports/sales`, { params: this.q({ from, to }) });
  }
  getCommissionReport(from?: string, to?: string) {
    return this.http.get<CommissionReport>(`${API}/reports/commissions`, { params: this.q({ from, to }) });
  }
}
