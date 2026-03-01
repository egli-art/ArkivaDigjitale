import { Component, inject, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router }        from '@angular/router';
import { AuthService }   from '../../core/services/auth.service';
import { ToastService }  from '../../core/services/toast.service';
import { environment }   from '../../../environments/environment';

type Tab = 'login' | 'register';

@Component({
  selector:    'app-auth',
  standalone:  true,
  imports:     [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl:    './auth.component.scss',
})
export class AuthComponent {
  private fb     = inject(FormBuilder);
  private authSv = inject(AuthService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  /* ── Signals ─────────────────────────────────────────────── */
  tab          = signal<Tab>('login');
  showLoginPw  = signal(false);
  showRegPw    = signal(false);
  loginLoading = signal(false);
  regLoading   = signal(false);
  demoLoading  = signal(false);
  showReset    = signal(false);
  resetSent    = signal(false);
  loginErr     = signal('');
  regErr       = signal('');
  resetEmail   = '';

  readonly demo = environment.demoUser;

  /* ── Forms ───────────────────────────────────────────────── */
  loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  regForm = this.fb.group({
    emri:     ['', [Validators.required, Validators.minLength(2)]],
    mbiemri:  ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    roli:     ['shikues', Validators.required],
  });

  /* ── Password strength (plain getter — no signal issues) ── */
  get pwStrength(): { score: number; label: string; color: string } {
    const pw = (this.regForm.get('password')?.value ?? '') as string;
    if (!pw) return { score: 0, label: '', color: 'transparent' };
    let s = 0;
    if (pw.length >= 6)            s += 20;
    if (pw.length >= 10)           s += 20;
    if (/[A-Z]/.test(pw))         s += 20;
    if (/[0-9]/.test(pw))         s += 20;
    if (/[^a-zA-Z0-9]/.test(pw)) s += 20;
    if (s <= 20) return { score: s, label: 'Shumë e dobët', color: '#e07070' };
    if (s <= 40) return { score: s, label: 'E dobët',       color: '#e09060' };
    if (s <= 60) return { score: s, label: 'Mesatare',      color: '#e8c97a' };
    if (s <= 80) return { score: s, label: 'Mirë',          color: '#a0c870' };
    return              { score: s, label: 'Shumë e fortë', color: '#6dbf72' };
  }

  get pwLength(): number {
    return ((this.regForm.get('password')?.value ?? '') as string).length;
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  isInvalid(form: 'login' | 'reg', field: string): boolean {
    const ctrl = (form === 'login' ? this.loginForm : this.regForm).get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  setRole(r: string): void { this.regForm.get('roli')?.setValue(r); }

  /* ── Actions ─────────────────────────────────────────────── */
  async onLogin(): Promise<void> {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    this.loginErr.set(''); this.loginLoading.set(true);
    const { email, password } = this.loginForm.value;
    const r = await this.authSv.login(email!, password!);
    this.loginLoading.set(false);
    if (r.success) this.router.navigate(['/map']);
    else this.loginErr.set(r.error ?? '');
  }

  async onRegister(): Promise<void> {
    this.regForm.markAllAsTouched();
    if (this.regForm.invalid) return;
    this.regErr.set(''); this.regLoading.set(true);
    const { emri, mbiemri, email, password, roli } = this.regForm.value;
    const r = await this.authSv.register(
      emri!, mbiemri!, email!, password!, roli as 'artist' | 'shikues',
    );
    this.regLoading.set(false);
    if (r.success) { this.toast.success(`Mirë se vini, ${emri}!`); this.router.navigate(['/map']); }
    else this.regErr.set(r.error ?? '');
  }

  async loginDemo(): Promise<void> {
    this.demoLoading.set(true); this.loginErr.set('');
    const r = await this.authSv.loginDemo();
    this.demoLoading.set(false);
    if (r.success) { this.toast.success('Hyri si Demo Artist ✓'); this.router.navigate(['/map']); }
    else this.toast.error(r.error ?? 'Gabim demo login.');
  }

  async onReset(): Promise<void> {
    if (!this.resetEmail.trim()) return;
    const r = await this.authSv.resetPassword(this.resetEmail);
    if (r.success) this.resetSent.set(true);
    else this.toast.error(r.error ?? 'Gabim gjatë dërgimit.');
  }

  closeReset(): void {
    this.showReset.set(false); this.resetSent.set(false); this.resetEmail = '';
  }
}
