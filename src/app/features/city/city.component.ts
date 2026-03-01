import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { ArtistService } from '../../core/services/artist.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Artist, ALBANIA_CITIES, City, ARTIST_TYPES } from '../../core/models/artist.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-city',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, RouterLink],
  templateUrl: './city.component.html',
  styleUrls: ['./city.component.scss']
})
export class CityComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private artistSvc = inject(ArtistService);
  auth              = inject(AuthService);
  private toast     = inject(ToastService);

  city     = signal<City | null>(null);
  artists  = signal<Artist[]>([]);
  loading  = signal(true);

  showModal   = false;
  saving      = false;
  artistTypes = ARTIST_TYPES;
  form = { emri:'', mbiemri:'', lloji:'Piktor', lindja:'', bio:'' };
  photoFile: File | null = null;
  photoPreview = '';

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('cityId')!;
    const found = ALBANIA_CITIES.find(c => c.id === id) ?? null;
    this.city.set(found);
    if (!found) { this.router.navigate(['/']); return; }
    await this.loadArtists(id);
    this.loading.set(false);
  }

  async loadArtists(cityId: string) {
    const list = await this.artistSvc.getArtistsByCity(cityId);
    this.artists.set(list);
  }

  openArtist(id: string) { this.router.navigate(['/artist', id]); }

  openModal() {
    this.form = { emri:'', mbiemri:'', lloji:'Piktor', lindja:'', bio:'' };
    this.photoFile = null; this.photoPreview = '';
    this.showModal = true;
  }

  onPhotoChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.photoFile = file;
    this.photoPreview = URL.createObjectURL(file);
  }

  async saveArtist() {
    if (!this.form.emri || !this.form.mbiemri) {
      this.toast.error('Emri dhe mbiemri janë të detyrueshme.'); return;
    }
    this.saving = true;
    try {
      const city = this.city()!;
      await this.artistSvc.addArtist({
        ...this.form,
        qyteti: city.id,
        qytetiEmri: city.name,
        shtuesId: this.auth.currentUser?.uid,
        shtuesEmri: this.auth.currentUser?.displayName ?? this.auth.currentUser?.email ?? '',
      }, this.photoFile ?? undefined);
      this.toast.success('Artisti u shtua me sukses!');
      this.showModal = false;
      await this.loadArtists(city.id);
    } catch (e) {
      this.toast.error('Gabim gjatë ruajtjes.');
    }
    this.saving = false;
  }
}
