import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: '',
    loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent),
    canActivate: [authGuard]
  },
  {
    path: 'city/:cityId',
    loadComponent: () => import('./features/city/city.component').then(m => m.CityComponent),
    canActivate: [authGuard]
  },
  {
    path: 'artist/:artistId',
    loadComponent: () => import('./features/artist/artist-detail/artist-detail.component').then(m => m.ArtistDetailComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
