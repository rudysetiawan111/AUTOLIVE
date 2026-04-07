// app/dashboard/features/workflow-sistem/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Shield, Download, Video, Upload, FileText,
  CheckCircle, Loader2, Clock, AlertCircle, Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  logs: string[];
  startTime?: Date;
  endTime?: Date;
}

interface Workflow {
  id: string;
  name: string;
  theme: string;
  status: 'active' | 'paused' | 'completed';
  currentStep: number;
  steps: WorkflowStep[];
  totalVideos: number;
  processedVideos: number;
}

export default function WorkflowSistemPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
    // Real-time updates via WebSocket/Supabase
    const interval = setInterval(fetchWorkflows, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/automation/workflow');
      const data = await res.json();
      setWorkflows(data.workflows);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, action: 'pause' | 'resume') => {
    try {
      await fetch('/api/automation/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId, action })
      });
      toast.success(`Workflow ${action === 'pause' ? 'paused' : 'resumed'}`);
      fetchWorkflows();
    } catch (error) {
      toast.error('Failed to update workflow');
    }
  };

  const getWorkflowSteps = (theme: string) => {
    return [
      { id: 'filter', name: '🎯 Viral & Copyright Filter', icon: TrendingUp },
      { id: 'download', name: '⬇️ Download Video', icon: Download },
      { id: 'edit', name: '✂️ Edit Video', icon: Video },
      { id: 'upload', name: '📤 Upload Video', icon: Upload },
      { id: 'report', name: '📊 Laporan Upload', icon: FileText }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Workflow System
          </h1>
          <p className="text-gray-400 mt-2">Real-time monitoring of automated video processing pipeline</p>
        </div>

        {/* Workflow List */}
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              
              {/* Workflow Header */}
              <div className="p-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{workflow.name}</h2>
                    <p className="text-gray-400">Theme: {workflow.theme}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleWorkflow(workflow.id, workflow.status === 'active' ? 'pause' : 'resume')}
                      className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                        workflow.status === 'active' 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {workflow.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                      {workflow.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
                
                {/* Progress Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Progress</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round((workflow.processedVideos / workflow.totalVideos) * 100)}%
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Videos Processed</p>
                    <p className="text-2xl font-bold text-white">
                      {workflow.processedVideos}/{workflow.totalVideos}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Current Step</p>
                    <p className="text-lg font-bold text-white">
                      Step {workflow.currentStep + 1}/5
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-sm text-gray-400">Status</p>
                    <p className={`text-lg font-bold ${
                      workflow.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {workflow.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="p-6">
                <div className="space-y-4">
                  {getWorkflowSteps(workflow.theme).map((step, idx) => {
                    const workflowStep = workflow.steps[idx];
                    const isActive = workflow.currentStep === idx;
                    const isCompleted = workflowStep?.status === 'completed';
                    const isFailed = workflowStep?.status === 'failed';
                    
                    return (
                      <div key={step.id} className="relative">
                        {/* Connector Line */}
                        {idx < 4 && (
                          <div className={`absolute left-6 top-12 w-0.5 h-12 ${
                            idx < workflow.currentStep ? 'bg-green-500' : 'bg-gray-600'
                          }`} />
                        )}
                        
                        <div className={`relative flex items-start gap-4 p-4 rounded-xl transition ${
                          isActive ? 'bg-blue-600/20 border border-blue-500' : 'bg-white/5'
                        }`}>
                          {/* Step Icon */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500' : 
                            isFailed ? 'bg-red-500' :
                            isActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'
                          }`}>
                            {isCompleted ? <CheckCircle size={24} /> : step.icon}
                          </div>
                          
                          {/* Step Info */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-white font-semibold">{step.name}</h3>
                                <p className="text-sm text-gray-400">
                                  {step.id === 'filter' && 'AI analyzes video for viral potential & copyright'}
                                  {step.id === 'download' && 'Downloading filtered videos from source'}
                                  {step.id === 'edit' && 'Processing video: resize, crop, add subtitles'}
                                  {step.id === 'upload' && 'Uploading to connected platforms'}
                                  {step.id === 'report' && 'Generating upload reports and analytics'}
                                </p>
                              </div>
                              {isActive && (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="animate-spin text-blue-400" size={16} />
                                  <span className="text-sm text-blue-400">Processing...</span>
                                </div>
                              )}
                              {isCompleted && (
                                <CheckCircle className="text-green-400" size={20} />
                              )}
                              {isFailed && (
                                <AlertCircle className="text-red-400" size={20} />
                              )}
                            </div>
                            
                            {/* Progress Bar for active step */}
                            {isActive && workflowStep && (
                              <div className="mt-2">
                                <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-blue-500 h-full transition-all duration-500"
                                    style={{ width: `${workflowStep.progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  {workflowStep.progress}% complete
                                </p>
                              </div>
                            )}
                            
                            {/* Logs */}
                            {workflowStep?.logs && workflowStep.logs.length > 0 && (
                              <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {workflowStep.logs.slice(-2).map((log, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <Clock size={12} />
                                    <span>{log}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>
          ))}
        </div>

        {workflows.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">No active workflows found.</p>
            <p className="text-sm text-gray-500 mt-2">Create an automation schedule to start processing videos.</p>
          </div>
        )}

      </div>
    </div>
  );
}
