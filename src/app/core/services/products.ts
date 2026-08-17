import { Injectable } from '@angular/core';
import { CrudApi } from '../api';
import { Product } from '../models';

export interface ProductInput {
  name: string;
  sku?: string;
  quantity: number;
  sourceUsage?: number;
  price?: number;
  description?: string;
  clientId: string;
  sourceId: string;
}

@Injectable({ providedIn: 'root' })
export class Products extends CrudApi<Product, ProductInput> {
  protected readonly resource = 'products';
}
