import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Keyboard,
  AlertTriangle,
  ExternalLink,
  Video,
  VideoOff,
  RefreshCw,
  Smartphone,
  Copy,
} from 'lucide-react';
import { api } from '@/services/api';
import { useTranslation } from '@/i18n/LanguageContext';
import type { TrackFittingDetail } from '@/types';

type ScanResult = 'success' | 'error' | null;
type ScanFeedback = 'looking' | 'checking' | 'notfound';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'phone'>('camera');
  const [qrInput, setQrInput] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [resultFitting, setResultFitting] = useState<TrackFittingDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [phoneUrl] = useState(
    () => `http://${window.location.hostname}:5173/scan?phone=1`
  );
  const [copied, setCopied] = useState(false);
  const [framesScanned, setFramesScanned] = useState(0);
  const [lastScanStatus, setLastScanStatus] = useState<ScanFeedback>('looking');
  const [autoStartPending, setAutoStartPending] = useState(false);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];

    setFramesScanned((n) => n + 1);
    setLastScanStatus('checking');
    setScanning(true);
    try {
      const result = await api.camera.scan(base64);
      if (result.success && result.fitting_id) {
        stopCamera();
        const detail = await api.fittings.get(result.fitting_id);
        setResultFitting(detail);
        setScanResult('success');
      } else {
        setLastScanStatus('notfound');
      }
    } catch {
      setLastScanStatus('notfound');
    } finally {
      setScanning(false);
    }
  }, [scanning, stopCamera]);

  const startCamera = useCallback(async (facing?: 'environment' | 'user') => {
    const mode = facing || facingMode;
    try {
      setCameraError('');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch {
        const fallbackMode = mode === 'environment' ? 'user' : 'environment';
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: fallbackMode, width: { ideal: 640 }, height: { ideal: 480 } },
        });
        setFacingMode(fallbackMode);
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      setCameraError('Camera access denied. Use manual entry below.');
      console.error('Camera error:', err);
    }
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    stopCamera();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setTimeout(() => startCamera(newMode), 200);
  }, [facingMode, startCamera, stopCamera]);

  useEffect(() => {
    if (cameraActive) {
      scanIntervalRef.current = setInterval(captureAndScan, 1500);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [cameraActive, captureAndScan]);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('phone') === '1') {
      setActiveTab('camera');
      setAutoStartPending(true);
    }
  }, []);

  useEffect(() => {
    if (autoStartPending) {
      setAutoStartPending(false);
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartPending]);

  useEffect(() => {
    if (lastScanStatus === 'notfound') {
      const t = setTimeout(() => setLastScanStatus('looking'), 1200);
      return () => clearTimeout(t);
    }
  }, [lastScanStatus]);

  const handleVerify = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    setScanResult(null);
    setResultFitting(null);
    setErrorMsg('');
    try {
      const verifyResult = await api.qr.verify(data.trim());
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
    setFramesScanned(0);
    setLastScanStatus('looking');
    stopCamera();
  };

  const copyPhoneUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(phoneUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = phoneUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const switchTab = (tab: 'camera' | 'manual' | 'phone') => {
    reset();
    setActiveTab(tab);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rail-blue/10 mb-3">
          <QrCode className="w-7 h-7 text-rail-blue" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{t('scan.title')}</h1>
        <p className="text-sm text-rail-steel mt-1">{t('scan.subtitle')}</p>
      </motion.div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => switchTab('camera')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'camera'
              ? 'bg-rail-blue text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          {t('scan.camera_tab')}
        </button>
        <button
          onClick={() => switchTab('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-rail-blue text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          {t('scan.manual_tab')}
        </button>
        <button
          onClick={() => switchTab('phone')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'phone'
              ? 'bg-rail-blue text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          {t('scan.phone_tab')}
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
            {activeTab === 'camera' && (
              <div className="glass-card-static p-6 space-y-4">
                <canvas ref={canvasRef} className="hidden" />

                {!cameraActive ? (
                  <div className="text-center space-y-4">
                    <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                      <Video className="w-16 h-16 text-slate-300" />
                    </div>
                    <button
                      onClick={() => startCamera()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all shadow-md"
                    >
                      <Camera className="w-4 h-4" />
                      {t('scan.start')}
                    </button>
                    {cameraError && (
                      <p className="text-xs text-red-500">{cameraError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-rail-blue/30">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-2xl"
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-rail-blue/40 rounded-xl" />
                        <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-rail-blue rounded-tl-lg" />
                        <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-rail-blue rounded-tr-lg" />
                        <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-rail-blue rounded-bl-lg" />
                        <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-rail-blue rounded-br-lg" />
                        {scanning && (
                          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5">
                            <div
                              className="w-full h-full bg-rail-blue/60"
                              style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                            />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm transition-colors ${
                              lastScanStatus === 'checking'
                                ? 'bg-rail-blue text-white'
                                : lastScanStatus === 'notfound'
                                  ? 'bg-slate-900/70 text-slate-200'
                                  : 'bg-white/85 text-slate-700 animate-pulse'
                            }`}
                          >
                            {lastScanStatus === 'checking'
                              ? t('scan.checking')
                              : lastScanStatus === 'notfound'
                                ? t('scan.no_qr')
                                : t('scan.looking')}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-white/80">
                            Scanned {framesScanned} frame{framesScanned === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <style>{`
                      @keyframes scanLine {
                        0%, 100% { transform: translateY(-120px); }
                        50% { transform: translateY(120px); }
                      }
                    `}</style>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        {scanning ? t('scan.scanning') : t('scan.point')}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={switchCamera}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {t('scan.flip')}
                        </button>
                        <button
                          onClick={stopCamera}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <VideoOff className="w-3 h-3" />
                          {t('scan.stop')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-center text-xs text-slate-400 mb-2">{t('scan.or_manual')}</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerify(qrInput)}
                      placeholder="e.g. RAILSAATHI:TF-NR-ERC-000001:V1"
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
                      {t('scan.verify')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="glass-card-static p-8">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <Search className="w-10 h-10 text-rail-blue/30 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">{t('scan.enter_id')}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualSearch}
                      onChange={(e) => setManualSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder="e.g. TF-NR-ERC-000001 or #12345"
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
                      {t('scan.search')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'phone' && (
              <div className="glass-card-static p-8">
                <div className="max-w-md mx-auto text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rail-blue/10">
                    <Smartphone className="w-7 h-7 text-rail-blue" />
                  </div>
                  <p className="text-sm text-slate-600">
                    {t('scan.phone_desc')}
                  </p>
                  <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(phoneUrl)}`}
                      alt="QR code linking to the phone scanner"
                      width={220}
                      height={220}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="text-xs font-mono text-slate-500 break-all bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
                    {phoneUrl}
                  </div>
                  <button
                    onClick={copyPhoneUrl}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all shadow-md"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? 'Copied!' : t('scan.phone_title')}
                  </button>
                  <p className="text-xs text-slate-400">
                    Make sure your phone is on the same network as this computer.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

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
              <h2 className="text-lg font-bold text-slate-800">{t('scan.verified')}</h2>
              <p className="text-sm text-slate-500">{t('scan.found')}</p>
            </div>

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
                  <div className="font-medium text-slate-700">{resultFitting.location_name || '\u2014'}</div>
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
                {t('common.view_passport')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
              >
                {t('common.scan_again')}
              </button>
            </div>
          </motion.div>
        )}

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
              <h2 className="text-lg font-bold text-slate-800">{t('scan.not_found')}</h2>
              <p className="text-sm text-slate-500">{errorMsg}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rail-blue text-white rounded-xl text-sm font-medium hover:bg-rail-blue/90 transition-all"
              >
                <QrCode className="w-4 h-4" />
                {t('scan.try_again')}
              </button>
              <button
                onClick={() => { reset(); setActiveTab('manual'); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all"
              >
                <Search className="w-4 h-4" />
                {t('scan.enter_manually')}
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full mt-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-3 h-3" />
              {t('scan.report_damaged')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
