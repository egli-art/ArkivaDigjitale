import { Component } from '@angular/core';

@Component({
  selector:   'app-loader',
  standalone: true,
  template: `
    <div class="loader">
      <div class="loader-logo">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="12" fill="#141428"/>
          <rect x="10" y="13"   width="24" height="2.5" rx="1.25" fill="#c9a84c"/>
          <rect x="10" y="20.5" width="16" height="2.5" rx="1.25" fill="#c9a84c" opacity=".65"/>
          <rect x="10" y="28"   width="20" height="2.5" rx="1.25" fill="#c9a84c" opacity=".4"/>
        </svg>
        <span>Arkiva Digjitale</span>
      </div>
      <div class="loader-track"><div class="loader-bar"></div></div>
      <p class="loader-sub">Duke ngarkuar arkivën…</p>
    </div>
  `,
  styles: [`
    .loader {
      position: fixed; inset: 0;
      background: var(--ink);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 1.5rem; z-index: 9998;
    }
    .loader-logo {
      display: flex; align-items: center; gap: .85rem;
      animation: fadeUp .5s var(--ease) both;
      span { font-family: var(--ff-serif); font-size: 1.6rem; color: var(--gold-lt); }
    }
    .loader-track {
      width: 140px; height: 2px; background: var(--border); border-radius: 99px; overflow: hidden;
      animation: fadeIn .5s var(--ease) .2s both;
    }
    .loader-bar {
      height: 100%; width: 0;
      background: linear-gradient(90deg, var(--gold-dk), var(--gold-lt));
      border-radius: 99px;
      animation: fill 1.4s var(--ease) .3s forwards;
    }
    @keyframes fill { to { width: 100%; } }
    .loader-sub {
      font-size: .75rem; color: var(--muted); letter-spacing: .08em; text-transform: uppercase;
      animation: fadeIn .5s var(--ease) .4s both;
    }
  `],
})
export class LoaderComponent {}
