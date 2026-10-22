import { Component, Input, OnChanges } from '@angular/core';
import { MonthlyPoint } from '../core/models';

/**
 * Combo chart: Plots Sold (blue bars, left axis) + Revenue (green line, right axis) — admin dashboard.
 */
@Component({
  selector: 'app-combo-chart',
  standalone: true,
  template: `
    <div class="legend" style="margin-bottom:10px">
      <div class="li"><span class="sw bar" style="background:#3b82f6"></span> Plots Sold</div>
      <div class="li"><span class="sw" style="background:#22c55e"></span> Revenue (in Cr)</div>
    </div>
    <div class="chart-scroll">
      <svg viewBox="0 0 720 270" style="width:100%;height:auto">
        @for (g of grid; track g.y) {
          <line [attr.x1]="48" [attr.x2]="672" [attr.y1]="g.y" [attr.y2]="g.y" stroke="#eef2f8" stroke-width="1" />
          <text [attr.x]="38" [attr.y]="g.y + 4" text-anchor="end" font-size="10" fill="#94a3b8">{{ g.left }}</text>
          <text [attr.x]="682" [attr.y]="g.y + 4" text-anchor="start" font-size="10" fill="#94a3b8">{{ g.right }}</text>
        }
        @for (b of bars; track b.month) {
          <rect [attr.x]="b.x" [attr.y]="b.y" width="22" [attr.height]="b.h" rx="4" fill="#3b82f6" opacity="0.9" />
          <text [attr.x]="b.x + 11" [attr.y]="258" text-anchor="middle" font-size="10.5" fill="#94a3b8">{{ b.month }}</text>
        }
        <polyline [attr.points]="linePoints" fill="none" stroke="#22c55e" stroke-width="2.6" stroke-linejoin="round" />
        @for (p of lineDots; track p.x) {
          <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3.8" fill="#fff" stroke="#22c55e" stroke-width="2.2" />
        }
      </svg>
    </div>
  `
})
export class ComboChartComponent implements OnChanges {
  @Input() data: MonthlyPoint[] = [];

  grid: { y: number; left: string; right: string }[] = [];
  bars: { month: string; x: number; y: number; h: number }[] = [];
  linePoints = '';
  lineDots: { x: number; y: number }[] = [];

  ngOnChanges() {
    const top = 16;
    const bottom = 234;
    const maxPlots = Math.max(4, ...this.data.map(d => d.plotsSold));
    const maxRevCr = Math.max(0.5, ...this.data.map(d => d.revenue / 1_00_00_000));

    this.grid = [0, 0.25, 0.5, 0.75, 1].map(f => ({
      y: bottom - (bottom - top) * f,
      left: String(Math.round(maxPlots * f)),
      right: (maxRevCr * f).toFixed(1)
    }));

    const step = 624 / Math.max(this.data.length, 1);
    this.bars = this.data.map((d, i) => {
      const h = Math.max(2, (d.plotsSold / maxPlots) * (bottom - top));
      return { month: d.month, x: 48 + step * i + step / 2 - 11, y: bottom - h, h };
    });

    this.lineDots = this.data.map((d, i) => {
      const x = 48 + step * i + step / 2;
      const y = bottom - (d.revenue / 1_00_00_000 / maxRevCr) * (bottom - top);
      return { x, y };
    });
    this.linePoints = this.lineDots.map(p => `${p.x},${p.y}`).join(' ');
  }
}
