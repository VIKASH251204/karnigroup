import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Commission } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">{{ auth.isAdmin() ? 'Commission Management' : 'My Commission' }}</div>
          <div class="small muted" style="margin-top:3px">
            {{ auth.isAdmin() ? 'Approve, pay or reject member commissions' : 'Your earned commissions — view only' }}
          </div>
        </div>
        <div class="toolbar">
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Member</th><th>Plot / Client</th><th class="hide-sm">Rate</th><th>Amount</th>
              <th class="hide-sm">Requested</th><th class="hide-sm">Approved</th><th>Status</th>
              @if (auth.isAdmin()) { <th>Action</th> }
            </tr>
          </thead>
          <tbody>
            @for (c of commissions(); track c.id; let i = $index) {
              <tr>
                <td>{{ (page() - 1) * pageSize + i + 1 }}</td>
                <td class="strong">{{ c.userName }}</td>
                <td>{{ c.plotNo || '—' }} <span class="muted small">/ {{ c.clientName || '—' }}</span></td>
                <td class="hide-sm">{{ c.rate }}%</td>
                <td class="strong">{{ c.amount | inr }}</td>
                <td class="hide-sm">{{ c.requestedAt | fdate }}</td>
                <td class="hide-sm">{{ c.approvedAt ? (c.approvedAt | fdate) : '—' }}</td>
                <td>
                  <span class="badge"
                        [class.green]="c.status === 'Paid'" [class.blue]="c.status === 'Approved'"
                        [class.orange]="c.status === 'Pending'" [class.red]="c.status === 'Rejected'">
                    {{ c.status }}
                  </span>
                </td>
                @if (auth.isAdmin()) {
                  <td>
                    <div class="flex" style="gap:6px">
                      @if (c.status === 'Pending') {
                        <button class="btn btn-success btn-sm" (click)="approve(c)"><app-icon name="check" [size]="12" /> Approve</button>
                        <button class="btn btn-danger btn-sm" (click)="reject(c)"><app-icon name="x" [size]="12" /></button>
                      }
                      @if (c.status === 'Approved') {
                        <button class="btn btn-primary btn-sm" (click)="pay(c)"><app-icon name="wallet" [size]="12" /> Mark Paid</button>
                      }
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td colspan="9"><div class="empty"><app-icon name="rupee" [size]="28" color="#cbd5e1" /> No commissions found</div></td></tr>
            }
          </tbody>
        </table>

        @if (!auth.isAdmin()) {
          <div class="view-only-chip" style="margin-top:14px">
            <app-icon name="shield" [size]="14" /> View only — commissions are approved by admin
          </div>
        }

        <div class="pagination">
          <div class="info">Showing {{ commissions().length }} of {{ total() }} commissions</div>
          <button class="page-btn" [disabled]="page() <= 1" (click)="load(page() - 1)">Prev</button>
          <span class="small muted">Page {{ page() }}</span>
          <button class="page-btn" [disabled]="commissions().length < pageSize" (click)="load(page() + 1)">Next</button>
        </div>
      </div>
    </div>
  `
})
export class CommissionsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  status = '';
  pageSize = 12;
  commissions = signal<Commission[]>([]);
  total = signal(0);
  page = signal(1);

  constructor() {
    this.load(1);
  }

  load(page: number) {
    const opts: { status?: string; page: number; pageSize: number } = { page, pageSize: this.pageSize };
    if (this.status) opts.status = this.status;
    this.api.getCommissions(opts).subscribe(res => {
      this.commissions.set(res.items);
      this.total.set(res.total);
      this.page.set(page);
    });
  }

  approve(c: Commission) {
    this.api.approveCommission(c.id).subscribe({
      next: () => { this.toast.success('Commission approved'); this.load(this.page()); },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Failed')
    });
  }

  pay(c: Commission) {
    this.api.payCommission(c.id).subscribe({
      next: () => { this.toast.success('Commission marked as paid'); this.load(this.page()); },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Failed')
    });
  }

  reject(c: Commission) {
    if (!confirm('Reject this commission?')) return;
    this.api.rejectCommission(c.id).subscribe({
      next: () => { this.toast.success('Commission rejected'); this.load(this.page()); },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Failed')
    });
  }
}
