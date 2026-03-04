import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArtistService } from '../../core/services/artist.service';
import { AuthService }   from '../../core/services/auth.service';
import { ToastService }  from '../../core/services/toast.service';
import { Artist, ALBANIA_CITIES, City, ARTIST_TYPES } from '../../core/models/artist.model';

@Component({
    selector:    'app-city',
    standalone:  true,
    imports:     [FormsModule, RouterLink],
    templateUrl: './city.component.html',
    styleUrls:   ['./city.component.scss'],
})
export class CityComponent implements OnInit {
    private route     = inject(ActivatedRoute);
    private router    = inject(Router);
    private artistSvc = inject(ArtistService);
    auth              = inject(AuthService);
    private toast     = inject(ToastService);

    // ── State ────────────────────────────────────────────────────
    city    = signal<City | null>(null);
    artists = signal<Artist[]>([]);
    loading = signal(true);
    view    = signal<'grid' | 'list'>('grid');
    showAdd = signal(false);
    saving  = signal(false);

    // ── Form ─────────────────────────────────────────────────────
    types = ARTIST_TYPES;
    form  = { emri: '', mbiemri: '', lloji: 'Piktor', lindja: '', bio: '' };

    private photoFile: File | null = null;
    photoPreview = signal('');

    // ── Init ─────────────────────────────────────────────────────
    async ngOnInit() {
        const id    = this.route.snapshot.paramMap.get('cityId')!;
        const found = ALBANIA_CITIES.find(c => c.id === id) ?? null;
        this.city.set(found);
        if (!found) { this.router.navigate(['/']); return; }
        await this.loadArtists(id);
        this.loading.set(false);
    }

    async loadArtists(cityId: string) {
        const list = await this.artistSvc.getArtistsByCity(cityId);
        this.artists.set(list);
        // Update count on city object
        const c = this.city();
        if (c) this.city.set({ ...c, count: list.length });
    }

    // ── Photo ────────────────────────────────────────────────────
    onPhoto(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            this.toast.error('Foto duhet të jetë më e vogël se 5MB.');
            return;
        }
        this.photoFile = file;
        this.photoPreview.set(URL.createObjectURL(file));
    }

    // ── Save ─────────────────────────────────────────────────────
    async save() {
        if (!this.form.emri.trim() || !this.form.mbiemri.trim()) {
            this.toast.error('Emri dhe mbiemri janë të detyrueshme.');
            return;
        }
        this.saving.set(true);
        try {
            const city = this.city()!;
            await this.artistSvc.addArtist({
                ...this.form,
                qyteti:     city.id,
                qytetiEmri: city.name,
                shtuesId:   this.auth.currentUser?.uid,
                shtuesEmri: this.auth.currentUser?.displayName
                    ?? this.auth.currentUser?.email
                    ?? '',
            }, this.photoFile ?? undefined);
            this.toast.success('Artisti u shtua me sukses!');
            this.showAdd.set(false);
            this.resetForm();
            await this.loadArtists(city.id);
        } catch (e: any) {
            console.error('saveArtist error:', e?.code, e?.message, e);
            this.toast.error('Gabim: ' + (e?.code ?? e?.message ?? 'E panjohur'));
        }
        this.saving.set(false);
    }

    // ── Reset ────────────────────────────────────────────────────
    resetForm() {
        this.form      = { emri: '', mbiemri: '', lloji: 'Piktor', lindja: '', bio: '' };
        this.photoFile = null;
        this.photoPreview.set('');
    }
}
