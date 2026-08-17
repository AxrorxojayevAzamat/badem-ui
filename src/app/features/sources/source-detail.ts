import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  min,
  required,
} from '@angular/forms/signals';
import { API_BASE } from '../../core/api';
import { Auth } from '../../core/auth/auth';
import { I18n } from '../../core/i18n/i18n';
import {
  Paginated,
  Source,
  SourceHistory,
  SourceHistoryAction,
} from '../../core/models';
import { Sources } from '../../core/services/sources';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { Paginator } from '../../shared/paginator';
import { FormError, serverError } from '../../shared/form-utils';

interface StockModel {
  quantity: number;
  note: string;
}

@Component({
  selector: 'app-source-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormField,
    FormRoot,
    FieldErrors,
    FormError,
    Paginator,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './source-detail.html',
  styleUrl: './source-detail.scss',
})
export class SourceDetail {
  readonly id = input.required<string>();

  private readonly api = inject(Sources);
  private readonly toast = inject(Toast);
  protected readonly auth = inject(Auth);
  protected readonly i18n = inject(I18n);

  protected readonly sourceRes = httpResource<Source>(
    () => `${API_BASE}/sources/${this.id()}`,
  );

  protected readonly historyPage = signal(1);
  protected readonly historyRes = httpResource<Paginated<SourceHistory>>(() => ({
    url: `${API_BASE}/sources/${this.id()}/history`,
    params: { page: this.historyPage(), limit: 15 },
  }));

  protected readonly source = computed(() => this.sourceRes.value());
  protected readonly history = computed(
    () => this.historyRes.value()?.data ?? [],
  );
  protected readonly isLow = computed(() => {
    const source = this.source();
    return source ? source.quantity <= source.minQuantity : false;
  });

  private readonly restockModel = signal<StockModel>({ quantity: 0, note: '' });
  protected readonly restockForm = form(
    this.restockModel,
    (path) => {
      required(path.quantity, {
        message: () => this.i18n.t('validation.enterAmount'),
      });
      min(path.quantity, 0.001, {
        message: () => this.i18n.t('validation.greaterThanZero'),
      });
      maxLength(path.note, 255);
    },
    {
      submission: {
        action: async (f) => {
          const { quantity, note } = f().value();
          try {
            const updated = await this.api.restock(
              this.id(),
              quantity,
              note || undefined,
            );
            this.toast.success(
              this.i18n.t('sourceDetail.restocked', {
                quantity,
                unit: updated.unit,
                total: updated.quantity,
              }),
            );
            this.restockModel.set({ quantity: 0, note: '' });
            // Also clear touched/dirty, otherwise the emptied field
            // immediately shows "must be greater than zero" after a save.
            this.restockForm().reset();
            this.reload();
            return null;
          } catch (error) {
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

  private readonly adjustModel = signal<StockModel>({ quantity: 0, note: '' });
  protected readonly adjustForm = form(
    this.adjustModel,
    (path) => {
      required(path.quantity, {
        message: () => this.i18n.t('validation.enterCounted'),
      });
      min(path.quantity, 0, {
        message: () => this.i18n.t('validation.stockNegative'),
      });
      maxLength(path.note, 255);
    },
    {
      submission: {
        action: async (f) => {
          const { quantity, note } = f().value();
          try {
            const updated = await this.api.adjust(
              this.id(),
              quantity,
              note || undefined,
            );
            this.toast.success(
              this.i18n.t('sourceDetail.corrected', {
                total: updated.quantity,
                unit: updated.unit,
              }),
            );
            this.adjustModel.set({ quantity: 0, note: '' });
            this.adjustForm().reset();
            this.reload();
            return null;
          } catch (error) {
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

  protected actionLabel(action: SourceHistoryAction): string {
    return this.i18n.t(`history.action.${action}`);
  }

  private reload() {
    this.sourceRes.reload();
    this.historyRes.reload();
  }
}
