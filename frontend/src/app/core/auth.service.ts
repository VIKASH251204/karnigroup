import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 're_token';
  private readonly USER_KEY = 're_user';

  user = signal<User | null>(this.readStoredUser());
  loggedIn = computed(() => !!this.user());
  isAdmin = computed(() => this.user()?.role === 'Admin');

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.user.set(res.user);
        })
      );
  }

  refreshMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(u => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(u));
        this.user.set(u);
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/change-password`, {
      oldPassword,
      newPassword
    });
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
