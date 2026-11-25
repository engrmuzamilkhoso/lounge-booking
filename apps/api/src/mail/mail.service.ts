import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { Environment } from '../config/environment.js';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  /** Set to show the attachment inside the HTML as `<img src="cid:…">`. */
  contentId?: string;
}

export interface EmailContent {
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Sends email over SMTP.
 *
 * Sending never fails the caller's request: a booking or registration is already saved when
 * its email goes out, so a mail outage is logged instead of being reported as a failed request
 * (same outcome as Laravel's queued mail, without a separate queue worker to keep alive).
 *
 * When SMTP_HOST is empty (local development) messages are logged instead of sent.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly staffAddresses: string[];

  constructor(configService: ConfigService<Environment, true>) {
    this.fromAddress = configService.get('MAIL_FROM', { infer: true });
    this.staffAddresses = configService.get('STAFF_NOTIFICATION_EMAILS', { infer: true });

    const smtpHost = configService.get('SMTP_HOST', { infer: true });
    if (smtpHost === '') {
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: configService.get('SMTP_PORT', { infer: true }),
      secure: configService.get('SMTP_SECURE', { infer: true }),
      auth: {
        user: configService.get('SMTP_USER', { infer: true }),
        pass: configService.get('SMTP_PASSWORD', { infer: true }),
      },
    });
  }

  async send(recipients: string[], content: EmailContent): Promise<void> {
    const uniqueRecipients = [...new Set(recipients)];
    if (uniqueRecipients.length === 0) {
      return;
    }

    if (this.transporter === null) {
      this.logger.log(
        {
          to: uniqueRecipients,
          subject: content.subject,
          html: content.html,
          attachments: content.attachments?.map((attachment) => attachment.filename),
        },
        'Email not sent (SMTP_HOST is empty)',
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: uniqueRecipients,
        subject: content.subject,
        html: content.html,
        attachments: content.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
          cid: attachment.contentId,
        })),
      });
    } catch (error) {
      this.logger.error(
        { err: error, to: uniqueRecipients, subject: content.subject },
        'Email sending failed',
      );
    }
  }

  /** Sends to the staff notification list (Laravel `config/emails.php`), plus any extra recipients. */
  async sendToStaff(content: EmailContent, additionalRecipients: string[] = []): Promise<void> {
    await this.send([...this.staffAddresses, ...additionalRecipients], content);
  }
}
