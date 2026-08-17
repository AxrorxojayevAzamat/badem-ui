import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { Auth } from '../../core/auth/auth';
import { Users } from '../../core/services/users';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface PasswordModel {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const passwordSchema = schema<PasswordModel>((path) => {
  required(path.currentPassword, { message: 'Enter your current password' });
  required(path.newPassword, { message: 'Choose a new password' });
  minLength(path.newPassword, 8, { message: 'At least 8 characters' });
  maxLength(path.newPassword, 72, { message: 'At most 72 characters' });

  // Cross-field check: `ctx.valueOf` reads the sibling field reactively, so the
  // mismatch error clears as soon as either password changes.
  validate(path.confirmPassword, (ctx) =>
    ctx.value() && ctx.value() !== ctx.valueOf(path.newPassword)
      ? { kind: 'mismatch', message: 'The two passwords do not match' }
      : null,
  );
});

@Component({
  selector: 'app-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError, DatePipe],
  templateUrl: './account.html',
})
export class Account {
  protected readonly auth = inject(Auth);
  private readonly users = inject(Users);
  private readonly toast = inject(Toast);

  private readonly model = signal<PasswordModel>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  protected readonly passwordForm = form(this.model, passwordSchema, {
    submission: {
      action: async (f) => {
        const { currentPassword, newPassword } = f().value();
        try {
          await this.users.changeOwnPassword(currentPassword, newPassword);
          this.toast.success('Password changed — please sign in again');
          // The API drops the stored refresh token, so the session is over.
          await this.auth.logout();
          return null;
        } catch (error) {
          return serverError(error, f.currentPassword);
        }
      },
    },
  });
}
