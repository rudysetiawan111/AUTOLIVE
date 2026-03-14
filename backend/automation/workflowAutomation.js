const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs-extra');
const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');
const Video = require('../models/Video');
const Channel = require('../models/Channel');

// Import collectors
const youtubeCollector = require('../collectors/youtubeCollector');
const tiktokCollector = require('../collectors/tiktokCollector');

// Import analyzers
const engagementAnalyzer = require('../analyzers/engagementAnalyzer');
const contentAnalyzer = require('../analyzers/contentAnalyzer');

// Import downloaders
const youtubeDownloader = require('../downloaders/youtubeDownloader');
const tiktokDownloader = require('../downloaders/tiktokDownloader');

// Import editors
const videoClipper = require('../editors/videoClipper');
const subtitleGenerator = require('../editors/subtitleGenerator');

// Import uploaders
const youtubeUploader = require('../uploaders/youtubeUploader');
const tiktokUploader = require('../uploaders/tiktokUploader');

// Import AI generators
const titleGenerator = require('../../ai/title-generator/generator');
const hashtagGenerator = require('../../ai/hashtag-generator/generator');
const viralityPredictor = require('../../ai/virality-engine/predictor');

// Import services
const emailService = require('../services/emailService');
const reportGenerator = require('../reports/reportGenerator');

class WorkflowAutomation {
  constructor() {
    this.activeExecutions = new Map();
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_JOBS) || 5;
  }

  async executeWorkflow(workflow, executionId = null) {
    const startTime = new Date();
    executionId = executionId || `${workflow._id}_${Date.now()}`;

    // Check if we can run more concurrent jobs
    if (this.activeExecutions.size >= this.maxConcurrent) {
      throw new Error('Maximum concurrent workflows reached');
    }

    // Register execution
    this.activeExecutions.set(executionId, {
      workflowId: workflow._id,
      startTime,
      status: 'running'
    });

    try {
      console.log(`[${executionId}] Starting workflow: ${workflow.name}`);

      // Create execution record
      const execution = new Execution({
        executionId,
        workflowId: workflow._id,
        workflowName: workflow.name,
        startTime,
        status: 'running',
        createdBy: workflow.createdBy,
        config: workflow.config
      });
      await execution.save();

      // Execute workflow steps
      const result = await this.processWorkflowSteps(workflow, executionId);

      // Update execution record
      execution.endTime = new Date();
      execution.status = 'completed';
      execution.result = result;
      await execution.save();

      // Generate and send report
      await this.generateWorkflowReport(execution, result);

      // Remove from active executions
      this.activeExecutions.delete(executionId);

      console.log(`[${executionId}] Workflow completed successfully`);

      return {
        success: true,
        executionId,
        ...result
      };

    } catch (error) {
      console.error(`[${executionId}] Workflow failed:`, error);

      // Update execution record with error
      await Execution.findOneAndUpdate(
        { executionId },
        {
          endTime: new Date(),
          status: 'failed',
          error: error.message
        }
      );

      // Remove from active executions
      this.activeExecutions.delete(executionId);

      // Send error notification
      await this.sendErrorNotification(workflow, error, executionId);

      throw error;
    }
  }

  async processWorkflowSteps(workflow, executionId) {
    const steps = workflow.steps || [];
    const results = {
      videosDiscovered: 0,
      videosDownloaded: 0,
      videosProcessed: 0,
      videosUploaded: 0,
      errors: [],
      stepResults: []
    };

    let context = {
      videos: [],
      downloadedVideos: [],
      processedVideos: [],
      uploadedVideos: []
    };

    // Execute each step in sequence
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        console.log(`[${executionId}] Executing step ${i + 1}: ${step.type}`);

        const stepResult = await this.executeStep(step, context, workflow, executionId);
        
        // Update context based on step type
        if (step.type === 'collect') {
          context.videos = stepResult.videos;
          results.videosDiscovered = stepResult.videos.length;
        } else if (step.type === 'download') {
          context.downloadedVideos = stepResult.downloadedVideos;
          results.videosDownloaded = stepResult.downloadedVideos.length;
        } else if (step.type === 'process') {
          context.processedVideos = stepResult.processedVideos;
          results.videosProcessed = stepResult.processedVideos.length;
        } else if (step.type === 'upload') {
          context.uploadedVideos = stepResult.uploadedVideos;
          results.videosUploaded = stepResult.uploadedVideos.length;
        }

        stepResult.stepIndex = i;
        stepResult.stepType = step.type;
        results.stepResults.push(stepResult);

        // Check if we should continue
        if (step.breakOnFailure && !stepResult.success) {
          throw new Error(`Step ${i + 1} failed and breakOnFailure is enabled`);
        }

      } catch (stepError) {
        const error = {
          step: i,
          type: step.type,
          message: stepError.message,
          timestamp: new Date()
        };
        results.errors.push(error);

        if (step.breakOnFailure) {
          throw stepError;
        }
      }
    }

    // Generate summary
    results.summary = this.generateSummary(results, context);
    results.success = results.errors.length === 0;

    return results;
  }

  async executeStep(step, context, workflow, executionId) {
    switch (step.type) {
      case 'collect':
        return await this.executeCollectStep(step, workflow, executionId);
      
      case 'analyze':
        return await this.executeAnalyzeStep(step, context, executionId);
      
      case 'download':
        return await this.executeDownloadStep(step, context, executionId);
      
      case 'process':
        return await this.executeProcessStep(step, context, executionId);
      
      case 'upload':
        return await this.executeUploadStep(step, context, workflow, executionId);
      
      case 'ai-title':
        return await this.executeAITitleStep(step, context, executionId);
      
      case 'ai-hashtag':
        return await this.executeAIHashtagStep(step, context, executionId);
      
      case 'ai-virality':
        return await this.executeAIViralityStep(step, context, executionId);
      
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async executeCollectStep(step, workflow, executionId) {
    const { platform, source, query, limit, filters } = step.config;
    let videos = [];

    console.log(`[${executionId}] Collecting videos from ${platform} (${source})`);

    if (platform === 'youtube') {
      if (source === 'trending') {
        videos = await youtubeCollector.collectTrendingVideos({
          regionCode: filters?.region || 'US',
          categoryId: filters?.category || 0,
          maxResults: limit || 50,
          minViralityScore: filters?.minVirality || 70
        });
      } else if (source === 'keywords') {
        videos = await youtubeCollector.collectByKeywords(
          query || ['viral', 'trending'],
          {
            maxResultsPerKeyword: limit || 20,
            minViews: filters?.minViews || 10000,
            daysOld: filters?.daysOld || 7,
            regionCode: filters?.region || 'US'
          }
        );
      } else if (source === 'channels') {
        videos = await youtubeCollector.collectByChannels(
          filters?.channels || [],
          {
            maxResultsPerChannel: limit || 20,
            daysOld: filters?.daysOld || 7
          }
        );
      }
    } else if (platform === 'tiktok') {
      if (source === 'viral') {
        videos = await tiktokCollector.collectViralVideos({
          maxResults: limit || 50,
          minViralityScore: filters?.minVirality || 75,
          categories: filters?.categories || []
        });
      } else if (source === 'hashtags') {
        videos = await tiktokCollector.collectByHashtags(
          query || ['fyp', 'viral'],
          {
            maxResultsPerHashtag: limit || 30,
            minViews: filters?.minViews || 10000,
            minLikes: filters?.minLikes || 1000
          }
        );
      }
    }

    return {
      success: true,
      videos,
      count: videos.length,
      platform,
      source
    };
  }

  async executeAnalyzeStep(step, context, executionId) {
    const { analysisType } = step.config;
    const videos = context.videos || [];

    console.log(`[${executionId}] Analyzing ${videos.length} videos`);

    const analyzedVideos = [];

    for (const video of videos) {
      try {
        let analysis = {};

        if (analysisType === 'engagement' || analysisType === 'both') {
          analysis.engagement = engagementAnalyzer.analyzeVideo(video);
        }

        if (analysisType === 'content' || analysisType === 'both') {
          analysis.content = await contentAnalyzer.analyzeVideoContent(video);
        }

        // Filter based on analysis
        if (step.config.filters) {
          if (analysis.engagement?.viralPotential?.score < (step.config.filters.minViralityScore || 0)) {
            continue;
          }
          if (analysis.content?.quality?.score < (step.config.filters.minQualityScore || 0)) {
            continue;
          }
        }

        analyzedVideos.push({
          ...video.toObject ? video.toObject() : video,
          analysis
        });

      } catch (error) {
        console.error(`[${executionId}] Error analyzing video ${video._id}:`, error);
      }
    }

    return {
      success: true,
      analyzedVideos,
      count: analyzedVideos.length,
      analysisType
    };
  }

  async executeDownloadStep(step, context, executionId) {
    const videos = context.videos || context.analyzedVideos || [];
    const { platform, quality, includeSubtitles } = step.config;
    const downloadedVideos = [];

    console.log(`[${executionId}] Downloading ${videos.length} videos`);

    for (const video of videos) {
      try {
        let downloadResult;

        if (video.platform === 'youtube' || platform === 'youtube') {
          downloadResult = await youtubeDownloader.downloadVideo(
            video.platformId || video.id,
            {
              quality: quality || 'highest',
              includeSubtitles: includeSubtitles || false
            }
          );
        } else if (video.platform === 'tiktok' || platform === 'tiktok') {
          downloadResult = await tiktokDownloader.downloadVideo(
            video.url || `https://www.tiktok.com/@user/video/${video.platformId}`,
            {
              quality: quality || 'high',
              watermark: step.config.removeWatermark || false
            }
          );
        }

        if (downloadResult && downloadResult.success) {
          // Create video record
          const videoRecord = new Video({
            userId: workflow.createdBy,
            title: downloadResult.title,
            platform: video.platform || platform,
            platformId: downloadResult.videoId,
            filePath: downloadResult.filePath,
            fileName: downloadResult.fileName,
            fileSize: downloadResult.fileSize,
            duration: downloadResult.duration,
            thumbnail: downloadResult.thumbnail,
            status: 'downloaded',
            downloadedAt: new Date(),
            metadata: {
              ...video.metadata,
              ...downloadResult.metadata
            }
          });

          await videoRecord.save();
          downloadedVideos.push(videoRecord);
        }

      } catch (error) {
        console.error(`[${executionId}] Error downloading video:`, error);
      }
    }

    return {
      success: true,
      downloadedVideos,
      count: downloadedVideos.length
    };
  }

  async executeProcessStep(step, context, executionId) {
    const videos = context.downloadedVideos || context.videos || [];
    const { processType, aspectRatio, duration, addSubtitles } = step.config;
    const processedVideos = [];

    console.log(`[${executionId}] Processing ${videos.length} videos`);

    for (const video of videos) {
      try {
        const filePath = video.filePath || video.path;
        let processResult;

        if (processType === 'clip' || processType === 'both') {
          processResult = await videoClipper.createShort(filePath, {
            duration: duration || 60,
            aspectRatio: aspectRatio || '9:16',
            quality: 'high',
            addSubtitles: addSubtitles || false,
            subtitlePath: video.subtitlePath
          });
        }

        if (processType === 'subtitles' || (processType === 'both' && addSubtitles)) {
          const subResult = await subtitleGenerator.generateSubtitles(
            processResult?.outputPath || filePath,
            {
              language: step.config.language || 'en-US',
              format: 'vtt'
            }
          );
          
          video.subtitlePath = subResult.subtitlePath;
        }

        if (processResult) {
          video.processedPath = processResult.outputPath;
          video.status = 'processed';
          video.processedAt = new Date();
          await video.save();
          
          processedVideos.push(video);
        }

      } catch (error) {
        console.error(`[${executionId}] Error processing video:`, error);
      }
    }

    return {
      success: true,
      processedVideos,
      count: processedVideos.length,
      processType
    };
  }

  async executeUploadStep(step, context, workflow, executionId) {
    const videos = context.processedVideos || context.downloadedVideos || [];
    const { platform, privacy, category, tags } = step.config;
    const uploadedVideos = [];

    console.log(`[${executionId}] Uploading ${videos.length} videos to ${platform}`);

    // Get channel for upload
    const channel = await Channel.findOne({
      _id: step.config.channelId,
      userId: workflow.createdBy,
      platform: platform
    });

    if (!channel) {
      throw new Error(`Channel not found for platform ${platform}`);
    }

    for (const video of videos) {
      try {
        const videoPath = video.processedPath || video.filePath;
        let uploadResult;

        // Generate title and description if AI enabled
        let title = video.title;
        let description = video.description || '';
        let videoTags = tags || [];

        if (step.config.generateTitle) {
          const titleResult = await titleGenerator.generateTitle(video);
          title = titleResult.title;
        }

        if (step.config.generateHashtags) {
          const hashtagResult = await hashtagGenerator.generateHashtags(video);
          videoTags = [...videoTags, ...hashtagResult.hashtags];
        }

        const metadata = {
          title,
          description,
          tags: videoTags,
          categoryId: category,
          privacyStatus: privacy || 'public'
        };

        if (platform === 'youtube') {
          uploadResult = await youtubeUploader.uploadVideo(
            videoPath,
            metadata,
            channel.accessToken
          );
        } else if (platform === 'tiktok') {
          uploadResult = await tiktokUploader.uploadVideo(
            videoPath,
            {
              ...metadata,
              authorName: channel.name
            },
            channel.accessToken,
            channel.platformId
          );
        }

        if (uploadResult && uploadResult.success) {
          video.status = 'uploaded';
          video.uploadedAt = new Date();
          video.uploadResults = uploadResult;
          await video.save();
          
          uploadedVideos.push({
            video,
            uploadResult
          });
        }

      } catch (error) {
        console.error(`[${executionId}] Error uploading video:`, error);
      }
    }

    return {
      success: true,
      uploadedVideos,
      count: uploadedVideos.length,
      platform
    };
  }

  async executeAITitleStep(step, context, executionId) {
    const videos = context.videos || context.analyzedVideos || [];
    const enhancedVideos = [];

    for (const video of videos) {
      try {
        const titleResult = await titleGenerator.generateTitle(video, step.config);
        video.generatedTitle = titleResult.title;
        video.titleOptions = titleResult.alternatives;
        enhancedVideos.push(video);
      } catch (error) {
        console.error(`[${executionId}] Error generating title:`, error);
      }
    }

    return {
      success: true,
      enhancedVideos,
      count: enhancedVideos.length
    };
  }

  async executeAIHashtagStep(step, context, executionId) {
    const videos = context.videos || context.analyzedVideos || [];
    const enhancedVideos = [];

    for (const video of videos) {
      try {
        const hashtagResult = await hashtagGenerator.generateHashtags(video, step.config);
        video.generatedHashtags = hashtagResult.hashtags;
        enhancedVideos.push(video);
      } catch (error) {
        console.error(`[${executionId}] Error generating hashtags:`, error);
      }
    }

    return {
      success: true,
      enhancedVideos,
      count: enhancedVideos.length
    };
  }

  async executeAIViralityStep(step, context, executionId) {
    const videos = context.videos || context.analyzedVideos || [];
    const predictedVideos = [];

    for (const video of videos) {
      try {
        const prediction = await viralityPredictor.predict(video, step.config);
        video.viralityPrediction = prediction;
        predictedVideos.push(video);
      } catch (error) {
        console.error(`[${executionId}] Error predicting virality:`, error);
      }
    }

    return {
      success: true,
      predictedVideos,
      count: predictedVideos.length
    };
  }

  async generateWorkflowReport(execution, result) {
    try {
      // Generate PDF report
      const reportPath = await reportGenerator.generateExecutionReport(execution, result);

      // Send email report
      await emailService.sendReportEmail({
        executionId: execution.executionId,
        workflowName: execution.workflowName,
        startTime: execution.startTime,
        endTime: execution.endTime,
        status: execution.status,
        videosProcessed: result.videosDiscovered,
        videosDownloaded: result.videosDownloaded,
        videosUploaded: result.videosUploaded,
        errors: result.errors,
        summary: result.summary,
        reportPath
      });

    } catch (error) {
      console.error('Error generating workflow report:', error);
    }
  }

  async sendErrorNotification(workflow, error, executionId) {
    try {
      await emailService.sendAlertEmail('error', {
        workflowName: workflow.name,
        executionId,
        error: error.message,
        timestamp: new Date()
      });
    } catch (emailError) {
      console.error('Error sending error notification:', emailError);
    }
  }

  generateSummary(results, context) {
    return {
      totalVideosDiscovered: results.videosDiscovered,
      totalVideosDownloaded: results.videosDownloaded,
      totalVideosProcessed: results.videosProcessed,
      totalVideosUploaded: results.videosUploaded,
      successRate: results.videosUploaded / Math.max(results.videosDiscovered, 1) * 100,
      totalErrors: results.errors.length,
      executionTime: results.stepResults.reduce((total, step) => 
        total + (step.executionTime || 0), 0
      ),
      timestamp: new Date()
    };
  }

  async getExecutionStatus(executionId) {
    const active = this.activeExecutions.get(executionId);
    if (active) {
      return {
        ...active,
        isActive: true
      };
    }

    const execution = await Execution.findOne({ executionId });
    return execution;
  }

  async cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      // Mark for cancellation
      execution.status = 'cancelling';
      
      // Update database
      await Execution.findOneAndUpdate(
        { executionId },
        {
          status: 'cancelled',
          endTime: new Date()
        }
      );

      this.activeExecutions.delete(executionId);
      
      return { success: true, message: 'Execution cancelled' };
    }

    return { success: false, message: 'Execution not found' };
  }

  getActiveExecutions() {
    const executions = [];
    for (const [executionId, data] of this.activeExecutions.entries()) {
      executions.push({
        executionId,
        ...data
      });
    }
    return executions;
  }
}

module.exports = new WorkflowAutomation();
