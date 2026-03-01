import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor } from '@angular/common';
import { ArtistService } from '../../core/services/artist.service';
import { ALBANIA_CITIES, City } from '../../core/models/artist.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [NgFor],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  private router     = inject(Router);
  private artistSvc  = inject(ArtistService);

  cities  = signal<City[]>([...ALBANIA_CITIES]);
  loading = signal(true);
  private map!: L.Map;

  async ngOnInit() {
    await this.loadCounts();
    this.initMap();
    this.loading.set(false);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
  }

  private async loadCounts() {
    const updated = await Promise.all(
      ALBANIA_CITIES.map(async c => ({
        ...c,
        count: await this.artistSvc.getCityCount(c.id)
      }))
    );
    this.cities.set(updated);
  }

  private initMap() {
    this.map = L.map('albania-map', {
      center: [41.1533, 20.1683],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(this.map);

    this.cities().forEach(city => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="city-pin">${city.count ?? 0}<span class="pin-label">${city.name}</span></div>`,
        iconSize: [38, 38], iconAnchor: [19, 19]
      });

      const marker = L.marker([city.lat, city.lng], { icon }).addTo(this.map);
      marker.on('click', () => this.goToCity(city.id));
      marker.bindPopup(`
        <div class="city-popup">
          <h3>${city.name}</h3>
          <p>${city.count ?? 0} artist${city.count !== 1 ? 'ë' : ''} · ${city.region}</p>
          <span class="popup-btn" onclick="window['goToCity']('${city.id}')">Eksplorо →</span>
        </div>
      `);
    });

    // Expose for popup click
    (window as any)['goToCity'] = (id: string) => this.goToCity(id);
  }

  goToCity(id: string) {
    this.router.navigate(['/city', id]);
  }
}
