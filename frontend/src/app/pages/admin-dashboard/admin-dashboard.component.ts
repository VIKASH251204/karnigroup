import { Component, inject, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { RangeService } from '../../core/range.service';
import { AdminDashboard, Sale, Commission } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ComboChartComponent } from '../../shared/combo-chart.component';
import { DonutChartComponent } from '../../shared/donut-chart.component';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, InrPipe, FDatePipe, ComboChartComponent, DonutChartComponent],
  template: `
    <div class="split-main">
      <div>
        <!-- Stat cards -->
        <div class="grid grid-5">
          <div class="stat">
            <div class="box bg-purple"><app-icon name="users" [size]="23" /></div>
            <div>
              <div class="label">Total Admins</div>
              <div class="value">{{ data()?.totalAdmins ?? 0 }}</div>
              <div class="sub">Active: {{ data()?.activeAdmins ?? 0 }}</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-green"><app-icon name="user-plus" [size]="23" /></div>
            <div>
              <div class="label">Total Registered</div>
              <div class="value">{{ data()?.totalRegistered ?? 0 }}</div>
              <div class="sub">Persons</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-green"><app-icon name="home" [size]="23" /></div>
            <div>
              <div class="label">Total Plots Sold</div>
              <div class="value">{{ data()?.totalPlotsSold ?? 0 }}</div>
              <div class="sub">Plots</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-blue"><app-icon name="trending-up" [size]="23" /></div>
            <div>
              <div class="label">Total Revenue</div>
              <div class="value">{{ data()?.totalRevenue ?? 0 | inr: 'short' }}</div>
              <div class="sub">(Received: {{ data()?.totalReceived ?? 0 | inr: 'short' }})</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-red"><app-icon name="wallet" [size]="23" /></div>
            <div>
              <div class="label">Total Pending</div>
              <div class="value">{{ data()?.totalPending ?? 0 | inr: 'short' }}</div>
              <div class="sub">(Advance: {{ data()?.totalAdvance ?? 0 | inr: 'short' }})</div>
            </div>
          </div>
        </div>

        <!-- Charts + Top admins -->
        <div class="split-3 mt">
          <div class="card">
            <div class="card-h">
              <div class="t">Sales &amp; Revenue Overview</div>
            </div>
            <div class="card-b">
              <app-combo-chart [data]="data()?.salesRevenueOverview || []" />
            </div>
          </div>

          <div class="card">
            <div class="card-h"><div class="t">Payment Collection Status</div></div>
            <div class="card-b">
              <app-donut-chart
                [received]="data()?.paymentCollection?.received || 0"
                [pending]="data()?.paymentCollection?.pending || 0"
                [advance]="data()?.paymentCollection?.advance || 0"
                [percent]="data()?.paymentCollection?.receivedPercent || 0"
                [size]="175" />
            </div>
          </div>

          <div class="card">
            <div class="card-h"><div class="t">Admin Performance (Top 5)</div></div>
            <div class="card-b table-wrap">
              <table class="tbl">
                <thead>
                  <tr><th>#</th><th class="hide-sm">Admin Name</th><th class="hide-sm">Plots Sold</th><th>Revenue</th><th class="hide-sm">Commission</th><th>Rank</th></tr>
                </thead>
                <tbody>
                  @for (a of data()?.topAdmins || []; track a.userId) {
                    <tr>
                      <td>{{ a.rank }}</td>
                      <td class="strong">{{ a.adminName }}</td>
                      <td class="hide-sm">{{ a.plotsSold }}</td>
                      <td class="strong">{{ a.revenue | inr: 'short' }}</td>
                      <td class="hide-sm">{{ a.commission | inr }}</td>
                      <td>
                        <span class="badge" [class.gold]="a.rank === 1" [class.blue]="a.rank <= 3" [class.gray]="a.rank > 3">
                          #{{ a.rank }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6"><div class="empty">No data</div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Recent sales + pending commissions -->
        <div class="split mt">
          <div class="card">
            <div class="card-h">
              <div class="t">Recent Plot Sales (All Admins)</div>
              <a routerLink="/sales" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-b table-wrap">
              <table class="tbl">
                <thead>
                  <tr><th>#</th><th>Client Name</th><th class="hide-sm">Admin Name</th><th>Plot No.</th><th>Deal Amount</th><th class="hide-sm">Received</th><th class="hide-sm">Pending</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  @for (s of data()?.recentSales || []; track s.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td class="strong">{{ s.clientName }}</td>
                      <td class="hide-sm">{{ s.registeredByName }}</td>
                      <td>{{ s.plotNo }}</td>
                      <td class="strong">{{ s.dealAmount | inr }}</td>
                      <td class="hide-sm" style="color:#16a34a;font-weight:600">{{ s.receivedAmount | inr }}</td>
                      <td class="hide-sm" style="color:#ea8a00;font-weight:600">{{ s.pendingAmount | inr }}</td>
                      <td>
                        <span class="badge" [class.green]="s.status === 'Completed'" [class.orange]="s.status === 'InProgress'" [class.gray]="s.status === 'Cancelled'">
                          {{ s.status === 'InProgress' ? 'In Progress' : s.status }}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-soft-blue btn-sm" (click)="editSale(s)">
                          <app-icon name="edit" [size]="12" /> Edit
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="9"><div class="empty">No sales</div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-h">
              <div class="t">Pending Commission Approvals</div>
              <a routerLink="/commissions" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-b table-wrap">
              <table class="tbl">
                <thead>
                  <tr><th>#</th><th class="hide-sm">Admin Name</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  @for (c of data()?.pendingCommissions || []; track c.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td class="strong">{{ c.userName }}</td>
                      <td class="strong">{{ c.amount | inr }}</td>
                      <td><span class="badge orange">{{ c.status }}</span></td>
                      <td>
                        <button class="btn btn-success btn-sm" (click)="approve(c)">
                          <app-icon name="check" [size]="12" /> Approve
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5"><div class="empty">All caught up!</div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ RIGHT: super admin panel ============ -->
      <div>
        <div class="card info-panel">
          <div class="info-head purple">
            <div class="big">Super Admin Panel</div>
            <div class="small">Full Access &amp; Edit Control</div>
          </div>
          <div class="info-body">
            <div class="tile" style="background:#f1eafe" routerLink="/users">
              <div class="ti bg-purple"><app-icon name="settings" [size]="20" /></div>
              <div class="t">Full Edit Access</div>
              <div class="d">Edit all data including admins, teams, clients, sales, payments</div>
            </div>
            <div class="tile" style="background:#e8f0fe" routerLink="/users">
              <div class="ti bg-blue"><app-icon name="shield-check" [size]="20" /></div>
              <div class="t">Manage Admins</div>
              <div class="d">Add, edit, block or remove any admin</div>
            </div>
            <div class="tile" style="background:#fef3e2" routerLink="/payments">
              <div class="ti bg-orange"><app-icon name="card" [size]="20" /></div>
              <div class="t">Verify Payments</div>
              <div class="d">Approve or reject commission / payments</div>
            </div>
            <div class="tile" style="background:#fdeaea" routerLink="/plots">
              <div class="ti bg-red"><app-icon name="home" [size]="20" /></div>
              <div class="t">Manage Plots</div>
              <div class="d">Add, edit or update plot details &amp; pricing</div>
            </div>
            <div class="tile" style="background:#e8f0fe" routerLink="/reports">
              <div class="ti bg-blue"><app-icon name="bar-chart" [size]="20" /></div>
              <div class="t">Full Reports</div>
              <div class="d">View company-wide reports &amp; analytics</div>
            </div>
            <div class="tile" style="background:#e7f7ee" routerLink="/site-photos">
              <div class="ti bg-green"><app-icon name="camera" [size]="20" /></div>
              <div class="t">View All Site Photos</div>
              <div class="d">Check all client visit photos and verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  private api = inject(ApiService);
  private range = inject(RangeService);
  private toast = inject(ToastService);
  private router = inject(Router);

  data = signal<AdminDashboard | null>(null);

  constructor() {
    effect(() => {
      const r = this.range.range();
      this.api.getAdminDashboard(r.from, r.to).subscribe(d => this.data.set(d));
    });
  }

  editSale(sale: Sale) {
    this.router.navigate(['/sales'], { queryParams: { edit: sale.id } });
  }

  approve(c: Commission) {
    this.api.approveCommission(c.id).subscribe({
      next: () => {
        this.toast.success(`Commission of ${c.userName} approved`);
        const r = this.range.range();
        this.api.getAdminDashboard(r.from, r.to).subscribe(d => this.data.set(d));
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Approval failed')
    });
  }
}
