import { Component, inject, signal, effect } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RangeService } from '../../core/range.service';
import { AdminPerformance } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe } from '../../shared/pipes';

@Component({
  selector: 'app-rank',
  standalone: true,
  imports: [IconComponent, InrPipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">My Rank — Company Leaderboard</div>
          <div class="small muted" style="margin-top:3px">Ranked by revenue generated in the selected period</div>
        </div>
        <div class="flex">
          @if (myRank()) {
            <div class="stat" style="padding:10px 16px; box-shadow:none; border:1px solid var(--line)">
              <div class="box bg-gold" style="width:38px;height:38px;border-radius:11px"><app-icon name="trophy" [size]="19" /></div>
              <div>
                <div class="label">Your Rank</div>
                <div class="value" style="font-size:19px">#{{ myRank() }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Rank</th><th>Member</th><th class="hide-sm">Plots Sold</th><th>Revenue</th><th class="hide-sm">Commission</th><th>Performance</th>
            </tr>
          </thead>
          <tbody>
            @for (m of members(); track m.userId; let i = $index) {
              <tr [class.rank-row]="m.userId === auth.user()?.id" [class.me]="m.userId === auth.user()?.id">
                <td>
                  <span class="rank-num" [class.top1]="m.rank === 1" [class.top2]="m.rank === 2" [class.top3]="m.rank === 3">
                    {{ m.rank }}
                  </span>
                </td>
                <td class="strong">
                  {{ m.adminName }}
                  @if (m.userId === auth.user()?.id) {
                    <span class="badge blue" style="margin-left:6px">You</span>
                  }
                </td>
                <td class="hide-sm">{{ m.plotsSold }}</td>
                <td class="strong">{{ m.revenue | inr }}</td>
                <td class="hide-sm">{{ m.commission | inr }}</td>
                <td style="min-width:180px">
                  <div class="progress-track">
                    <div class="progress-fill" [style.width.%]="pct(m)" [style.background]="m.rank === 1 ? '#22c55e' : '#3b82f6'"></div>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><div class="empty"><app-icon name="trophy" [size]="28" color="#cbd5e1" /> No rankings yet</div></td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RankComponent {
  private api = inject(ApiService);
  private range = inject(RangeService);
  auth = inject(AuthService);

  members = signal<AdminPerformance[]>([]);

  myRank() {
    return this.members().find(m => m.userId === this.auth.user()?.id)?.rank ?? null;
  }

  pct(m: AdminPerformance) {
    const max = Math.max(...this.members().map(x => x.revenue), 1);
    return Math.round((m.revenue / max) * 100);
  }

  constructor() {
    effect(() => {
      const r = this.range.range();
      this.api.getSalesReport(r.from, r.to).subscribe(rep => this.members.set(rep.byMember));
    });
  }
}
