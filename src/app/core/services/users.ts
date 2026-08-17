import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CrudApi } from '../api';
import { Role, User } from '../models';

export interface UserInput {
  email: string;
  fullName: string;
  password: string;
  role?: Role;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class Users extends CrudApi<User, UserInput> {
  protected readonly resource = 'users';

  changeOwnPassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    return firstValueFrom(
      this.http.patch<void>(`${this.url}/me/password`, {
        currentPassword,
        newPassword,
      }),
    );
  }
}
