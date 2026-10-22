import { Component, Input, OnChanges } from '@angular/core';
import { MonthlyPoint } from '../core/models';

/**
 * Grouped bar chart: Plots Sold (blue) + Revenue (green) per month.
 * Both series are scaled independently (dual visual axis like the design).
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="legend" style="margin-bottom:10px">
      <div class="li"><span class="sw bar" style="background:#3b82f6"></span> Plots Sold</div>
      <div class="li"><span class="sw bar" style="background:#22c55e"></span> Revenue</div>
    </div>
    <div class="chart-scroll">
      <svg viewBox="0 0 720 260" style="width:100%;height:auto">
        <!-- grid + y labels -->
        @for (g of grid; track g.y) {
          <line [attr.x1]="42" [attr.x2]="710" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#eef2f8" stroke-width="1" />
          <text [attr.x]="32" [attr.y]="g.y + 4" text-anchor="end" font-size="10" fill="#94a3b8">{{ g.label }}</text>
        }
        @for (b of bars; track b.month) {
          <rect [attr.x]="b.x1" [attr.y]="b.y1" width="11" [attr.height]="b.h1" rx="3" fill="#3b82f6" opacity="0.92" />
          <rect [attr.x]="b.x2" [attr.y]="b.y2" width="11" [attr.height]="b.h2" rx="3" fill="#22c55e" opacity="0.92" />
          <text [attr.x]="b.x1 + 11" [attr.y]="248" text-anchor="middle" font-size="10.5" fill="#94a3b8">{{ b.month }}</text>
        }
      </svg>
    </div>
  `
})
export class BarChartComponent implements OnChanges {
  @Input() data: MonthlyPoint[] = [];
  @Input() height = 260;

  grid: { y: number; label: string }[] = [];
  bars: { month: string; x1: number; y1: number; h1: number; x2: number; y2: number; h2: number }[] = [];

  ngOnChanges() {
    const top = 14;
    const bottom = 226;
    const maxPlots = Math.max(4, ...this.data.map(d => d.plotsSold));
    const maxRevenue = Math.max(4, ...this.data.map(d => d.revenue));

    this.grid = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      y: bottom - (bottom - top) * f,
      label: String(Math.round(maxPlots * f))
    }));

    const step = 668 / Math.max(this.data.length, 1);
    this.bars = this.data.map((d, i) => {
      const cx = 42 + step * i + step / 2;
      const h1 = Math.max(2, (d.plotsSold / maxPlots) * (bottom - top));
      const h2 = Math.max(2, (d.revenue / maxRevenue) * (bottom - top));
      return {
        month: d.month,
        x1: cx - 13,
        y1: bottom - h1,
        h1,
        x2: cx + 2,
        y2: bottom - h2,
        h2
      };
    });
  }
}
