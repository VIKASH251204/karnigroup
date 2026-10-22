import { Component, inject, signal, effect } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RangeService } from '../../core/range.service';
import { SalesReport, CommissionReport } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe } from '../../shared/pipes';
import { ComboChartComponent } from '../../shared/combo-chart.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [IconComponent, InrPipe, ComboChartComponent],
  template: `
    <div class="grid grid-4">
      <div class="stat">
        <div class="box bg-blue"><app-icon name="briefcase" [size]="23" /></div>
        <div>
          <div class="label">Total Deals</div>
          <div class="value">{{ sales()?.totalDeals ?? 0 }}</div>
          <div class="sub">{{ auth.isAdmin() ? 'Company-wide' : 'Your deals' }}</div>
        </div>
      </div>
      <div class="stat">
        <div class="box bg-green"><app-icon name="trending-up" [size]="23" /></div>
        <div>
          <div class="label">Total Revenue</div>
          <div class="value">{{ sales()?.totalRevenue ?? 0 | inr: 'short' }}</div>
          <div class="sub">Received: {{ sales()?.totalReceived ?? 0 | inr: 'short' }}</div>
        </div>
      </div>
      <div class="stat">
        <div class="box bg-orange"><app-icon name="clock" [size]="23" /></div>
        <div>
          <div class="label">Pending Amount</div>
          <div class="value">{{ sales()?.totalPending ?? 0 | inr: 'short' }}</div>
          <div class="sub">Yet to be collected</div>
        </div>
      </div>
      <div class="stat">
        <div class="box bg-purple"><app-icon name="rupee" [size]="23" /></div>
        <div>
          <div class="label">Total Commission</div>
          <div class="value">{{ comm()?.total ?? 0 | inr: 'short' }}</div>
          <div class="sub">Pending: {{ comm()?.pending ?? 0 | inr }}</div>
        </div>
      </div>
    </div>

    <div class="card mt">
      <div class="card-h">
        <div class="t">Sales &amp; Revenue Trend</div>
        <div class="small muted">{{ range.range().label }}</div>
      </div>
      <div class="card-b">
        <app-combo-chart [data]="sales()?.monthly || []" />
      </div>
    </div>

    <div class="split mt">
      @if (auth.isAdmin()) {
        <div class="card">
          <div class="card-h"><div class="t">Performance By Member</div></div>
          <div class="card-b table-wrap">
            <table class="tbl">
              <thead>
                <tr><th>#</th><th>Member</th><th>Plots Sold</th><th>Revenue</th><th>Commission</th></tr>
              </thead>
              <tbody>
                @for (m of sales()?.byMember || []; track m.userId) {
                  <tr>
                    <td>{{ m.rank }}</td>
                    <td class="strong">{{ m.adminName }}</td>
                    <td>{{ m.plotsSold }}</td>
                    <td class="strong">{{ m.revenue | inr }}</td>
                    <td>{{ m.commission | inr }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <div class="card">
        <div class="card-h"><div class="t">Commission Summary</div></div>
        <div class="card-b table-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>{{ auth.isAdmin() ? 'Member' : 'Status' }}</th><th>Total</th><th>Pending</th><th>Paid</th>
              </tr>
            </thead>
            <tbody>
              @if (auth.isAdmin()) {
                @for (u of comm()?.byUser || []; track u.name) {
                  <tr>
                    <td class="strong">{{ u.name }}</td>
                    <td class="strong">{{ u.total | inr }}</td>
                    <td style="color:var(--orange);font-weight:700">{{ u.pending | inr }}</td>
                    <td style="color:var(--green);font-weight:700">{{ u.paid | inr }}</td>
                  </tr>
                }
              } @else {
                <tr>
                  <td class="strong">Summary</td>
                  <td class="strong">{{ comm()?.total ?? 0 | inr }}</td>
                  <td style="color:var(--orange);font-weight:700">{{ comm()?.pending ?? 0 | inr }}</td>
                  <td style="color:var(--green);font-weight:700">{{ comm()?.paid ?? 0 | inr }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {
  private api = inject(ApiService);
  auth = inject(AuthService);
  range = inject(RangeService);

  sales = signal<SalesReport | null>(null);
  comm = signal<CommissionReport | null>(null);

  constructor() {
    effect(() => {
      const r = this.range.range();
      this.api.getSalesReport(r.from, r.to).subscribe(s => this.sales.set(s));
      this.api.getCommissionReport(r.from, r.to).subscribe(c => this.comm.set(c));
    });
  }
}
