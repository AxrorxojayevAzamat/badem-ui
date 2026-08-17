import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },

      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/supplier-list').then(
            (m) => m.SupplierList,
          ),
      },
      {
        path: 'suppliers/new',
        loadComponent: () =>
          import('./features/suppliers/supplier-form').then(
            (m) => m.SupplierForm,
          ),
      },
      {
        path: 'suppliers/:id',
        loadComponent: () =>
          import('./features/suppliers/supplier-form').then(
            (m) => m.SupplierForm,
          ),
      },

      {
        path: 'sources',
        loadComponent: () =>
          import('./features/sources/source-list').then((m) => m.SourceList),
      },
      {
        path: 'sources/new',
        loadComponent: () =>
          import('./features/sources/source-form').then((m) => m.SourceForm),
      },
      {
        path: 'sources/:id',
        loadComponent: () =>
          import('./features/sources/source-detail').then(
            (m) => m.SourceDetail,
          ),
      },
      {
        path: 'sources/:id/edit',
        loadComponent: () =>
          import('./features/sources/source-form').then((m) => m.SourceForm),
      },

      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/client-list').then((m) => m.ClientList),
      },
      {
        path: 'clients/new',
        loadComponent: () =>
          import('./features/clients/client-form').then((m) => m.ClientForm),
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/clients/client-form').then((m) => m.ClientForm),
      },

      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list').then((m) => m.ProductList),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-form').then((m) => m.ProductForm),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/products/product-form').then((m) => m.ProductForm),
      },

      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history-list').then((m) => m.HistoryList),
      },

      {
        path: 'employees',
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
        loadComponent: () =>
          import('./features/employees/employee-list').then(
            (m) => m.EmployeeList,
          ),
      },
      {
        path: 'employees/new',
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
        loadComponent: () =>
          import('./features/employees/employee-form').then(
            (m) => m.EmployeeForm,
          ),
      },
      {
        path: 'employees/:id',
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
        loadComponent: () =>
          import('./features/employees/employee-form').then(
            (m) => m.EmployeeForm,
          ),
      },

      {
        path: 'users',
        canActivate: [roleGuard('ADMIN', 'MANAGER')],
        loadComponent: () =>
          import('./features/users/user-list').then((m) => m.UserList),
      },
      {
        path: 'users/new',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/users/user-form').then((m) => m.UserForm),
      },

      {
        path: 'account',
        loadComponent: () =>
          import('./features/account/account').then((m) => m.Account),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
