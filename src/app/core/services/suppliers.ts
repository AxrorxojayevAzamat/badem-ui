import { Injectable } from '@angular/core';
import { CrudApi } from '../api';
import { Supplier } from '../models';

export interface SupplierInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class Suppliers extends CrudApi<Supplier, SupplierInput> {
  protected readonly resource = 'suppliers';
}
