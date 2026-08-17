import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import { Auth } from '../../core/auth/auth';
import { I18n } from '../../core/i18n/i18n';
import { Users } from '../../core/services/users';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface PasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError, DatePipe],
  templateUrl: './account.html',
})
export class Account {
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);
  private readonly users = inject(Users);
  private readonly toast = inject(Toast);

  private readonly model = signal<PasswordModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(
    this.model,
    (path) => {
      required(path.currentPassword, {
        message: () => this.i18n.t('validation.currentPassword'),
      });
      required(path.newPassword, {
        message: () => this.i18n.t('validation.newPassword'),
      });
      minLength(path.newPassword, 8, {
        message: () => this.i18n.t('validation.min8'),
      });
      maxLength(path.newPassword, 72, {
        message: () => this.i18n.t('validation.max72'),
      });

      // Cross-field check: `ctx.valueOf` reads the sibling field reactively, so
      // the mismatch error clears as soon as either password changes.
      validate(path.confirmPassword, (ctx) =>
        ctx.value() && ctx.value() !== ctx.valueOf(path.newPassword)
          ? {
              kind: 'mismatch',
              message: this.i18n.t('validation.passwordMismatch'),
            }
          : null,
      );
    },
    {
      submission: {
        action: async (f) => {
          const { currentPassword, newPassword } = f().value();
          try {
            await this.users.changeOwnPassword(currentPassword, newPassword);
            this.toast.success(this.i18n.t('account.changed'));
            // The API drops the stored refresh token, so the session is over.
            await this.auth.logout();
            return null;
          } catch (error) {
            return serverError(
              error,
              f.currentPassword,
              this.i18n.t('validation.serverRejected'),
            );
          }
        },
      },
    },
  );
}
