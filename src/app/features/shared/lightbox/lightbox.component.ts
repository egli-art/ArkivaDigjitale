import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lightbox',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (src) {
      <div class="lightbox" (click)="close.emit()">
        <button class="lightbox-close" (click)="close.emit()">x</button>
        <img class="lightbox-img" [src]="src" [alt]="alt" (click)="$event.stopPropagation()"/>
      </div>
    }
  `
})
export class LightboxComponent {
  @Input() src  = '';
  @Input() alt  = '';
  @Output() close = new EventEmitter<void>();
}