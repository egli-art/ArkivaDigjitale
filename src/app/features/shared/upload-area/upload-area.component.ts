import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-area',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-area" [class.dragover]="dragging"
         (dragover)="$event.preventDefault(); dragging=true"
         (dragleave)="dragging=false"
         (drop)="onDrop($event)">
      <input type="file" [accept]="accept" [multiple]="multiple" (change)="onFiles($event)" class="upload-input"/>
      <div class="upload-icon">{{ icon }}</div>
      <div class="upload-text">{{ label }}</div>
    </div>
    @if (previews.length) {
      <div class="upload-preview">
        @for (p of previews; track $index; let i = $index) {
          <div class="upload-preview-item">
            <img [src]="p" alt="preview"/>
            <span class="preview-remove" (click)="removePreview(i)">x</span>
          </div>
        }
      </div>
    }
  `
})
export class UploadAreaComponent {
  @Input() accept   = 'image/*';
  @Input() multiple = false;
  @Input() icon     = '📷';
  @Input() label    = 'Kliko ose zvarrit skedarin';
  @Output() filesSelected = new EventEmitter<File[]>();

  dragging  = false;
  previews: string[] = [];
  private selectedFiles: File[] = [];

  onFiles(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.process(files);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.process(files);
  }

  process(files: File[]): void {
    this.selectedFiles = files;
    this.previews = files.map(f => URL.createObjectURL(f));
    this.filesSelected.emit(files);
  }

  removePreview(i: number): void {
    this.selectedFiles.splice(i, 1);
    this.previews.splice(i, 1);
    this.filesSelected.emit([...this.selectedFiles]);
  }
}