import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'auth',    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),       canActivate: [guestGuard] },
  { path: 'pending', loadComponent: () => import('./features/shared/navbar/pending.component').then(m => m.PendingComponent) },
  { path: 'banned',  loadComponent: () => import('./features/shared/navbar/banned.component').then(m => m.BannedComponent)  },
  { path: 'admin',   loadComponent: () => import('./features/auth/admin/admin.component').then(m => m.AdminComponent),     canActivate: [adminGuard] },
  { path: '',        loadComponent: () => import('./features/map/map.component').then(m => m.MapComponent),           canActivate: [authGuard] },
  { path: 'city/:cityId',      loadComponent: () => import('./features/city/city.component').then(m => m.CityComponent),                                                                canActivate: [authGuard] },
  { path: 'artist/:artistId',  loadComponent: () => import('./features/artist/artist-detail/artist-detail.component').then(m => m.ArtistDetailComponent),                              canActivate: [authGuard] },
  { path: 'profile',           loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),                                                       canActivate: [authGuard] },
  { path: '**',                loadComponent: () => import('./features/shared/not-found/not-found.component').then(m => m.NotFoundComponent) },
];








