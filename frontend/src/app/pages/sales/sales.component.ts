import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Sale, Person, Plot } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">{{ auth.isAdmin() ? 'All Plot Sales' : 'My Sales' }}</div>
          <div class="small muted" style="margin-top:3px">
            {{ auth.isAdmin() ? 'Company-wide plot sales • full edit control' : 'Your sold plots — view only' }}
          </div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search client / plot…" [(ngModel)]="search" (ngModelChange)="load(1)" />
          </div>
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" (click)="openCreate()">
              <app-icon name="plus" [size]="15" color="#fff" /> New Sale
            </button>
          }
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Client Name</th><th>Plot No.</th><th>Deal Amount</th><th>Received</th><th>Pending</th>
              <th class="hide-sm">Advance</th><th class="hide-sm">Sale Date</th><th>Status</th>
              @if (auth.isAdmin()) { <th class="hide-sm">Sold By</th><th>Action</th> }
            </tr>
          </thead>
          <tbody>
            @for (s of sales(); track s.id; let i = $index) {
              <tr>
                <td>{{ (page() - 1) * pageSize + i + 1 }}</td>
                <td class="strong">{{ s.clientName }}</td>
                <td>{{ s.plotNo }}</td>
                <td class="strong">{{ s.dealAmount | inr }}</td>
                <td style="color:#16a34a;font-weight:700">{{ s.receivedAmount | inr }}</td>
                <td style="color:#ea8a00;font-weight:700">{{ s.pendingAmount | inr }}</td>
                <td class="hide-sm">{{ s.advanceAmount | inr }}</td>
                <td class="hide-sm">{{ s.saleDate | fdate }}</td>
                <td>
                  <span class="badge" [class.green]="s.status === 'Completed'" [class.orange]="s.status === 'InProgress'" [class.gray]="s.status === 'Cancelled'">
                    {{ s.status === 'InProgress' ? 'In Progress' : s.status }}
                  </span>
                </td>
                @if (auth.isAdmin()) {
                  <td class="hide-sm">{{ s.registeredByName }}</td>
                  <td>
                    <div class="flex" style="gap:6px">
                      <button class="btn btn-soft-blue btn-sm" (click)="openEdit(s)"><app-icon name="edit" [size]="12" /> Edit</button>
                      <button class="btn btn-danger btn-sm" (click)="remove(s)"><app-icon name="trash" [size]="12" /></button>
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr><td colspan="11"><div class="empty"><app-icon name="chart" [size]="28" color="#cbd5e1" /> No sales found</div></td></tr>
            }
          </tbody>
        </table>

        @if (!auth.isAdmin()) {
          <div class="view-only-chip" style="margin-top:14px">
            <app-icon name="shield" [size]="14" /> View only — sales are created &amp; edited by admin
          </div>
        }

        <div class="pagination">
          <div class="info">Showing {{ sales().length }} of {{ total() }} sales</div>
          <button class="page-btn" [disabled]="page() <= 1" (click)="load(page() - 1)">Prev</button>
          <span class="small muted">Page {{ page() }}</span>
          <button class="page-btn" [disabled]="sales().length < pageSize" (click)="load(page() + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- CREATE / EDIT MODAL -->
    @if (showForm()) {
      <div class="modal-back" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">{{ editId() ? 'Edit Sale' : 'New Plot Sale' }}</div>
            <button class="icon-btn" style="border:0" (click)="showForm.set(false)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>Client (3rd Person) *</label>
                <select [(ngModel)]="form.personId">
                  <option [ngValue]="0">— Select client —</option>
                  @for (p of persons(); track p.id) {
                    <option [ngValue]="p.id">{{ p.fullName }} — {{ p.phone }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Plot *</label>
                <select [(ngModel)]="form.plotId">
                  <option [ngValue]="0">— Select plot —</option>
                  @for (p of availablePlots(); track p.id) {
                    <option [ngValue]="p.id">{{ p.plotNo }} — {{ p.project }} ({{ p.price | inr }})</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Deal Amount (₹) *</label>
                <input type="number" [(ngModel)]="form.dealAmount" placeholder="e.g. 2500000" />
              </div>
              <div class="field">
                <label>Sale Date *</label>
                <input type="date" [(ngModel)]="form.saleDate" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [(ngModel)]="form.status">
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="save()">
              <app-icon name="check" [size]="14" color="#fff" /> {{ editId() ? 'Save Changes' : 'Create Sale' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SalesComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  search = '';
  status = '';
  pageSize = 12;

  sales = signal<Sale[]>([]);
  total = signal(0);
  page = signal(1);
  persons = signal<Person[]>([]);
  plots = signal<Plot[]>([]);

  showForm = signal(false);
  editId = signal<number | null>(null);
  form = this.blankForm();

  availablePlots = computed(() => {
    const current = this.editId();
    return this.plots().filter(p => p.status === 'Available' || p.id === this.form.plotId);
  });

  constructor() {
    this.load(1);
    this.api.getPersons({ pageSize: 200 }).subscribe(r => this.persons.set(r.items));
    this.api.getPlots().subscribe(p => this.plots.set(p));

    // deep-link edit from admin dashboard
    this.route.queryParams.subscribe(q => {
      if (q['edit']) {
        const id = Number(q['edit']);
        this.api.getSales({ pageSize: 50 }).subscribe(res => {
          const sale = res.items.find(s => s.id === id);
          if (sale) this.openEdit(sale);
        });
      }
    });
  }

  private blankForm() {
    return {
      personId: 0 as number | null,
      plotId: 0 as number | null,
      dealAmount: 0,
      saleDate: new Date().toISOString().slice(0, 10),
      status: 'InProgress'
    };
  }

  load(page: number) {
    const opts: { search?: string; status?: string; page: number; pageSize: number } = { page, pageSize: this.pageSize };
    if (this.search) opts.search = this.search;
    if (this.status) opts.status = this.status;
    this.api.getSales(opts).subscribe(res => {
      this.sales.set(res.items);
      this.total.set(res.total);
      this.page.set(page);
    });
  }

  openCreate() {
    this.editId.set(null);
    this.form = this.blankForm();
    this.showForm.set(true);
  }

  openEdit(s: Sale) {
    this.editId.set(s.id);
    this.form = {
      personId: s.personId,
      plotId: s.plotId,
      dealAmount: s.dealAmount,
      saleDate: s.saleDate.slice(0, 10),
      status: s.status
    };
    this.showForm.set(true);
  }

  save() {
    if (!this.form.personId || !this.form.plotId || !this.form.dealAmount) {
      this.toast.error('Client, plot and deal amount are required');
      return;
    }
    const body = {
      personId: this.form.personId!,
      plotId: this.form.plotId!,
      dealAmount: Number(this.form.dealAmount),
      saleDate: new Date(this.form.saleDate).toISOString(),
      status: this.form.status
    };
    const req = this.editId() ? this.api.updateSale(this.editId()!, body) : this.api.createSale(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Sale updated' : 'Sale created & commission generated');
        this.showForm.set(false);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Save failed')
    });
  }

  remove(s: Sale) {
    if (!confirm(`Delete sale of ${s.clientName} (${s.plotNo})?`)) return;
    this.api.deleteSale(s.id).subscribe({
      next: () => {
        this.toast.success('Sale deleted');
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
