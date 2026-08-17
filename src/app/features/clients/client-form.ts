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
import { Client } from '../../core/models';
import { Clients } from '../../core/services/clients';
import { Toast } from '../../core/toast';
import { FieldErrors } from '../../shared/field-errors';
import { FormError, serverError } from '../../shared/form-utils';

interface ClientModel {
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
}

const empty: ClientModel = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  isActive: true,
};

@Component({
  selector: 'app-client-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, FormRoot, FieldErrors, FormError],
  templateUrl: './client-form.html',
})
export class ClientForm {
  readonly id = input<string>();

  private readonly api = inject(Clients);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);
  protected readonly i18n = inject(I18n);

  private readonly existing = httpResource<Client>(() =>
    this.id() ? `${API_BASE}/clients/${this.id()}` : undefined,
  );

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly loading = computed(() => this.existing.isLoading());

  protected readonly model = linkedSignal<Client | undefined, ClientModel>({
    source: () => this.existing.value(),
    computation: (client) =>
      client
        ? {
            name: client.name,
            company: client.company ?? '',
            phone: client.phone ?? '',
            email: client.email ?? '',
            address: client.address ?? '',
            isActive: client.isActive,
          }
        : empty,
  });

  protected readonly clientForm = form(
    this.model,
    (path) => {
      required(path.name, {
        message: () => this.i18n.t('validation.clientNameRequired'),
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
                this.i18n.t('clientForm.updated', { name: payload.name }),
              );
            } else {
              await this.api.create(payload);
              this.toast.success(
                this.i18n.t('clientForm.created', { name: payload.name }),
              );
            }
            await this.router.navigate(['/clients']);
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
    void this.router.navigate(['/clients']);
  }
}
