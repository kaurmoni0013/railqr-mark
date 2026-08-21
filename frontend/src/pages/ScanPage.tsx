import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ScanLine,
  Keyboard,
  AlertTriangle,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { api } from '@/services/api';
import type { TrackFittingDetail, QRVerifyResponse } from '@/types';

type ScanResult = 'success' | 'error' | null;

const statusColor = (status: string) => {
  switch (status) {
    case 'HEALTHY': return 'bg-green-100 text-green-700';
    case 'ATTENTION': return 'bg-amber-100 text-amber-700';
    case 'CRITICAL': return 'bg-red-100 text-red-700';
    case 'UNDER_MAINTENANCE': return 'bg-purple-100 text-purple-700';
    default: return 'bg-slate-100 text-slate-500';
  }
};

export default function ScanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [qrInput, setQrInput] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [resultFitting, setResultFitting] = useState<TrackFittingDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    setScanResult(null);
    setResultFitting(null);
    setErrorMsg('');
    try {
      const verifyResult: QRVerifyResponse = await api.qr.verify(data.trim());
      if (!verifyResult.valid || !verifyResult.fitting_id) {
        setScanResult('error');
        setErrorMsg('QR code not recognized. Please try again.');
        return;
      }
      const fitting = await api.fittings.get(verifyResult.fitting_id);
      setResultFitting(fitting);
      setScanResult('success');
    } catch {
      setScanResult('error');
      setErrorMsg('QR code not recognized. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualSearch.trim()) return;
    setLoading(true);
    setScanResult(null);
    setResultFitting(null);
    setErrorMsg('');
    try {
      const result = await api.fittings.list({ search: manualSearch.trim(), page_size: 1 });
      if (result.items.length > 0) {
        const detail = await api.fittings.get(result.items[0].id);
        setResultFitting(detail);
        setScanResult('success');
      } else {
        setScanResult('error');
        setErrorMsg('No fitting found with that ID or code.');
      }
    } catch {
      setScanResult('error');
      setErrorMsg('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanResult(null);
    setResultFitting(null);
    setQrInput('');
    setManualSearch('');
    setErrorMsg('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rail-blue/10 mb-3">
          <QrCode className="w-7 h-7 text-rail-blue" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Scan QR Code</h1>
        <p className="text-sm text-rail-steel mt-1">Scan or search for track fitting digital passports</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => { setActiveTab('camera'); reset(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'camera'
              ? 'bg-rail-blue text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          Camera Scanner
        </button>
        <button
          onClick={() => { setActiveTab('manual'); reset(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-rail-blue text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          Manual Entry
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!scanResult && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Camera Scanner Tab */}
            {activeTab === 'camera' && (
              <div className="glass-card-static p-8">
                {/* Scanning Frame */}
                <div className="relative w-64 h-64 mx-auto mb-6">
                  <div className="absolute inset-0 border-2 border-dashed border-slate-200 rounded-2xl" />
                  {/* Animated corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-rail-blue rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-rail-blue rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-rail-blue rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-rail-blue rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-rail-blue to-transparent opacity-50">
                    <div
                      className="w-full h-full bg-rail-blue"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScanLine className="w-12 h-12 text-rail-blue/20" />
                  </div>
                </div>
                <style>{`
                  @keyframes scanLine {
                    0%, 100% { transform: translateY(-80px); }
                    50% { transform: translateY(80px); }
                  }
                `}</style>

                <p className="text-center text-sm text-slate-500 mb-4">
                  Point your camera at the QR code on a track fitting
                </p>
                <p className="text-center text-xs text-slate-400 mb-6">
                  Camera access required. For demo, enter QR data below.
                </p>

                {/* Demo QR Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify(qrInput)}
                    placeholder='e.g. RAILQR:FF-001:V1'
                    className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-rail-blue/50 focus:ring-1 focus:ring-rail-blue/20 font-mono"
                  />
                  <button
                    onClick={() => handleVerify(qrInput)}
                    disabled={loading || !qrInput.trim()}
                    className="px-5 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <QrCode className="w-4 h-4" />
                    )}
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry Tab */}
            {activeTab === 'manual' && (
              <div className="glass-card-static p-8">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <Search className="w-10 h-10 text-rail-blue/30 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Enter a Fitting ID or Fitting Code to search</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder='e.g. FIT-1 or FF-001'
                      className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-rail-blue/50 focus:ring-1 focus:ring-rail-blue/20 font-mono"
                    />
                    <button
                      onClick={handleManualSearch}
                      disabled={loading || !manualSearch.trim()}
                      className="px-5 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Success Result */}
        {scanResult === 'success' && resultFitting && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card-static p-6"
          >
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3"
              >
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </motion.div>
              <h2 className="text-lg font-bold text-slate-800">QR Verified Successfully</h2>
              <p className="text-sm text-slate-500">Fitting found in the system</p>
            </div>

            {/* Fitting Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-bold text-slate-800">{resultFitting.fitting_code}</div>
                  <div className="text-sm text-slate-500">{resultFitting.fitting_type_name || `Type-${resultFitting.fitting_type_id}`}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor(resultFitting.status)}`}>
                  {resultFitting.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Zone</span>
                  <div className="font-medium text-slate-700">{resultFitting.zone_name || `Zone-${resultFitting.zone_id}`}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Division</span>
                  <div className="font-medium text-slate-700">{resultFitting.division_name || `Div-${resultFitting.division_id}`}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Location</span>
                  <div className="font-medium text-slate-700">{resultFitting.location_name || '—'}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Health Score</span>
                  <div className={`font-bold ${
                    resultFitting.health_score >= 70 ? 'text-green-600' :
                    resultFitting.health_score >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}>{resultFitting.health_score}/100</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/fittings/${resultFitting.id}`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View Full Passport
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
              >
                Scan Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Result */}
        {scanResult === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card-static p-6"
          >
            <div className="text-center mb-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-3"
              >
                <XCircle className="w-9 h-9 text-red-500" />
              </motion.div>
              <h2 className="text-lg font-bold text-slate-800">QR Not Recognized</h2>
              <p className="text-sm text-slate-500">{errorMsg}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all"
              >
                <QrCode className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => { reset(); setActiveTab('manual'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
              >
                <Search className="w-4 h-4" />
                Enter ID Manually
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              Report Damaged QR
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
