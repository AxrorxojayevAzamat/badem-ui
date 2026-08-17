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
  schema,
} from '@angular/forms/signals';
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

const userSchema = schema<UserModel>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  required(path.fullName, { message: 'Full name is required' });
  minLength(path.fullName, 2, { message: 'At least 2 characters' });
  maxLength(path.fullName, 120);
  required(path.password, { message: 'Password is required' });
  // bcrypt only hashes the first 72 bytes, which the API enforces too.
  minLength(path.password, 8, { message: 'At least 8 characters' });
  maxLength(path.password, 72, { message: 'At most 72 characters' });
});

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

  protected readonly roles: readonly Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

  private readonly model = signal<UserModel>({
    email: '',
    fullName: '',
    password: '',
    role: 'EMPLOYEE',
    isActive: true,
  });

  protected readonly userForm = form(this.model, userSchema, {
    submission: {
      action: async (f) => {
        const payload = f().value();
        try {
          await this.api.create(payload);
          this.toast.success(`Account ${payload.email} created`);
          await this.router.navigate(['/users']);
          return null;
        } catch (error) {
          // "email already exists" belongs on the email field.
          return serverError(error, f.email);
        }
      },
    },
  });

  protected cancel() {
    void this.router.navigate(['/users']);
  }
}
