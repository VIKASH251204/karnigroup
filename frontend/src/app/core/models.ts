// ============ Shared ============
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Role = 'Admin' | 'Associate';

// ============ Auth / Users ============
export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'Active' | 'Blocked';
  parentUserId: number | null;
  parentName: string | null;
  profilePhoto: string | null;
  designation: string | null;
  commissionRate: number;
  createdAt: string;
  totalRegistered: number;
  plotsSold: number;
  revenue: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  parentUserId: number | null;
  commissionRate: number;
  designation?: string | null;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  parentUserId: number | null;
  commissionRate: number;
  designation?: string | null;
  status: 'Active' | 'Blocked';
}

// ============ Persons ============
export interface Person {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  idProofNumber: string | null;
  status: 'Active' | 'Inactive';
  notes: string | null;
  registeredById: number;
  registeredByName: string;
  createdAt: string;
  saleCount: number;
  totalBusiness: number;
}

export interface PersonRequest {
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  idProofNumber?: string | null;
  notes?: string | null;
  status: string;
}

// ============ Plots ============
export interface Plot {
  id: number;
  plotNo: string;
  project: string;
  block: string | null;
  sizeSqFt: number;
  price: number;
  status: 'Available' | 'Sold' | 'Blocked';
  createdAt: string;
}

// ============ Sales / Payments ============
export interface Sale {
  id: number;
  personId: number;
  clientName: string;
  plotId: number;
  plotNo: string;
  dealAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  advanceAmount: number;
  saleDate: string;
  status: 'InProgress' | 'Completed' | 'Cancelled';
  registeredById: number;
  registeredByName: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  saleId: number;
  clientName: string;
  plotNo: string;
  amount: number;
  paymentType: 'Received' | 'Advance';
  method: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  paidAt: string;
  notes: string | null;
  verifiedById: number | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
}

// ============ Commissions ============
export interface Commission {
  id: number;
  userId: number;
  userName: string;
  saleId: number | null;
  plotNo: string | null;
  clientName: string | null;
  amount: number;
  rate: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  requestedAt: string;
  approvedAt: string | null;
}

// ============ Site Visits ============
export interface SiteVisitPhoto {
  id: number;
  filePath: string;
  caption: string | null;
  uploadedById: number;
  uploadedByName: string;
  uploadedAt: string;
}

export interface SiteVisit {
  id: number;
  personId: number;
  clientName: string;
  clientPhone: string | null;
  plotId: number | null;
  plotNo: string | null;
  visitDate: string;
  notes: string | null;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdById: number;
  createdByName: string;
  createdAt: string;
  photos: SiteVisitPhoto[];
}

// ============ Dashboard / Reports ============
export interface MonthlyPoint {
  month: string;
  plotsSold: number;
  revenue: number;
}

export interface PaymentStatus {
  received: number;
  pending: number;
  advance: number;
  receivedPercent: number;
}

export interface EmployeeDashboard {
  myRank: number;
  totalUsers: number;
  totalRegistered: number;
  totalPlotsSold: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  salesOverview: MonthlyPoint[];
  paymentStatus: PaymentStatus;
  recentPersons: Person[];
  recentSales: Sale[];
}

export interface AdminPerformance {
  rank: number;
  userId: number;
  adminName: string;
  plotsSold: number;
  revenue: number;
  commission: number;
}

export interface AdminDashboard {
  totalAdmins: number;
  activeAdmins: number;
  totalRegistered: number;
  totalPlotsSold: number;
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
  totalAdvance: number;
  receivedPercent: number;
  salesRevenueOverview: MonthlyPoint[];
  paymentCollection: PaymentStatus;
  topAdmins: AdminPerformance[];
  recentSales: Sale[];
  pendingCommissions: Commission[];
}

export interface SalesReport {
  from: string;
  to: string;
  totalDeals: number;
  totalRevenue: number;
  totalReceived: number;
  totalPending: number;
  plotsSold: number;
  monthly: MonthlyPoint[];
  byMember: AdminPerformance[];
}

export interface CommissionReport {
  from: string;
  to: string;
  total: number;
  pending: number;
  approved: number;
  paid: number;
  byUser: { name: string; total: number; pending: number; paid: number }[];
}
