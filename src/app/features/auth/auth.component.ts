import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type Tab = 'login' | 'register';
type Role = 'artist' | 'shikues';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, NgClass, NgIf],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  private authSvc = inject(AuthService);
  private router  = inject(Router);
  private toast   = inject(ToastService);

  tab = signal<Tab>('login');
    currentYear = new Date().getFullYear();

  // Login
  loginEmail    = '';
  loginPwd      = '';
  loginErr      = '';
  loginLoading  = false;
  showLoginPwd  = false;

  // Register
  regEmri     = '';
  regMbiemri  = '';
  regEmail    = '';
  regPwd      = '';
  regErr      = '';
  regLoading  = false;
  showRegPwd  = false;
  selectedRole: Role = 'artist';
  pwdStrength = 0;
  pwdLabel    = '';
  pwdColor    = '';

  // Reset
  resetEmail   = '';
  showReset    = false;
  resetLoading = false;

  setTab(t: Tab) { this.tab.set(t); this.loginErr = ''; this.regErr = ''; }

  selectRole(r: Role) { this.selectedRole = r; }

  onPwdInput(val: string) {
    let s = 0;
    if (val.length >= 6)  s += 25;
    if (val.length >= 10) s += 25;
    if (/[A-Z]/.test(val)) s += 25;
    if (/[0-9!@#$%^&*]/.test(val)) s += 25;
    this.pwdStrength = s;
    const idx = Math.floor(s/25) - 1;
    const labels = ['E dobët','Mesatare','Mirë','E fortë'];
    const colors = ['#e07070','#e0a070','#a0c060','#70c97a'];
    this.pwdLabel = labels[idx] ?? '';
    this.pwdColor = colors[idx] ?? 'transparent';
  }

  async login() {
    this.loginErr = '';
    if (!this.loginEmail || !this.loginPwd) { this.loginErr = 'Plotëso të gjitha fushat.'; return; }
    this.loginLoading = true;
    try {
      await this.authSvc.login(this.loginEmail, this.loginPwd);
      this.router.navigate(['/']);
    } catch(e: any) {
      this.loginErr = this.authSvc.mapError(e.code);
    }
    this.loginLoading = false;
  }

  async register() {
    this.regErr = '';
    if (!this.regEmri||!this.regMbiemri||!this.regEmail||!this.regPwd) {
      this.regErr = 'Plotëso të gjitha fushat.'; return;
    }
    if (this.regPwd.length < 6) { this.regErr = 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.'; return; }
    this.regLoading = true;
    try {
      await this.authSvc.register(this.regEmri, this.regMbiemri, this.regEmail, this.regPwd, this.selectedRole);
      this.router.navigate(['/']);
    } catch(e: any) {
      this.regErr = this.authSvc.mapError(e.code);
    }
    this.regLoading = false;
  }

  async sendReset() {
    if (!this.resetEmail) return;
    this.resetLoading = true;
    try {
      await this.authSvc.resetPassword(this.resetEmail);
      this.toast.success('Linku u dërgua në emailin tuaj!');
      this.showReset = false;
    } catch {
      this.toast.error('Email i pavlefshëm ose jo i regjistruar.');
    }
    this.resetLoading = false;
  }
}
