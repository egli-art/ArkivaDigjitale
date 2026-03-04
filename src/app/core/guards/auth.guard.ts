import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return combineLatest([auth.profile$, auth.banned$]).pipe(
    take(1),
    map(([profile, banned]) => {
      if (!profile)  return router.createUrlTree(['/auth']);
      if (banned)    return router.createUrlTree(['/banned']);
      if (profile.roli === 'artist' && !(profile as any).approved) {
        return router.createUrlTree(['/pending']);
      }
      return true;
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.user$.pipe(
    take(1),
    map(user => user ? router.createUrlTree(['/']) : true)
  );
};
