import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {AuthService} from "../../../core/services/auth.service";


@Component({
  selector: 'app-banned',
  standalone: true,
  template: `
    <div class="banned-page">
      <div class="banned-card">
        <div class="bc-icon">⛔</div>
        <h1>Llogaria juaj është bllokuar</h1>
        <p>Aksesi juaj në Arkiva Digjitale është pezulluar nga administratori.</p>
        <p class="bc-sub">Nëse mendoni se ky vendim është i gabuar, ju lutem kontaktoni ekipin tonë.</p>
        <div class="bc-email">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          info&#64;arkivadigjitale.al
        </div>
        <button class="btn-logout" (click)="logout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Dil nga llogaria
        </button>
      </div>
    </div>
  `,
  styles: [`
    .banned-page {
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      background: #07070f; padding: 2rem;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .banned-card {
      background: #0e0e1c;
      border: 1px solid rgba(224,112,112,.25);
      border-radius: 24px; padding: 3rem 2.5rem;
      max-width: 460px; width: 100%; text-align: center;
      box-shadow: 0 0 60px rgba(224,112,112,.06);
    }
    .bc-icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
    h1 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.7rem; font-weight: 400; color: #f0ece2;
      margin-bottom: 1rem; line-height: 1.2;
    }
    p { font-size: .9rem; color: #9494b0; line-height: 1.7; margin-bottom: .6rem; }
    .bc-sub { font-size: .82rem; color: #6e6e8a; }
    .bc-email {
      display: inline-flex; align-items: center; gap: .5rem;
      font-size: .82rem; color: #e07070;
      background: rgba(224,112,112,.08);
      border: 1px solid rgba(224,112,112,.2);
      border-radius: 8px; padding: .5rem 1rem;
      margin: 1.25rem 0 2rem;
    }
    .btn-logout {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .65rem 1.4rem; border-radius: 10px;
      border: 1px solid rgba(224,112,112,.25); background: none;
      color: #e07070; font-size: .84rem; cursor: pointer;
      transition: background .2s, border-color .2s;
      &:hover { background: rgba(224,112,112,.08); border-color: rgba(224,112,112,.45); }
    }
  `]
})
export class BannedComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/auth']);
  }
}
