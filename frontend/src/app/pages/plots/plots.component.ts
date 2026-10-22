import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Plot } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-plots',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">Plots / Inventory</div>
          <div class="small muted" style="margin-top:3px">
            {{ auth.isAdmin() ? 'Add, edit or update plot details & pricing' : 'Plot inventory — view only' }}
          </div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search plot no / project…" [(ngModel)]="search" (ngModelChange)="load()" />
          </div>
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load()">
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Blocked">Blocked</option>
          </select>
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" (click)="openCreate()">
              <app-icon name="plus" [size]="15" color="#fff" /> Add Plot
            </button>
          }
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Plot No.</th><th>Project</th><th class="hide-sm">Block</th><th class="hide-sm">Size (sq.ft)</th>
              <th>Price</th><th>Status</th>
              @if (auth.isAdmin()) { <th>Action</th> }
            </tr>
          </thead>
          <tbody>
            @for (p of plots(); track p.id; let i = $index) {
              <tr>
                <td>{{ i + 1 }}</td>
                <td class="strong">{{ p.plotNo }}</td>
                <td>{{ p.project }}</td>
                <td class="hide-sm">{{ p.block || '—' }}</td>
                <td class="hide-sm">{{ sizeFmt(p.sizeSqFt) }}</td>
                <td class="strong">{{ p.price | inr }}</td>
                <td>
                  <span class="badge" [class.green]="p.status === 'Available'" [class.blue]="p.status === 'Sold'" [class.red]="p.status === 'Blocked'">
                    {{ p.status }}
                  </span>
                </td>
                @if (auth.isAdmin()) {
                  <td>
                    <div class="flex" style="gap:6px">
                      <button class="btn btn-soft-blue btn-sm" (click)="openEdit(p)"><app-icon name="edit" [size]="12" /> Edit</button>
                      <button class="btn btn-danger btn-sm" (click)="remove(p)"><app-icon name="trash" [size]="12" /></button>
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td colspan="8"><div class="empty"><app-icon name="pin" [size]="28" color="#cbd5e1" /> No plots found</div></td></tr>
            }
          </tbody>
        </table>

        @if (!auth.isAdmin()) {
          <div class="view-only-chip" style="margin-top:14px">
            <app-icon name="shield" [size]="14" /> View only — plots are managed by admin
          </div>
        }
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-back" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">{{ editId() ? 'Edit Plot' : 'Add New Plot' }}</div>
            <button class="icon-btn" style="border:0" (click)="showForm.set(false)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>Plot Number *</label>
                <input [(ngModel)]="form.plotNo" placeholder="e.g. A-05" />
              </div>
              <div class="field">
                <label>Project *</label>
                <input [(ngModel)]="form.project" placeholder="e.g. Green Valley Enclave" />
              </div>
              <div class="field">
                <label>Block</label>
                <input [(ngModel)]="form.block" placeholder="e.g. A" />
              </div>
              <div class="field">
                <label>Size (sq.ft) *</label>
                <input type="number" [(ngModel)]="form.sizeSqFt" />
              </div>
              <div class="field">
                <label>Price (₹) *</label>
                <input type="number" [(ngModel)]="form.price" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form.status">
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="save()">
              <app-icon name="check" [size]="14" color="#fff" /> {{ editId() ? 'Save Changes' : 'Add Plot' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PlotsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  search = '';
  status = '';
  plots = signal<Plot[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);

  form: { plotNo: string; project: string; block: string; sizeSqFt: number; price: number; status: Plot["status"] } = this.blank();

  constructor() {
    this.load();
  }

  private blank() {
    return { plotNo: '', project: '', block: '', sizeSqFt: 0, price: 0, status: 'Available' as Plot["status"] };
  }

  load() {
    const opts: { search?: string; status?: string } = {};
    if (this.search) opts.search = this.search;
    if (this.status) opts.status = this.status;
    this.api.getPlots(opts).subscribe(p => this.plots.set(p));
  }

  openCreate() {
    this.editId.set(null);
    this.form = this.blank();
    this.showForm.set(true);
  }

  sizeFmt(v: number): string {
    return Math.round(v).toLocaleString('en-IN');
  }

  openEdit(p: Plot) {
    this.editId.set(p.id);
    this.form = { plotNo: p.plotNo, project: p.project, block: p.block || '', sizeSqFt: p.sizeSqFt, price: p.price, status: p.status };
    this.showForm.set(true);
  }

  save() {
    if (!this.form.plotNo || !this.form.project || !this.form.price) {
      this.toast.error('Plot number, project and price are required');
      return;
    }
    const body = { ...this.form, sizeSqFt: Number(this.form.sizeSqFt), price: Number(this.form.price) };
    const req = this.editId() ? this.api.updatePlot(this.editId()!, body) : this.api.createPlot(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Plot updated' : 'Plot added');
        this.showForm.set(false);
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Save failed')
    });
  }

  remove(p: Plot) {
    if (!confirm(`Delete plot ${p.plotNo}?`)) return;
    this.api.deletePlot(p.id).subscribe({
      next: () => { this.toast.success('Plot deleted'); this.load(); },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
