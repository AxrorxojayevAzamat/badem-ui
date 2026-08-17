import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FieldTree, ValidationError } from '@angular/forms/signals';
import { apiErrorMessage } from '../core/api';

/**
 * Turns a failed API call into a signal-forms validation error.
 *
 * Returned from a `submit()` action, so a 409 "not enough stock" lands on the
 * field that caused it instead of in a disconnected alert box.
 */
export function serverError(
  error: unknown,
  fieldTree?: FieldTree<unknown>,
): ValidationError.WithOptionalFieldTree[] {
  return [
    {
      kind: 'server',
      message: apiErrorMessage(error, 'The server rejected this request'),
      ...(fieldTree ? { fieldTree } : {}),
    },
  ];
}

/**
 * Shows the errors attached to the form root — i.e. server errors that are not
 * about one specific field.
 *
 *   <form-error [form]="productForm" />
 */
@Component({
  selector: 'form-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (message(); as text) {
      <div class="alert error">{{ text }}</div>
    }
  `,
})
export class FormError {
  readonly form = input.required<FieldTree<unknown>>();

  readonly message = computed(() => {
    const errors = this.form()().errors();
    return errors.length > 0 ? (errors[0].message ?? 'Invalid form') : null;
  });
}
