import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PersonRequest } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { ToastService } from '../../shared/toast.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register-person',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="split-main">
      <div class="card">
        <div class="card-h">
          <div>
            <div class="t">Register Team Member (3rd Person)</div>
            <div class="small muted" style="margin-top:3px">
              They will join YOUR team under your ID — {{ auth.user()?.fullName }}
            </div>
          </div>
          <span class="badge blue"><app-icon name="shield-check" [size]="12" /> Allowed for Associates</span>
        </div>
        <div class="card-b">
          @if (error()) {
            <div class="err-box" style="max-width:100%">{{ error() }}</div>
          }

          <div class="form-grid">
            <div class="field">
              <label>Full Name *</label>
              <input [(ngModel)]="form.fullName" placeholder="e.g. Aman Verma" />
            </div>
            <div class="field">
              <label>Phone Number *</label>
              <input [(ngModel)]="form.phone" placeholder="e.g. 9876543210" />
            </div>
            <div class="field">
              <label>Email</label>
              <input [(ngModel)]="form.email" placeholder="e.g. person@gmail.com" />
            </div>
            <div class="field">
              <label>ID Proof Number</label>
              <input [(ngModel)]="form.idProofNumber" placeholder="Aadhaar / PAN / DL no." />
            </div>
            <div class="field full">
              <label>Address</label>
              <input [(ngModel)]="form.address" placeholder="House no., area, city, state" />
            </div>
            <div class="field">
              <label>Status</label>
              <select [(ngModel)]="form.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div class="field full">
              <label>Notes</label>
              <textarea [(ngModel)]="form.notes" placeholder="Interested in..., budget, requirements..."></textarea>
            </div>
          </div>

          <div class="flex" style="margin-top:18px">
            <button class="btn btn-primary" [disabled]="saving()" (click)="submit()">
              <app-icon name="user-plus" [size]="16" color="#fff" />
              {{ saving() ? 'Registering…' : 'Add to My Team' }}
            </button>
            <button class="btn btn-ghost" (click)="reset()">Reset</button>
            <a routerLink="/team" class="btn btn-ghost">View My Team</a>
          </div>
        </div>
      </div>

      <div>
        <div class="card info-panel">
          <div class="info-head blue">
            <div class="big">Register Team</div>
            <div class="small">Add new people into your team in your ID</div>
          </div>
          <div class="info-body">
            <div class="tile" style="background:#e8f0fe">
              <div class="ti bg-blue"><app-icon name="shield" [size]="20" /></div>
              <div class="t">What you CAN do</div>
              <div class="d">Register team members • Sell plots to clients • Upload site visit photos • View own data</div>
            </div>
            <div class="tile" style="background:#fdeaea">
              <div class="ti bg-red"><app-icon name="x" [size]="20" /></div>
              <div class="t">What you CANNOT do</div>
              <div class="d">Edit sales, payments, plots or other members' data — view only</div>
            </div>
          </div>
        </div>

        @if (lastRegistered()) {
          <div class="card mt" style="padding:18px">
            <div class="flex">
              <div class="box bg-green" style="width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center">
                <app-icon name="check" [size]="20" color="#16a34a" />
              </div>
              <div>
                <div style="font-weight:800">Registered Successfully!</div>
                <div class="small muted">{{ lastRegistered()!.fullName }} — {{ lastRegistered()!.phone }} added to your team</div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class RegisterPersonComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  auth = inject(AuthService);

  form: PersonRequest = this.blank();
  saving = signal(false);
  error = signal('');
  lastRegistered = signal<{ fullName: string; phone: string } | null>(null);

  private blank(): PersonRequest {
    return {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      idProofNumber: '',
      notes: '',
      status: 'Active'
    };
  }

  reset() {
    this.form = this.blank();
    this.error.set('');
    this.lastRegistered.set(null);
  }

  submit() {
    if (!this.form.fullName?.trim() || !this.form.phone?.trim()) {
      this.error.set('Name and phone number are required');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    this.api.createPerson(this.form).subscribe({
      next: p => {
        this.saving.set(false);
        this.toast.success(`${p.fullName} added to your team`);
        this.lastRegistered.set({ fullName: p.fullName, phone: p.phone });
        this.form = this.blank();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      }
    });
  }
}
