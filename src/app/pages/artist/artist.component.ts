import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ArtistsService } from '../../core/services/artists.service';
import { AuthService }    from '../../core/services/auth.service';
import { ToastService }   from '../../core/services/toast.service';
import { Artist, Work, ALBANIA_CITIES, ARTIST_TYPES } from '../../core/models';

@Component({
  selector:    'app-artist',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './artist.component.html',
  styleUrl:    './artist.component.scss',
})
export class ArtistComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc   = inject(ArtistsService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  artist       = signal<Artist | null>(null);
  works        = signal<Work[]>([]);
  loading      = signal(true);
  worksLoading = signal(false);
  cityName     = signal('');

  /* Lightbox */
  lbImages = signal<string[]>([]);
  lbIndex  = signal(0);

  /* Edit artist */
  showEdit = signal(false);
  editSaving = signal(false);
  editForm = { emri: '', mbiemri: '', lloji: '', lindja: '', bio: '' };
  readonly types = ARTIST_TYPES;

  /* Add work */
  showWork    = signal(false);
  workSaving  = signal(false);
  workFiles:  File[] = [];
  workPrev    = signal<string[]>([]);
  workForm    = { titulli: '', viti: '', medium: '', pershkrim: '' };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    const a = await this.svc.getArtist(id);
    if (!a) { this.router.navigate(['/map']); return; }
    this.artist.set(a);
    this.cityName.set(ALBANIA_CITIES.find(c => c.id === a.qyteti)?.name ?? a.qytetiEmri);
    this.loading.set(false);
    await this.loadWorks(id);
  }

  private async loadWorks(id: string): Promise<void> {
    this.worksLoading.set(true);
    this.works.set(await this.svc.getWorks(id));
    this.worksLoading.set(false);
  }

  goBack(): void {
    const city = this.artist()?.qyteti;
    this.router.navigate(city ? ['/city', city] : ['/map']);
  }

  /* Lightbox */
  openLb(imgs: string[], i = 0): void { if (imgs.length) { this.lbImages.set(imgs); this.lbIndex.set(i); } }
  closeLb(): void { this.lbImages.set([]); }
  prevLb(): void  { this.lbIndex.update(i => (i - 1 + this.lbImages().length) % this.lbImages().length); }
  nextLb(): void  { this.lbIndex.update(i => (i + 1) % this.lbImages().length); }

  /* Edit */
  openEdit(): void {
    const a = this.artist()!;
    this.editForm = { emri: a.emri, mbiemri: a.mbiemri, lloji: a.lloji, lindja: a.lindja, bio: a.bio };
    this.showEdit.set(true);
  }

  async saveEdit(): Promise<void> {
    if (!this.editForm.emri.trim()) { this.toast.error('Emri është i detyrueshëm.'); return; }
    this.editSaving.set(true);
    try {
      await this.svc.updateArtist(this.artist()!.id!, this.editForm);
      this.artist.update(a => a ? { ...a, ...this.editForm } : a);
      this.toast.success('Profili u përditësua!');
      this.showEdit.set(false);
    } catch { this.toast.error('Gabim gjatë ruajtjes.'); }
    this.editSaving.set(false);
  }

  /* Work */
  onWorkImages(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.workFiles = files;
    this.workPrev.set(files.map(f => URL.createObjectURL(f)));
  }

  removeImg(i: number): void {
    this.workFiles.splice(i, 1);
    this.workPrev.update(p => p.filter((_, idx) => idx !== i));
  }

  async saveWork(): Promise<void> {
    if (!this.workForm.titulli.trim()) { this.toast.error('Titulli është i detyrueshëm.'); return; }
    this.workSaving.set(true);
    try {
      await this.svc.addWork(
        this.artist()!.id!,
        { ...this.workForm, shtuesId: this.auth.user()!.uid },
        this.workFiles,
      );
      this.artist.update(a => a ? { ...a, vepraNr: (a.vepraNr ?? 0) + 1 } : a);
      this.toast.success('Vepra u ngarkua me sukses!');
      this.showWork.set(false); this.resetWork();
      await this.loadWorks(this.artist()!.id!);
    } catch { this.toast.error('Gabim gjatë ngarkimit.'); }
    this.workSaving.set(false);
  }

  resetWork(): void {
    this.workForm = { titulli: '', viti: '', medium: '', pershkrim: '' };
    this.workFiles = []; this.workPrev.set([]);
  }
}
