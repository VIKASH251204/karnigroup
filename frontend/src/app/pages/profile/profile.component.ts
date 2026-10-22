import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { InrPipe, FDatePipe } from '../../shared/pipes';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, IconComponent, InrPipe, FDatePipe],
  template: `
    <div class="split">
      <!-- Profile card -->
      <div class="card">
        <div class="card-h"><div class="t">My Profile</div></div>
        <div class="card-b">
          <div class="flex" style="margin-bottom:20px">
            <div class="avatar" style="width:74px;height:74px;font-size:24px">{{ initials() }}</div>
            <div>
              <div style="font-size:18px;font-weight:800">{{ auth.user()?.fullName }}</div>
              <div class="muted">{{ auth.user()?.email }}</div>
              <div class="flex" style="margin-top:7px">
                <span class="badge" [class.purple]="auth.isAdmin()" [class.blue]="!auth.isAdmin()">
                  {{ auth.isAdmin() ? 'Admin' : 'Associate' }}
                </span>
                <span class="badge green">{{ auth.user()?.status }}</span>
              </div>
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>Full Name</label>
              <input [readonly]="true" [value]="auth.user()?.fullName" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input [readonly]="true" [value]="auth.user()?.phone" />
            </div>
            <div class="field">
              <label>Designation</label>
              <input [readonly]="true" [value]="auth.user()?.designation || '—'" />
            </div>
            <div class="field">
              <label>Commission Rate</label>
              <input [readonly]="true" [value]="(auth.user()?.commissionRate || 0) + '%'" />
            </div>
            <div class="field">
              <label>Reports To</label>
              <input [readonly]="true" [value]="auth.user()?.parentName || '—'" />
            </div>
            <div class="field">
              <label>Member Since</label>
              <input [readonly]="true" [value]="auth.user()?.createdAt | fdate" />
            </div>
          </div>

          <div class="grid grid-3" style="margin-top:18px">
            <div class="stat" style="box-shadow:none;border:1px solid var(--line)">
              <div class="box bg-blue" style="width:40px;height:40px"><app-icon name="users" [size]="18" /></div>
              <div><div class="label">Registered</div><div class="value" style="font-size:18px">{{ auth.user()?.totalRegistered ?? 0 }}</div></div>
            </div>
            <div class="stat" style="box-shadow:none;border:1px solid var(--line)">
              <div class="box bg-green" style="width:40px;height:40px"><app-icon name="home" [size]="18" /></div>
              <div><div class="label">Plots Sold</div><div class="value" style="font-size:18px">{{ auth.user()?.plotsSold ?? 0 }}</div></div>
            </div>
            <div class="stat" style="box-shadow:none;border:1px solid var(--line)">
              <div class="box bg-purple" style="width:40px;height:40px"><app-icon name="rupee" [size]="18" /></div>
              <div><div class="label">Revenue</div><div class="value" style="font-size:16px">{{ auth.user()?.revenue ?? 0 | inr: 'short' }}</div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Change password -->
      <div class="card">
        <div class="card-h"><div class="t">Change Password</div></div>
        <div class="card-b">
          @if (msg()) {
            <div class="err-box" [style.background]="ok() ? '#e7f7ee' : '#fdeaea'" [style.color]="ok() ? '#16a34a' : '#ef4444'">
              {{ msg() }}
            </div>
          }
          <div class="field" style="margin-bottom:14px">
            <label>Old Password</label>
            <input type="password" [(ngModel)]="oldPassword" />
          </div>
          <div class="field" style="margin-bottom:14px">
            <label>New Password</label>
            <input type="password" [(ngModel)]="newPassword" />
          </div>
          <div class="field" style="margin-bottom:18px">
            <label>Confirm New Password</label>
            <input type="password" [(ngModel)]="confirmPassword" />
          </div>
          <button class="btn btn-primary" (click)="changePassword()">
            <app-icon name="key" [size]="15" color="#fff" /> Update Password
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  msg = signal('');
  ok = signal(false);

  initials = computed(() => {
    const n = this.auth.user()?.fullName || '?';
    return n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  });

  changePassword() {
    this.msg.set('');
    if (!this.oldPassword || !this.newPassword) {
      this.msg.set('Please fill all password fields');
      this.ok.set(false);
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.msg.set('New passwords do not match');
      this.ok.set(false);
      return;
    }
    this.auth.changePassword(this.oldPassword, this.newPassword).subscribe({
      next: res => {
        this.msg.set(res.message || 'Password changed');
        this.ok.set(true);
        this.toast.success('Password changed successfully');
        this.oldPassword = this.newPassword = this.confirmPassword = '';
      },
      error: (err: HttpErrorResponse) => {
        this.msg.set(err.error?.message || 'Password change failed');
        this.ok.set(false);
      }
    });
  }
}
