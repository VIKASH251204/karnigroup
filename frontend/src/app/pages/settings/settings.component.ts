import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="split">
      <div class="card">
        <div class="card-h"><div class="t">Company Settings</div></div>
        <div class="card-b">
          <div class="form-grid">
            <div class="field">
              <label>Company Name</label>
              <input [(ngModel)]="company.name" />
            </div>
            <div class="field">
              <label>Phone</label>
              <input [(ngModel)]="company.phone" />
            </div>
            <div class="field full">
              <label>Office Address</label>
              <textarea [(ngModel)]="company.address"></textarea>
            </div>
            <div class="field">
              <label>Default Commission Rate (%)</label>
              <input type="number" [(ngModel)]="company.commissionRate" />
            </div>
            <div class="field">
              <label>Currency</label>
              <select [(ngModel)]="company.currency">
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:18px" (click)="save()">
            <app-icon name="check" [size]="15" color="#fff" /> Save Settings
          </button>
          <div class="small muted" style="margin-top:12px">
            ℹ️ Company settings are stored locally in this demo. Wire up a Settings API table for production.
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-h"><div class="t">System Info</div></div>
          <div class="card-b">
            <table class="tbl">
              <tbody>
                <tr><td class="strong">Frontend</td><td>Angular 18 (standalone)</td></tr>
                <tr><td class="strong">Backend</td><td>ASP.NET Core 8 Web API</td></tr>
                <tr><td class="strong">Database</td><td>SQL Server (EF Core 8)</td></tr>
                <tr><td class="strong">Auth</td><td>JWT Bearer + Role-based (Admin / Associate)</td></tr>
                <tr><td class="strong">Logged in as</td><td>{{ auth.user()?.fullName }} ({{ auth.user()?.role }})</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card mt">
          <div class="card-h"><div class="t">Role Permissions</div></div>
          <div class="card-b">
            <table class="tbl">
              <thead><tr><th>Capability</th><th>Admin</th><th>Associate</th></tr></thead>
              <tbody>
                <tr><td>Register team members (3rd persons)</td><td><span class="badge green">Yes</span></td><td><span class="badge green">Yes</span></td></tr>
                <tr><td>Sell plots to clients</td><td><span class="badge green">Yes</span></td><td><span class="badge green">Yes</span></td></tr>
                <tr><td>Upload site visit photos</td><td><span class="badge green">Yes</span></td><td><span class="badge green">Yes</span></td></tr>
                <tr><td>Edit / delete sales, payments, plots</td><td><span class="badge green">Yes</span></td><td><span class="badge red">No (view only)</span></td></tr>
                <tr><td>Manage admins / employees</td><td><span class="badge green">Yes</span></td><td><span class="badge red">No</span></td></tr>
                <tr><td>Approve payments &amp; commissions</td><td><span class="badge green">Yes</span></td><td><span class="badge red">No</span></td></tr>
                <tr><td>Company-wide reports</td><td><span class="badge green">Yes</span></td><td><span class="badge orange">Own data only</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  auth = inject(AuthService);
  private toast = inject(ToastService);

  company = {
    name: 'RealEstate Pvt. Ltd.',
    phone: '+91 98765 00011',
    address: 'Civil Lines, Alwar, Rajasthan',
    commissionRate: 5,
    currency: 'INR'
  };

  save() {
    localStorage.setItem('re_company', JSON.stringify(this.company));
    this.toast.success('Settings saved');
  }
}
