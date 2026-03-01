import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/shared/navbar/navbar.component';
import { ToastComponent } from './features/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-toast />
  `,
  styles: [`
    .main-content {
      padding-top: var(--nav-h);
      min-height: 100vh;
    }
  `]
})
export class AppComponent {}
