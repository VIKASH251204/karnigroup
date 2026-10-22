import { Injectable, signal } from '@angular/core';

export interface DateRange {
  from: string;
  to: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class RangeService {
  readonly year = new Date().getFullYear();

  range = signal<DateRange>({
    from: `${this.year}-01-01`,
    to: `${this.year}-12-31`,
    label: `01 Jan ${this.year} - 31 Dec ${this.year}`
  });

  presets(): DateRange[] {
    const y = this.year;
    return [
      { from: `${y}-01-01`, to: `${y}-12-31`, label: `01 Jan ${y} - 31 Dec ${y}` },
      { from: `${y}-01-01`, to: `${y}-06-30`, label: `01 Jan ${y} - 30 Jun ${y}` },
      { from: `${y}-07-01`, to: `${y}-12-31`, label: `01 Jul ${y} - 31 Dec ${y}` },
      { from: `${y}-10-01`, to: `${y}-12-31`, label: `01 Oct ${y} - 31 Dec ${y}` },
      { from: `${y}-01-01`, to: `${new Date().toISOString().slice(0, 10)}`, label: `01 Jan ${y} - Today` }
    ];
  }

  set(preset: DateRange) {
    this.range.set(preset);
  }
}
