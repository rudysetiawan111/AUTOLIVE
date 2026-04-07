// components/AutomationSettings.tsx
'use client';

import { useState } from 'react';
import { X, Calendar, Video, Filter, Clock, TrendingUp, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

interface AutomationSettingsProps {
  connectedAccounts: any[];
  onClose: () => void;
  onSave: (settings: any) => void;
}

export default function AutomationSettings({ connectedAccounts, onClose, onSave }: AutomationSettingsProps) {
  const [settings, setSettings] = useState({
    youtubeChannel: '',
    tiktokAccount: '',
    videoTheme: 'viral',
    schedule: {
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
      time: '09:00',
      frequency: 'daily', // daily, weekly, custom
      daysOfWeek: [1,2,3,4,5], // 0-6 Sunday to Saturday
      duration: 30 // days
    },
    videoFormat: '16:9',
    aiEnhancements: {
      viralPrediction: true,
      copyrightCheck: true,
      autoSubtitles: true,
      smartCropping: true,
      thumbnailGeneration: true,
      seoOptimization: true
    },
    advancedOptions: {
      maxRetries: 3,
      failoverToBackup: true,
      contentSpinning: false,
      scheduleRandomization: false
    }
  });

  const themes = [
    { value: 'viral', label: '🔥 Viral Content', icon: TrendingUp },
    { value: 'educational', label: '📚 Educational', icon: Zap },
    { value: 'entertainment', label: '🎭 Entertainment', icon: Zap },
    { value: 'news', label: '📰 News & Trends', icon: Zap },
    { value: 'tutorial', label: '💻 Tutorial/How-to', icon: Zap }
  ];

  const formats = [
    { value: '16:9', label: '16:9 - Landscape', desc: 'Best for YouTube' },
    { value: '9:16', label: '9:16 - Portrait', desc: 'Best for TikTok/Shorts' },
    { value: '1:1', label: '1:1 - Square', desc: 'Best for Instagram/Facebook' }
  ];

  const handleSubmit = async () => {
    if (!settings.youtubeChannel && !settings.tiktokAccount) {
      toast.error('Please select at least one platform for automation');
      return;
    }

    try {
      const response = await fetch('/api/automation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Automation schedule created successfully!');
        onSave(settings);
      } else {
        throw new Error('Failed to create schedule');
      }
    } catch (error) {
      toast.error('Failed to create automation schedule');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">⚙️ Automation Settings</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* A. Pilih Channel YouTube */}
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-white font-semibold mb-2">
              🎥 YouTube Channel
            </label>
            <select 
              value={settings.youtubeChannel}
              onChange={(e) => setSettings({...settings, youtubeChannel: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
            >
              <option value="">Select YouTube Channel</option>
              {connectedAccounts
                .filter(acc => acc.platform === 'youtube')
                .map(acc => (
                  <option key={acc.channelId} value={acc.channelId}>
                    {acc.channelName}
                  </option>
                ))}
            </select>
          </div>

          {/* B. Pilih Akun TikTok */}
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-white font-semibold mb-2">
              🎵 TikTok Account
            </label>
            <select 
              value={settings.tiktokAccount}
              onChange={(e) => setSettings({...settings, tiktokAccount: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white"
            >
              <option value="">Select TikTok Account</option>
              {connectedAccounts
                .filter(acc => acc.platform === 'tiktok')
                .map(acc => (
                  <option key={acc.channelId} value={acc.channelId}>
                    {acc.channelName}
                  </option>
                ))}
            </select>
          </div>

          {/* C. Tema Video */}
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-white font-semibold mb-3">
              🎨 Video Theme Filter
            </label>
            <div className="grid grid-cols-2 gap-3">
              {themes.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => setSettings({...settings, videoTheme: theme.value})}
                  className={`p-3 rounded-lg text-left transition ${
                    settings.videoTheme === theme.value
                      ? 'bg-purple-600 border-2 border-purple-400'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <theme.icon size={20} />
                    <span className="text-white">{theme.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* D. Jadwal Upload */}
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-white font-semibold mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Upload Schedule
            </label>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400">Start Date</label>
                  <input 
                    type="date"
                    value={settings.schedule.startDate}
                    onChange={(e) => setSettings({
                      ...settings,
                      schedule: {...settings.schedule, startDate: e.target.value}
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Upload Time</label>
                  <input 
                    type="time"
                    value={settings.schedule.time}
                    onChange={(e) => setSettings({
                      ...settings,
                      schedule: {...settings.schedule, time: e.target.value}
                    })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Duration (days)</label>
                <input 
                  type="number"
                  min="1"
                  max="365"
                  value={settings.schedule.duration}
                  onChange={(e) => setSettings({
                    ...settings,
                    schedule: {...settings.schedule, duration: parseInt(e.target.value)}
                  })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">*Automation will run for {settings.schedule.duration} days</p>
              </div>
            </div>
          </div>

          {/* E. Format Video */}
          <div className="bg-white/5 rounded-xl p-4">
            <label className="block text-white font-semibold mb-3 flex items-center gap-2">
              <Video size={20} />
              Video Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map(format => (
                <button
                  key={format.value}
                  onClick={() => setSettings({...settings, videoFormat: format.value})}
                  className={`p-3 rounded-lg text-center transition ${
                    settings.videoFormat === format.value
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-white/10 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  <p className="text-white font-bold">{format.label}</p>
                  <p className="text-xs text-gray-400">{format.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* F. AI Enhancements (DeepSeek Recommendation) */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-4 border border-purple-500/50">
            <label className="block text-white font-semibold mb-3 flex items-center gap-2">
              <Shield size={20} />
              🤖 AI Enhancements (Recommended by DeepSeek)
            </label>
            <div className="space-y-2">
              {Object.entries(settings.aiEnhancements).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                  <span className="text-gray-300">
                    {key === 'viralPrediction' && '🎯 Viral Content Prediction'}
                    {key === 'copyrightCheck' && '©️ Copyright Check & Clearance'}
                    {key === 'autoSubtitles' && '📝 Auto-Generate Subtitles'}
                    {key === 'smartCropping' && '✂️ Smart Cropping & Reframing'}
                    {key === 'thumbnailGeneration' && '🖼️ AI Thumbnail Generation'}
                    {key === 'seoOptimization' && '🔍 SEO Optimization'}
                  </span>
                  <input 
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiEnhancements: {...settings.aiEnhancements, [key]: e.target.checked}
                    })}
                    className="w-5 h-5 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* G. Button Lanjutkan */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform"
          >
            🚀 Create Automation Schedule
          </button>

        </div>
      </div>
    </div>
  );
      }
