import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree, ValidationError } from '@angular/forms/signals';

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

  readonly message = computed(() => describe(this.state().errors()[0]));
}

/** Signal-forms built-in errors carry a `kind`; messages are optional. */
export function describe(error: ValidationError | undefined): string {
  if (!error) return '';
  if (error.message) return error.message;
  switch (error.kind) {
    case 'required':
      return 'This field is required';
    case 'email':
      return 'Enter a valid email address';
    case 'min':
      return 'Value is too small';
    case 'max':
      return 'Value is too large';
    case 'minLength':
      return 'Too short';
    case 'maxLength':
      return 'Too long';
    case 'pattern':
      return 'Wrong format';
    default:
      return 'Invalid value';
  }
}
