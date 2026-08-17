import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CrudApi, toParams } from '../api';
import { ListQuery, Paginated, Source, SourceHistory } from '../models';

export interface SourceInput {
  name: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  pricePerUnit?: number;
  description?: string;
  supplierId: string;
  isActive?: boolean;
}

/** `quantity` is not part of the update payload — stock only moves through
 *  restock/adjust or product production, so the ledger stays complete. */
export type SourceUpdate = Partial<Omit<SourceInput, 'quantity'>>;

@Injectable({ providedIn: 'root' })
export class Sources extends CrudApi<Source, SourceInput, SourceUpdate> {
  protected readonly resource = 'sources';

  restock(id: string, quantity: number, note?: string): Promise<Source> {
    return firstValueFrom(
      this.http.post<Source>(`${this.url}/${id}/restock`, { quantity, note }),
    );
  }

  adjust(id: string, quantity: number, note?: string): Promise<Source> {
    return firstValueFrom(
      this.http.post<Source>(`${this.url}/${id}/adjust`, { quantity, note }),
    );
  }

  history(id: string, query: ListQuery = {}): Promise<Paginated<SourceHistory>> {
    return firstValueFrom(
      this.http.get<Paginated<SourceHistory>>(`${this.url}/${id}/history`, {
        params: toParams(query),
      }),
    );
  }
}
