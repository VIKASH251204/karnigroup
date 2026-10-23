import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { from, switchMap, tap } from 'rxjs';
import { login, logout, handleAuthCallback, acceptInvite, updateUser, requestPasswordRecovery } from '@netlify/identity';
import { environment } from '../../environments/environment';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly USER_KEY = 're_user';
  private inviteToken: string | null = null;
  passwordSetup = signal(false);
  callbackError = signal('');
  user = signal<User | null>(this.readStoredUser());
  loggedIn = computed(() => !!this.user());
  isAdmin = computed(() => this.user()?.role === 'Admin');
  readonly callbackReady: Promise<void>;

  constructor(private http: HttpClient, private router: Router) {
    localStorage.removeItem('re_token');
    this.callbackReady = this.processCallback();
  }

  // Identity manages secure session cookies and refreshes the session automatically.
  get token(): null { return null; }

  login(email: string, password: string) {
    return from(login(email, password)).pipe(switchMap(() => this.refreshMe()));
  }

  completePasswordSetup(password: string) {
    const task = this.inviteToken ? acceptInvite(this.inviteToken, password) : updateUser({ password });
    return from(task).pipe(tap(() => { this.inviteToken = null; this.passwordSetup.set(false); }), switchMap(() => this.refreshMe()));
  }

  requestRecovery(email: string) { return from(requestPasswordRecovery(email)); }

  refreshMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(tap(u => {
      localStorage.setItem(this.USER_KEY, JSON.stringify(u)); this.user.set(u);
    }));
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, { oldPassword, newPassword });
  }

  logout() {
    this.user.set(null); localStorage.removeItem(this.USER_KEY);
    void logout().catch(() => {});
    this.router.navigate(['/login']);
  }

  private async processCallback() {
    try {
      const result = await handleAuthCallback();
      if (!result) return;
      if (result.type === 'invite') { this.inviteToken = result.token ?? null; this.passwordSetup.set(true); }
      else if (result.type === 'recovery') this.passwordSetup.set(true);
      else this.refreshMe().subscribe({ next: () => this.router.navigate(['/dashboard']), error: () => this.user.set(null) });
    } catch { this.callbackError.set('This account link is invalid or expired. Request a new invite or password reset.'); }
  }

  private readStoredUser(): User | null {
    try { const raw = localStorage.getItem(this.USER_KEY); return raw ? JSON.parse(raw) as User : null; }
    catch { return null; }
  }
}
