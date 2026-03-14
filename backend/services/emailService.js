const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Send email
  async sendEmail(options) {
    try {
      let html = options.html;
      let text = options.text;
      
      // Use template if specified
      if (options.template) {
        const template = this.getTemplate(options.template, options.data);
        html = template.html;
        text = template.text;
      }
      
      const mailOptions = {
        from: `"AUTOLIVE" <${process.env.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        text: text || 'Please enable HTML to view this email',
        html: html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }
  
  // Get email template
  getTemplate(name, data = {}) {
    switch (name) {
      case 'verification':
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Verifikasi Email AUTOLIVE</h1>
                </div>
                <div class="content">
                  <h2>Halo ${data.name || 'Pengguna'}!</h2>
                  <p>Terima kasih telah mendaftar di AUTOLIVE. Untuk menyelesaikan pendaftaran, silakan verifikasi email Anda dengan mengklik tombol di bawah ini:</p>
                  <p style="text-align: center;">
                    <a href="${data.verificationLink}" class="button">Verifikasi Email</a>
                  </p>
                  <p>Atau copy link berikut ke browser Anda:</p>
                  <p>${data.verificationLink}</p>
                  <p>Link ini akan kadaluarsa dalam 24 jam.</p>
                  <p>Jika Anda tidak mendaftar di AUTOLIVE, abaikan email ini.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 AUTOLIVE. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            Verifikasi Email AUTOLIVE
            
            Halo ${data.name || 'Pengguna'}!
            
            Terima kasih telah mendaftar di AUTOLIVE. Untuk menyelesaikan pendaftaran, silakan verifikasi email Anda dengan mengklik link berikut:
            
            ${data.verificationLink}
            
            Link ini akan kadaluarsa dalam 24 jam.
            
            Jika Anda tidak mendaftar di AUTOLIVE, abaikan email ini.
          `
        };
        
      case 'password-reset':
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 10px 20px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Reset Password AUTOLIVE</h1>
                </div>
                <div class="content">
                  <h2>Halo ${data.name || 'Pengguna'}!</h2>
                  <p>Kami menerima permintaan untuk mereset password akun AUTOLIVE Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
                  <p style="text-align: center;">
                    <a href="${data.resetLink}" class="button">Reset Password</a>
                  </p>
                  <p>Atau copy link berikut ke browser Anda:</p>
                  <p>${data.resetLink}</p>
                  <p>Link ini akan kadaluarsa dalam 1 jam.</p>
                  <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 AUTOLIVE. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            Reset Password AUTOLIVE
            
            Halo ${data.name || 'Pengguna'}!
            
            Kami menerima permintaan untuk mereset password akun AUTOLIVE Anda. Klik link berikut untuk membuat password baru:
            
            ${data.resetLink}
            
            Link ini akan kadaluarsa dalam 1 jam.
            
            Jika Anda tidak meminta reset password, abaikan email ini.
          `
        };
        
      case 'upload-success':
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .success { color: #28a745; font-weight: bold; }
                .video-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Upload Berhasil!</h1>
                </div>
                <div class="content">
                  <h2 class="success">Video berhasil diupload ke ${data.platform}</h2>
                  
                  <div class="video-info">
                    <h3>${data.title}</h3>
                    <p><strong>Platform:</strong> ${data.platform}</p>
                    <p><strong>Waktu:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Link:</strong> <a href="${data.url}">${data.url}</a></p>
                  </div>
                  
                  <p>Login ke dashboard AUTOLIVE untuk melihat statistik video Anda.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 AUTOLIVE. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            ✅ Upload Berhasil!
            
            Video berhasil diupload ke ${data.platform}
            
            Judul: ${data.title}
            Platform: ${data.platform}
            Waktu: ${new Date().toLocaleString()}
            Link: ${data.url}
            
            Login ke dashboard AUTOLIVE untuk melihat statistik video Anda.
          `
        };
        
      case 'upload-failed':
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .error { color: #dc3545; font-weight: bold; }
                .video-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>❌ Upload Gagal</h1>
                </div>
                <div class="content">
                  <h2 class="error">Video gagal diupload ke ${data.platform}</h2>
                  
                  <div class="video-info">
                    <h3>${data.title}</h3>
                    <p><strong>Platform:</strong> ${data.platform}</p>
                    <p><strong>Waktu:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Error:</strong> ${data.error}</p>
                  </div>
                  
                  <p>Login ke dashboard AUTOLIVE untuk mencoba lagi atau melihat detail error.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 AUTOLIVE. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            ❌ Upload Gagal
            
            Video gagal diupload ke ${data.platform}
            
            Judul: ${data.title}
            Platform: ${data.platform}
            Waktu: ${new Date().toLocaleString()}
            Error: ${data.error}
            
            Login ke dashboard AUTOLIVE untuk mencoba lagi atau melihat detail error.
          `
        };
        
      case 'daily-report':
        return {
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .stats { display: flex; justify-content: space-between; margin: 20px 0; }
                .stat-box { background: white; padding: 15px; border-radius: 5px; text-align: center; flex: 1; margin: 0 5px; }
                .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
                .stat-label { font-size: 12px; color: #666; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Laporan Harian AUTOLIVE</h1>
                  <p>${data.date}</p>
                </div>
                <div class="content">
                  <h2>Ringkasan Aktivitas</h2>
                  
                  <div class="stats">
                    <div class="stat-box">
                      <div class="stat-value">${data.stats.uploads}</div>
                      <div class="stat-label">Total Upload</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value">${data.stats.success}</div>
                      <div class="stat-label">Berhasil</div>
                    </div>
                    <div class="stat-box">
                      <div class="stat-value">${data.stats.failed}</div>
                      <div class="stat-label">Gagal</div>
                    </div>
                  </div>
                  
                  <h3>Detail Upload</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #667eea; color: white;">
                      <th style="padding: 10px;">Judul</th>
                      <th style="padding: 10px;">Platform</th>
                      <th style="padding: 10px;">Status</th>
                      <th style="padding: 10px;">Waktu</th>
                    </tr>
                    ${data.uploads.map(u => `
                      <tr style="border-bottom: 1px solid #ddd;">
                        <td style="padding: 10px;">${u.title}</td>
                        <td style="padding: 10px;">${u.platform}</td>
                        <td style="padding: 10px; color: ${u.status === 'success' ? '#28a745' : '#dc3545'};">${u.status}</td>
                        <td style="padding: 10px;">${u.time}</td>
                      </tr>
                    `).join('')}
                  </table>
                  
                  <p style="margin-top: 20px;">Login ke dashboard untuk melihat laporan lengkap.</p>
                </div>
                <div class="footer">
                  <p>&copy; 2024 AUTOLIVE. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
            📊 Laporan Harian AUTOLIVE
            Tanggal: ${data.date}
            
            Ringkasan Aktivitas:
            Total Upload: ${data.stats.uploads}
            Berhasil: ${data.stats.success}
            Gagal: ${data.stats.failed}
            
            Detail Upload:
            ${data.uploads.map(u => `- ${u.title} (${u.platform}): ${u.status}`).join('\n')}
            
            Login ke dashboard untuk melihat laporan lengkap.
          `
        };
        
      default:
        return {
          html: '<p>No template found</p>',
          text: 'No template found'
        };
    }
  }
  
  // Send verification email
  async sendVerificationEmail(email, name, token) {
    return this.sendEmail({
      to: email,
      subject: 'Verifikasi Email AUTOLIVE',
      template: 'verification',
      data: {
        name,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${token}`
      }
    });
  }
  
  // Send password reset email
  async sendPasswordResetEmail(email, name, token) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Password AUTOLIVE',
      template: 'password-reset',
      data: {
        name,
        resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${token}`
      }
    });
  }
  
  // Send upload success notification
  async sendUploadSuccessEmail(email, data) {
    return this.sendEmail({
      to: email,
      subject: '✅ Upload Berhasil - AUTOLIVE',
      template: 'upload-success',
      data
    });
  }
  
  // Send upload failed notification
  async sendUploadFailedEmail(email, data) {
    return this.sendEmail({
      to: email,
      subject: '❌ Upload Gagal - AUTOLIVE',
      template: 'upload-failed',
      data
    });
  }
  
  // Send daily report
  async sendDailyReport(email, data) {
    return this.sendEmail({
      to: email,
      subject: `📊 Laporan Harian AUTOLIVE - ${data.date}`,
      template: 'daily-report',
      data
    });
  }
}

module.exports = new EmailService();
