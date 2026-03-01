import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtistService } from '../../../core/services/artist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Artist, Work, ALBANIA_CITIES, ARTIST_TYPES } from '../../../core/models/artist.model';

@Component({
  selector: 'app-artist-detail',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterLink],
  templateUrl: './artist-detail.component.html',
  styleUrls: ['./artist-detail.component.scss']
})
export class ArtistDetailComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private artistSvc = inject(ArtistService);
  auth              = inject(AuthService);
  private toast     = inject(ToastService);

  artist  = signal<Artist | null>(null);
  works   = signal<Work[]>([]);
  loading = signal(true);
  cityName = '';

  // Edit artist modal
  showEditModal = false;
  editSaving    = false;
  artistTypes   = ARTIST_TYPES;
  editForm = { emri:'', mbiemri:'', lloji:'', lindja:'', bio:'' };

  // Add work modal
  showWorkModal  = false;
  workSaving     = false;
  workForm = { titulli:'', viti:'', medium:'', pershkrim:'' };
  workImages: File[] = [];
  workPreviews: string[] = [];

  // Lightbox
  lightboxSrc = '';
  lightboxAlt = '';
  showLightbox = false;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('artistId')!;
    const a  = await this.artistSvc.getArtist(id);
    if (!a) { this.router.navigate(['/']); return; }
    this.artist.set(a);
    this.cityName = ALBANIA_CITIES.find(c => c.id === a.qyteti)?.name ?? a.qytetiEmri ?? '';
    this.works.set(await this.artistSvc.getWorks(id));
    this.loading.set(false);
  }

  goBackToCity() {
    this.router.navigate(['/city', this.artist()?.qyteti]);
  }

  // ── Edit ────────────────────────────────────────────────
  openEditModal() {
    const a = this.artist()!;
    this.editForm = { emri: a.emri, mbiemri: a.mbiemri, lloji: a.lloji, lindja: a.lindja ?? '', bio: a.bio ?? '' };
    this.showEditModal = true;
  }

  async saveEdit() {
    if (!this.editForm.emri || !this.editForm.mbiemri) {
      this.toast.error('Emri dhe mbiemri janë të detyrueshme.'); return;
    }
    this.editSaving = true;
    try {
      await this.artistSvc.updateArtist(this.artist()!.id!, this.editForm);
      this.artist.set({ ...this.artist()!, ...this.editForm });
      this.toast.success('Profili u përditësua!');
      this.showEditModal = false;
    } catch { this.toast.error('Gabim gjatë përditësimit.'); }
    this.editSaving = false;
  }

  // ── Add Work ─────────────────────────────────────────────
  openWorkModal() {
    this.workForm = { titulli:'', viti:'', medium:'', pershkrim:'' };
    this.workImages = []; this.workPreviews = [];
    this.showWorkModal = true;
  }

  onWorkImages(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.workImages = files;
    this.workPreviews = files.map(f => URL.createObjectURL(f));
  }

  removeWorkImg(i: number) {
    this.workImages.splice(i, 1);
    this.workPreviews.splice(i, 1);
  }

  async saveWork() {
    if (!this.workForm.titulli) { this.toast.error('Titulli është i detyrueshëm.'); return; }
    this.workSaving = true;
    try {
      await this.artistSvc.addWork(this.artist()!.id!, this.workForm, this.workImages);
      const updated = { ...this.artist()!, vepraNr: (this.artist()!.vepraNr ?? 0) + 1 };
      this.artist.set(updated);
      this.toast.success('Vepra u shtua me sukses!');
      this.showWorkModal = false;
      this.works.set(await this.artistSvc.getWorks(this.artist()!.id!));
    } catch { this.toast.error('Gabim gjatë ruajtjes.'); }
    this.workSaving = false;
  }

  // ── Lightbox ─────────────────────────────────────────────
  openLightbox(src: string, alt: string) {
    if (!src) return;
    this.lightboxSrc = src; this.lightboxAlt = alt;
    this.showLightbox = true;
  }
}
