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
  schema,
} from '@angular/forms/signals';
import { API_BASE, clean } from '../../core/api';
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

/** The built-in validators skip empty values, so optional fields need no guard. */
const supplierSchema = schema<SupplierModel>((path) => {
  required(path.name, { message: 'Supplier name is required' });
  minLength(path.name, 2, { message: 'At least 2 characters' });
  maxLength(path.name, 160);
  email(path.email, { message: 'Enter a valid email address' });
  maxLength(path.phone, 32);
  maxLength(path.address, 255);
});

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

  /** The submit action lives on the form; `[formRoot]` runs it. */
  protected readonly supplierForm = form(this.model, supplierSchema, {
    submission: {
      action: async (f) => {
        const payload = clean(f().value());
        try {
          const id = this.id();
          if (id) {
            await this.api.update(id, payload);
            this.toast.success(`Supplier "${payload.name}" updated`);
          } else {
            await this.api.create(payload);
            this.toast.success(`Supplier "${payload.name}" created`);
          }
          await this.router.navigate(['/suppliers']);
          return null;
        } catch (error) {
          return serverError(error);
        }
      },
    },
  });

  protected cancel() {
    void this.router.navigate(['/suppliers']);
  }
}
