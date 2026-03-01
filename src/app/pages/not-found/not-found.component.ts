import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector:   'app-not-found',
  standalone: true,
  imports:    [RouterLink],
  template: `
    <div class="nf">
      <div class="nf-num">404</div>
      <h1 class="nf-h">Faqja nuk u gjet</h1>
      <p class="nf-p">Kjo faqe nuk ekziston ose është zhvendosur.</p>
      <a class="btn-primary" routerLink="/map">Kthehu te Harta</a>
    </div>
  `,
  styles: [`
    .nf { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; text-align: center; padding: 2rem; }
    .nf-num { font-family: var(--ff-serif); font-size: 6rem; color: var(--border-h); line-height: 1; font-style: italic; }
    .nf-h   { font-family: var(--ff-serif); font-size: 1.75rem; font-weight: 400; }
    .nf-p   { color: var(--muted-lt); font-size: .9rem; }
    .btn-primary { margin-top: .5rem; }
  `],
})
export class NotFoundComponent {}
