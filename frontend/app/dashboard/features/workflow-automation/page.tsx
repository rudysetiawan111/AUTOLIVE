// app/dashboard/features/workflow-automation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Youtube, 
  Music2, 
  Play, 
  Settings, 
  Calendar, 
  Video,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import YouTubeConnect from '@/components/YouTubeConnect';
import TikTokConnect from '@/components/TikTokConnect';
import AutomationSettings from '@/components/AutomationSettings';

interface ConnectedAccount {
  platform: 'youtube' | 'tiktok';
  channelName: string;
  channelId: string;
  thumbnail: string;
  subscribers?: number;
}

export default function WorkflowAutomationPage() {
  const { data: session } = useSession();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [isConnected, setIsConnected] = useState({ youtube: false, tiktok: false });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load connected accounts from database
  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const res = await fetch('/api/integrations/accounts');
      const data = await res.json();
      setConnectedAccounts(data.accounts);
      setIsConnected({
        youtube: data.accounts.some((a: any) => a.platform === 'youtube'),
        tiktok: data.accounts.some((a: any) => a.platform === 'tiktok')
      });
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: 'youtube' | 'tiktok') => {
    window.location.href = `/api/auth/${platform}`;
  };

  const canStartAutomation = isConnected.youtube || isConnected.tiktok;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Workflow Automation
          </h1>
          <p className="text-gray-400 mt-2">
            Hubungkan akun sosial media Anda untuk memulai automation video
          </p>
        </div>

        {/* Connection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* YouTube Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-500" />
                <h2 className="text-xl font-semibold text-white">YouTube</h2>
              </div>
              {isConnected.youtube && (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>
            
            {isConnected.youtube ? (
              <div className="space-y-3">
                {connectedAccounts
                  .filter(acc => acc.platform === 'youtube')
                  .map(acc => (
                    <div key={acc.channelId} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white font-medium">{acc.channelName}</p>
                      <p className="text-sm text-gray-400">
                        {acc.subscribers?.toLocaleString()} subscribers
                      </p>
                    </div>
                  ))}
                <button
                  onClick={() => handleConnect('youtube')}
                  className="w-full mt-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition"
                >
                  Connect Another Channel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('youtube')}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <Youtube size={20} />
                Connect YouTube Channel
              </button>
            )}
          </div>

          {/* TikTok Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Music2 className="w-8 h-8 text-pink-500" />
                <h2 className="text-xl font-semibold text-white">TikTok</h2>
              </div>
              {isConnected.tiktok && (
                <CheckCircle className="w-6 h-6 text-green-400" />
              )}
            </div>
            
            {isConnected.tiktok ? (
              <div className="space-y-3">
                {connectedAccounts
                  .filter(acc => acc.platform === 'tiktok')
                  .map(acc => (
                    <div key={acc.channelId} className="bg-white/5 rounded-lg p-3">
                      <p className="text-white font-medium">{acc.channelName}</p>
                    </div>
                  ))}
                <button
                  onClick={() => handleConnect('tiktok')}
                  className="w-full mt-2 px-4 py-2 bg-pink-600/20 text-pink-400 rounded-lg hover:bg-pink-600/30 transition"
                >
                  Connect Another Account
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleConnect('tiktok')}
                className="w-full px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition flex items-center justify-center gap-2"
              >
                <Music2 size={20} />
                Connect TikTok Account
              </button>
            )}
          </div>
        </div>

        {/* Start Automation Button */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowSettings(true)}
            disabled={!canStartAutomation}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg transition-all transform
              flex items-center gap-3 mx-auto
              ${canStartAutomation 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-105 cursor-pointer shadow-lg shadow-purple-500/50' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Play size={24} />
            Start Automation
            {!canStartAutomation && (
              <AlertCircle size={18} className="text-yellow-400" />
            )}
          </button>
          {!canStartAutomation && (
            <p className="text-sm text-yellow-400 mt-2">
              *Connect at least one platform to enable automation
            </p>
          )}
        </div>

        {/* Automation Settings Modal */}
        {showSettings && (
          <AutomationSettings 
            connectedAccounts={connectedAccounts}
            onClose={() => setShowSettings(false)}
            onSave={(settings) => {
              console.log('Settings saved:', settings);
              setShowSettings(false);
            }}
          />
        )}

      </div>
    </div>
  );
}
