import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink],
  template: `
    <nav class="navbar" *ngIf="(auth.user$ | async) as user">
      <a class="nav-brand" routerLink="/">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="7" fill="#1a1a2e"/>
          <path d="M7 9h18M7 16h12M7 23h15" stroke="#e8c97a" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Arkiva Digjitale
      </a>
      <div class="nav-right">
        <span class="role-badge">
          {{ auth.isArtist ? 'Artist / Autor' : 'Shikues' }}
        </span>
        <span class="nav-user">{{ user.displayName || user.email }}</span>
        <button class="nav-logout" (click)="logout()">Dil</button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0;
      height: var(--nav-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      background: rgba(10,10,20,0.82);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--gold-border);
      z-index: 500;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 0.75rem;
      font-family: var(--ff-serif); font-size: 1.1rem; letter-spacing: 0.05em;
      color: var(--white);
    }
    .nav-right {
      display: flex; align-items: center; gap: 1rem;
    }
    .role-badge {
      font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border: 1px solid var(--gold-border-h);
      border-radius: 99px; color: var(--gold);
    }
    .nav-user { font-size: 0.82rem; color: var(--muted); }
    .nav-logout {
      padding: 0.35rem 0.9rem;
      font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
      border: 1px solid var(--gold-border);
      border-radius: 99px; color: var(--muted-light);
      transition: all 0.2s;
      &:hover { border-color: var(--gold-border-h); color: var(--white); }
    }
    @media (max-width: 600px) {
      .navbar { padding: 0 1rem; }
      .nav-user { display: none; }
    }
  `]
})
export class NavbarComponent {
  auth    = inject(AuthService);
  private router  = inject(Router);
  private toast   = inject(ToastService);

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/auth']);
    this.toast.success('Doli me sukses.');
  }
}
