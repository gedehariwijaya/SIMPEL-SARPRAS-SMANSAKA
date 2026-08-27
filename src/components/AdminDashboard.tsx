import React, { useState } from 'react';
import { DamageReport, ItemLoan, ItemReturn, AppConfig, DamageStatus, LoanStatus } from '../types';
import { StorageService, getTodayISODate } from '../services/storageService';
import { FirebaseService } from '../services/firebaseService';
import { ExportService } from '../services/exportService';
import { SchoolLogo } from './SchoolLogo';
import {
  Shield,
  Wrench,
  Package,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Flame,
  UserCheck,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

interface AdminDashboardProps {
  damageReports: DamageReport[];
  loans: ItemLoan[];
  returns: ItemReturn[];
  config: AppConfig;
  onRefreshData: () => void;
  onSelectDamage: (report: DamageReport) => void;
  onSelectLoan: (loan: ItemLoan) => void;
  onBackToHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  damageReports,
  loans,
  returns,
  config,
  onRefreshData,
  onSelectDamage,
  onSelectLoan,
  onBackToHome,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('simpel_sarpras_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'kerusakan' | 'peminjaman' | 'pengembalian' | 'rekap'>('kerusakan');
  const [isExporting, setIsExporting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Status update modal states
  const [selectedDamageToEdit, setSelectedDamageToEdit] = useState<DamageReport | null>(null);
  const [catatanPetugasInput, setCatatanPetugasInput] = useState('');
  const [targetDamageStatus, setTargetDamageStatus] = useState<DamageStatus>('DIPROSES');

  const todayStr = getTodayISODate();
  const isFirebaseConnected = FirebaseService.isConfigured();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'Aset') {
      setIsAuthenticated(true);
      sessionStorage.setItem('simpel_sarpras_admin_auth', 'true');
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Kata sandi salah! Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('simpel_sarpras_admin_auth');
    setPasswordInput('');
    setAuthError('');
  };

  // If user is not yet authenticated, show password gate screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-6 sm:my-12 animate-fade-in px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          {/* School Badge & Lock Header */}
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 p-2 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
                <SchoolLogo className="w-full h-full" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Akses Admin Sarpras
            </h2>
            <p className="text-xs text-indigo-700 font-bold uppercase tracking-wider mt-0.5">
              SMA Negeri 1 Tejakula
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Masukkan kata sandi administrator untuk mengelola status perbaikan sarana, persetujuan peminjaman, dan unduh data.
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="input-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="Masukkan password admin..."
                  autoFocus
                  required
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-all font-medium"
                />
                <button
                  type="button"
                  id="btn-toggle-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                id="btn-submit-admin-password"
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-900/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Unlock className="w-4 h-4" />
                <span>Buka Panel Admin</span>
              </button>

              {onBackToHome && (
                <button
                  type="button"
                  id="btn-cancel-admin-login"
                  onClick={onBackToHome}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Beranda</span>
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              SIMPEL SARPRAS • Sistem Informasi Manajemen Sarpras
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Metrics
  const pendingDamages = damageReports.filter((d) => d.status === 'DILAPORKAN');
  const processingDamages = damageReports.filter((d) => d.status === 'DIPROSES');
  const finishedDamages = damageReports.filter((d) => d.status === 'SELESAI');

  const pendingLoans = loans.filter((l) => l.status === 'MENUNGGU');
  const approvedLoans = loans.filter((l) => l.status === 'DISETUJUI');
  const activeLoans = loans.filter((l) => l.status === 'SEDANG DIPINJAM');
  const finishedLoans = loans.filter((l) => l.status === 'SELESAI');
  const overdueLoans = loans.filter((l) => l.status === 'SEDANG DIPINJAM' && l.tanggalRencanaKembali < todayStr);

  const handleUpdateDamageStatus = (report: DamageReport, newStatus: DamageStatus, notes?: string) => {
    StorageService.updateDamageReportStatus(report.id, newStatus, notes);
    onRefreshData();
    setSelectedDamageToEdit(null);
    setActionMessage({ text: `Status laporan ${report.id} diubah menjadi ${newStatus}.`, success: true });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleUpdateLoanStatus = (loan: ItemLoan, newStatus: LoanStatus) => {
    StorageService.updateLoanStatus(loan.id, newStatus, 'Waka Sarpras');
    onRefreshData();
    setActionMessage({ text: `Status peminjaman ${loan.id} diubah menjadi ${newStatus}.`, success: true });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      ExportService.exportToPDF('semua', damageReports, loans, returns);
      setActionMessage({ text: 'Laporan PDF resmi berhasil diunduh.', success: true });
    } catch (e) {
      setActionMessage({ text: 'Gagal mengunduh PDF.', success: false });
    } finally {
      setIsExporting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDownloadExcel = () => {
    setIsExporting(true);
    try {
      ExportService.exportToExcel(damageReports, loans, returns);
      setActionMessage({ text: 'Laporan Excel (3 Sheet) berhasil diunduh.', success: true });
    } catch (e) {
      setActionMessage({ text: 'Gagal mengunduh Excel.', success: false });
    } finally {
      setIsExporting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Panel Pengelolaan Waka & Petugas Sarpras
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  Admin Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Persetujuan peminjaman, perbaikan sarana, dan download laporan realtime Firebase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF Button */}
            <button
              id="btn-admin-download-pdf"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              title="Unduh Laporan Format PDF Resmi"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Download Excel Button */}
            <button
              id="btn-admin-download-excel"
              onClick={handleDownloadExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
              title="Unduh Laporan Format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>

            {/* Refresh Data button */}
            <button
              id="btn-admin-refresh"
              onClick={() => {
                onRefreshData();
                setActionMessage({ text: 'Data berhasil dimuat ulang secara realtime dari Firebase.', success: true });
                setTimeout(() => setActionMessage(null), 3000);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-md shadow-slate-900/20 cursor-pointer"
              title="Sinkronkan & Muat Ulang Data Realtime"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Sinkronkan Data</span>
            </button>

            {/* Lock / Logout Admin Button */}
            <button
              id="btn-admin-logout"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-2xl transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer"
              title="Kunci / Keluar dari Panel Admin"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Kunci</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              actionMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{actionMessage.success ? '✅' : '⚠️'}</span>
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Action Sub Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-slate-100">
          <button
            id="subtab-admin-kerusakan"
            onClick={() => setActiveSubTab('kerusakan')}
            className={`p-3 rounded-2xl text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer ${
              activeSubTab === 'kerusakan'
                ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-rose-500" />
              <span>Kelola Kerusakan</span>
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono font-bold">
              {pendingDamages.length + processingDamages.length}
            </span>
          </button>

          <button
            id="subtab-admin-peminjaman"
            onClick={() => setActiveSubTab('peminjaman')}
            className={`p-3 rounded-2xl text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer ${
              activeSubTab === 'peminjaman'
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              <span>Kelola Peminjaman</span>
            </div>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
              {pendingLoans.length}
            </span>
          </button>

          <button
            id="subtab-admin-pengembalian"
            onClick={() => setActiveSubTab('pengembalian')}
            className={`p-3 rounded-2xl text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer ${
              activeSubTab === 'pengembalian'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-500" />
              <span>Pengembalian</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold">
              {returns.length}
            </span>
          </button>

          <button
            id="subtab-admin-rekap"
            onClick={() => setActiveSubTab('rekap')}
            className={`p-3 rounded-2xl text-xs font-extrabold text-left transition-all flex items-center justify-between cursor-pointer ${
              activeSubTab === 'rekap'
                ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Rekap Ringkas</span>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono font-bold">
              📊
            </span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: KELOLA KERUSAKAN */}
      {activeSubTab === 'kerusakan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Daftar Laporan Kerusakan Perlu Tindakan
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {damageReports.length} laporan
            </span>
          </div>

          <div className="space-y-3">
            {damageReports.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Belum ada laporan kerusakan yang masuk.
              </div>
            ) : (
              damageReports.map((report) => (
                <div
                  key={report.id}
                  id={`admin-damage-card-${report.id}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                        {report.id}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {report.tanggalLapor}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          report.status === 'SELESAI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : report.status === 'DIPROSES'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <p><span className="text-slate-500">Sarana / Fasilitas:</span> <strong className="text-slate-900 font-bold text-sm">{report.namaSarana}</strong></p>
                      <p><span className="text-slate-500">Lokasi:</span> <strong className="text-slate-800">{report.lokasi} ({report.detailLokasi})</strong></p>
                      <p><span className="text-slate-500">Tingkat Kerusakan:</span> <span className="font-semibold text-rose-700">{report.jenisKerusakan}</span></p>
                      <p><span className="text-slate-500">Deskripsi:</span> {report.deskripsi}</p>
                    </div>

                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p><span className="text-slate-500">Pelapor:</span> <strong className="text-slate-900 font-bold">{report.namaPelapor}</strong> ({report.statusPelapor})</p>
                      <p><span className="text-slate-500">Kontak:</span> {report.kontak || '-'}</p>
                      {report.catatanPetugas && (
                        <p><span className="text-slate-500">Catatan Petugas:</span> <strong className="text-indigo-800">{report.catatanPetugas}</strong></p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Damage */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onSelectDamage(report)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Detail Foto
                    </button>

                    {report.status !== 'DIPROSES' && report.status !== 'SELESAI' && (
                      <button
                        id={`btn-proses-${report.id}`}
                        onClick={() => {
                          setSelectedDamageToEdit(report);
                          setTargetDamageStatus('DIPROSES');
                          setCatatanPetugasInput(report.catatanPetugas || 'Sedang dalam penanganan teknisi sarpras.');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        Tandai Diproses
                      </button>
                    )}

                    {report.status !== 'SELESAI' && (
                      <button
                        id={`btn-selesai-${report.id}`}
                        onClick={() => {
                          setSelectedDamageToEdit(report);
                          setTargetDamageStatus('SELESAI');
                          setCatatanPetugasInput(report.catatanPetugas || 'Perbaikan telah selesai dilaksanakan.');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        Selesai Diperbaiki
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: KELOLA PEMINJAMAN */}
      {activeSubTab === 'peminjaman' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Daftar Permohonan & Status Peminjaman
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {loans.length} peminjaman
            </span>
          </div>

          <div className="space-y-3">
            {loans.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Belum ada permohonan peminjaman.
              </div>
            ) : (
              loans.map((loan) => (
                <div
                  key={loan.id}
                  id={`admin-loan-card-${loan.id}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                        {loan.id}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Tgl Pinjam: {loan.tanggalPinjam}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          loan.status === 'DISETUJUI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : loan.status === 'SEDANG DIPINJAM'
                            ? 'bg-indigo-100 text-indigo-800'
                            : loan.status === 'SELESAI'
                            ? 'bg-slate-100 text-slate-700'
                            : loan.status === 'DITOLAK'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <p><span className="text-slate-500">Barang:</span> <strong className="text-slate-900 font-bold text-sm">{loan.namaBarang} ({loan.jumlah})</strong></p>
                      <p><span className="text-slate-500">Waktu / Durasi:</span> {loan.waktu || 'Jam Pelajaran'}</p>
                      <p><span className="text-slate-500">Rencana Kembali:</span> <strong className="text-slate-800">{loan.tanggalRencanaKembali}</strong></p>
                      <p><span className="text-slate-500">Keperluan:</span> {loan.keperluan}</p>
                    </div>

                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p><span className="text-slate-500">Peminjam:</span> <strong className="text-slate-900 font-bold">{loan.namaPeminjam}</strong> ({loan.statusPeminjam} - {loan.kelasUnit})</p>
                      <p><span className="text-slate-500">Kontak:</span> {loan.kontak}</p>
                      {loan.persetujuanOleh && (
                        <p><span className="text-slate-500">Disetujui Oleh:</span> <strong className="text-emerald-700">{loan.persetujuanOleh}</strong></p>
                      )}
                    </div>
                  </div>

                  {/* Actions for Loans */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onSelectLoan(loan)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Detail
                    </button>

                    {loan.status === 'MENUNGGU' && (
                      <>
                        <button
                          id={`btn-approve-${loan.id}`}
                          onClick={() => handleUpdateLoanStatus(loan, 'DISETUJUI')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          Setujui Peminjaman
                        </button>
                        <button
                          id={`btn-reject-${loan.id}`}
                          onClick={() => handleUpdateLoanStatus(loan, 'DITOLAK')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {loan.status === 'DISETUJUI' && (
                      <button
                        id={`btn-handover-${loan.id}`}
                        onClick={() => handleUpdateLoanStatus(loan, 'SEDANG DIPINJAM')}
                        className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        Serahkan Barang (Mulai Pinjam)
                      </button>
                    )}

                    {loan.status === 'SEDANG DIPINJAM' && (
                      <button
                        id={`btn-finish-loan-${loan.id}`}
                        onClick={() => handleUpdateLoanStatus(loan, 'SELESAI')}
                        className="px-3.5 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        Tandai Selesai Kembali
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: PENGEMBALIAN */}
      {activeSubTab === 'pengembalian' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Riwayat Pengembalian Sarana
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {returns.length} pengembalian tercatat
            </span>
          </div>

          <div className="space-y-3">
            {returns.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Belum ada catatan pengembalian.
              </div>
            ) : (
              returns.map((ret) => (
                <div
                  key={ret.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                      {ret.id}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        ret.kondisiBarang === 'Baik'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ret.kondisiBarang === 'Ada kerusakan'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Kondisi: {ret.kondisiBarang}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p><span className="text-slate-500">Barang:</span> <strong className="text-slate-900 font-bold">{ret.namaBarang} ({ret.jumlah})</strong></p>
                    <p><span className="text-slate-500">Peminjam:</span> <strong className="text-slate-800 font-bold">{ret.namaPeminjam}</strong></p>
                    <p><span className="text-slate-500">Tgl Pengembalian:</span> {ret.tanggalPengembalian}</p>
                    {ret.catatan && <p className="bg-slate-50 p-2.5 rounded-xl text-slate-700 border border-slate-100 mt-2"><strong>Catatan:</strong> {ret.catatan}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: REKAP RINGKAS */}
      {activeSubTab === 'rekap' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Ringkasan Rekapitulasi Sarpras
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Box 1: Rekap Kerusakan */}
              <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 space-y-2.5">
                <h4 className="text-xs font-black text-rose-900 uppercase">Rekap Kerusakan</h4>
                <div className="text-xs text-slate-700 space-y-1.5">
                  <div className="flex justify-between"><span>Laporan Baru:</span> <strong className="text-rose-700 font-bold">{pendingDamages.length}</strong></div>
                  <div className="flex justify-between"><span>Sedang Diproses:</span> <strong className="text-amber-700 font-bold">{processingDamages.length}</strong></div>
                  <div className="flex justify-between"><span>Selesai Diperbaiki:</span> <strong className="text-emerald-700 font-bold">{finishedDamages.length}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-rose-200 font-black text-slate-900"><span>Total:</span> <span>{damageReports.length}</span></div>
                </div>
              </div>

              {/* Box 2: Rekap Peminjaman */}
              <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100 space-y-2.5">
                <h4 className="text-xs font-black text-indigo-900 uppercase">Rekap Peminjaman</h4>
                <div className="text-xs text-slate-700 space-y-1.5">
                  <div className="flex justify-between"><span>Menunggu:</span> <strong className="text-amber-700 font-bold">{pendingLoans.length}</strong></div>
                  <div className="flex justify-between"><span>Disetujui:</span> <strong className="text-emerald-700 font-bold">{approvedLoans.length}</strong></div>
                  <div className="flex justify-between"><span>Sedang Dipinjam:</span> <strong className="text-indigo-700 font-bold">{activeLoans.length}</strong></div>
                  <div className="flex justify-between"><span>Selesai:</span> <strong className="text-slate-700 font-bold">{finishedLoans.length}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-indigo-200 font-black text-slate-900"><span>Total:</span> <span>{loans.length}</span></div>
                </div>
              </div>

              {/* Box 3: Rekap Pengembalian */}
              <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 space-y-2.5">
                <h4 className="text-xs font-black text-emerald-900 uppercase">Rekap Pengembalian</h4>
                <div className="text-xs text-slate-700 space-y-1.5">
                  <div className="flex justify-between"><span>Kondisi Baik:</span> <strong className="text-emerald-700 font-bold">{returns.filter(r => r.kondisiBarang === 'Baik').length}</strong></div>
                  <div className="flex justify-between"><span>Ada Kerusakan:</span> <strong className="text-amber-700 font-bold">{returns.filter(r => r.kondisiBarang === 'Ada kerusakan').length}</strong></div>
                  <div className="flex justify-between"><span>Rusak:</span> <strong className="text-rose-700 font-bold">{returns.filter(r => r.kondisiBarang === 'Rusak').length}</strong></div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 font-black text-slate-900"><span>Total Pengembalian:</span> <span>{returns.length}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-200 font-medium">
              💡 <strong>Database Cloud Firebase Firestore:</strong> Seluruh data disimpan dan disinkronkan secara realtime ke database Firebase Firestore. Anda dapat langsung mengunduh laporan PDF resmi atau file Excel (.xlsx) kapan saja menggunakan tombol di atas.
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Status Kerusakan */}
      {selectedDamageToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-scale-up">
            <h3 className="text-base font-black text-slate-900">
              Perbarui Status Perbaikan ({selectedDamageToEdit.id})
            </h3>
            <p className="text-xs text-slate-600">
              Fasilitas: <strong className="text-slate-900">{selectedDamageToEdit.namaSarana}</strong> ({selectedDamageToEdit.lokasi})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Baru</label>
                <select
                  value={targetDamageStatus}
                  onChange={(e) => setTargetDamageStatus(e.target.value as DamageStatus)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="DIPROSES">DIPROSES (Sedang dalam pengerjaan teknisi)</option>
                  <option value="SELESAI">SELESAI (Perbaikan tuntas)</option>
                  <option value="DILAPORKAN">DILAPORKAN (Kembalikan ke antrean)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Petugas Sarpras</label>
                <textarea
                  value={catatanPetugasInput}
                  onChange={(e) => setCatatanPetugasInput(e.target.value)}
                  placeholder="Tuliskan tindakan teknisi, penggantian suku cadang, atau konfirmasi selesai..."
                  rows={3}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDamageToEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleUpdateDamageStatus(selectedDamageToEdit, targetDamageStatus, catatanPetugasInput)}
                className="px-4 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
              >
                Simpan Pembaruan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attribution & System Info Footer in Admin Tab */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 md:p-6 text-white border border-indigo-900/50 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <SchoolLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white tracking-tight">
                  SIMPEL SARPRAS SMA Negeri 1 Tejakula
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Firebase Edition</span>
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-semibold mt-0.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dibuat oleh : <strong>Gede Hari Wijaya, S.Pd. Gr.</strong></span>
              </p>
            </div>
          </div>

          <div className="text-right sm:text-right text-[11px] text-slate-300 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
            <span className="font-bold text-white tracking-wide">Widya Sthiti Dharma</span>
            <span className="text-indigo-300">Tim Sarana & Prasarana SMAN 1 Tejakula</span>
          </div>
        </div>
      </div>
    </div>
  );
};
