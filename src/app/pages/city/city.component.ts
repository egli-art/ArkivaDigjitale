import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ArtistsService } from '../../core/services/artists.service';
import { AuthService }    from '../../core/services/auth.service';
import { ToastService }   from '../../core/services/toast.service';
import { Artist, City, ALBANIA_CITIES, ARTIST_TYPES } from '../../core/models';

@Component({
  selector:    'app-city',
  standalone:  true,
  imports:     [CommonModule, FormsModule, RouterLink],
  templateUrl: './city.component.html',
  styleUrl:    './city.component.scss',
})
export class CityComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc   = inject(ArtistsService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  city    = signal<City | null>(null);
  artists = signal<Artist[]>([]);
  loading = signal(true);
  view    = signal<'grid' | 'list'>('grid');

  showAdd = signal(false);
  saving  = signal(false);

  form = { emri: '', mbiemri: '', lloji: 'Piktor', lindja: '', bio: '' };
  readonly types = ARTIST_TYPES;
  photoFile: File | null = null;
  photoPreview = signal('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('cityId')!;
    const found = ALBANIA_CITIES.find(c => c.id === id);
    if (!found) { this.router.navigate(['/map']); return; }
    this.city.set({ ...found });
    await this.reload(id);
  }

  private async reload(cityId: string): Promise<void> {
    this.loading.set(true);
    try {
      const [list, count] = await Promise.all([
        this.svc.getArtistsByCity(cityId),
        this.svc.countByCity(cityId),
      ]);
      this.artists.set(list);
      this.city.update(c => c ? { ...c, count } : c);
    } finally { this.loading.set(false); }
  }

  onPhoto(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.photoFile = f;
    this.photoPreview.set(URL.createObjectURL(f));
  }

  resetForm(): void {
    this.form = { emri: '', mbiemri: '', lloji: 'Piktor', lindja: '', bio: '' };
    this.photoFile = null; this.photoPreview.set('');
  }

  async save(): Promise<void> {
    if (!this.form.emri.trim() || !this.form.mbiemri.trim()) {
      this.toast.error('Emri dhe mbiemri janë të detyrueshme.'); return;
    }
    this.saving.set(true);
    try {
      const city = this.city()!;
      await this.svc.addArtist(
        { ...this.form, qyteti: city.id, qytetiEmri: city.name,
          shtuesId: this.auth.user()!.uid, shtuesEmri: this.auth.displayName() },
        this.photoFile ?? undefined,
      );
      this.toast.success(`${this.form.emri} ${this.form.mbiemri} u shtua!`);
      this.showAdd.set(false); this.resetForm();
      await this.reload(city.id);
    } catch { this.toast.error('Gabim gjatë ruajtjes.'); }
    this.saving.set(false);
  }
}
