import { Injectable } from '@angular/core';
import { CrudApi } from '../api';
import { Employee } from '../models';

export interface EmployeeInput {
  fullName: string;
  position: string;
  phone?: string;
  address?: string;
  salary?: number;
  hiredAt?: string;
  userId?: string;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class Employees extends CrudApi<Employee, EmployeeInput> {
  protected readonly resource = 'employees';
}
