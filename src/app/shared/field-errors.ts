import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslationKey } from '../core/i18n/en';
import { I18n } from '../core/i18n/i18n';

/**
 * Renders the validation errors of a signal-forms field, but only once the
 * user has touched it (or the form has been submitted).
 *
 *   <field-errors [field]="form.email" />
 */
@Component({
  selector: 'field-errors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <p class="field-error">{{ message() }}</p>
    }
  `,
  styles: `
    .field-error {
      margin: 0.25rem 0 0;
      color: var(--danger);
      font-size: 0.8125rem;
    }
  `,
})
export class FieldErrors {
  private readonly i18n = inject(I18n);

  /**
   * Any field of a signal form, e.g. `form.email` or `form.quantity`.
   * `FieldTree<unknown>` is the API's own "some field" type — `FieldTree<any>`
   * would widen into the reactive-forms compat overload and stop matching.
   */
  readonly field = input.required<FieldTree<unknown>>();

  private readonly state = computed(() => this.field()());

  readonly visible = computed(() => {
    const state = this.state();
    return state.touched() && state.errors().length > 0;
  });

  /**
   * Validators built in this app pass an already-translated `message`. Only
   * the framework's own errors fall back to a key lookup here.
   */
  readonly message = computed(() => {
    const error = this.state().errors()[0];
    if (!error) return '';
    if (error.message) return error.message;
    return this.i18n.t(BUILT_IN[error.kind] ?? 'validation.invalid');
  });
}

const BUILT_IN: Record<string, TranslationKey> = {
  required: 'validation.required',
  email: 'validation.email',
  min: 'validation.min',
  max: 'validation.max',
  minLength: 'validation.minLength',
  maxLength: 'validation.maxLength',
  pattern: 'validation.pattern',
};
