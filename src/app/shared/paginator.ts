import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Paginated } from '../core/models';

@Component({
  selector: 'paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (meta(); as m) {
      <div class="paginator">
        <span class="count">
          {{ m.total }} {{ m.total === 1 ? 'record' : 'records' }}
        </span>
        <div class="controls">
          <button
            type="button"
            class="btn ghost"
            [disabled]="m.page <= 1"
            (click)="pageChange.emit(m.page - 1)"
          >
            Previous
          </button>
          <span class="page">Page {{ m.page }} of {{ pageCount() }}</span>
          <button
            type="button"
            class="btn ghost"
            [disabled]="m.page >= pageCount()"
            (click)="pageChange.emit(m.page + 1)"
          >
            Next
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
  readonly result = input<Paginated<unknown> | undefined>();
  readonly pageChange = output<number>();

  readonly meta = computed(() => this.result()?.meta);
  readonly pageCount = computed(() => Math.max(this.meta()?.pageCount ?? 1, 1));
}
