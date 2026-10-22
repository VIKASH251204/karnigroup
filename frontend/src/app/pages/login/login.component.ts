import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="brand-line">
          <div class="brand-logo" style="width:46px;height:46px;border-radius:13px">
            <app-icon name="home" [size]="24" color="#fff" />
          </div>
          <div>
            <div style="font-size:19px;font-weight:800">RealEstate <span style="color:#2563eb">Panel</span></div>
            <div class="small muted">Company Admin &amp; Associate Portal</div>
          </div>
        </div>

        <h1>Welcome back</h1>
        <div class="sub">Login to manage your registrations, sales &amp; site visits.</div>

        @if (error()) {
          <div class="err-box">{{ error() }}</div>
        }

        <div class="field" style="margin-bottom:14px">
          <label>Email Address</label>
          <input type="email" [(ngModel)]="email" placeholder="you@realestate.com" (keyup.enter)="submit()" />
        </div>
        <div class="field" style="margin-bottom:20px">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="submit()" />
        </div>

        <button class="btn btn-primary" style="width:100%;padding:12px;font-size:14px" [disabled]="loading()" (click)="submit()">
          @if (loading()) {
            Signing in…
          } @else {
            <app-icon name="shield-check" [size]="17" color="#fff" /> Sign In
          }
        </button>

        <div class="demo-chip">
          <div><b>Admin login:</b> admin&#64;realestate.com / Admin&#64;123</div>
          <div><b>Associate login:</b> associate&#64;realestate.com / Assoc&#64;123</div>
          <div style="margin-top:6px;color:#94a3b8">Admin = full access &amp; edit control. Associate = register 3rd persons + site visit photos, rest view-only.</div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.email || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 0) {
          this.error.set(
            '⚠ API server (backend) se connect nahi ho raha. ' +
            '1) Terminal me backend chalayein: cd backend\\RealEstate.Api && dotnet run --urls http://localhost:5080 ' +
            '2) Check karein: browser me http://localhost:5080/api/health khulna chahiye. ' +
            '3) Agar SQL Server error aaye to start-backend.bat use karein (demo mode).'
          );
        } else {
          this.error.set(err.error?.message || `Login failed (HTTP ${err.status}). Please try again.`);
        }
      }
    });
  }
}
