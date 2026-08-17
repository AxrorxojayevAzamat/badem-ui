import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { I18n } from '../../core/i18n/i18n';
import { Role } from '../../core/models';
import { Users } from '../../core/services/users';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface UserModel {
  email: string;
  fullName: string;
  password: string;
  role: Role;
  isActive: boolean;
}

@Component({
  selector: 'app-user-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './user-form.html',
})
export class UserForm {
  private readonly api = inject(Users);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  protected readonly roles: readonly Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

  private readonly model = signal<UserModel>({
    email: '',
    fullName: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true,
  });

  protected readonly userForm = form(
    this.model,
    (path) => {
      required(path.email, {
        message: () => this.i18n.t('validation.emailRequired'),
      });
      email(path.email, { message: () => this.i18n.t('validation.email') });
      required(path.fullName, {
        message: () => this.i18n.t('validation.fullNameRequired'),
      });
      minLength(path.fullName, 2, {
        message: () => this.i18n.t('validation.min2'),
      });
      maxLength(path.fullName, 120);
      required(path.password, {
        message: () => this.i18n.t('validation.passwordRequired'),
      });
      // bcrypt only hashes the first 72 bytes, which the API enforces too.
      minLength(path.password, 8, {
        message: () => this.i18n.t('validation.min8'),
      });
      maxLength(path.password, 72, {
        message: () => this.i18n.t('validation.max72'),
      });
    },
    {
      submission: {
        action: async (f) => {
          const payload = f().value();
          try {
            await this.api.create(payload);
            this.toast.success(
              this.i18n.t('userForm.created', { email: payload.email }),
            );
            await this.router.navigate(['/users']);
            return null;
          } catch (error) {
            // "email already exists" belongs on the email field.
            return serverError(
              error,
              f.email,
              this.i18n.t('validation.serverRejected'),
            );
          }
        },
      },
    },
  );

  protected cancel() {
    void this.router.navigate(['/users']);
  }
}
