import { Pipe, PipeTransform } from '@angular/core';

/** Formats a number in Indian rupee style: 2500000 -> ₹25,00,000 */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined, mode: 'full' | 'short' = 'full'): string {
    if (value === null || value === undefined || isNaN(Number(value))) return '₹0';
    const n = Number(value);

    if (mode === 'short') {
      if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
      if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
    }

    const neg = n < 0;
    const s = Math.round(Math.abs(n)).toString();
    let formatted: string;
    if (s.length <= 3) {
      formatted = s;
    } else {
      const last3 = s.slice(-3);
      const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formatted = `${rest},${last3}`;
    }
    return `${neg ? '-' : ''}₹${formatted}`;
  }
}

/** 2026-10-22 -> 22 Oct 2026 */
@Pipe({ name: 'fdate', standalone: true })
export class FDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, withTime = false): string {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const base = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    return withTime
      ? `${base}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : base;
  }
}
