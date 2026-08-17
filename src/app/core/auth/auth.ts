import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api';
import { Role, Tokens, User } from '../models';

const ACCESS_KEY = 'badem.accessToken';
const REFRESH_KEY = 'badem.refreshToken';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly access = signal<string | null>(read(ACCESS_KEY));
  private readonly refresh = signal<string | null>(read(REFRESH_KEY));

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.access() !== null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);

  /** Shared between concurrent 401s so only one refresh call goes out. */
  private refreshInFlight: Promise<boolean> | null = null;

  accessToken(): string | null {
    return this.access();
  }

  refreshToken(): string | null {
    return this.refresh();
  }

  can(...roles: Role[]): boolean {
    const role = this.role();
    return role !== null && roles.includes(role);
  }

  async login(email: string, password: string): Promise<void> {
    const tokens = await firstValueFrom(
      this.http.post<Tokens>(`${API_BASE}/auth/login`, { email, password }),
    );
    this.store(tokens);
    await this.loadCurrentUser();
  }

  async register(
    email: string,
    fullName: string,
    password: string,
  ): Promise<void> {
    const tokens = await firstValueFrom(
      this.http.post<Tokens>(`${API_BASE}/auth/register`, {
        email,
        fullName,
        password,
      }),
    );
    this.store(tokens);
    await this.loadCurrentUser();
  }

  async loadCurrentUser(): Promise<User | null> {
    if (!this.access()) return null;
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${API_BASE}/auth/me`),
      );
      this.user.set(user);
      return user;
    } catch {
      this.clear();
      return null;
    }
  }

  /**
   * Exchanges the refresh token for a new pair. The backend rotates tokens, so
   * concurrent callers must share one request — two parallel refreshes would
   * make the second one look like token reuse and kill the session.
   */
  refreshTokens(): Promise<boolean> {
    this.refreshInFlight ??= this.doRefresh().finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<boolean> {
    const token = this.refresh();
    if (!token) return false;
    try {
      const tokens = await firstValueFrom(
        this.http.post<Tokens>(`${API_BASE}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      this.store(tokens);
      return true;
    } catch {
      this.clear();
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.access()) {
      // Best effort: clear the stored hash on the server, ignore failures.
      await firstValueFrom(
        this.http.post(`${API_BASE}/auth/logout`, null),
      ).catch(() => undefined);
    }
    this.clear();
    await this.router.navigate(['/login']);
  }

  clear(): void {
    this.access.set(null);
    this.refresh.set(null);
    this.user.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  private store(tokens: Tokens): void {
    this.access.set(tokens.accessToken);
    this.refresh.set(tokens.refreshToken);
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

function read(key: string): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
}
