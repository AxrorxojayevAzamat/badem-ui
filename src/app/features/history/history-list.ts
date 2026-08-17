import { DatePipe, DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE } from '../../core/api';
import { I18n } from '../../core/i18n/i18n';
import {
  Paginated,
  Source,
  SourceHistory,
  SourceHistoryAction,
} from '../../core/models';
import { Paginator } from '../../shared/paginator';

const ACTIONS: readonly SourceHistoryAction[] = [
  'RESTOCK',
  'PRODUCTION',
  'RETURN',
  'ADJUSTMENT',
];

@Component({
  selector: 'app-history-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Paginator, DecimalPipe, DatePipe],
  templateUrl: './history-list.html',
})
export class HistoryList {
  protected readonly i18n = inject(I18n);
  protected readonly actions = ACTIONS;

  protected readonly page = signal(1);
  protected readonly sourceId = signal('');
  protected readonly action = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');

  protected readonly res = httpResource<Paginated<SourceHistory>>(() => ({
    url: `${API_BASE}/source-history`,
    params: {
      page: this.page(),
      limit: 25,
      ...(this.sourceId() ? { sourceId: this.sourceId() } : {}),
      ...(this.action() ? { action: this.action() } : {}),
      ...(this.from() ? { from: this.from() } : {}),
      ...(this.to() ? { to: this.to() } : {}),
    },
  }));

  private readonly sourcesRes = httpResource<Paginated<Source>>(() => ({
    url: `${API_BASE}/sources`,
    params: { page: 1, limit: 100 },
  }));

  protected readonly rows = computed(() => this.res.value()?.data ?? []);
  protected readonly sources = computed(() => this.sourcesRes.value()?.data ?? []);

  protected setFilter(target: 'sourceId' | 'action' | 'from' | 'to', event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this[target].set(value);
    this.page.set(1);
  }

  protected actionLabel(action: SourceHistoryAction): string {
    return this.i18n.t(`history.action.${action}`);
  }

  protected badgeClass(action: SourceHistoryAction): string {
    switch (action) {
      case 'RESTOCK':
        return 'green';
      case 'PRODUCTION':
        return 'red';
      case 'RETURN':
        return 'green';
      default:
        return 'amber';
    }
  }
}
