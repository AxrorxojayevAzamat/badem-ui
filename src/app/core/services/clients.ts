import { Injectable } from '@angular/core';
import { CrudApi } from '../api';
import { Client } from '../models';

export interface ClientInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class Clients extends CrudApi<Client, ClientInput> {
  protected readonly resource = 'clients';
}
