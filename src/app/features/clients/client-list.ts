import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { I18n } from '../../core/i18n/i18n';
import { Client, Paginated } from '../../core/models';
import { Clients } from '../../core/services/clients';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-client-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator],
  templateUrl: './client-list.html',
})
export class ClientList {
  private readonly api = inject(Clients);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);

  protected readonly page = signal(1);
  protected readonly search = signal('');

  protected readonly res = httpResource<Paginated<Client>>(() => ({
    url: `${API_BASE}/clients`,
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

  protected async remove(client: Client) {
    if (!confirm(this.i18n.t('clients.confirmDelete', { name: client.name }))) {
      return;
    }
    try {
      await this.api.remove(client.id);
      this.toast.success(this.i18n.t('clients.deleted', { name: client.name }));
      this.res.reload();
    } catch (error) {
      this.toast.error(
        apiErrorMessage(error, this.i18n.t('clients.deleteFailed')),
      );
    }
  }
}
