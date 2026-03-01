import { Component, inject } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ToastService }      from '../../../core/services/toast.service';

@Component({
  selector:   'app-toast',
  standalone: true,
  imports:    [CommonModule],
  template: `
    <div class="toasts">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.type" (click)="toast.show('','info', 0)">
          <span class="ti">{{ t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ' }}</span>
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts {
      position: fixed; bottom: 1.75rem; right: 1.75rem;
      z-index: 9000; display: flex; flex-direction: column; gap: .6rem; pointer-events: none;
    }
    .toast {
      display: flex; align-items: flex-start; gap: .6rem;
      padding: .8rem 1.1rem;
      background: var(--ink-2); border: 1px solid var(--border); border-radius: var(--r-lg);
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
      max-width: 320px; font-size: .83rem; color: var(--cream-dim);
      animation: toastIn .3s var(--ease) both;
      pointer-events: all; cursor: pointer;

      &.success { border-color: rgba(109,191,114,.25); .ti { color: var(--success); } }
      &.error   { border-color: rgba(224,112,112,.25); .ti { color: var(--error);   } }
      &.info    { border-color: rgba(107,159,228,.25); .ti { color: var(--info);    } }
    }
    .ti { flex-shrink: 0; }
  `],
})
export class ToastComponent {
  toast = inject(ToastService);
}
