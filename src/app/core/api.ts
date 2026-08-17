import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ListQuery, Paginated } from './models';

/** Dev server proxies /api to the NestJS backend (see proxy.conf.json). */
export const API_BASE = '/api';

/** Drops empty values so the API never sees `?search=` or unknown params. */
export function toParams(query: ListQuery): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params[key] = String(value);
  }
  return params;
}

/**
 * Shared CRUD calls for the uniform `/api/<resource>` endpoints.
 * Lists are usually read with `httpResource` in the components; these methods
 * cover the mutations and the one-off reads that forms need.
 */
export abstract class CrudApi<TEntity, TCreate, TUpdate = Partial<TCreate>> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resource: string;

  protected get url(): string {
    return `${API_BASE}/${this.resource}`;
  }

  list(query: ListQuery = {}): Promise<Paginated<TEntity>> {
    return firstValueFrom(
      this.http.get<Paginated<TEntity>>(this.url, { params: toParams(query) }),
    );
  }

  get(id: string): Promise<TEntity> {
    return firstValueFrom(this.http.get<TEntity>(`${this.url}/${id}`));
  }

  create(body: TCreate): Promise<TEntity> {
    return firstValueFrom(this.http.post<TEntity>(this.url, body));
  }

  update(id: string, body: TUpdate): Promise<TEntity> {
    return firstValueFrom(this.http.patch<TEntity>(`${this.url}/${id}`, body));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
}

/**
 * Strips empty strings and undefined before sending a payload.
 * The API validates optional fields with `@IsOptional()`, which only skips
 * `null`/`undefined` — an empty string would be rejected as a bad email/uuid.
 */
export function clean<T extends object>(payload: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === '') continue;
    result[key] = value;
  }
  return result as T;
}

/** Pulls the human-readable message out of a Nest error response. */
export function apiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  const body = (error as { error?: { message?: string | string[] } } | null)?.error;
  const message = body?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function apiErrorStatus(error: unknown): number {
  return (error as { status?: number } | null)?.status ?? 0;
}
