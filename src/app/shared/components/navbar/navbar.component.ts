import { Component, inject, signal } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { RouterLink, Router }        from '@angular/router';
import { AuthService }               from '../../../core/services/auth.service';

@Component({
  selector:   'app-navbar',
  standalone: true,
  imports:    [CommonModule, RouterLink],
  template: `
    <nav class="nav">
      <a class="brand" routerLink="/map">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#141428"/>
          <rect x="7" y="9"  width="18" height="2"   rx="1" fill="#c9a84c"/>
          <rect x="7" y="15" width="11" height="2"   rx="1" fill="#c9a84c" opacity=".65"/>
          <rect x="7" y="21" width="14" height="2"   rx="1" fill="#c9a84c" opacity=".4"/>
        </svg>
        <span class="brand-name">Arkiva Digjitale</span>
      </a>

      <a class="nav-link" routerLink="/map">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
          <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
        Harta
      </a>

      <div class="nav-right">
        <span class="role-pill" [class.artist]="auth.isArtist()">
          {{ auth.isArtist() ? '🎨 Artist' : '👁 Shikues' }}
        </span>

        <div class="user-btn" (click)="open.set(!open())">
          <div class="avatar">{{ initials() }}</div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>

          @if (open()) {
            <div class="dropdown" (click)="$event.stopPropagation()">
              <div class="dd-head">
                <div class="dd-name">{{ auth.displayName() }}</div>
                <div class="dd-email">{{ auth.user()?.email }}</div>
              </div>
              <button class="dd-item danger" (click)="logout()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                Dil nga llogaria
              </button>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 600;
      height: var(--nav-h);
      display: flex; align-items: center; gap: 1.5rem; padding: 0 1.75rem;
      background: rgba(7,7,15,.82); backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
    }
    .brand { display: flex; align-items: center; gap: .75rem; text-decoration: none; }
    .brand-name { font-family: var(--ff-serif); font-size: 1rem; color: var(--cream); }

    .nav-link {
      display: flex; align-items: center; gap: .4rem;
      font-size: .75rem; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
      color: var(--muted-lt); text-decoration: none; transition: color .2s;
      padding: .3rem .65rem; border-radius: var(--r); border: 1px solid transparent;
      &:hover { color: var(--gold-lt); border-color: var(--border); background: var(--surface); }
    }

    .nav-right { display: flex; align-items: center; gap: 1rem; margin-left: auto; }

    .role-pill {
      font-size: .68rem; font-weight: 500; letter-spacing: .06em;
      padding: .25rem .75rem; border-radius: 99px;
      border: 1px solid var(--border); color: var(--muted-lt); background: var(--surface);
      &.artist { border-color: var(--border-h); color: var(--gold-lt); background: var(--gold-glow-s); }
    }

    .user-btn {
      position: relative; display: flex; align-items: center; gap: .4rem;
      cursor: pointer; padding: .3rem .6rem; border-radius: var(--r);
      border: 1px solid transparent; transition: all .2s; color: var(--muted);
      &:hover { border-color: var(--border); background: var(--surface); color: var(--muted-lt); }
    }

    .avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: var(--ink-3); border: 1px solid var(--border-h);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--ff-serif); font-size: .8rem; color: var(--gold-lt); font-style: italic;
    }

    .dropdown {
      position: absolute; top: calc(100% + 8px); right: 0;
      min-width: 200px; background: var(--ink-2); border: 1px solid var(--border);
      border-radius: var(--r-lg); box-shadow: 0 16px 48px rgba(0,0,0,.5);
      overflow: hidden; animation: fadeUp .2s var(--ease); z-index: 700;
    }
    .dd-head { padding: .9rem 1.1rem .75rem; border-bottom: 1px solid var(--border); }
    .dd-name  { font-size: .85rem; color: var(--cream); font-weight: 500; }
    .dd-email { font-size: .72rem; color: var(--muted-lt); margin-top: .1rem; }

    .dd-item {
      display: flex; align-items: center; gap: .6rem;
      width: 100%; padding: .75rem 1.1rem; font-size: .82rem; color: var(--muted-lt);
      transition: all .15s; background: none; border: none; cursor: pointer;
      font-family: var(--ff-sans); text-align: left;
      &:hover { background: var(--surface-h); color: var(--cream); }
      &.danger:hover { color: var(--error); }
    }

    @media (max-width: 640px) { .brand-name, .role-pill { display: none; } .nav { padding: 0 1rem; } }
  `],
})
export class NavbarComponent {
  auth   = inject(AuthService);
  router = inject(Router);
  open   = signal(false);

  initials(): string {
    return this.auth.displayName().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
  }

  async logout(): Promise<void> {
    this.open.set(false);
    await this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
