import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    this.fromAddress = this.config.get<string>('SMTP_FROM', 'noreply@ssm-app.ro');

    if (host && port) {
      const user = this.config.get<string>('SMTP_USER');
      const pass = this.config.get<string>('SMTP_PASSWORD');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        ...(user && pass ? { auth: { user, pass } } : {}),
      });

      this.logger.log(`Email transport configurat: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP nu este configurat — emailurile vor fi ignorate');
    }
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email ignorat (SMTP neconfigurat): ${options.subject} → ${options.to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email trimis: ${options.subject} → ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Eroare la trimiterea emailului: ${error}`);
      return false;
    }
  }
}
