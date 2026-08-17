import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class Toast {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(text: string) {
    this.push(text, 'success');
  }

  error(text: string) {
    this.push(text, 'error');
  }

  info(text: string) {
    this.push(text, 'info');
  }

  dismiss(id: number) {
    this.messages.update((all) => all.filter((m) => m.id !== id));
  }

  private push(text: string, tone: ToastMessage['tone']) {
    const id = this.nextId++;
    this.messages.update((all) => [...all, { id, text, tone }]);
    setTimeout(() => this.dismiss(id), tone === 'error' ? 6000 : 3500);
  }
}
