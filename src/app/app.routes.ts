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
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    },
    { path: '', redirectTo: 'map', pathMatch: 'full' },
    {
        path: '**',

        loadComponent: () => import('./features/shared/not-found/not-found.component').then(m => m.NotFoundComponent),
    },
    // {
    //     path: 'chat',
    //     loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    // },

{ path: '**', redirectTo: '' }
];
