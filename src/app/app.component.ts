import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './features/shared/navbar/navbar.component';
import { ToastComponent } from './features/shared/toast/toast.component';
import {HttpClientModule} from "@angular/common/http";


@Component({
  selector: 'app-root',
  standalone: true,
    imports: [RouterOutlet, NavbarComponent, ToastComponent,    HttpClientModule, // ← Must be here
    ],
  template: `
    <app-navbar />
    <main class="main-content">
        <router-outlet></router-outlet> 
    </main>
    <app-toast />
  `,
  styles: [`
    .main-content {
      margin-top: auto;
      min-height: 100vh;
    }
  `]
})
export class AppComponent {}
