import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Auth } from './auth';
import { Role } from '../models';

/**
 * Shared by both guards. Kept as a plain function so its return type stays
 * `boolean | UrlTree` — `CanActivateFn` also allows Observables, which would
 * leak into `await` results.
 */
async function ensureAuthenticated(
  auth: Auth,
  router: Router,
  url: string,
): Promise<boolean | UrlTree> {
  const toLogin = () =>
    router.createUrlTree(['/login'], { queryParams: { redirect: url } });

  if (!auth.isAuthenticated()) return toLogin();

  // First navigation after a reload: the token is in storage but the profile
  // is not loaded yet, and the role guards need it.
  if (!auth.user()) {
    const user = await auth.loadCurrentUser();
    if (!user) return toLogin();
  }
  return true;
}

export const authGuard: CanActivateFn = (_route, state) =>
  ensureAuthenticated(inject(Auth), inject(Router), state.url);

/** Route-level role check, mirroring the @Roles() guard on the API. */
export const roleGuard =
  (...roles: Role[]): CanActivateFn =>
  async (_route, state) => {
    // inject() must run synchronously, before the first await.
    const auth = inject(Auth);
    const router = inject(Router);

    const allowed = await ensureAuthenticated(auth, router, state.url);
    if (allowed !== true) return allowed;

    return auth.can(...roles) ? true : router.createUrlTree(['/dashboard']);
  };
