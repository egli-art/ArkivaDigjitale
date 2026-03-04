import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.profile$.pipe(
    take(1),
    map(profile => {
      if (profile && (profile as any).roli === 'admin') return true;
      if (!profile) return router.createUrlTree(['/auth']);
      return router.createUrlTree(['/']);
    })
  );
};
