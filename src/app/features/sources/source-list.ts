import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { Paginated, Source, Supplier } from '../../core/models';
import { Sources } from '../../core/services/sources';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-source-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator, DecimalPipe],
  templateUrl: './source-list.html',
})
export class SourceList {
  private readonly api = inject(Sources);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);

  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly supplierId = signal('');
  protected readonly lowStockOnly = signal(false);

  protected readonly res = httpResource<Paginated<Source>>(() => ({
    url: `${API_BASE}/sources`,
    params: {
      page: this.page(),
      limit: 20,
      ...(this.search() ? { search: this.search() } : {}),
      ...(this.supplierId() ? { supplierId: this.supplierId() } : {}),
      ...(this.lowStockOnly() ? { lowStock: true } : {}),
    },
  }));

  /** Feeds the supplier filter dropdown. */
  protected readonly suppliersRes = httpResource<Paginated<Supplier>>(() => ({
    url: `${API_BASE}/suppliers`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly rows = computed(() => this.res.value()?.data ?? []);
  protected readonly suppliers = computed(
    () => this.suppliersRes.value()?.data ?? [],
  );

  protected isLow(source: Source): boolean {
    return source.quantity <= source.minQuantity;
  }

  protected onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value.trim());
    this.page.set(1);
  }

  protected onSupplier(event: Event) {
    this.supplierId.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  protected onLowStock(event: Event) {
    this.lowStockOnly.set((event.target as HTMLInputElement).checked);
    this.page.set(1);
  }

  protected async remove(source: Source) {
    if (!confirm(`Delete source "${source.name}"?`)) return;
    try {
      await this.api.remove(source.id);
      this.toast.success(`Source "${source.name}" deleted`);
      this.res.reload();
    } catch (error) {
      this.toast.error(apiErrorMessage(error, 'Could not delete source'));
    }
  }
}
