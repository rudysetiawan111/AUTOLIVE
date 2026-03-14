const cron = require('node-cron');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const workflowAutomation = require('./workflowAutomation');
const emailService = require('../services/emailService');

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  async initialize() {
    console.log('Initializing scheduler...');
    
    // Load all active workflows
    const activeWorkflows = await Workflow.find({ 
      isActive: true,
      'schedule.enabled': true 
    });

    for (const workflow of activeWorkflows) {
      this.scheduleWorkflow(workflow);
    }

    this.isRunning = true;
    console.log(`Scheduler initialized with ${this.jobs.size} jobs`);
  }

  scheduleWorkflow(workflow) {
    try {
      const scheduleConfig = workflow.schedule;
      
      if (!scheduleConfig || !scheduleConfig.enabled) {
        return;
      }

      // Cancel existing job if any
      this.cancelWorkflow(workflow._id.toString());

      // Parse cron expression based on schedule type
      let cronExpression = this.getCronExpression(scheduleConfig);

      // Schedule the job
      const job = cron.schedule(cronExpression, async () => {
        await this.executeWorkflow(workflow);
      }, {
        scheduled: true,
        timezone: scheduleConfig.timezone || 'UTC'
      });

      // Store job reference
      this.jobs.set(workflow._id.toString(), {
        job,
        config: scheduleConfig,
        workflowId: workflow._id
      });

      console.log(`Scheduled workflow: ${workflow.name} (${workflow._id})`);
    } catch (error) {
      console.error(`Error scheduling workflow ${workflow._id}:`, error);
    }
  }

  getCronExpression(schedule) {
    switch (schedule.frequency) {
      case 'hourly':
        return `${schedule.minute || 0} * * * *`;
      
      case 'daily':
        return `${schedule.minute || 0} ${schedule.hour || 0} * * *`;
      
      case 'weekly':
        const day = schedule.dayOfWeek || 1; // Monday default
        return `${schedule.minute || 0} ${schedule.hour || 0} * * ${day}`;
      
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        return `${schedule.minute || 0} ${schedule.hour || 0} ${dayOfMonth} * *`;
      
      case 'custom':
        return schedule.cronExpression;
      
      default:
        throw new Error(`Unsupported frequency: ${schedule.frequency}`);
    }
  }

  async executeWorkflow(workflow) {
    const executionId = `${workflow._id}_${Date.now()}`;
    const startTime = new Date();

    try {
      console.log(`Executing workflow: ${workflow.name} (${executionId})`);

      // Create execution record
      const execution = new Execution({
        executionId,
        workflowId: workflow._id,
        workflowName: workflow.name,
        startTime,
        status: 'running',
        createdBy: workflow.createdBy
      });
      await execution.save();

      // Execute workflow
      const result = await workflowAutomation.executeWorkflow(workflow, executionId);

      // Update execution record
      execution.endTime = new Date();
      execution.status = result.success ? 'completed' : 'failed';
      execution.result = result;
      await execution.save();

      // Send email report
      if (workflow.emailReport !== false) {
        await this.sendExecutionReport(execution);
      }

      console.log(`Workflow execution completed: ${workflow.name}`, result);
      
      return result;
    } catch (error) {
      console.error(`Error executing workflow ${workflow.name}:`, error);

      // Update execution record with error
      await Execution.findOneAndUpdate(
        { executionId },
        {
          endTime: new Date(),
          status: 'failed',
          error: error.message
        }
      );

      // Send error alert
      await emailService.sendAlertEmail('error', {
        workflowName: workflow.name,
        executionId,
        error: error.message,
        startTime
      });

      throw error;
    }
  }

  async sendExecutionReport(execution) {
    try {
      const reportData = {
        executionId: execution.executionId,
        workflowName: execution.workflowName,
        startTime: execution.startTime,
        endTime: execution.endTime,
        status: execution.status,
        videosProcessed: execution.result?.videosProcessed || 0,
        videosUploaded: execution.result?.videosUploaded || 0,
        errors: execution.result?.errors || [],
        summary: execution.result?.summary || 'Workflow execution completed'
      };

      await emailService.sendReportEmail(reportData);
    } catch (error) {
      console.error('Error sending execution report:', error);
    }
  }

  cancelWorkflow(workflowId) {
    const jobInfo = this.jobs.get(workflowId);
    if (jobInfo) {
      jobInfo.job.stop();
      this.jobs.delete(workflowId);
      console.log(`Cancelled workflow: ${workflowId}`);
    }
  }

  async updateWorkflowSchedule(workflowId, newSchedule) {
    try {
      // Cancel existing job
      this.cancelWorkflow(workflowId);

      // Update workflow in database
      await Workflow.findByIdAndUpdate(workflowId, {
        'schedule': newSchedule
      });

      // Reschedule if enabled
      if (newSchedule.enabled) {
        const workflow = await Workflow.findById(workflowId);
        this.scheduleWorkflow(workflow);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating workflow schedule:', error);
      throw error;
    }
  }

  async pauseWorkflow(workflowId) {
    this.cancelWorkflow(workflowId);
    
    await Workflow.findByIdAndUpdate(workflowId, {
      'schedule.enabled': false,
      isActive: false
    });

    return { success: true };
  }

  async resumeWorkflow(workflowId) {
    const workflow = await Workflow.findById(workflowId);
    
    if (workflow && workflow.schedule) {
      workflow.schedule.enabled = true;
      workflow.isActive = true;
      await workflow.save();
      
      this.scheduleWorkflow(workflow);
    }

    return { success: true };
  }

  async executeNow(workflowId) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    return this.executeWorkflow(workflow);
  }

  getScheduledJobs() {
    const jobs = [];
    for (const [workflowId, jobInfo] of this.jobs.entries()) {
      jobs.push({
        workflowId,
        config: jobInfo.config,
        nextRun: this.getNextRunTime(jobInfo.job)
      });
    }
    return jobs;
  }

  getNextRunTime(job) {
    // node-cron doesn't provide next run time directly
    // This would need to be calculated based on the cron expression
    return 'Calculation not implemented';
  }

  async stop() {
    for (const [workflowId, jobInfo] of this.jobs.entries()) {
      jobInfo.job.stop();
    }
    this.jobs.clear();
    this.isRunning = false;
    console.log('Scheduler stopped');
  }

  async getExecutionHistory(workflowId, limit = 50) {
    return Execution.find({ workflowId })
      .sort({ startTime: -1 })
      .limit(limit);
  }

  async getExecutionStats(workflowId) {
    const stats = await Execution.aggregate([
      { $match: { workflowId } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgDuration: { $avg: { $subtract: ['$endTime', '$startTime'] } },
        totalVideosProcessed: { $sum: '$result.videosProcessed' },
        totalVideosUploaded: { $sum: '$result.videosUploaded' }
      }}
    ]);

    return stats;
  }
}

module.exports = new Scheduler();
