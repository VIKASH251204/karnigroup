import { Component, Input, OnChanges } from '@angular/core';
import { InrPipe } from './pipes';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [InrPipe],
  template: `
    <div class="donut-flex">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
        <circle [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none" [attr.stroke]="'#eef2f8'" [attr.stroke-width]="stroke" />
        @for (seg of segments; track seg.label) {
          <circle
            [attr.cx]="c" [attr.cy]="c" [attr.r]="r" fill="none"
            [attr.stroke]="seg.color" [attr.stroke-width]="stroke"
            [attr.stroke-dasharray]="seg.dash"
            [attr.stroke-dashoffset]="seg.offset"
            [attr.transform]="'rotate(-90 ' + c + ' ' + c + ')'"
            stroke-linecap="butt" />
        }
        <text [attr.x]="c" [attr.y]="c - 4" text-anchor="middle"
              [attr.font-size]="size * 0.19" font-weight="800" fill="#1e293b">{{ centerValue }}</text>
        <text [attr.x]="c" [attr.y]="c + size * 0.11" text-anchor="middle"
              [attr.font-size]="size * 0.085" font-weight="600" fill="#94a3b8">{{ centerLabel }}</text>
      </svg>

      <div class="donut-legend" style="flex:1; min-width:180px">
        @for (row of legend; track row.label) {
          <div class="row">
            <span class="dot" [style.background]="row.color"></span>
            <span class="k">{{ row.label }}</span>
            <span class="v">{{ row.value | inr: 'short' }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class DonutChartComponent implements OnChanges {
  @Input() received = 0;
  @Input() pending = 0;
  @Input() advance = 0;
  @Input() percent = 0;
  @Input() centerLabel = 'Received';
  @Input() size = 160;

  stroke = 26;
  c = 80;
  r = 58;
  centerValue = '0%';
  segments: { label: string; color: string; dash: string; offset: number }[] = [];
  legend: { label: string; color: string; value: number }[] = [];

  ngOnChanges() {
    this.c = this.size / 2;
    this.r = this.size * 0.34;
    this.stroke = this.size * 0.155;
    this.centerValue = `${Math.round(this.percent)}%`;

    const parts = [
      { label: 'Received', color: '#22c55e', value: this.received },
      { label: 'Pending', color: '#f59e0b', value: this.pending },
      { label: 'Advance', color: '#3b82f6', value: this.advance }
    ];
    this.legend = parts;

    const total = parts.reduce((s, p) => s + p.value, 0) || 1;
    const circumference = 2 * Math.PI * this.r;
    let accumulated = 0;
    this.segments = parts
      .filter(p => p.value > 0)
      .map(p => {
        const len = (p.value / total) * circumference;
        const seg = {
          label: p.label,
          color: p.color,
          dash: `${len} ${circumference - len}`,
          offset: -accumulated
        };
        accumulated += len;
        return seg;
      });
  }
}
