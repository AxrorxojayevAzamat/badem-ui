import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormField,
  FormRoot,
  email,
  form,
  minLength,
  required,
} from '@angular/forms/signals';
import { apiErrorMessage } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { I18n, Lang } from '../../core/i18n/i18n';
import { FieldErrors } from '../../shared/field-errors';

interface Credentials {
  email: string;
  password: string;
}

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
  protected readonly i18n = inject(I18n);

  private readonly model = signal<Credentials>({ email: '', password: '' });

  protected readonly serverError = signal<string | null>(null);

  /**
   * Validation messages are passed as functions, not strings: signal forms
   * re-evaluates them reactively, so switching language updates the errors
   * already on screen.
   */
  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: () => this.i18n.t('validation.emailRequired') });
      email(path.email, { message: () => this.i18n.t('validation.email') });
      required(path.password, {
        message: () => this.i18n.t('validation.passwordRequired'),
      });
      minLength(path.password, 8, {
        message: () => this.i18n.t('validation.passwordMin'),
      });
    },
    {
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
              apiErrorMessage(error, this.i18n.t('auth.failed')),
            );
            return null;
          }
        },
      },
    },
  );

  protected onLanguage(event: Event) {
    this.i18n.setLang((event.target as HTMLSelectElement).value as Lang);
  }
}
