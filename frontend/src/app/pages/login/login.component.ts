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

        <h1>{{ auth.passwordSetup() ? 'Set your password' : 'Welcome back' }}</h1>
        <div class="sub">Login to manage your registrations, sales &amp; site visits.</div>

        @if (error()) {
          <div class="err-box">{{ error() }}</div>
        }

        @if (!auth.passwordSetup()) {
        <div class="field" style="margin-bottom:14px">
          <label>Email Address</label>
          <input type="email" [(ngModel)]="email" placeholder="you@realestate.com" (keyup.enter)="submit()" />
        </div>
        }
        <div class="field" style="margin-bottom:20px">
          <label>Password</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" (keyup.enter)="submit()" />
        </div>

        <button class="btn btn-primary" style="width:100%;padding:12px;font-size:14px" [disabled]="loading()" (click)="submit()">
          @if (loading()) {
            Signing in…
          } @else {
            <app-icon name="shield-check" [size]="17" color="#fff" /> {{ auth.passwordSetup() ? 'Save password' : 'Sign In' }}
          }
        </button>

        @if (!auth.passwordSetup()) {
          <button class="btn" style="width:100%;margin-top:12px" [disabled]="loading()" (click)="recover()">Forgot password?</button>
        }
        @if (notice()) { <div class="small muted" style="margin-top:12px">{{ notice() }}</div> }
        <div class="demo-chip">Use the account invited by your company administrator. Open your invitation email to set your password before signing in.</div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  notice = signal('');

  constructor(public auth: AuthService, private router: Router) {
    void auth.callbackReady.then(() => this.error.set(auth.callbackError()));
  }

  submit() {
    if ((!this.auth.passwordSetup() && !this.email) || !this.password) {
      this.error.set('Please enter email and password');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    if (this.auth.passwordSetup() && this.password.length < 8) {
      this.loading.set(false); this.error.set('Password must be at least 8 characters'); return;
    }
    const operation = this.auth.passwordSetup() ? this.auth.completePasswordSetup(this.password) : this.auth.login(this.email.trim(), this.password);
    operation.subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Unable to sign in. Check your account invitation and try again.');
      }
    });
  }
  recover() {
    if (!this.email.trim()) { this.error.set('Enter your email address first'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.requestRecovery(this.email.trim()).subscribe({
      next: () => { this.loading.set(false); this.notice.set('If an account exists, a password reset email is on its way.'); },
      error: () => { this.loading.set(false); this.error.set('Unable to send reset email. Please try again.'); }
    });
  }

}
