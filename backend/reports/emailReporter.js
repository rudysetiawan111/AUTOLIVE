const emailService = require('../services/emailService');
const reportGenerator = require('./reportGenerator');
const UploadReport = require('../models/UploadReport');
const Execution = require('../models/Execution');
const cron = require('node-cron');

class EmailReporter {
  constructor() {
    this.scheduledReports = new Map();
  }

  async sendExecutionReport(executionId) {
    try {
      const execution = await Execution.findOne({ executionId });
      if (!execution) {
        throw new Error(`Execution not found: ${executionId}`);
      }

      // Generate PDF report
      const reportPath = await reportGenerator.generateExecutionReport(
        execution,
        execution.result || {}
      );

      // Prepare email data
      const reportData = {
        executionId: execution.executionId,
        workflowName: execution.workflowName,
        startTime: execution.startTime,
        endTime: execution.endTime,
        status: execution.status,
        videosProcessed: execution.result?.videosDiscovered || 0,
        videosDownloaded: execution.result?.videosDownloaded || 0,
        videosUploaded: execution.result?.videosUploaded || 0,
        errors: execution.result?.errors || [],
        summary: this.generateSummary(execution),
        reportPath
      };

      // Send email
      await emailService.sendReportEmail(reportData);

      return { success: true, executionId };
    } catch (error) {
      console.error('Error sending execution report:', error);
      throw error;
    }
  }

  async sendDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's data
      const executions = await Execution.find({
        startTime: { $gte: today, $lt: tomorrow }
      });

      const uploads = await UploadReport.find({
        createdAt: { $gte: today, $lt: tomorrow }
      });

      // Generate report
      const reportPath = await reportGenerator.generateDailyReport();

      // Prepare summary
      const summary = {
        date: today.toLocaleDateString(),
        executions: {
          total: executions.length,
          completed: executions.filter(e => e.status === 'completed').length,
          failed: executions.filter(e => e.status === 'failed').length,
          running: executions.filter(e => e.status === 'running').length
        },
        uploads: {
          total: uploads.length,
          successful: uploads.filter(u => u.status === 'completed').length,
          failed: uploads.filter(u => u.status === 'failed').length
        },
        performance: this.calculatePerformance(executions, uploads)
      };

      // Create HTML email content
      const htmlContent = this.generateDailySummaryHTML(summary);

      // Send email
      await emailService.transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: `📊 AUTOLIVE Daily Summary - ${today.toLocaleDateString()}`,
        html: htmlContent,
        attachments: [
          {
            filename: `daily_report_${today.toISOString().split('T')[0]}.pdf`,
            path: reportPath
          }
        ]
      });

      return { success: true, date: today };
    } catch (error) {
      console.error('Error sending daily summary:', error);
      throw error;
    }
  }

  async sendWeeklyReport() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Get weekly data
      const executions = await Execution.find({
        startTime: { $gte: startDate, $lt: endDate }
      });

      const uploads = await UploadReport.find({
        createdAt: { $gte: startDate, $lt: endDate }
      });

      // Calculate statistics
      const stats = {
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalExecutions: executions.length,
        successRate: this.calculateSuccessRate(executions),
        totalUploads: uploads.length,
        videosByPlatform: this.groupByPlatform(uploads),
        dailyAverage: Math.round(uploads.length / 7),
        topPerforming: await this.getTopPerformingVideos(7)
      };

      // Generate PDF report
      const reportPath = await reportGenerator.generateAnalyticsReport(stats, 'weekly');

      // Send email
      await emailService.transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: `📈 AUTOLIVE Weekly Performance Report`,
        html: this.generateWeeklyReportHTML(stats),
        attachments: [
          {
            filename: `weekly_report_${Date.now()}.pdf`,
            path: reportPath
          }
        ]
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending weekly report:', error);
      throw error;
    }
  }

  async sendMonthlyReport() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      // Get monthly data
      const executions = await Execution.find({
        startTime: { $gte: startDate, $lt: endDate }
      });

      const uploads = await UploadReport.find({
        createdAt: { $gte: startDate, $lt: endDate }
      });

      // Calculate comprehensive statistics
      const stats = {
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        totalExecutions: executions.length,
        executionsByStatus: this.groupByStatus(executions),
        totalUploads: uploads.length,
        uploadsByPlatform: this.groupByPlatform(uploads),
        uploadsByDay: this.groupByDay(uploads, 30),
        totalViews: uploads.reduce((sum, u) => sum + (u.statistics?.views || 0), 0),
        totalEngagement: uploads.reduce((sum, u) => sum + (u.statistics?.likes || 0) + (u.statistics?.comments || 0), 0),
        averageEngagementRate: this.calculateAvgEngagementRate(uploads),
        topVideos: await this.getTopPerformingVideos(10),
        growth: this.calculateGrowth(uploads)
      };

      // Generate PDF report
      const reportPath = await reportGenerator.generateAnalyticsReport(stats, 'monthly');

      // Send email
      await emailService.transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: `📊 AUTOLIVE Monthly Performance Report`,
        html: this.generateMonthlyReportHTML(stats),
        attachments: [
          {
            filename: `monthly_report_${Date.now()}.pdf`,
            path: reportPath
          }
        ]
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending monthly report:', error);
      throw error;
    }
  }

  async sendAlert(alertType, data) {
    try {
      await emailService.sendAlertEmail(alertType, data);
      return { success: true };
    } catch (error) {
      console.error('Error sending alert:', error);
      throw error;
    }
  }

  scheduleReport(reportType, schedule) {
    const jobId = `${reportType}_${Date.now()}`;
    
    let cronExpression;
    switch (schedule) {
      case 'daily':
        cronExpression = '0 9 * * *'; // 9 AM every day
        break;
      case 'weekly':
        cronExpression = '0 9 * * 1'; // 9 AM every Monday
        break;
      case 'monthly':
        cronExpression = '0 9 1 * *'; // 9 AM on the 1st of every month
        break;
      default:
        cronExpression = schedule;
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        switch (reportType) {
          case 'daily':
            await this.sendDailySummary();
            break;
          case 'weekly':
            await this.sendWeeklyReport();
            break;
          case 'monthly':
            await this.sendMonthlyReport();
            break;
        }
        console.log(`Scheduled ${reportType} report sent successfully`);
      } catch (error) {
        console.error(`Error sending scheduled ${reportType} report:`, error);
      }
    });

    this.scheduledReports.set(jobId, {
      job,
      reportType,
      schedule,
      createdAt: new Date()
    });

    return jobId;
  }

  cancelReport(jobId) {
    const job = this.scheduledReports.get(jobId);
    if (job) {
      job.job.stop();
      this.scheduledReports.delete(jobId);
      return true;
    }
    return false;
  }

  generateSummary(execution) {
    const result = execution.result || {};
    const successRate = result.videosUploaded / Math.max(result.videosDiscovered, 1) * 100;
    
    return `Workflow ${execution.workflowName} completed with ${result.videosUploaded} videos uploaded. Success rate: ${successRate.toFixed(2)}%`;
  }

  calculatePerformance(executions, uploads) {
    const totalViews = uploads.reduce((sum, u) => sum + (u.statistics?.views || 0), 0);
    const totalLikes = uploads.reduce((sum, u) => sum + (u.statistics?.likes || 0), 0);
    const totalComments = uploads.reduce((sum, u) => sum + (u.statistics?.comments || 0), 0);

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalEngagement: totalLikes + totalComments
    };
  }

  calculateSuccessRate(executions) {
    if (executions.length === 0) return 0;
    const completed = executions.filter(e => e.status === 'completed').length;
    return (completed / executions.length) * 100;
  }

  groupByPlatform(uploads) {
    const groups = {};
    uploads.forEach(upload => {
      const platform = upload.platform || 'unknown';
      if (!groups[platform]) {
        groups[platform] = 0;
      }
      groups[platform]++;
    });
    return groups;
  }

  groupByStatus(executions) {
    const groups = {};
    executions.forEach(exec => {
      const status = exec.status || 'unknown';
      if (!groups[status]) {
        groups[status] = 0;
      }
      groups[status]++;
    });
    return groups;
  }

  groupByDay(uploads, days) {
    const groups = {};
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      groups[dateStr] = 0;
    }

    uploads.forEach(upload => {
      const date = new Date(upload.createdAt).toISOString().split('T')[0];
      if (groups[date] !== undefined) {
        groups[date]++;
      }
    });

    return groups;
  }

  async getTopPerformingVideos(limit = 5) {
    const videos = await Video.find({
      'statistics.views': { $gt: 0 }
    })
    .sort({ 'statistics.views': -1 })
    .limit(limit)
    .select('title platform statistics uploadedAt');

    return videos.map(v => ({
      title: v.title,
      platform: v.platform,
      views: v.statistics?.views || 0,
      likes: v.statistics?.likes || 0,
      uploadDate: v.uploadedAt
    }));
  }

  calculateAvgEngagementRate(uploads) {
    if (uploads.length === 0) return 0;
    
    let totalRate = 0;
    let count = 0;

    uploads.forEach(upload => {
      const views = upload.statistics?.views || 0;
      const likes = upload.statistics?.likes || 0;
      const comments = upload.statistics?.comments || 0;
      
      if (views > 0) {
        const rate = ((likes + comments) / views) * 100;
        totalRate += rate;
        count++;
      }
    });

    return count > 0 ? totalRate / count : 0;
  }

  calculateGrowth(uploads) {
    const midPoint = Math.floor(uploads.length / 2);
    const firstHalf = uploads.slice(0, midPoint);
    const secondHalf = uploads.slice(midPoint);

    const firstHalfViews = firstHalf.reduce((sum, u) => sum + (u.statistics?.views || 0), 0);
    const secondHalfViews = secondHalf.reduce((sum, u) => sum + (u.statistics?.views || 0), 0);

    const growth = firstHalfViews > 0 
      ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 
      : 0;

    return {
      percentage: growth,
      positive: growth > 0
    };
  }

  generateDailySummaryHTML(summary) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .metric { display: inline-block; width: 45%; margin: 5px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 12px; color: #6c757d; }
          .success { color: #28a745; }
          .warning { color: #ffc107; }
          .danger { color: #dc3545; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 AUTOLIVE Daily Summary</h1>
            <p>${summary.date}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Execution Summary</h2>
              <div>
                <div class="metric">
                  <div class="metric-value">${summary.executions.total}</div>
                  <div class="metric-label">Total Executions</div>
                </div>
                <div class="metric">
                  <div class="metric-value success">${summary.executions.completed}</div>
                  <div class="metric-label">Completed</div>
                </div>
                <div class="metric">
                  <div class="metric-value danger">${summary.executions.failed}</div>
                  <div class="metric-label">Failed</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Upload Summary</h2>
              <div>
                <div class="metric">
                  <div class="metric-value">${summary.uploads.total}</div>
                  <div class="metric-label">Total Uploads</div>
                </div>
                <div class="metric">
                  <div class="metric-value success">${summary.uploads.successful}</div>
                  <div class="metric-label">Successful</div>
                </div>
                <div class="metric">
                  <div class="metric-value danger">${summary.uploads.failed}</div>
                  <div class="metric-label">Failed</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Performance Metrics</h2>
              <div>
                <div class="metric">
                  <div class="metric-value">${summary.performance.totalViews.toLocaleString()}</div>
                  <div class="metric-label">Total Views</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${summary.performance.totalEngagement.toLocaleString()}</div>
                  <div class="metric-label">Total Engagement</div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated daily summary from AUTOLIVE System</p>
              <p>© ${new Date().getFullYear()} AUTOLIVE. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWeeklyReportHTML(stats) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 AUTOLIVE Weekly Report</h1>
            <p>${stats.period}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Weekly Overview</h2>
              <p><strong>Total Executions:</strong> ${stats.totalExecutions}</p>
              <p><strong>Success Rate:</strong> ${stats.successRate.toFixed(2)}%</p>
              <p><strong>Total Uploads:</strong> ${stats.totalUploads}</p>
              <p><strong>Daily Average:</strong> ${stats.dailyAverage}</p>
            </div>

            <div class="section">
              <h2>Uploads by Platform</h2>
              <table>
                <tr>
                  <th>Platform</th>
                  <th>Videos</th>
                </tr>
                ${Object.entries(stats.videosByPlatform).map(([platform, count]) => `
                  <tr>
                    <td>${platform}</td>
                    <td>${count}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="section">
              <h2>Top Performing Videos</h2>
              <table>
                <tr>
                  <th>Title</th>
                  <th>Platform</th>
                  <th>Views</th>
                </tr>
                ${stats.topPerforming.map(video => `
                  <tr>
                    <td>${video.title}</td>
                    <td>${video.platform}</td>
                    <td>${video.views.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </table>
            </div>

            <div class="footer">
              <p>View the attached PDF for detailed analytics</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateMonthlyReportHTML(stats) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .growth-positive { color: #28a745; font-weight: bold; }
          .growth-negative { color: #dc3545; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 AUTOLIVE Monthly Report</h1>
            <p>${stats.period}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>Monthly Highlights</h2>
              <p><strong>Total Executions:</strong> ${stats.totalExecutions}</p>
              <p><strong>Total Uploads:</strong> ${stats.totalUploads}</p>
              <p><strong>Total Views:</strong> ${stats.totalViews.toLocaleString()}</p>
              <p><strong>Total Engagement:</strong> ${stats.totalEngagement.toLocaleString()}</p>
              <p><strong>Average Engagement Rate:</strong> ${stats.averageEngagementRate.toFixed(2)}%</p>
              <p><strong>Growth:</strong> <span class="${stats.growth.positive ? 'growth-positive' : 'growth-negative'}">${stats.growth.percentage.toFixed(2)}%</span></p>
            </div>

            <div class="section">
              <h2>Executions by Status</h2>
              ${Object.entries(stats.executionsByStatus).map(([status, count]) => `
                <p><strong>${status}:</strong> ${count}</p>
              `).join('')}
            </div>

            <div class="section">
              <h2>Top 10 Videos This Month</h2>
              <ol>
                ${stats.topVideos.map(video => `
                  <li><strong>${video.title}</strong> - ${video.views.toLocaleString()} views (${video.platform})</li>
                `).join('')}
              </ol>
            </div>

            <div class="footer">
              <p>View the attached PDF for complete monthly analytics</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailReporter();
