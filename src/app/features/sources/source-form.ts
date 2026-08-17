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
  disabled,
  form,
  maxLength,
  min,
  minLength,
  required,
} from '@angular/forms/signals';
import { API_BASE, clean } from '../../core/api';
import { I18n } from '../../core/i18n/i18n';
import { Paginated, Source, Supplier } from '../../core/models';
import { Sources } from '../../core/services/sources';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface SourceModel {
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  description: string;
  supplierId: string;
  isActive: boolean;
}

const empty: SourceModel = {
  name: '',
  unit: 'kg',
  quantity: 0,
  minQuantity: 0,
  pricePerUnit: 0,
  description: '',
  supplierId: '',
  isActive: true,
};

@Component({
  selector: 'app-source-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './source-form.html',
})
export class SourceForm {
  readonly id = input<string>();

  private readonly api = inject(Sources);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  private readonly existing = httpResource<Source>(() =>
    this.id() ? `${API_BASE}/sources/${this.id()}` : undefined,
  );

  private readonly suppliersRes = httpResource<Paginated<Supplier>>(() => ({
    url: `${API_BASE}/suppliers`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly suppliers = computed(
    () => this.suppliersRes.value()?.data ?? [],
  );
  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = computed(() => this.existing.isLoading());

  protected readonly model = linkedSignal<Source | undefined, SourceModel>({
    source: () => this.existing.value(),
    computation: (source) =>
      source
        ? {
            name: source.name,
            unit: source.unit,
            quantity: source.quantity,
            minQuantity: source.minQuantity,
            pricePerUnit: source.pricePerUnit,
            description: source.description ?? '',
            supplierId: source.supplierId,
            isActive: source.isActive,
          }
        : empty,
  });

  /**
   * The schema is declared inline so its logic can read component signals —
   * here `isEdit()` disables the opening-stock field, because an existing
   * source only changes through restock/adjust/production.
   */
  protected readonly sourceForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: () => this.i18n.t('validation.sourceNameRequired'),
      });
      minLength(path.name, 2, { message: () => this.i18n.t('validation.min2') });
      maxLength(path.name, 160);
      required(path.unit, {
        message: () => this.i18n.t('validation.unitRequired'),
      });
      maxLength(path.unit, 16);
      required(path.supplierId, {
        message: () => this.i18n.t('validation.chooseSupplier'),
      });
      min(path.quantity, 0, {
        message: () => this.i18n.t('validation.stockNegative'),
      });
      min(path.minQuantity, 0, {
        message: () => this.i18n.t('validation.minimumNegative'),
      });
      min(path.pricePerUnit, 0, {
        message: () => this.i18n.t('validation.priceNegative'),
      });
      maxLength(path.description, 255);

      disabled(path.quantity, () =>
        this.isEdit() ? this.i18n.t('sourceForm.stockLocked') : false,
      );
    },
    {
      submission: {
        action: async (f) => {
          const value = f().value();
          try {
            const id = this.id();
            if (id) {
              // `quantity` is deliberately not part of the update payload.
              const { quantity: _stock, ...rest } = value;
              await this.api.update(id, clean(rest));
              this.toast.success(
                this.i18n.t('sourceForm.updated', { name: value.name }),
              );
            } else {
              await this.api.create(clean(value));
              this.toast.success(
                this.i18n.t('sourceForm.created', { name: value.name }),
              );
            }
            await this.router.navigate(['/sources']);
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

  protected readonly quantityDisabledReason = computed(
    () => this.sourceForm.quantity().disabledReasons()[0]?.message ?? null,
  );

  protected cancel() {
    void this.router.navigate(['/sources']);
  }
}
