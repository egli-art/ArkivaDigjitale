import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();
  private counter = 0;

  show(message: string, type: Toast['type'] = 'info') {
    const id = ++this.counter;
    const toast: Toast = { id, message, type };
    this._toasts$.next([...this._toasts$.value, toast]);
    setTimeout(() => this.remove(id), 3000);
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string)   { this.show(msg, 'error'); }

  private remove(id: number) {
    this._toasts$.next(this._toasts$.value.filter(t => t.id !== id));
  }
}
