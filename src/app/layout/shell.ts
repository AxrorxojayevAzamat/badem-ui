import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../core/auth/auth';

interface NavItem {
  path: string;
  label: string;
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

  private readonly items: readonly NavItem[] = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/products', label: 'Products' },
    { path: '/sources', label: 'Sources' },
    { path: '/history', label: 'Stock history' },
    { path: '/suppliers', label: 'Suppliers' },
    { path: '/clients', label: 'Clients' },
    { path: '/employees', label: 'Employees', roles: ['ADMIN', 'MANAGER'] },
    { path: '/users', label: 'Users', roles: ['ADMIN', 'MANAGER'] },
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

  protected logout() {
    void this.auth.logout();
  }
}
