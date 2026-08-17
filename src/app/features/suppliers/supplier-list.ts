import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { I18n } from '../../core/i18n/i18n';
import { Paginated, Supplier } from '../../core/models';
import { Suppliers } from '../../core/services/suppliers';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-supplier-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator],
  templateUrl: './supplier-list.html',
})
export class SupplierList {
  private readonly api = inject(Suppliers);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);

  protected readonly page = signal(1);
  protected readonly search = signal('');

  protected readonly res = httpResource<Paginated<Supplier>>(() => ({
    url: `${API_BASE}/suppliers`,
    params: {
      page: this.page(),
      limit: 20,
      ...(this.search() ? { search: this.search() } : {}),
    },
  }));

  protected readonly rows = computed(() => this.res.value()?.data ?? []);

  protected onSearch(event: Event) {
    this.search.set((event.target as HTMLInputElement).value.trim());
    this.page.set(1);
  }

  protected async remove(supplier: Supplier) {
    if (!confirm(this.i18n.t('suppliers.confirmDelete', { name: supplier.name }))) {
      return;
    }
    try {
      await this.api.remove(supplier.id);
      this.toast.success(this.i18n.t('suppliers.deleted', { name: supplier.name }));
      this.res.reload();
    } catch (error) {
      this.toast.error(
        apiErrorMessage(error, this.i18n.t('suppliers.deleteFailed')),
      );
    }
  }
}
