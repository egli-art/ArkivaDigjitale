import { Component, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgFor } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgClass],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toast.toasts$ | async"
           class="toast"
           [ngClass]="t.type">
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      z-index: 9000;
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .toast {
      padding: 0.75rem 1.25rem;
      background: var(--navy-light);
      border: 1px solid var(--gold-border);
      border-radius: var(--r);
      font-size: 0.85rem;
      color: var(--white);
      max-width: 300px;
      animation: slideToast 0.3s var(--ease) both;
    }
    .toast.success { border-color: rgba(112,201,122,0.35); color: var(--success); }
    .toast.error   { border-color: rgba(224,112,112,0.35); color: var(--error); }
    @keyframes slideToast {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: none; }
    }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}
