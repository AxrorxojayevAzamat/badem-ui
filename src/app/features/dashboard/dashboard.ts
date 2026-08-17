import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { Paginated, Product, Source, SourceHistory } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, LowerCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly auth = inject(Auth);

  // `httpResource` re-fetches whenever the request signal changes and exposes
  // loading/error state as signals — no subscriptions to manage.
  private readonly sourcesRes = httpResource<Paginated<Source>>(() => ({
    url: `${API_BASE}/sources`,
    params: { page: 1, limit: 100 },
  }));

  private readonly productsRes = httpResource<Paginated<Product>>(() => ({
    url: `${API_BASE}/products`,
    params: { page: 1, limit: 5 },
  }));

  private readonly historyRes = httpResource<Paginated<SourceHistory>>(() => ({
    url: `${API_BASE}/source-history`,
    params: { page: 1, limit: 8 },
  }));

  protected readonly loading = computed(
    () => this.sourcesRes.isLoading() || this.productsRes.isLoading(),
  );

  protected readonly sources = computed(() => this.sourcesRes.value()?.data ?? []);
  protected readonly recentProducts = computed(
    () => this.productsRes.value()?.data ?? [],
  );
  protected readonly recentMovements = computed(
    () => this.historyRes.value()?.data ?? [],
  );

  protected readonly sourceCount = computed(
    () => this.sourcesRes.value()?.meta.total ?? 0,
  );
  protected readonly productCount = computed(
    () => this.productsRes.value()?.meta.total ?? 0,
  );

  protected readonly lowStock = computed(() =>
    this.sources().filter((s) => s.quantity <= s.minQuantity),
  );

  protected readonly stockValue = computed(() =>
    this.sources().reduce((sum, s) => sum + s.quantity * s.pricePerUnit, 0),
  );
}
