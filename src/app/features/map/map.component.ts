import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Router }         from '@angular/router';
import { ArtistsService } from '../../core/services/artists.service';
import { ALBANIA_CITIES, City } from '../../core/models';

declare const L: any; // loaded via CDN in index.html

@Component({
  selector:    'app-map',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrl:    './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc    = inject(ArtistsService);
  private router = inject(Router);

  cities      = signal<City[]>(ALBANIA_CITIES.map(c => ({ ...c, count: 0 })));
  loading     = signal(true);       // sidebar data loading
  mapReady    = signal(false);      // map has initialised
  mapError    = signal(false);      // leaflet unavailable
  search      = '';
  private map: any = null;
  private viewInited = false;
  private dataReady  = false;
    currentYear = new Date().getFullYear();

  filteredCities(): City[] {
    const q = this.search.toLowerCase().trim();
    return q
      ? this.cities().filter(c =>
          c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q))
      : this.cities();
  }

  totalArtists(): number {
    return this.cities().reduce((s, c) => s + (c.count ?? 0), 0);
  }

  // ── Lifecycle ─────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadCounts();
    this.loading.set(false);
    this.dataReady = true;
    this.tryInitMap();
  }

  ngAfterViewInit(): void {
    this.viewInited = true;
    this.tryInitMap();
  }

  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ── Map init ───────────────────────────────────────────────
  /**
   * Only attempt map init once BOTH conditions are true:
   * - view has been rendered (AfterViewInit)
   * - Firestore count data is loaded
   * Uses requestAnimationFrame so the #albania-map div is definitely in the DOM.
   */
  tryInitMap(): void {
    if (!this.viewInited || !this.dataReady || this.map) return;

    requestAnimationFrame(() => {
      // Give Angular one more paint cycle to flush the DOM
      requestAnimationFrame(() => this.initMap());
    });
  }

  private initMap(): void {
    if (typeof L === 'undefined') {
      console.error('[Map] Leaflet not loaded — check index.html CDN links');
      this.mapError.set(true);
      return;
    }

    const el = document.getElementById('albania-map');
    if (!el) {
      console.error('[Map] #albania-map element not found in DOM');
      this.mapError.set(true);
      return;
    }

    try {
      this.map = L.map('albania-map', {
        center:  [41.15, 20.17],
        zoom:    7.2,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: true,
      });

      // Dark-filtered OSM tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom:     19,
        attribution: '© OpenStreetMap',
      }).addTo(this.map);

      this.addMarkers();
      this.mapReady.set(true);

      // Force Leaflet to recalculate tile positions after any layout shift
      setTimeout(() => this.map?.invalidateSize(), 200);

    } catch (err) {
      console.error('[Map] Leaflet init failed:', err);
      this.mapError.set(true);
    }
  }

  private addMarkers(): void {
    this.cities().forEach(city => {
      const count = city.count ?? 0;
      const hasArtists = count > 0;

      const icon = L.divIcon({
        className: '',
        html: `
          <div class="city-marker ${hasArtists ? 'has-artists' : ''}">
            <div class="city-dot">${count}</div>
            <div class="city-label">${city.name}</div>
          </div>`,
        iconSize:   [70, 56],
        iconAnchor: [35, 20],
      });

      const popup = L.popup({ closeButton: false, maxWidth: 200 }).setContent(`
        <div class="city-popup">
          <h3>${city.name}</h3>
          <p class="popup-meta">${count} artist${count !== 1 ? 'ë' : ''} · ${city.region}</p>
          <button class="popup-btn" id="popup-${city.id}">Eksplorо →</button>
        </div>`);

      const marker = L.marker([city.lat, city.lng], { icon })
        .bindPopup(popup)
        .addTo(this.map!);

      marker.on('popupopen', () => {
        setTimeout(() => {
          document.getElementById(`popup-${city.id}`)
            ?.addEventListener('click', () => this.goTo(city.id));
        }, 50);
      });
    });
  }

  private async loadCounts(): Promise<void> {
    try {
      const counts = await Promise.all(
        ALBANIA_CITIES.map(c => this.svc.countByCity(c.id)),
      );
      this.cities.set(ALBANIA_CITIES.map((c, i) => ({ ...c, count: counts[i] })));
    } catch (e) {
      console.error('[Map] Failed to load city counts:', e);
    }
  }

  goTo(cityId: string): void { this.router.navigate(['/city', cityId]); }
}
