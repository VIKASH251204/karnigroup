import { Component, inject, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RangeService } from '../../core/range.service';
import { EmployeeDashboard } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { BarChartComponent } from '../../shared/bar-chart.component';
import { DonutChartComponent } from '../../shared/donut-chart.component';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, InrPipe, FDatePipe, BarChartComponent, DonutChartComponent],
  template: `
    <div class="split-main">
      <!-- ============ LEFT: dashboard content ============ -->
      <div>
        <!-- Stat cards -->
        <div class="grid grid-4">
          <div class="stat">
            <div class="box bg-gold"><app-icon name="trophy" [size]="24" /></div>
            <div>
              <div class="label">My Rank</div>
              <div class="value">#{{ data()?.myRank ?? '—' }}</div>
              <div class="sub">out of {{ data()?.totalUsers ?? 0 }} members</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-blue"><app-icon name="users" [size]="24" /></div>
            <div>
              <div class="label">My Team</div>
              <div class="value">{{ data()?.totalRegistered ?? 0 }}</div>
              <div class="sub">Registered Members</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-green"><app-icon name="home" [size]="24" /></div>
            <div>
              <div class="label">Total Plots Sold</div>
              <div class="value">{{ data()?.totalPlotsSold ?? 0 }}</div>
              <div class="sub">Plots</div>
            </div>
          </div>
          <div class="stat">
            <div class="box bg-green"><app-icon name="wallet" [size]="24" /></div>
            <div>
              <div class="label">Total Commission</div>
              <div class="value">{{ data()?.totalCommission ?? 0 | inr }}</div>
              <div class="sub">(Pending: {{ data()?.pendingCommission ?? 0 | inr }})</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="split mt">
          <div class="card">
            <div class="card-h">
              <div class="t">Sales Overview</div>
              <div class="legend">
                <div class="li"><span class="sw bar" style="background:#3b82f6"></span> Plots Sold</div>
                <div class="li"><span class="sw bar" style="background:#22c55e"></span> Revenue</div>
              </div>
            </div>
            <div class="card-b">
              <app-bar-chart [data]="data()?.salesOverview || []" />
            </div>
          </div>

          <div class="card">
            <div class="card-h"><div class="t">Payment Status</div></div>
            <div class="card-b">
              <app-donut-chart
                [received]="data()?.paymentStatus?.received || 0"
                [pending]="data()?.paymentStatus?.pending || 0"
                [advance]="data()?.paymentStatus?.advance || 0"
                [percent]="data()?.paymentStatus?.receivedPercent || 0"
                [size]="170" />
            </div>
          </div>
        </div>

        <!-- Tables -->
        <div class="split mt">
          <div class="card">
            <div class="card-h">
              <div class="t">Recent Team Members</div>
              <a routerLink="/register-person" class="btn btn-soft-blue btn-sm">
                <app-icon name="plus" [size]="13" /> Register New
              </a>
            </div>
            <div class="card-b table-wrap">
              <table class="tbl">
                <thead>
                  <tr><th>#</th><th>Name</th><th>Phone</th><th class="hide-sm">Date</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  @for (p of data()?.recentPersons || []; track p.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td class="strong">{{ p.fullName }}</td>
                      <td>{{ p.phone }}</td>
                      <td class="hide-sm">{{ p.createdAt | fdate }}</td>
                      <td><span class="badge" [class.green]="p.status === 'Active'" [class.gray]="p.status !== 'Active'">{{ p.status }}</span></td>
                      <td><a routerLink="/clients" class="btn btn-soft-blue btn-sm"><app-icon name="eye" [size]="12" /> View</a></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6"><div class="empty">No registrations yet</div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-h">
              <div class="t">Recent Plot Sales</div>
              <a routerLink="/sales" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-b table-wrap">
              <table class="tbl">
                <thead>
                  <tr><th>#</th><th>Client Name</th><th>Plot No.</th><th>Deal Amount</th><th class="hide-sm">Received</th><th class="hide-sm">Pending</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (s of data()?.recentSales || []; track s.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td class="strong">{{ s.clientName }}</td>
                      <td>{{ s.plotNo }}</td>
                      <td class="strong">{{ s.dealAmount | inr }}</td>
                      <td class="hide-sm" style="color:#16a34a;font-weight:600">{{ s.receivedAmount | inr }}</td>
                      <td class="hide-sm" style="color:#ea8a00;font-weight:600">{{ s.pendingAmount | inr }}</td>
                      <td>
                        <span class="badge" [class.green]="s.status === 'Completed'" [class.orange]="s.status === 'InProgress'" [class.gray]="s.status === 'Cancelled'">
                          {{ s.status === 'InProgress' ? 'In Progress' : s.status }}
                        </span>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7"><div class="empty">No sales yet</div></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ RIGHT: limited access panel ============ -->
      <div>
        <div class="card info-panel">
          <div class="info-head blue">
            <div class="big">Admin Panel</div>
            <div class="small">Limited Access (Own Data Only)</div>
          </div>
          <div class="info-body">
            <div class="tile" style="background:#e8f0fe" routerLink="/register-person">
              <div class="ti bg-blue"><app-icon name="user-plus" [size]="20" /></div>
              <div class="t">Register Team</div>
              <div class="d">Add new people to your team under your ID</div>
            </div>
            <div class="tile" style="background:#e7f7ee" routerLink="/rank">
              <div class="ti bg-green"><app-icon name="trophy" [size]="20" /></div>
              <div class="t">Track Your Rank</div>
              <div class="d">See your current rank in the company</div>
            </div>
            <div class="tile" style="background:#e7f7ee" routerLink="/sales">
              <div class="ti bg-green"><app-icon name="home" [size]="20" /></div>
              <div class="t">View Your Sales</div>
              <div class="d">See how many plots you have sold</div>
            </div>
            <div class="tile" style="background:#f1eafe" routerLink="/clients">
              <div class="ti bg-purple"><app-icon name="users" [size]="20" /></div>
              <div class="t">My Clients</div>
              <div class="d">See clients you have sold plots to</div>
            </div>
            <div class="tile" style="background:#fdeaea" routerLink="/payments">
              <div class="ti bg-red"><app-icon name="wallet" [size]="20" /></div>
              <div class="t">Payment Status</div>
              <div class="d">Check received, pending and advance payment</div>
            </div>
            <div class="tile" style="background:#e8f0fe" routerLink="/site-visits">
              <div class="ti bg-blue"><app-icon name="camera" [size]="20" /></div>
              <div class="t">Site Visit Proof</div>
              <div class="d">Upload client visit photos to track your clients</div>
            </div>
          </div>
        </div>

        <div class="card mt" style="padding:16px">
          <div class="view-only-chip" style="width:100%;justify-content:center">
            <app-icon name="shield" [size]="15" /> View-only access — edits restricted
          </div>
          <div class="small muted" style="margin-top:10px;line-height:1.6">
            You can <b>register team members</b> and <b>send site visit photos</b>.
            Clients are people you sell plots to. Sales, payments &amp; plots are managed by your admin.
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmployeeDashboardComponent {
  private api = inject(ApiService);
  private range = inject(RangeService);
  data = signal<EmployeeDashboard | null>(null);

  constructor() {
    // reload whenever the selected date range changes
    effect(() => {
      const r = this.range.range();
      this.api.getEmployeeDashboard(r.from, r.to).subscribe(d => this.data.set(d));
    });
  }
}
