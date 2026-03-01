import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router }         from '@angular/router';
import { ArtistsService } from '../../core/services/artists.service';
import { ALBANIA_CITIES, City } from '../../core/models';

// Leaflet is loaded via CDN in index.html — window.L is available at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const L: any;

@Component({
  selector:    'app-map',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrl:    './map.component.scss',
})
export class MapComponent implements OnInit, OnDestroy {
  private svc    = inject(ArtistsService);
  private router = inject(Router);

  cities  = signal<City[]>(ALBANIA_CITIES.map(c => ({ ...c, count: 0 })));
  loading = signal(true);
  search  = '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map: any = null;

  filteredCities(): City[] {
    const q = this.search.toLowerCase().trim();
    return q
      ? this.cities().filter(c => c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q))
      : this.cities();
  }

  totalArtists(): number { return this.cities().reduce((s, c) => s + (c.count ?? 0), 0); }

  async ngOnInit(): Promise<void> {
    await this.loadCounts();
    this.loading.set(false);
    // Defer map init so the #albania-map div is rendered
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void { if (this.map) { this.map.remove(); this.map = null; } }

  private async loadCounts(): Promise<void> {
    const counts = await Promise.all(ALBANIA_CITIES.map(c => this.svc.countByCity(c.id)));
    this.cities.set(ALBANIA_CITIES.map((c, i) => ({ ...c, count: counts[i] })));
  }

  private initMap(): void {
    if (typeof L === 'undefined' || this.map) return;

    this.map = L.map('albania-map', { center: [41.15, 20.17], zoom: 7.2, minZoom: 6, maxZoom: 14 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);

    this.cities().forEach(city => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="city-marker"><div class="city-dot">${city.count ?? 0}</div><div class="city-label">${city.name}</div></div>`,
        iconSize:   [60, 52],
        iconAnchor: [30, 20],
      });

      const popup = L.popup({ closeButton: false })
        .setContent(`<div class="city-popup">
          <h3>${city.name}</h3>
          <p class="popup-meta">${city.count ?? 0} artist${(city.count ?? 0) !== 1 ? 'ë' : ''} · ${city.region}</p>
          <button class="popup-btn" id="popup-${city.id}">Eksplorо →</button>
        </div>`);

      const marker = L.marker([city.lat, city.lng], { icon }).bindPopup(popup).addTo(this.map);

      marker.on('popupopen', () => {
        setTimeout(() => {
          document.getElementById(`popup-${city.id}`)
            ?.addEventListener('click', () => this.goTo(city.id));
        }, 50);
      });
    });
  }

  goTo(cityId: string): void { this.router.navigate(['/city', cityId]); }
}
