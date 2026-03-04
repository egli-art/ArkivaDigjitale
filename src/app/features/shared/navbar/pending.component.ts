import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {ToastService} from "../../../core/services/toast.service";
import {AuthService} from "../../../core/services/auth.service";

@Component({
    selector: 'app-pending',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="pending-page">
      <div class="pending-card" [class.approved]="justApproved">

        <!-- ── Approved state ── -->
        <ng-container *ngIf="justApproved">
          <div class="pc-icon">🎉</div>
          <h1>Llogaria juaj u aprovua!</h1>
          <p>Urime! Tani po ju ridrejtojmë në platformë...</p>
          <div class="pc-loader">
            <div class="loader-bar"></div>
          </div>
        </ng-container>

        <!-- ── Waiting state ── -->
        <ng-container *ngIf="!justApproved">
          <div class="pc-icon">⏳</div>
          <h1>Llogaria juaj është në pritje</h1>
          <p>
            Regjistrimi juaj si <strong>Artist / Autor</strong> u pranua me sukses.<br>
            Ekipi ynë do ta shqyrtojë dhe aprovojë llogarinë tuaj brenda <strong>24–48 orëve</strong>.
          </p>
          <p class="pc-email">{{ email }}</p>

          <div class="pc-steps">
            <div class="step step--done">
              <div class="st-dot"></div>
              <span>Regjistrim i përfunduar</span>
            </div>
            <div class="step step--active">
              <div class="st-dot"></div>
              <span>Shqyrtim nga administratori</span>
            </div>
            <div class="step">
              <div class="st-dot"></div>
              <span>Akses i plotë në platformë</span>
            </div>
          </div>

          <p class="pc-hint">
            Do të merrni një email sapo llogaria të aprovohet. Kjo faqe do të përditësohet automatikisht.
          </p>

          <button class="btn-logout" (click)="logout()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Dil nga llogaria
          </button>
        </ng-container>

      </div>
    </div>
  `,
    styles: [`
    .pending-page {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; background: #07070f; padding: 2rem;
      font-family: 'DM Sans', system-ui, sans-serif;
    }

    .pending-card {
      background: #0e0e1c; border: 1px solid rgba(201,168,76,.2);
      border-radius: 24px; padding: 3rem 2.5rem;
      max-width: 480px; width: 100%; text-align: center;
      box-shadow: 0 24px 80px rgba(0,0,0,.4);
      transition: border-color .4s;
      &.approved {
        border-color: rgba(109,191,114,.35);
        box-shadow: 0 0 60px rgba(109,191,114,.08);
      }
    }

    .pc-icon {
      font-size: 3.5rem; margin-bottom: 1.5rem;
      animation: pulse 2s ease infinite;
      display: block;
    }

    h1 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.8rem; font-weight: 400; color: #f0ece2;
      margin-bottom: 1rem; line-height: 1.2;
    }

    p { font-size: .9rem; color: #9494b0; line-height: 1.75; margin-bottom: .75rem; }
    p strong { color: #e8c97a; font-weight: 600; }

    .pc-email {
      font-size: .82rem; color: #6e6e8a;
      font-family: 'Courier New', monospace;
      background: rgba(255,255,255,.03);
      border: 1px solid rgba(201,168,76,.1); border-radius: 8px;
      padding: .5rem 1rem; margin: 1rem 0 1.75rem;
      display: inline-block;
    }

    .pc-hint {
      font-size: .78rem; color: #4a4a62; font-style: italic;
      margin: 0 0 2rem;
    }

    .pc-steps {
      display: flex; flex-direction: column; gap: .65rem;
      text-align: left; margin-bottom: 1.75rem;
      background: rgba(255,255,255,.02); border-radius: 14px;
      padding: 1.25rem 1.5rem;
      border: 1px solid rgba(201,168,76,.08);
    }

    .step {
      display: flex; align-items: center; gap: .85rem;
      font-size: .83rem; color: #4a4a62;
      &--done   { color: #6dbf72; }
      &--active { color: #e8c97a; }
    }

    .st-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      background: #252548; border: 2px solid #4a4a62;
      .step--done  & { background: #6dbf72; border-color: #6dbf72; box-shadow: 0 0 8px rgba(109,191,114,.4); }
      .step--active & {
        background: #e8c97a; border-color: #e8c97a;
        box-shadow: 0 0 8px rgba(232,201,122,.4);
        animation: pulse-dot 1.5s ease infinite;
      }
    }

    .btn-logout {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .65rem 1.4rem; border-radius: 10px;
      border: 1px solid rgba(201,168,76,.2); background: none;
      color: #6e6e8a; font-size: .84rem; cursor: pointer;
      font-family: 'DM Sans', system-ui, sans-serif;
      transition: border-color .2s, color .2s;
      &:hover { border-color: rgba(224,112,112,.4); color: #e07070; }
    }

    /* Approved redirect state */
    .pc-loader {
      height: 3px; background: rgba(109,191,114,.15);
      border-radius: 99px; overflow: hidden; margin-top: 2rem;
    }
    .loader-bar {
      height: 100%; background: #6dbf72; border-radius: 99px;
      animation: fill-bar 1.8s ease forwards;
    }

    @keyframes pulse      { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    @keyframes pulse-dot  { 0%,100% { box-shadow: 0 0 8px rgba(232,201,122,.4); } 50% { box-shadow: 0 0 16px rgba(232,201,122,.7); } }
    @keyframes fill-bar   { from { width: 0; } to { width: 100%; } }
  `]
})
export class PendingComponent implements OnInit, OnDestroy {
    private auth   = inject(AuthService);
    private router = inject(Router);
    private toast  = inject(ToastService);

    justApproved = false;
    private sub!: Subscription;

    get email() { return this.auth.currentUser?.email ?? ''; }

    ngOnInit() {
        // Subscribe to real-time profile updates from onSnapshot in AuthService
        this.sub = this.auth.profile$.subscribe(profile => {
            if (!profile) return;

            // Artist just got approved → show success then redirect
            if (profile.roli === 'artist' && (profile as any).approved) {
                this.justApproved = true;
                this.toast.success('Llogaria juaj u aprovua! Po ju ridrejtojmë...');
                // Give user 1.8s to see the success animation then navigate
                setTimeout(() => this.router.navigate(['/']), 1800);
            }
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    async logout() {
        await this.auth.logout();
        this.router.navigate(['/auth']);
        this.toast.success('Doli me sukses.');
    }
}
