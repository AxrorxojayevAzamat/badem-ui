/** Mirrors the entities and DTOs exposed by badem-api. */

export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type SourceHistoryAction =
  | 'RESTOCK'
  | 'PRODUCTION'
  | 'RETURN'
  | 'ADJUSTMENT';

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pageCount: number };
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface Auditable {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends Auditable {
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Employee extends Auditable {
  fullName: string;
  position: string;
  phone: string | null;
  address: string | null;
  salary: number;
  hiredAt: string | null;
  isActive: boolean;
  userId: string | null;
  user?: User | null;
}

export interface Supplier extends Auditable {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  isActive: boolean;
  sources?: Source[];
}

export interface Source extends Auditable {
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  description: string | null;
  isActive: boolean;
  supplierId: string;
  supplier?: Supplier;
}

export interface SourceHistory {
  id: string;
  sourceId: string;
  source?: Source;
  action: SourceHistoryAction;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  productId: string | null;
  product?: Product | null;
  userId: string | null;
  user?: User | null;
  note: string | null;
  createdAt: string;
}

export interface Client extends Auditable {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  company: string | null;
  isActive: boolean;
  products?: Product[];
}

export interface Product extends Auditable {
  name: string;
  sku: string | null;
  quantity: number;
  sourceUsage: number;
  totalSourceUsed: number;
  price: number;
  description: string | null;
  clientId: string;
  client?: Client;
  sourceId: string;
  source?: Source;
}

/** Query parameters accepted by the list endpoints. */
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  [param: string]: string | number | boolean | undefined;
}
