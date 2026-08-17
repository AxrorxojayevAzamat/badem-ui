import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { Auth } from './auth';

/** Endpoints that carry their own credentials and must not be retried. */
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

const isAuthEndpoint = (url: string) => AUTH_ENDPOINTS.some((p) => url.includes(p));

/**
 * Attaches the access token and, on a 401, transparently refreshes once and
 * replays the request. A failed refresh sends the user back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (isAuthEndpoint(req.url)) return next(req);

  const withToken = (token: string | null) =>
    token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(withToken(auth.accessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      return from(auth.refreshTokens()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            auth.clear();
            void router.navigate(['/login']);
            return throwError(() => error);
          }
          return next(withToken(auth.accessToken()));
        }),
      );
    }),
  );
};
