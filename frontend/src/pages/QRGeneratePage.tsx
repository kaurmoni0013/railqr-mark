import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  QrCode,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Hash,
} from 'lucide-react';
import { api } from '@/services/api';
import type { TrackFitting, QRGenerateResponse, PaginatedResponse } from '@/types';

export default function QRGeneratePage() {
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('fitting_id');

  const [fittingId, setFittingId] = useState(presetId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TrackFitting[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<QRGenerateResponse | null>(null);
  const [error, setError] = useState('');

  const searchFittings = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.fittings.list({ search: query.trim(), page_size: 5 });
      setSearchResults(data.items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchFittings(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchFittings]);

  useEffect(() => {
    if (presetId) {
      handleGenerate(Number(presetId));
    }
  }, [presetId]);

  const handleGenerate = async (id: number) => {
    setGenerating(true);
    setError('');
    setResult(null);
    setShowDropdown(false);
    try {
      const data = await api.qr.generate(id);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.qr_image_base64}`;
    link.download = `QR_${result.fitting_code}_v${result.version}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${result.fitting_code}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;">
          <h2 style="margin-bottom:4px;">${result.fitting_code}</h2>
          <p style="color:#666;font-size:12px;margin-bottom:16px;">${result.qr_data}</p>
          <img src="data:image/png;base64,${result.qr_image_base64}" style="width:256px;height:256px;" />
          <p style="color:#999;font-size:10px;margin-top:12px;">RailSaathi v${result.version}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copyPayload = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.qr_data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rail-blue/10 mb-3">
          <QrCode className="w-7 h-7 text-rail-blue" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Generate QR Code</h1>
        <p className="text-sm text-rail-steel mt-1">Create a unique QR identity for track fittings</p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-static p-6"
      >
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Fitting ID / Code
        </label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery || fittingId}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFittingId('');
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search by fitting code or ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-rail-blue/50 focus:ring-1 focus:ring-rail-blue/20 transition-all font-mono"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-rail-blue rounded-full animate-spin" />
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {searchResults.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFittingId(String(f.id));
                    setSearchQuery(f.fitting_code);
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                >
                  <div>
                    <span className="font-mono text-sm font-semibold text-rail-blue">{f.fitting_code}</span>
                    <span className="text-xs text-slate-500 ml-2">ID: {f.id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    f.status === 'HEALTHY' ? 'bg-green-100 text-green-700' :
                    f.status === 'ATTENTION' ? 'bg-amber-100 text-amber-700' :
                    f.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {f.status}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchQuery && !searching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-4 text-center">
              <p className="text-sm text-slate-500">No fittings found</p>
            </div>
          )}
        </div>

        <button
          onClick={() => fittingId && handleGenerate(Number(fittingId))}
          disabled={generating || !fittingId}
          className="w-full mt-4 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-semibold hover:bg-rail-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          style={{ boxShadow: '0 4px 15px -3px rgba(11, 92, 171, 0.3)' }}
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              Generate QR Code
            </>
          )}
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static p-5 text-center"
        >
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-static p-6"
        >
          <div className="text-center mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-2"
            >
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </motion.div>
            <h2 className="text-lg font-bold text-slate-800">QR Code Generated</h2>
            <p className="text-sm text-slate-500">Successfully created digital identity</p>
          </div>

          {/* QR Image */}
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-white rounded-xl border-2 border-slate-100 shadow-sm">
              <img
                src={`data:image/png;base64,${result.qr_image_base64}`}
                alt={`QR Code for ${result.fitting_code}`}
                className="w-48 h-48"
              />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Fitting Code</span>
              <span className="text-sm font-mono font-semibold text-slate-800">{result.fitting_code}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Version</span>
              <span className="text-sm font-semibold text-slate-800">v{result.version}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Payload</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-rail-blue">
                  {result.qr_data}
                </code>
                <button
                  onClick={copyPayload}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="Copy payload"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print QR
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
