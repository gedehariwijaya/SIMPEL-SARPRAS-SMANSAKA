import React, { useState, useEffect } from 'react';
import { AppConfig, DamageReport, ItemLoan, ItemReturn } from '../types';
import { StorageService } from '../services/storageService';
import { GoogleDriveService, GoogleAuthToken } from '../services/googleDriveService';
import { SchoolLogo } from './SchoolLogo';
import {
  X,
  Sheet,
  Check,
  Copy,
  RefreshCw,
  ExternalLink,
  Code2,
  Database,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  FolderOpen,
  HelpCircle,
  Settings
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  damageReports: DamageReport[];
  loans: ItemLoan[];
  returns: ItemReturn[];
  onSaveConfig: (config: AppConfig) => void;
  onRefreshAllData: () => void;
  onResetDemoData: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  damageReports,
  loans,
  returns,
  onSaveConfig,
  onRefreshAllData,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'drive' | 'settings' | 'guide' | 'code'>('drive');
  
  // Google Drive & OAuth states
  const [authToken, setAuthToken] = useState<GoogleAuthToken | null>(GoogleDriveService.getStoredToken());
  const [isCreatingInDrive, setIsCreatingInDrive] = useState(false);
  const [creationStep, setCreationStep] = useState<string>('');
  const [driveActionMessage, setDriveActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Syncing states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Manual Settings state
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(config.googleSpreadsheetUrl);
  const [webhookUrl, setWebhookUrl] = useState(config.appsScriptWebhookUrl);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const appsScriptCode = StorageService.getGoogleAppsScriptCode();

  useEffect(() => {
    setAuthToken(GoogleDriveService.getStoredToken());
  }, [isOpen]);

  // Handle 1-Click Create in Google Drive
  const handleCreateInDrive = async () => {
    setIsCreatingInDrive(true);
    setDriveActionMessage(null);
    setCreationStep('Menghubungkan ke Akun Google...');

    try {
      let token = authToken?.accessToken;
      if (!token || (authToken && Date.now() > authToken.expiresAt)) {
        setCreationStep('Membuka izin Google Drive & Sheets...');
        token = await GoogleDriveService.requestAccessToken();
        const stored = GoogleDriveService.getStoredToken();
        setAuthToken(stored);
      }

      setCreationStep('Membuat file Spreadsheet "SIMPEL SARPRAS SMA Negeri 1 Tejakula" di Google Drive...');
      
      const result = await GoogleDriveService.createSpreadsheetInDrive(token, {
        damageReports,
        loans,
        returns,
      });

      setCreationStep('Menyimpan konfigurasi database...');

      const updatedConfig: AppConfig = {
        ...config,
        googleSpreadsheetId: result.spreadsheetId,
        googleSpreadsheetUrl: result.spreadsheetUrl,
        lastSyncedAt: new Date().toISOString(),
      };

      StorageService.saveConfig(updatedConfig);
      onSaveConfig(updatedConfig);
      setSpreadsheetUrl(result.spreadsheetUrl);

      setDriveActionMessage({
        type: 'success',
        text: 'Spreadsheet database berhasil dibuat di Google Drive Anda dengan 4 Sheet terstruktur!',
      });
    } catch (err: any) {
      console.error('Error creating spreadsheet in Drive:', err);
      setDriveActionMessage({
        type: 'error',
        text: err.message || 'Gagal membuat spreadsheet di Google Drive.',
      });
    } finally {
      setIsCreatingInDrive(false);
      setCreationStep('');
    }
  };

  // Handle Syncing to Google Sheets
  const handleSyncToDrive = async () => {
    if (!config.googleSpreadsheetId && !config.googleSpreadsheetUrl) {
      setDriveActionMessage({
        type: 'error',
        text: 'Belum ada Spreadsheet yang terhubung. Buat otomatis atau masukkan URL terlebih dahulu.',
      });
      return;
    }

    setIsSyncing(true);
    setDriveActionMessage(null);

    try {
      let token = authToken?.accessToken;
      if (!token || (authToken && Date.now() > authToken.expiresAt)) {
        token = await GoogleDriveService.requestAccessToken();
        setAuthToken(GoogleDriveService.getStoredToken());
      }

      let sheetId = config.googleSpreadsheetId;
      if (!sheetId && config.googleSpreadsheetUrl) {
        const match = config.googleSpreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) sheetId = match[1];
      }

      if (!sheetId) {
        throw new Error('ID Spreadsheet tidak valid.');
      }

      const res = await GoogleDriveService.syncAllToSpreadsheet(token, sheetId, {
        damageReports,
        loans,
        returns,
      });

      if (res.success) {
        const updatedConfig = { ...config, lastSyncedAt: new Date().toISOString() };
        StorageService.saveConfig(updatedConfig);
        onSaveConfig(updatedConfig);
        setDriveActionMessage({
          type: 'success',
          text: res.message,
        });
      } else {
        setDriveActionMessage({
          type: 'error',
          text: res.message,
        });
      }
    } catch (err: any) {
      setDriveActionMessage({
        type: 'error',
        text: 'Gagal sinkronisasi: ' + err.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Pulling Data from Google Sheets
  const handlePullFromDrive = async () => {
    if (!config.googleSpreadsheetId && !config.googleSpreadsheetUrl) {
      setDriveActionMessage({
        type: 'error',
        text: 'Belum ada Spreadsheet yang terhubung.',
      });
      return;
    }

    setIsPulling(true);
    setDriveActionMessage(null);

    try {
      let token = authToken?.accessToken;
      if (!token || (authToken && Date.now() > authToken.expiresAt)) {
        token = await GoogleDriveService.requestAccessToken();
        setAuthToken(GoogleDriveService.getStoredToken());
      }

      let sheetId = config.googleSpreadsheetId;
      if (!sheetId && config.googleSpreadsheetUrl) {
        const match = config.googleSpreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) sheetId = match[1];
      }

      if (!sheetId) {
        throw new Error('ID Spreadsheet tidak valid.');
      }

      const pulled = await GoogleDriveService.pullDataFromSpreadsheet(token, sheetId);

      if (pulled.damageReports.length > 0) {
        localStorage.setItem('simpel_sarpras_damage_v1', JSON.stringify(pulled.damageReports));
      }
      if (pulled.loans.length > 0) {
        localStorage.setItem('simpel_sarpras_loans_v1', JSON.stringify(pulled.loans));
      }
      if (pulled.returns.length > 0) {
        localStorage.setItem('simpel_sarpras_returns_v1', JSON.stringify(pulled.returns));
      }

      onRefreshAllData();
      setDriveActionMessage({
        type: 'success',
        text: `Berhasil mengunduh data (${pulled.damageReports.length} laporan, ${pulled.loans.length} peminjaman, ${pulled.returns.length} pengembalian) dari Google Sheets!`,
      });
    } catch (err: any) {
      setDriveActionMessage({
        type: 'error',
        text: 'Gagal menarik data: ' + err.message,
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleSaveManual = () => {
    let sheetId = config.googleSpreadsheetId;
    if (spreadsheetUrl.trim()) {
      const match = spreadsheetUrl.trim().match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) sheetId = match[1];
    }

    const updated: AppConfig = {
      ...config,
      googleSpreadsheetId: sheetId,
      googleSpreadsheetUrl: spreadsheetUrl.trim(),
      appsScriptWebhookUrl: webhookUrl.trim(),
      autoSync,
    };
    StorageService.saveConfig(updated);
    onSaveConfig(updated);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          action: 'test_connection',
          data: { test: true, time: new Date().toISOString() },
        }),
      });

      const result = await res.json();
      if (result.success) {
        setTestResult({
          success: true,
          message: 'Koneksi ke Google Apps Script Webhook berhasil!',
        });
      } else {
        setTestResult({
          success: false,
          message: result.message || 'Koneksi gagal.',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Koneksi gagal: ' + e.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        id="google-sheets-modal-container"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 p-1 border border-white/25 flex items-center justify-center shadow-xs">
              <SchoolLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  Database Google Drive & Sheets
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded-full">
                  SMAN 1 Tejakula
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                Penyimpanan cloud resmi & sinkronisasi data sarana prasarana
              </p>
            </div>
          </div>

          <button
            id="btn-close-sheets-modal"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            id="modal-tab-drive"
            onClick={() => setActiveTab('drive')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'drive'
                ? 'bg-white text-emerald-800 shadow-xs border-t-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Drive Otomatis</span>
          </button>

          <button
            id="modal-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-emerald-800 shadow-xs border-t-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Atur URL Manual</span>
          </button>

          <button
            id="modal-tab-guide"
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white text-emerald-800 shadow-xs border-t-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Struktur Database</span>
          </button>

          <button
            id="modal-tab-code"
            onClick={() => setActiveTab('code')}
            className={`px-3.5 sm:px-4 py-2.5 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-white text-emerald-800 shadow-xs border-t-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Apps Script</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* TAB 1: GOOGLE DRIVE OTOMATIS */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {/* Feature Intro Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-indigo-50/30 border border-emerald-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      Pembuatan Database Google Spreadsheet 1-Klik
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Sistem akan membuat file spreadsheet baru bernama{' '}
                      <strong className="text-emerald-900 font-bold">
                        SIMPEL SARPRAS SMA Negeri 1 Tejakula
                      </strong>{' '}
                      langsung di Google Drive Anda, lengkap dengan 4 sheet berwarna (Kerusakan, Peminjaman, Pengembalian, & Inventaris Sarana) serta menyalin data saat ini.
                    </p>
                  </div>
                </div>

                {/* Status Spreadsheet */}
                {config.googleSpreadsheetUrl ? (
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Spreadsheet Terhubung di Google Drive
                      </span>
                      {config.lastSyncedAt && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          Terakhir sync: {new Date(config.lastSyncedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        id="btn-modal-open-drive-sheet"
                        href={config.googleSpreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Buka di Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={handleSyncToDrive}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <Upload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                        <span>{isSyncing ? 'Mengunggah...' : 'Unggah / Sync ke Sheet'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePullFromDrive}
                        disabled={isPulling}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <Download className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                        <span>{isPulling ? 'Mengunduh...' : 'Tarik Data'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-create-in-drive-action"
                      onClick={handleCreateInDrive}
                      disabled={isCreatingInDrive}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-emerald-900/20 hover:shadow-xl cursor-pointer disabled:opacity-60"
                    >
                      {isCreatingInDrive ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>
                        {isCreatingInDrive
                          ? 'Sedang Memproses Pembuatan Database...'
                          : '🚀 Buat Database Spreadsheet Otomatis di Google Drive Saya'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Progress step or notification */}
              {creationStep && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-bold flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>{creationStep}</span>
                </div>
              )}

              {driveActionMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
                    driveActionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : driveActionMessage.type === 'error'
                      ? 'bg-rose-50 text-rose-900 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  }`}
                >
                  <span className="text-base leading-none">
                    {driveActionMessage.type === 'success' ? '✅' : driveActionMessage.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <p>{driveActionMessage.text}</p>
                  </div>
                </div>
              )}

              {/* If already has spreadsheet, show re-create or overwrite option */}
              {config.googleSpreadsheetUrl && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">
                      Opsi Pembuatan Ulang / Reset Spreadsheet
                    </span>
                    <button
                      type="button"
                      onClick={handleCreateInDrive}
                      disabled={isCreatingInDrive}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Buat File Baru Lagi di Drive
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gunakan jika Anda ingin membuat file spreadsheet terpisah atau meregenerasi struktur sheet yang baru.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  URL Google Spreadsheet Sarpras (Google Drive)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    id="input-spreadsheet-url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono"
                  />
                  {spreadsheetUrl && (
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-emerald-200 transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </a>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Spreadsheet di Google Drive sekolah yang memuat sheet KERUSAKAN, PEMINJAMAN, PENGEMBALIAN, & INVENTARIS_SARANA.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  URL Web App Google Apps Script (Opsional / Webhook)
                </label>
                <input
                  type="url"
                  id="input-apps-script-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-hidden font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Didapatkan setelah Deploy Web App di Apps Script spreadsheet Anda jika ingin menggunakan webhook tanpa Google Login.
                </span>
              </div>

              {/* Test Connection Button */}
              {webhookUrl && (
                <div className="pt-1">
                  <button
                    type="button"
                    id="btn-test-connection"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Menguji...' : 'Uji Koneksi Webhook'}</span>
                  </button>

                  {testResult && (
                    <div
                      className={`mt-2 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        testResult.success
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <span>{testResult.success ? '✅' : '❌'}</span>
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Demo Data Reset */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-800 block">Data Awal SMAN 1 Tejakula</span>
                  <span className="text-[11px] text-slate-500">Kembalikan data percontohan siap uji</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Kembalikan data percontohan awal SMAN 1 Tejakula?')) {
                      onResetDemoData();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reset Data Uji
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN STRUKTUR SHEET */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <span className="font-black text-emerald-950 block text-sm">
                  Struktur 4 Sheet Database di Google Drive:
                </span>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Ketika Anda mengklik tombol <strong>Buat Database Otomatis</strong>, spreadsheet Anda akan otomatis memiliki 4 Sheet berwarna:
                </p>
                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <strong className="text-indigo-900 block font-bold">1. Sheet KERUSAKAN (Header Biru Indigo)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kolom: <code>ID_LAPORAN, TIMESTAMP, NAMA_PELAPOR, STATUS_PELAPOR, KONTAK, LOKASI, DETAIL_LOKASI, NAMA_SARANA, JENIS_KERUSAKAN, DESKRIPSI, FOTO_BUKTI, TANGGAL_LAPOR, STATUS, CATATAN_PETUGAS, TANGGAL_SELESAI</code>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100">
                    <strong className="text-indigo-900 block font-bold">2. Sheet PEMINJAMAN (Header Ungu Indigo)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kolom: <code>ID_PEMINJAMAN, TIMESTAMP, NAMA_PEMINJAM, STATUS_PEMINJAM, KELAS_UNIT, KONTAK, NAMA_BARANG, JUMLAH, KEPERLUAN, TANGGAL_PINJAM, RENCANA_KEMBALI, CATATAN, STATUS</code>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-100">
                    <strong className="text-emerald-900 block font-bold">3. Sheet PENGEMBALIAN (Header Hijau Emerald)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kolom: <code>ID_PENGEMBALIAN, ID_PEMINJAMAN, TIMESTAMP, NAMA_PEMINJAM, NAMA_BARANG, JUMLAH, TANGGAL_PINJAM, RENCANA_KEMBALI, TANGGAL_PENGEMBALIAN, KONDISI_BARANG, CATATAN, FOTO_BUKTI, STATUS</code>
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-teal-100">
                    <strong className="text-teal-900 block font-bold">4. Sheet INVENTARIS_SARANA (Header Cyan Teal)</strong>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kolom: <code>KODE_BARANG, NAMA_SARANA_BARANG, KATEGORI, LOKASI_STANDAR, TOTAL_UNIT, TERSEDIA, KONDISI_BAIK, KONDISI_RUSAK</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPS SCRIPT CODE */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700">
                  Skrip Siap Pakai Google Apps Script
                </span>
                <button
                  type="button"
                  id="btn-copy-apps-script-code"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Seluruh Kode'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed select-all border border-slate-800">
                {appsScriptCode}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {activeTab === 'settings' && (
            <button
              type="button"
              id="btn-save-sheets-config"
              onClick={handleSaveManual}
              className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Simpan Konfigurasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
