import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE, apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { Employee, Paginated } from '../../core/models';
import { Employees } from '../../core/services/employees';
import { Toast } from '../../core/toast';
import { Paginator } from '../../shared/paginator';

@Component({
  selector: 'app-employee-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator, DecimalPipe],
  templateUrl: './employee-list.html',
})
export class EmployeeList {
  private readonly api = inject(Employees);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);

  protected readonly page = signal(1);
  protected readonly search = signal('');

  protected readonly res = httpResource<Paginated<Employee>>(() => ({
    url: `${API_BASE}/employees`,
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

  protected async remove(employee: Employee) {
    if (!confirm(`Delete employee "${employee.fullName}"?`)) return;
    try {
      await this.api.remove(employee.id);
      this.toast.success(`Employee "${employee.fullName}" deleted`);
      this.res.reload();
    } catch (error) {
      this.toast.error(apiErrorMessage(error, 'Could not delete employee'));
    }
  }
}
