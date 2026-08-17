import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { I18n } from '../../core/i18n/i18n';
import { Paginated, User } from '../../core/models';
import { Users } from '../../core/services/users';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator, DatePipe],
  templateUrl: './user-list.html',
})
export class UserList {
  private readonly api = inject(Users);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);

  protected readonly page = signal(1);
  protected readonly search = signal('');

  protected readonly res = httpResource<Paginated<User>>(() => ({
    url: `${API_BASE}/users`,
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

  protected async toggleActive(user: User) {
    try {
      await this.api.update(user.id, { isActive: !user.isActive });
      this.toast.success(
        user.isActive
          ? this.i18n.t('users.wasDisabled', { email: user.email })
          : this.i18n.t('users.enabled', { email: user.email }),
      );
      this.res.reload();
    } catch (error) {
      this.toast.error(
        apiErrorMessage(error, this.i18n.t('users.updateFailed')),
      );
    }
  }

  protected async remove(user: User) {
    if (!confirm(this.i18n.t('users.confirmDelete', { email: user.email }))) {
      return;
    }
    try {
      await this.api.remove(user.id);
      this.toast.success(this.i18n.t('users.deleted', { email: user.email }));
      this.res.reload();
    } catch (error) {
      this.toast.error(
        apiErrorMessage(error, this.i18n.t('users.deleteFailed')),
      );
    }
  }
}
