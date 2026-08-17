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
  debounce,
  form,
  maxLength,
  min,
  minLength,
  required,
  validate,
  validateHttp,
} from '@angular/forms/signals';
import { API_BASE, clean } from '../../core/api';
import { I18n } from '../../core/i18n/i18n';
import { Client, Paginated, Product, Source } from '../../core/models';
import { Products } from '../../core/services/products';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface ProductModel {
  name: string;
  sku: string;
  quantity: number;
  sourceUsage: number;
  price: number;
  description: string;
  clientId: string;
  sourceId: string;
}

const empty: ProductModel = {
  name: '',
  sku: '',
  quantity: 0,
  sourceUsage: 1,
  price: 0,
  description: '',
  clientId: '',
  sourceId: '',
};

@Component({
  selector: 'app-product-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  readonly id = input<string>();

  private readonly api = inject(Products);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  private readonly existing = httpResource<Product>(() =>
    this.id() ? `${API_BASE}/products/${this.id()}` : undefined,
  );

  private readonly clientsRes = httpResource<Paginated<Client>>(() => ({
    url: `${API_BASE}/clients`,
    params: { page: 1, limit: 100 },
  }));

  private readonly sourcesRes = httpResource<Paginated<Source>>(() => ({
    url: `${API_BASE}/sources`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly clients = computed(() => this.clientsRes.value()?.data ?? []);
  protected readonly sources = computed(() => this.sourcesRes.value()?.data ?? []);

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = computed(() => this.existing.isLoading());

  protected readonly model = linkedSignal<Product | undefined, ProductModel>({
    source: () => this.existing.value(),
    computation: (product) =>
      product
        ? {
            name: product.name,
            sku: product.sku ?? '',
            quantity: product.quantity,
            sourceUsage: product.sourceUsage,
            price: product.price,
            description: product.description ?? '',
            clientId: product.clientId,
            sourceId: product.sourceId,
          }
        : empty,
  });

  protected readonly selectedSource = computed(() =>
    this.sources().find((source) => source.id === this.model().sourceId),
  );

  /**
   * How much of the source this batch may consume. When editing, the amount
   * this product already booked is available again — the API re-settles the
   * difference rather than charging the whole batch twice.
   */
  protected readonly availableStock = computed(() => {
    const source = this.selectedSource();
    if (!source) return null;
    const product = this.existing.value();
    const alreadyBooked =
      product && product.sourceId === source.id ? product.totalSourceUsed : 0;
    return round3(source.quantity + alreadyBooked);
  });

  protected readonly totalNeeded = computed(() => {
    const { quantity, sourceUsage } = this.model();
    return round3((quantity || 0) * (sourceUsage || 0));
  });

  protected readonly remainingAfter = computed(() => {
    const available = this.availableStock();
    return available === null ? null : round3(available - this.totalNeeded());
  });

  protected readonly productForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: () => this.i18n.t('validation.productNameRequired'),
      });
      minLength(path.name, 2, { message: () => this.i18n.t('validation.min2') });
      maxLength(path.name, 160);
      maxLength(path.sku, 64);
      required(path.clientId, {
        message: () => this.i18n.t('validation.chooseClient'),
      });
      required(path.sourceId, {
        message: () => this.i18n.t('validation.chooseSource'),
      });
      min(path.quantity, 0.001, {
        message: () => this.i18n.t('validation.quantityPositive'),
      });
      min(path.sourceUsage, 0.001, {
        message: () => this.i18n.t('validation.usagePositive'),
      });
      min(path.price, 0, {
        message: () => this.i18n.t('validation.priceNegative'),
      });
      maxLength(path.description, 255);

      // Cross-field rule mirroring the API: a batch cannot consume more than the
      // source holds. `ctx.valueOf` reads sibling fields reactively, so the error
      // appears (and clears) as soon as any of the three inputs changes.
      validate(path.quantity, (ctx) => {
        const quantity = ctx.value();
        const usage = ctx.valueOf(path.sourceUsage);
        const available = this.availableStock();
        const source = this.selectedSource();
        if (!source || available === null || !quantity || !usage) return null;

        const needed = round3(quantity * usage);
        if (needed > available) {
          return {
            kind: 'insufficientStock',
            message: this.i18n.t('validation.insufficientStock', {
              available,
              needed,
              unit: source.unit,
              name: source.name,
            }),
          };
        }
        return null;
      });

      // Don't hammer the API on every keystroke.
      debounce(path.sku, 400);

      // Async uniqueness check against the products endpoint.
      validateHttp(path.sku, {
        request: (ctx) => {
          const sku = ctx.value().trim();
          return sku
            ? { url: `${API_BASE}/products`, params: { search: sku, limit: 20 } }
            : undefined;
        },
        onSuccess: (result: Paginated<Product>, ctx) => {
          const sku = ctx.value().trim().toLowerCase();
          const taken = result.data.some(
            (product) =>
              (product.sku ?? '').toLowerCase() === sku && product.id !== this.id(),
          );
          return taken
            ? {
                kind: 'skuTaken',
                message: this.i18n.t('validation.skuTaken', { sku: ctx.value() }),
              }
            : null;
        },
        // A failed lookup must not block the form; the API enforces this anyway.
        onError: () => null,
      });
    },
    {
      submission: {
        action: async (f) => {
          const value = f().value();
          try {
            const id = this.id();
            if (id) {
              await this.api.update(id, clean(value));
              this.toast.success(
                this.i18n.t('productForm.updated', { name: value.name }),
              );
            } else {
              const created = await this.api.create(clean(value));
              this.toast.success(
                this.i18n.t('productForm.created', {
                  quantity: created.quantity,
                  name: created.name,
                  used: created.totalSourceUsed,
                  unit: this.selectedSource()?.unit ?? '',
                }),
              );
            }
            await this.router.navigate(['/products']);
            return null;
          } catch (error) {
            // A 409 from the stock check belongs on the quantity field.
            return serverError(
              error,
              f.quantity,
              this.i18n.t('validation.serverRejected'),
            );
          }
        },
      },
    },
  );

  protected cancel() {
    void this.router.navigate(['/products']);
  }
}

const round3 = (value: number) => Number(value.toFixed(3));
