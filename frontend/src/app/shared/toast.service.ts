import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, type: Toast['type'] = 'success', duration = 3200) {
    const t: Toast = { id: this.nextId++, message, type };
    this.toasts.update(list => [...list, t]);
    setTimeout(() => this.dismiss(t.id), duration);
  }

  success(m: string) { this.show(m, 'success'); }
  error(m: string) { this.show(m, 'error', 4500); }
  info(m: string) { this.show(m, 'info'); }

  dismiss(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
