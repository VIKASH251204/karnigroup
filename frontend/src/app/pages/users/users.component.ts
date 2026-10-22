import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { User, CreateUserRequest, UpdateUserRequest, Role } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="card">
      <div class="card-h">
        <div>
          <div class="t">All Admins / Members</div>
          <div class="small muted" style="margin-top:3px">Add, edit, block or remove any admin / employee</div>
        </div>
        <div class="toolbar">
          <div class="search-box">
            <app-icon name="search" [size]="15" color="#94a3b8" />
            <input placeholder="Search name / email…" [(ngModel)]="search" (ngModelChange)="load()" />
          </div>
          <select class="btn btn-ghost" style="padding:9px 12px" [(ngModel)]="role" (ngModelChange)="load()">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Associate">Associate</option>
          </select>
          <button class="btn btn-primary" (click)="openCreate()">
            <app-icon name="user-plus" [size]="15" color="#fff" /> Add Member
          </button>
        </div>
      </div>

      <div class="card-b table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Role</th><th class="hide-sm">Designation</th><th class="hide-sm">Reports To</th>
              <th class="hide-sm">Phone</th><th class="hide-sm">Rate</th><th class="hide-sm">Registered</th><th class="hide-sm">Plots Sold</th><th class="hide-sm">Revenue</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id; let i = $index) {
              <tr>
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="flex">
                    <div class="avatar" style="width:34px;height:34px;font-size:11.5px">{{ initials(u.fullName) }}</div>
                    <div>
                      <div class="strong">{{ u.fullName }}</div>
                      <div class="small muted">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge" [class.purple]="u.role === 'Admin'" [class.blue]="u.role === 'Associate'">{{ u.role }}</span></td>
                <td class="hide-sm">{{ u.designation || '—' }}</td>
                <td class="hide-sm">{{ u.parentName || '—' }}</td>
                <td class="hide-sm">{{ u.phone }}</td>
                <td class="hide-sm">{{ u.commissionRate }}%</td>
                <td class="hide-sm">{{ u.totalRegistered }}</td>
                <td class="strong hide-sm">{{ u.plotsSold }}</td>
                <td class="hide-sm">{{ u.revenue | inr: 'short' }}</td>
                <td>
                  <span class="badge" [class.green]="u.status === 'Active'" [class.red]="u.status === 'Blocked'">{{ u.status }}</span>
                </td>
                <td>
                  <div class="flex" style="gap:6px">
                    <button class="btn btn-soft-blue btn-sm" (click)="openEdit(u)"><app-icon name="edit" [size]="12" /></button>
                    @if (u.status === 'Active' && u.id !== auth.user()?.id) {
                      <button class="btn btn-warning btn-sm" (click)="toggleBlock(u)">Block</button>
                    }
                    @if (u.status === 'Blocked') {
                      <button class="btn btn-success btn-sm" (click)="toggleBlock(u)">Unblock</button>
                    }
                    @if (u.id !== auth.user()?.id) {
                      <button class="btn btn-danger btn-sm" (click)="remove(u)"><app-icon name="trash" [size]="12" /></button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="12"><div class="empty"><app-icon name="users" [size]="28" color="#cbd5e1" /> No members found</div></td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-back" (click)="showForm.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-h">
            <div class="t">{{ editId() ? 'Edit Member' : 'Add New Member' }}</div>
            <button class="icon-btn" style="border:0" (click)="showForm.set(false)"><app-icon name="x" [size]="18" /></button>
          </div>
          <div class="modal-b">
            <div class="form-grid">
              <div class="field">
                <label>Full Name *</label>
                <input [(ngModel)]="form.fullName" />
              </div>
              <div class="field">
                <label>Email *</label>
                <input type="email" [(ngModel)]="form.email" />
              </div>
              <div class="field">
                <label>Phone *</label>
                <input [(ngModel)]="form.phone" />
              </div>
              <div class="field">
                <label>{{ editId() ? 'New Password (blank = keep)' : 'Password *' }}</label>
                <input type="password" [(ngModel)]="form.password" />
              </div>
              <div class="field">
                <label>Role</label>
                <select [(ngModel)]="form.role">
                  <option value="Associate">Associate</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div class="field">
                <label>Designation</label>
                <input [(ngModel)]="form.designation" placeholder="e.g. Sales Executive" />
              </div>
              <div class="field">
                <label>Reports To</label>
                <select [(ngModel)]="form.parentUserId">
                  <option [ngValue]="null">— None —</option>
                  @for (u of possibleParents(); track u.id) {
                    <option [ngValue]="u.id">{{ u.fullName }} ({{ u.role }})</option>
                  }
                </select>
              </div>
              <div class="field">
                <label>Commission Rate (%)</label>
                <input type="number" [(ngModel)]="form.commissionRate" />
              </div>
              @if (editId()) {
                <div class="field">
                  <label>Status</label>
                  <select [(ngModel)]="form.status">
                    <option value="Active">Active</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              }
            </div>
          </div>
          <div class="modal-f">
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="save()">
              <app-icon name="check" [size]="14" color="#fff" /> {{ editId() ? 'Save Changes' : 'Create Member' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class UsersComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  search = '';
  role = '';
  users = signal<User[]>([]);
  showForm = signal(false);
  editId = signal<number | null>(null);

  form = this.blank();

  constructor() {
    this.load();
  }

  private blank() {
    return {
      fullName: '', email: '', phone: '', password: '',
      role: 'Associate' as Role, designation: '', parentUserId: null as number | null,
      commissionRate: 5, status: 'Active'
    };
  }

  possibleParents() {
    return this.users().filter(u => u.role === 'Admin' && u.id !== this.editId());
  }

  initials(name: string) {
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  load() {
    const opts: { search?: string; role?: string } = {};
    if (this.search) opts.search = this.search;
    if (this.role) opts.role = this.role;
    this.api.getUsers(opts).subscribe(u => this.users.set(u));
  }

  openCreate() {
    this.editId.set(null);
    this.form = this.blank();
    this.showForm.set(true);
  }

  openEdit(u: User) {
    this.editId.set(u.id);
    this.form = {
      fullName: u.fullName, email: u.email, phone: u.phone, password: '',
      role: u.role, designation: u.designation || '', parentUserId: u.parentUserId,
      commissionRate: u.commissionRate, status: u.status
    };
    this.showForm.set(true);
  }

  save() {
    if (!this.form.fullName || !this.form.email || !this.form.phone) {
      this.toast.error('Name, email and phone are required');
      return;
    }

    if (this.editId()) {
      const body: UpdateUserRequest = {
        fullName: this.form.fullName,
        email: this.form.email,
        phone: this.form.phone,
        password: this.form.password || undefined,
        role: this.form.role,
        designation: this.form.designation,
        parentUserId: this.form.parentUserId,
        commissionRate: Number(this.form.commissionRate),
        status: this.form.status as 'Active' | 'Blocked'
      };
      this.api.updateUser(this.editId()!, body).subscribe({
        next: () => { this.toast.success('Member updated'); this.showForm.set(false); this.load(); },
        error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Update failed')
      });
    } else {
      if (!this.form.password) {
        this.toast.error('Password is required for new members');
        return;
      }
      const body: CreateUserRequest = {
        fullName: this.form.fullName,
        email: this.form.email,
        phone: this.form.phone,
        password: this.form.password,
        role: this.form.role,
        designation: this.form.designation,
        parentUserId: this.form.parentUserId,
        commissionRate: Number(this.form.commissionRate)
      };
      this.api.createUser(body).subscribe({
        next: () => { this.toast.success('Member created'); this.showForm.set(false); this.load(); },
        error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Create failed')
      });
    }
  }

  toggleBlock(u: User) {
    const newStatus = u.status === 'Active' ? 'Blocked' : 'Active';
    const body: UpdateUserRequest = {
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      designation: u.designation,
      parentUserId: u.parentUserId,
      commissionRate: u.commissionRate,
      status: newStatus
    };
    this.api.updateUser(u.id, body).subscribe({
      next: () => {
        this.toast.success(`${u.fullName} ${newStatus === 'Blocked' ? 'blocked' : 'unblocked'}`);
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Action failed')
    });
  }

  remove(u: User) {
    if (!confirm(`Delete ${u.fullName}?`)) return;
    this.api.deleteUser(u.id).subscribe({
      next: () => { this.toast.success('Member deleted'); this.load(); },
      error: (err: HttpErrorResponse) => this.toast.error(err.error?.message || 'Delete failed')
    });
  }
}
