/**
 * EmailService — dërgon email direkt nga Angular pa Firebase Functions.
 * Përdor EmailJS (emailjs.com) — falas deri 200 email/muaj.
 *
 * SETUP (1 herë):
 *   1. Shko te https://www.emailjs.com dhe krijo llogari falas
 *   2. Add Service → Gmail → lidh llogarinë tënde Gmail
 *   3. Email Templates → krijo template me variablat: {{to_email}}, {{to_name}}, {{subject}}, {{message}}
 *   4. Merr: SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY
 *   5. Vendosi në environment.ts (shiko poshtë)
 */
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailService {

  private readonly serviceId  = (environment as any).emailjs?.serviceId  ?? '';
  private readonly templateId = (environment as any).emailjs?.templateId ?? '';
  private readonly publicKey  = (environment as any).emailjs?.publicKey  ?? '';

  async sendApprovalEmail(toEmail: string, toName: string): Promise<void> {
    await this.send(toEmail, toName,
      '🎨 Llogaria juaj u aprovua — Arkiva Digjitale',
      `Urime ${toName}! Llogaria juaj si Artist/Autor u aprovua. Hyni te: https://arkiva-digjitale.web.app`
    );
  }

  async sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
    await this.send(toEmail, toName,
      '🎉 Mirë se vini në Arkiva Digjitale!',
      `Mirë se vini ${toName}! Llogaria juaj u krijua me sukses.`
    );
  }

  async sendPendingEmail(toEmail: string, toName: string): Promise<void> {
    await this.send(toEmail, toName,
      '⏳ Regjistrimi juaj u pranua — Arkiva Digjitale',
      `Faleminderit ${toName}! Regjistrimi juaj si Artist u pranua. Do të merrni email sapo të aprovohet llogaria.`
    );
  }

  private async send(
    toEmail: string,
    toName:  string,
    subject: string,
    message: string
  ): Promise<void> {
    if (!this.serviceId || !this.publicKey) {
      throw new Error('EmailJS nuk është konfiguruar. Shto emailjs në environment.ts');
    }

    const params = {
      service_id:  this.serviceId,
      template_id: this.templateId,
      user_id:     this.publicKey,
      template_params: { to_email: toEmail, to_name: toName, subject, message },
    };

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(params),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`EmailJS error ${res.status}: ${txt}`);
    }
  }
}
