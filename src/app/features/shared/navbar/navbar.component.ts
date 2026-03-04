import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" *ngIf="(auth.user$ | async) as user">

      <!-- Brand -->
      <a class="nav-brand" routerLink="/">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M7 9h18M7 16h12M7 23h15"
                  stroke="#e8c97a" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="brand-text">Arkiva<em>Digjitale</em></span>
      </a>

      <!-- Center links -->
      <div class="nav-links">
        <a class="nl" routerLink="/" routerLinkActive="nl--on"
           [routerLinkActiveOptions]="{exact:true}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Harta
        </a>

        <!-- Admin panel link — only visible to admins -->
        <a class="nl nl--admin" *ngIf="auth.isAdmin" routerLink="/admin" routerLinkActive="nl--on">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Admin
        </a>
      </div>

      <!-- Right -->
      <div class="nav-right">

        <!-- Role pill -->
        <div class="role-pill"
             [class.role-pill--artist]="auth.isArtist"
             [class.role-pill--admin]="auth.isAdmin">
          <span class="rp-dot"></span>
          <span *ngIf="auth.isAdmin">Administrator</span>
          <span *ngIf="auth.isArtist && !auth.isAdmin">Artist & Autor</span>
          <span *ngIf="!auth.isArtist && !auth.isAdmin">Shikues</span>
        </div>

        <!-- Avatar chip -->
        <a class="nav-avatar" routerLink="/profile">
          <ng-container *ngIf="(auth.avatarUrl$ | async) as src; else av_init">
            <img [src]="src" alt="avatar" class="nav-av-img"/>
          </ng-container>
          <ng-template #av_init>
            <span class="nav-av-init">
              {{ initials((auth.currentProfile?.emriPlote) || user.email || '') }}
            </span>
          </ng-template>
          <span class="nav-av-name">{{ (auth.profile$ | async)?.emriPlote || user.email }}</span>
        </a> 

        <!-- Logout -->
        <button class="nav-logout" (click)="logout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span class="nl-txt">Dil</span>
        </button>

      </div>
    </nav>
  `,
  styles: [`
    :host {
      --gold:      #e8c97a;
      --gold-glow: rgba(232,201,122,.08);
      --ink-nav:   rgba(8,8,18,.9);
      --border:    rgba(232,201,122,.10);
      --border-h:  rgba(232,201,122,.30);
      --cream:     #f0ece2;
      --muted:     #6e6e8a;
      --muted-lt:  #9494b0;
      --ff-serif:  'DM Serif Display', Georgia, serif;
      --ff-sans:   'DM Sans', system-ui, sans-serif;
    }

    .navbar {
      position: fixed; top: 0; left: 0; right: 0; height: 68px;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      background: var(--ink-nav);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid var(--border);
      z-index: 500;
      &::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg,
          transparent 0%, rgba(232,201,122,.2) 30%,
          rgba(232,201,122,.45) 50%, rgba(232,201,122,.2) 70%, transparent 100%);
      }
    }

    .nav-brand {
      display: flex; align-items: center; gap: .65rem;
      text-decoration: none; flex-shrink: 0;
    }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: linear-gradient(135deg, #141428, #1c1c35);
      border: 1px solid var(--border-h);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 12px rgba(232,201,122,.08);
      transition: box-shadow .2s;
    }
    .nav-brand:hover .brand-icon { box-shadow: 0 0 20px rgba(232,201,122,.2); }
    .brand-text {
      font-family: var(--ff-serif); font-size: 1.05rem;
      letter-spacing: .04em; color: var(--cream); line-height: 1;
      em { font-style: normal; color: var(--gold); margin-left: .05em; }
    }

    .nav-links {
      position: absolute; left: 50%; transform: translateX(-50%);
      display: flex; gap: .25rem;
    }
    .nl {
      display: inline-flex; align-items: center; gap: .4rem;
      padding: .4rem .9rem; border-radius: 99px;
      font-size: .72rem; font-weight: 500; letter-spacing: .09em;
      text-transform: uppercase; color: var(--muted-lt);
      border: 1px solid transparent; text-decoration: none;
      font-family: var(--ff-sans);
      transition: color .2s, border-color .2s, background .2s;
      svg { opacity: .5; transition: opacity .2s; }
      &:hover { color: var(--cream); background: rgba(255,255,255,.04); svg { opacity: 1; } }
      &.nl--on { color: var(--gold); border-color: var(--border); background: var(--gold-glow); svg { opacity: 1; } }
    }
    .nl--admin {
      color: rgba(107,159,228,.8);
      &:hover { color: #6b9fe4; }
      &.nl--on { color: #6b9fe4; border-color: rgba(107,159,228,.3); background: rgba(107,159,228,.08); }
    }

    .nav-right { display: flex; align-items: center; gap: .75rem; flex-shrink: 0; }

    .role-pill {
      display: flex; align-items: center; gap: .45rem;
      padding: .22rem .75rem; border-radius: 99px;
      font-size: .65rem; font-weight: 600; letter-spacing: .12em;
      text-transform: uppercase; color: var(--muted-lt);
      border: 1px solid var(--border); background: rgba(255,255,255,.02);
      font-family: var(--ff-sans); white-space: nowrap;
      &--artist { color: var(--gold); border-color: var(--border-h); background: var(--gold-glow); }
      &--admin  { color: #6b9fe4; border-color: rgba(107,159,228,.3); background: rgba(107,159,228,.08); }
    }
    .rp-dot {
      width: 5px; height: 5px; border-radius: 50%; background: var(--muted-lt); flex-shrink: 0;
      .role-pill--artist & { background: var(--gold); box-shadow: 0 0 5px var(--gold); }
      .role-pill--admin  & { background: #6b9fe4; box-shadow: 0 0 5px #6b9fe4; }
    }

    .nav-avatar {
      display: flex; align-items: center; gap: .55rem;
      padding: .28rem .7rem .28rem .28rem; border-radius: 99px;
      border: 1px solid var(--border); background: rgba(255,255,255,.03);
      text-decoration: none; cursor: pointer;
      transition: border-color .2s, background .2s, box-shadow .2s;
      &:hover { border-color: var(--border-h); background: var(--gold-glow); box-shadow: 0 0 0 3px rgba(232,201,122,.05); }
    }
    .nav-av-img {
      width: 30px; height: 30px; border-radius: 50%;
      object-fit: cover; display: block; flex-shrink: 0;
      border: 1.5px solid rgba(232,201,122,.5);
    }
    .nav-av-init {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #1c1c35, #252548);
      border: 1.5px solid rgba(232,201,122,.35);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--ff-serif); font-size: .72rem; font-style: italic; color: var(--gold);
    }
    .nav-av-name {
      font-size: .8rem; color: var(--cream); font-family: var(--ff-sans);
      max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .nav-logout {
      display: inline-flex; align-items: center; gap: .35rem;
      padding: .38rem .75rem; border-radius: 99px;
      font-size: .72rem; letter-spacing: .08em; text-transform: uppercase;
      color: var(--muted); border: 1px solid var(--border);
      font-family: var(--ff-sans); background: none; cursor: pointer;
      transition: border-color .2s, color .2s, background .2s;
      svg { flex-shrink: 0; }
      &:hover { border-color: rgba(224,112,112,.4); color: #e07070; background: rgba(224,112,112,.06); }
    }
    .nl-txt { font-weight: 500; }

    @media (max-width: 860px) { .nav-links { display: none; } .role-pill { display: none; } }
    @media (max-width: 600px) { .navbar { padding: 0 1rem; } .nl-txt { display: none; } .nav-av-name { display: none; } }
    @media (max-width: 400px) { .brand-text { display: none; } }
  `]
})
export class NavbarComponent {
  auth          = inject(AuthService);
  private router  = inject(Router);
  private toast   = inject(ToastService);

  initials(name: string): string {
    const parts = name.trim().split(/[\s@]/);
    if (parts.length >= 2 && parts[1]) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name[0] ?? '?').toUpperCase();
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/auth']);
    this.toast.success('Doli me sukses.');
  }
}
