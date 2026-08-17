import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth/auth';
import { TranslationKey } from '../core/i18n/en';
import { I18n, Lang } from '../core/i18n/i18n';

interface NavItem {
  path: string;
  label: TranslationKey;
  roles?: readonly ('ADMIN' | 'MANAGER' | 'EMPLOYEE')[];
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);

  private readonly items: readonly NavItem[] = [
    { path: '/dashboard', label: 'nav.dashboard' },
    { path: '/products', label: 'nav.products' },
    { path: '/sources', label: 'nav.sources' },
    { path: '/history', label: 'nav.history' },
    { path: '/suppliers', label: 'nav.suppliers' },
    { path: '/clients', label: 'nav.clients' },
    { path: '/employees', label: 'nav.employees', roles: ['ADMIN', 'MANAGER'] },
    { path: '/users', label: 'nav.users', roles: ['ADMIN', 'MANAGER'] },
  ];

  protected readonly nav = computed(() =>
    this.items.filter((item) => !item.roles || this.auth.can(...item.roles)),
  );

  protected readonly initials = computed(() => {
    const name = this.auth.user()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  });

  protected onLanguage(event: Event) {
    this.i18n.setLang((event.target as HTMLSelectElement).value as Lang);
  }

  protected logout() {
    void this.auth.logout();
  }
}
