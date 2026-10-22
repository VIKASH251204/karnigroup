import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Payment, Sale } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">{{ auth.isAdmin() ? 'Payment Management' : 'Payment Status' }}</div>
          <div class="small muted" style="margin-top:3px">
            {{ auth.isAdmin() ? 'Verify, approve or reject payments & advances' : 'Received, pending & advance payments of your sales (view only)' }}
          </div>
        </div>
        <div class="toolbar">
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" (click)="openCreate()">
              <app-icon name="plus" [size]="15" color="#fff" /> Add Payment
            </button>
          }
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Client</th><th>Plot</th><th>Amount</th><th>Type</th><th class="hide-sm">Method</th>
              <th class="hide-sm">Paid At</th><th>Status</th><th class="hide-sm">Verified</th>
              @if (auth.isAdmin()) { <th>Action</th> }
            </tr>
          </thead>
          <tbody>
            @for (p of payments(); track p.id; let i = $index) {
              <tr>
                <td>{{ (page() - 1) * pageSize + i + 1 }}</td>
                <td class="strong">{{ p.clientName }}</td>
                <td>{{ p.plotNo }}</td>
                <td class="strong">{{ p.amount | inr }}</td>
                <td>
                  <span class="badge" [class.blue]="p.paymentType === 'Received'" [class.purple]="p.paymentType === 'Advance'">
                    {{ p.paymentType }}
                  </span>
                </td>
                <td class="hide-sm">{{ p.method }}</td>
                <td class="hide-sm">{{ p.paidAt | fdate }}</td>
                <td>
                  <span class="badge" [class.green]="p.status === 'Approved'" [class.orange]="p.status === 'Pending'" [class.red]="p.status === 'Rejected'">
                    {{ p.status }}
                  </span>
                </td>
                <td class="small muted hide-sm">{{ p.verifiedAt ? (p.verifiedAt | fdate) : '—' }}</td>
                @if (auth.isAdmin()) {
                  <td>
                    @if (p.status === 'Pending') {
                      <div class="flex" style="gap:6px">
                        <button class="btn btn-success btn-sm" (click)="verify(p, 'Approved')">
                          <app-icon name="check" [size]="12" /> Approve
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="verify(p, 'Rejected')">
                          <app-icon name="x" [size]="12" /> Reject
                        </button>
                      </div>
                    } @else {
                      <button class="btn btn-ghost btn-sm" (click)="remove(p)"><app-icon name="trash" [size]="12" /></button>
                    }
                  </td>
                }
              </tr>
            } @empty {
              <tr><td colspan="10"><div class="empty"><app-icon name="card" [size]="28" color="#cbd5e1" /> No payments found</div></td></tr>
            }
          </tbody>
        </table>

        @if (!auth.isAdmin()) {
          <div class="view-only-chip" style="margin-top:14px">
            <app-icon name="shield" [size]="14" /> View only — payments are verified by admin
          </div>
        }

        <div class="pagination">
          <div class="info">Showing {{ payments().length }} of {{ total() }} payments</div>
          <button class="page-btn" [disabled]="page() <= 1" (click)="load(page() - 1)">Prev</button>
          <span class="small muted">Page {{ page() }}</span>
          <button class="page-btn" [disabled]="payments().length < pageSize" (click)="load(page() + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- ADD PAYMENT MODAL -->
    @if (showForm()) {
      <div class="modal-back" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">Add Payment</div>
            <button class="icon-btn" style="border:0" (click)="showForm.set(false)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field full">
                <label>Sale *</label>
                <select [(ngModel)]="form.saleId">
                  <option [ngValue]="0">— Select sale —</option>
                  @for (s of sales(); track s.id) {
                    <option [ngValue]="s.id">{{ s.clientName }} — {{ s.plotNo }} ({{ s.dealAmount | inr }})</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Amount (₹) *</label>
                <input type="number" [(ngModel)]="form.amount" />
              </div>
              <div class="field">
                <label>Payment Type</label>
                <select [(ngModel)]="form.paymentType">
                  <option value="Received">Received</option>
                  <option value="Advance">Advance</option>
                </select>
              </div>
              <div class="field">
                <label>Method</label>
                <select [(ngModel)]="form.method">
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div class="field">
                <label>Paid Date</label>
                <input type="date" [(ngModel)]="form.paidAt" />
              </div>
              <div class="field full">
                <label>Notes</label>
                <textarea [(ngModel)]="form.notes"></textarea>
              </div>
            </div>
            <div class="small muted" style="margin-top:10px">New payments are saved as <b>Pending</b> and need admin verification.</div>
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="save()">
              <app-icon name="check" [size]="14" color="#fff" /> Add Payment
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PaymentsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  status = '';
  pageSize = 12;

  payments = signal<Payment[]>([]);
  sales = signal<Sale[]>([]);
  total = signal(0);
  page = signal(1);
  showForm = signal(false);

  form = {
    saleId: 0 as number | null,
    amount: 0,
    paymentType: 'Received',
    method: 'BankTransfer',
    paidAt: new Date().toISOString().slice(0, 10),
    notes: ''
  };

  constructor() {
    this.load(1);
    this.api.getSales({ pageSize: 100 }).subscribe(r => this.sales.set(r.items));
  }

  load(page: number) {
    const opts: { status?: string; page: number; pageSize: number } = { page, pageSize: this.pageSize };
    if (this.status) opts.status = this.status;
    this.api.getPayments(opts).subscribe(res => {
      this.payments.set(res.items);
      this.total.set(res.total);
      this.page.set(page);
    });
  }

  openCreate() {
    this.form = {
      saleId: 0,
      amount: 0,
      paymentType: 'Received',
      method: 'BankTransfer',
      paidAt: new Date().toISOString().slice(0, 10),
      notes: ''
    };
    this.showForm.set(true);
  }

  save() {
    if (!this.form.saleId || !this.form.amount) {
      this.toast.error('Sale and amount are required');
      return;
    }
    this.api.createPayment({
      saleId: this.form.saleId!,
      amount: Number(this.form.amount),
      paymentType: this.form.paymentType,
      method: this.form.method,
      paidAt: new Date(this.form.paidAt).toISOString(),
      notes: this.form.notes
    }).subscribe({
      next: () => {
        this.toast.success('Payment added (pending verification)');
        this.showForm.set(false);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Save failed')
    });
  }

  verify(p: Payment, status: 'Approved' | 'Rejected') {
    this.api.verifyPayment(p.id, status).subscribe({
      next: () => {
        this.toast.success(`Payment ${status.toLowerCase()}`);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Action failed')
    });
  }

  remove(p: Payment) {
    if (!confirm('Delete this payment record?')) return;
    this.api.deletePayment(p.id).subscribe({
      next: () => {
        this.toast.success('Payment deleted');
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
