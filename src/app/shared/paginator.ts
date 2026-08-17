import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Paginated } from '../core/models';
import { I18n } from '../core/i18n/i18n';

@Component({
  selector: 'paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      <div class="paginator">
        <span class="count">{{ i18n.t('common.records', { count: m.total }) }}</span>
        <div class="controls">
          <button
            type="button"
            class="btn ghost"
            [disabled]="m.page <= 1"
            (click)="pageChange.emit(m.page - 1)"
          >
            {{ i18n.t('common.previous') }}
          </button>
          <span class="page">
            {{ i18n.t('common.pageOf', { page: m.page, pages: pageCount() }) }}
          </span>
          <button
            type="button"
            class="btn ghost"
            [disabled]="m.page >= pageCount()"
            (click)="pageChange.emit(m.page + 1)"
          >
            {{ i18n.t('common.next') }}
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .paginator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0 0;
      flex-wrap: wrap;
    }
    .count,
    .page {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class Paginator {
  protected readonly i18n = inject(I18n);

  readonly result = input<Paginated<unknown> | undefined>();
  readonly pageChange = output<number>();

  readonly meta = computed(() => this.result()?.meta);
  readonly pageCount = computed(() => Math.max(this.meta()?.pageCount ?? 1, 1));
}
