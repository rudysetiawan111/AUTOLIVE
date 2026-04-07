'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Play, Loader2, CheckCircle2, RefreshCcw,
  ListChecks, Activity, ShieldAlert, TrendingUp, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

// ================= TYPES =================
interface WorkflowItem {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  progress: number;
  error_message?: string;
}

interface ResultItem {
  keyword: string;
  status: string;
  retry: number;
  earning?: { revenue: number };
}

// ================= COMPONENT =================
export default function WorkflowAutomationPage() {
  const supabase = createClient();

  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  // 🔥 NEW STATE (ULTIMATE ENGINE)
  const [results, setResults] = useState<ResultItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // ================= FETCH =================
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false });

    const mapped = (data || []).map((wf: any) => ({
      ...wf,
      status: wf.status || 'idle',
      progress: wf.status === 'success' ? 100 : 0
    }));

    setWorkflows(mapped);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // ================= RUN ULTIMATE ENGINE =================
  const runUltimateEngine = async () => {
    setIsRunning(true);
    toast.loading('Menjalankan AI Auto System...', { id: 'run' });

    try {
      const res = await fetch('/api/automation/ultimate-engine', {
        method: 'POST',
        body: JSON.stringify({ userId: 'demo-user' })
      });

      const data = await res.json();

      if (!data.success) throw new Error();

      setResults(data.data);

      // hitung revenue
      const total = data.data.reduce(
        (sum: number, item: any) => sum + (item.earning?.revenue || 0),
        0
      );

      setTotalRevenue(total);

      toast.success('Sistem berjalan sukses 🚀', { id: 'run' });

    } catch {
      toast.error('Gagal menjalankan sistem', { id: 'run' });
    }

    setIsRunning(false);
  };

  // ================= SELECT =================
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow mb-6">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Activity className="text-blue-600" />
            WORKFLOW AUTOMATION (ULTIMATE)
          </h1>
          <p className="text-sm text-gray-500">
            Auto generate → upload → monetize → retry AI
          </p>

          {/* ACTION */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={runUltimateEngine}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              {isRunning ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              RUN AUTO SYSTEM
            </button>

            <button
              onClick={fetchWorkflows}
              className="px-4 py-2 bg-gray-200 rounded-xl flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl text-center">
            <TrendingUp className="mx-auto text-blue-500" />
            <p className="text-lg font-bold">{results.length}</p>
            <p className="text-xs">Konten Diproses</p>
          </div>

          <div className="bg-white p-4 rounded-xl text-center">
            <CheckCircle2 className="mx-auto text-green-500" />
            <p className="text-lg font-bold">
              {results.filter(r => r.status === 'success').length}
            </p>
            <p className="text-xs">Sukses</p>
          </div>

          <div className="bg-white p-4 rounded-xl text-center">
            <DollarSign className="mx-auto text-yellow-500" />
            <p className="text-lg font-bold">Rp {totalRevenue}</p>
            <p className="text-xs">Revenue</p>
          </div>
        </div>

        {/* RESULT LIST */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl">
          <h2 className="font-bold mb-3">Hasil AI Automation</h2>

          {results.length === 0 ? (
            <p className="text-sm text-gray-500">
              Belum ada data...
            </p>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="border p-3 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{r.keyword}</p>
                    <p className="text-xs text-gray-500">
                      Retry: {r.retry}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-bold ${
                        r.status === 'success'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {r.status}
                    </p>
                    <p className="text-xs">
                      Rp {r.earning?.revenue || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WORKFLOW LIST (EXISTING) */}
        <div className="mt-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <ListChecks size={16} /> Workflow List
          </h2>

          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            workflows.map(wf => (
              <div
                key={wf.id}
                className="p-3 border rounded-lg mb-2 flex justify-between"
              >
                <div>
                  <p className="font-semibold">{wf.name}</p>
                  <p className="text-xs">{wf.status}</p>
                </div>

                {wf.status === 'failed' && (
                  <ShieldAlert className="text-red-500" />
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
