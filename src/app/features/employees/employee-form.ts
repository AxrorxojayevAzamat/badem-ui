import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { API_BASE, clean } from '../../core/api';
import { I18n } from '../../core/i18n/i18n';
import { Employee, Paginated, User } from '../../core/models';
import { Employees } from '../../core/services/employees';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface EmployeeModel {
  fullName: string;
  position: string;
  phone: string;
  address: string;
  salary: number;
  hiredAt: string;
  userId: string;
  isActive: boolean;
}

const empty: EmployeeModel = {
  fullName: '',
  position: '',
  phone: '',
  address: '',
  salary: 0,
  hiredAt: '',
  userId: '',
  isActive: true,
};

@Component({
  selector: 'app-employee-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './employee-form.html',
})
export class EmployeeForm {
  readonly id = input<string>();

  private readonly api = inject(Employees);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  private readonly existing = httpResource<Employee>(() =>
    this.id() ? `${API_BASE}/employees/${this.id()}` : undefined,
  );

  private readonly usersRes = httpResource<Paginated<User>>(() => ({
    url: `${API_BASE}/users`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly users = computed(() => this.usersRes.value()?.data ?? []);
  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = computed(() => this.existing.isLoading());

  protected readonly model = linkedSignal<Employee | undefined, EmployeeModel>({
    source: () => this.existing.value(),
    computation: (employee) =>
      employee
        ? {
            fullName: employee.fullName,
            position: employee.position,
            phone: employee.phone ?? '',
            address: employee.address ?? '',
            salary: employee.salary,
            hiredAt: employee.hiredAt ?? '',
            userId: employee.userId ?? '',
            isActive: employee.isActive,
          }
        : empty,
  });

  protected readonly employeeForm = form(
    this.model,
    (path) => {
      required(path.fullName, {
        message: () => this.i18n.t('validation.fullNameRequired'),
      });
      minLength(path.fullName, 2, {
        message: () => this.i18n.t('validation.min2'),
      });
      maxLength(path.fullName, 120);
      required(path.position, {
        message: () => this.i18n.t('validation.positionRequired'),
      });
      maxLength(path.position, 120);
      maxLength(path.phone, 32);
      maxLength(path.address, 255);
      min(path.salary, 0, {
        message: () => this.i18n.t('validation.salaryNegative'),
      });
    },
    {
      submission: {
        action: async (f) => {
          const payload = clean(f().value());
          try {
            const id = this.id();
            if (id) {
              await this.api.update(id, payload);
              this.toast.success(
                this.i18n.t('employeeForm.updated', { name: payload.fullName }),
              );
            } else {
              await this.api.create(payload);
              this.toast.success(
                this.i18n.t('employeeForm.created', { name: payload.fullName }),
              );
            }
            await this.router.navigate(['/employees']);
            return null;
          } catch (error) {
            // "user already linked to another employee" belongs on that field.
            return serverError(
              error,
              f.userId,
              this.i18n.t('validation.serverRejected'),
            );
          }
        },
      },
    },
  );

  protected cancel() {
    void this.router.navigate(['/employees']);
  }
}
