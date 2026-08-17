import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { Client, Paginated, Product, Source } from '../../core/models';
import { Products } from '../../core/services/products';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-product-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator, DecimalPipe],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly api = inject(Products);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);

  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly clientId = signal('');
  protected readonly sourceId = signal('');

  protected readonly res = httpResource<Paginated<Product>>(() => ({
    url: `${API_BASE}/products`,
    params: {
      page: this.page(),
      limit: 20,
      ...(this.search() ? { search: this.search() } : {}),
      ...(this.clientId() ? { clientId: this.clientId() } : {}),
      ...(this.sourceId() ? { sourceId: this.sourceId() } : {}),
    },
  }));

  private readonly clientsRes = httpResource<Paginated<Client>>(() => ({
    url: `${API_BASE}/clients`,
    params: { page: 1, limit: 100 },
  }));

  private readonly sourcesRes = httpResource<Paginated<Source>>(() => ({
    url: `${API_BASE}/sources`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly rows = computed(() => this.res.value()?.data ?? []);
  protected readonly clients = computed(() => this.clientsRes.value()?.data ?? []);
  protected readonly sources = computed(() => this.sourcesRes.value()?.data ?? []);

  protected onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value.trim());
    this.page.set(1);
  }

  protected onClient(event: Event) {
    this.clientId.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected onSource(event: Event) {
    this.sourceId.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected async remove(product: Product) {
    const used = `${product.totalSourceUsed} ${product.source?.unit ?? ''}`.trim();
    if (
      !confirm(
        `Delete "${product.name}"? The ${used} it consumed goes back to ${product.source?.name ?? 'the source'}.`,
      )
    ) {
      return;
    }
    try {
      await this.api.remove(product.id);
      this.toast.success(`"${product.name}" deleted — ${used} returned to stock`);
      this.res.reload();
    } catch (error) {
      this.toast.error(apiErrorMessage(error, 'Could not delete product'));
    }
  }
}
