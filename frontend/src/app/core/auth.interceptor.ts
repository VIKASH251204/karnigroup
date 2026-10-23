import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { getUser } from '@netlify/identity';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!req.url.startsWith('/api/')) return next(req);
  // Refresh Identity's cookie before calling protected same-origin API routes.
  return from(getUser()).pipe(switchMap(() => next(req)), catchError((err: HttpErrorResponse) => {
    if (err.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/change-password')) auth.logout();
    return throwError(() => err);
  }));
};
