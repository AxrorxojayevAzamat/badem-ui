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
  email,
  form,
  maxLength,
  minLength,
  required,
} from '@angular/forms/signals';
import { API_BASE, clean } from '../../core/api';
import { I18n } from '../../core/i18n/i18n';
import { Supplier } from '../../core/models';
import { Suppliers } from '../../core/services/suppliers';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface SupplierModel {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  isActive: boolean;
}

const empty: SupplierModel = {
  name: '',
  phone: '',
  email: '',
  address: '',
  taxNumber: '',
  isActive: true,
};

@Component({
  selector: 'app-supplier-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './supplier-form.html',
})
export class SupplierForm {
  /** Bound from the `:id` route parameter (withComponentInputBinding). */
  readonly id = input<string>();

  private readonly api = inject(Suppliers);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  private readonly existing = httpResource<Supplier>(() =>
    this.id() ? `${API_BASE}/suppliers/${this.id()}` : undefined,
  );

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = computed(() => this.existing.isLoading());

  /**
   * `linkedSignal` keeps the model in sync with the loaded entity: it starts
   * empty, then resets to the server values once they arrive — and stays
   * writable so the form can edit it.
   */
  protected readonly model = linkedSignal<Supplier | undefined, SupplierModel>({
    source: () => this.existing.value(),
    computation: (supplier) =>
      supplier
        ? {
            name: supplier.name,
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
            taxNumber: supplier.taxNumber ?? '',
            isActive: supplier.isActive,
          }
        : empty,
  });

  /** The built-in validators skip empty values, so optional fields need no guard. */
  protected readonly supplierForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: () => this.i18n.t('validation.supplierNameRequired'),
      });
      minLength(path.name, 2, { message: () => this.i18n.t('validation.min2') });
      maxLength(path.name, 160);
      email(path.email, { message: () => this.i18n.t('validation.email') });
      maxLength(path.phone, 32);
      maxLength(path.address, 255);
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
                this.i18n.t('supplierForm.updated', { name: payload.name }),
              );
            } else {
              await this.api.create(payload);
              this.toast.success(
                this.i18n.t('supplierForm.created', { name: payload.name }),
              );
            }
            await this.router.navigate(['/suppliers']);
            return null;
          } catch (error) {
            return serverError(
              error,
              undefined,
              this.i18n.t('validation.serverRejected'),
            );
          }
        },
      },
    },
  );

  protected cancel() {
    void this.router.navigate(['/suppliers']);
  }
}
