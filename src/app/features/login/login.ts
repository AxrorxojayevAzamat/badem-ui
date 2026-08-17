import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormField,
  FormRoot,
  email,
  form,
  minLength,
  required,
  schema,
} from '@angular/forms/signals';
import { apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { FieldErrors } from '../../shared/field-errors';

interface Credentials {
  email: string;
  password: string;
}

/** Validation rules live in a schema, separate from the component. */
const credentialsSchema = schema<Credentials>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });
});

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  private readonly model = signal<Credentials>({ email: '', password: '' });

  protected readonly serverError = signal<string | null>(null);

  /**
   * The form is a field tree wrapped around the model signal. The submit
   * action lives on the form itself, so the `[formRoot]` directive on the
   * <form> element runs it — no (submit) handler and no preventDefault.
   */
  protected readonly loginForm = form(this.model, credentialsSchema, {
    submission: {
      action: async (f) => {
        this.serverError.set(null);
        try {
          await this.auth.login(f.email().value(), f.password().value());
          const redirect = new URLSearchParams(location.search).get('redirect');
          await this.router.navigateByUrl(redirect ?? '/dashboard');
          return null;
        } catch (error) {
          // Wrong credentials are a property of the pair, not of one field.
          this.serverError.set(
            apiErrorMessage(error, 'Could not sign in, please try again'),
          );
          return null;
        }
      },
    },
  });
}
