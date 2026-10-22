import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Person, PersonRequest } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">{{ title() }}</div>
          <div class="small muted" style="margin-top:3px">{{ subtitle() }}</div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search name / phone / email…" [(ngModel)]="search" (ngModelChange)="load(1)" />
          </div>
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="status" (ngModelChange)="load(1)">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <a routerLink="/register-person" class="btn btn-primary">
            <app-icon name="plus" [size]="15" color="#fff" />
            {{ mode === 'clients' ? 'Register Person' : 'Add Team Member' }}
          </a>
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Phone</th><th class="hide-sm">Email</th>
              @if (mode === 'all') { <th class="hide-sm">Registered By</th> }
              <th>{{ mode === 'team' ? 'Joined' : 'Date' }}</th>
              <th class="hide-sm">Deals</th><th class="hide-sm">Business</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (p of items(); track p.id; let i = $index) {
              <tr>
                <td>{{ (page() - 1) * pageSize + i + 1 }}</td>
                <td class="strong">{{ p.fullName }}</td>
                <td>{{ p.phone }}</td>
                <td class="hide-sm">{{ p.email || '—' }}</td>
                @if (mode === 'all') {
                  <td class="hide-sm">{{ p.registeredByName }}</td>
                }
                <td>{{ p.createdAt | fdate }}</td>
                <td class="hide-sm">{{ p.saleCount }}</td>
                <td class="strong hide-sm">{{ p.totalBusiness | inr }}</td>
                <td>
                  <span class="badge" [class.green]="p.status === 'Active'" [class.gray]="p.status !== 'Active'">{{ p.status }}</span>
                </td>
                <td>
                  <div class="flex" style="gap:6px">
                    <button class="btn btn-soft-blue btn-sm" (click)="view(p)"><app-icon name="eye" [size]="12" /> View</button>
                    @if (auth.isAdmin()) {
                      <button class="btn btn-ghost btn-sm" (click)="edit(p)"><app-icon name="edit" [size]="12" /></button>
                      <button class="btn btn-danger btn-sm" (click)="remove(p)"><app-icon name="trash" [size]="12" /></button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="10"><div class="empty"><app-icon name="users" [size]="28" color="#cbd5e1" /> {{ emptyText() }}</div></td></tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <div class="info">Showing {{ items().length }} of {{ total() }} records</div>
          <button class="page-btn" [disabled]="page() <= 1" (click)="load(page() - 1)">Prev</button>
          <span class="small muted">Page {{ page() }}</span>
          <button class="page-btn" [disabled]="items().length < pageSize" (click)="load(page() + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- VIEW / EDIT MODAL -->
    @if (selected()) {
      <div class="modal-back" (click)="selected.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">{{ editMode() ? 'Edit Person' : 'Person Details' }}</div>
            <button class="icon-btn" style="border:0" (click)="selected.set(null)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>Full Name</label>
                <input [readonly]="!editMode()" [(ngModel)]="draft.fullName" />
              </div>
              <div class="field">
                <label>Phone</label>
                <input [readonly]="!editMode()" [(ngModel)]="draft.phone" />
              </div>
              <div class="field">
                <label>Email</label>
                <input [readonly]="!editMode()" [(ngModel)]="draft.email" />
              </div>
              <div class="field">
                <label>ID Proof Number</label>
                <input [readonly]="!editMode()" [(ngModel)]="draft.idProofNumber" />
              </div>
              <div class="field full">
                <label>Address</label>
                <input [readonly]="!editMode()" [(ngModel)]="draft.address" />
              </div>
              <div class="field">
                <label>Status</label>
                <select [disabled]="!editMode()" [(ngModel)]="draft.status">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div class="field full">
                <label>Notes</label>
                <textarea [readonly]="!editMode()" [(ngModel)]="draft.notes"></textarea>
              </div>
            </div>
            <div class="small muted" style="margin-top:12px">
              Registered by <b>{{ selected()!.registeredByName }}</b> on {{ selected()!.createdAt | fdate }}
              • {{ selected()!.saleCount }} deal(s) • Business {{ selected()!.totalBusiness | inr }}
            </div>
            @if (!auth.isAdmin()) {
              <div class="view-only-chip" style="margin-top:12px">
                <app-icon name="shield" [size]="14" /> View only — editing is admin-only
              </div>
            }
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="selected.set(null)">Close</button>
            @if (auth.isAdmin()) {
              @if (editMode()) {
                <button class="btn btn-primary" (click)="save()"><app-icon name="check" [size]="14" color="#fff" /> Save Changes</button>
              } @else {
                <button class="btn btn-primary" (click)="editMode.set(true)"><app-icon name="edit" [size]="14" color="#fff" /> Edit</button>
              }
            }
          </div>
        </div>
      </div>
    }
  `
})
export class PersonsComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  mode: 'all' | 'team' | 'clients' = 'all';
  search = '';
  status = '';
  pageSize = 12;

  items = signal<Person[]>([]);
  total = signal(0);
  page = signal(1);
  selected = signal<Person | null>(null);
  editMode = signal(false);
  draft: PersonRequest = this.blank();

  title = computed(() => {
    if (this.mode === 'team') return this.auth.isAdmin() ? 'My Registered Team' : 'My Team';
    if (this.mode === 'clients') return this.auth.isAdmin() ? 'All Clients (Plot Buyers)' : 'My Clients';
    return 'All Registered Persons';
  });

  subtitle = computed(() => {
    if (this.mode === 'team') return 'People you have registered — they are your team';
    if (this.mode === 'clients') return this.auth.isAdmin()
      ? 'People who have bought plots (all members)'
      : 'People you have sold plots to';
    return 'All persons registered by all members (every team)';
  });

  emptyText = computed(() => {
    if (this.mode === 'team') return 'No team members yet — register your first person';
    if (this.mode === 'clients') return 'No clients yet — sell a plot to see buyers here';
    return 'No persons found';
  });

  constructor() {
    this.route.data.subscribe(d => {
      this.mode = d['mode'] || 'all';
      this.load(1);
    });
  }

  load(page: number) {
    const opts: { search?: string; status?: string; view?: string; page: number; pageSize: number } = {
      page,
      pageSize: this.pageSize,
      view: this.mode
    };
    if (this.search) opts.search = this.search;
    if (this.status) opts.status = this.status;
    this.api.getPersons(opts).subscribe(res => {
      this.items.set(res.items);
      this.total.set(res.total);
      this.page.set(page);
    });
  }

  private blank(): PersonRequest {
    return { fullName: '', phone: '', email: '', address: '', idProofNumber: '', notes: '', status: 'Active' };
  }

  view(p: Person) {
    this.selected.set(p);
    this.editMode.set(false);
    this.draft = { ...p };
  }

  edit(p: Person) {
    this.selected.set(p);
    this.editMode.set(true);
    this.draft = { ...p };
  }

  save() {
    const id = this.selected()!.id;
    this.api.updatePerson(id, this.draft).subscribe({
      next: updated => {
        this.toast.success('Person updated');
        this.selected.set(null);
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Update failed')
    });
  }

  remove(p: Person) {
    if (!confirm(`Delete ${p.fullName}? This cannot be undone.`)) return;
    this.api.deletePerson(p.id).subscribe({
      next: () => {
        this.toast.success('Person deleted');
        this.load(this.page());
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
