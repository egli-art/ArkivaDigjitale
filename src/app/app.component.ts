import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from './features/shared/navbar/navbar.component';
import { ToastComponent }  from './features/shared/toast/toast.component';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent, HttpClientModule, NgIf],
  template: `
    <app-navbar *ngIf="showNav()" />
    <main class="main-content" [class.no-nav]="!showNav()">
      <router-outlet />
    </main>
    <app-toast />
  `,
  styles: [`
    .main-content.no-nav { margin-top: 0; }
  `]
}) 
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth   = inject(AuthService);

  showNav = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => {
        const url = e.urlAfterRedirects;
        return !url.startsWith('/auth') && !url.startsWith('/admin')
            && !url.startsWith('/pending') && !url.startsWith('/banned');
      }),
      startWith((() => {
        const p = window.location.pathname;
        return !p.startsWith('/auth') && !p.startsWith('/admin')
            && !p.startsWith('/pending') && !p.startsWith('/banned');
      })())
    )
  );

  ngOnInit() {
    // Mid-session ban detection — redirect immediately if admin bans a logged-in user
    this.auth.banned$.subscribe(banned => {
      if (banned) {
        this.auth.logout().then(() => {
          this.router.navigate(['/banned']);
        });
      }
    });
  }
}
