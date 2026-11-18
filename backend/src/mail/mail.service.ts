import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async sendNoteShareEmail(
    to: string,
    noteTitle: string,
    link: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'AI Notes <powiadomienia@zmax-dev.pl>',
      to,
      subject: `Udostępniono ci notatke ${noteTitle}`,
      html: `
        <p>Ktoś udostępnił Ci notatkę „${noteTitle}”.</p>
        <p><a href="${link}">Otwórz notatkę</a></p>
        <p>Nie musisz mieć konta, żeby ją zobaczyć — a jeśli chcesz zachować dostęp na stałe, możesz je założyć tym samym adresem e-mail.</p>
      `,
    });
  }

  async sendProjectShareEmail(
    to: string,
    projectName: string,
    link: string,
  ): Promise<void> {
    await this.resend.emails.send({
      from: 'AI Notes <powiadomienia@zmax-dev.pl>',
      to,
      subject: `Zaproszenie do projektu ${projectName}`,
      html: `
        <p>Ktoś zaprosił Cię do projektu „${projectName}”.</p>
        <p><a href="${link}">Zobacz zaproszenie</a></p>
        <p>Żeby dołączyć, musisz się zalogować lub założyć konto tym samym adresem e-mail.</p>
      `,
    });
  }
}
