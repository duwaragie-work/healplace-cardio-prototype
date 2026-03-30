import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as dns from 'dns'
import * as nodemailer from 'nodemailer'

dns.setDefaultResultOrder('ipv4first')

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly transporter: nodemailer.Transporter
  private readonly from: string

  constructor(private readonly config: ConfigService) {
    const port = Number(this.config.get<string>('SMTP_PORT', '465'))
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
    })

    this.from = this.config.get<string>(
      'SMTP_FROM',
      'Healplace <no-reply@healplace.com>',
    )
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html })
      this.logger.log(`Email sent to ${to} — subject: ${subject}`)
    } catch (error) {
      this.logger.error(
        `Email failed for ${to}`,
        error instanceof Error ? error.message : error,
      )
    }
  }
}
