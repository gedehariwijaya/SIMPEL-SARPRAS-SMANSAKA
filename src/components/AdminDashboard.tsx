import React, { useState } from 'react';
import { DamageReport, ItemLoan, ItemReturn, AppConfig, DamageStatus, LoanStatus } from '../types';
import { StorageService, getTodayISODate } from '../services/storageService';
import { GoogleDriveService } from '../services/googleDriveService';
import { SchoolLogo } from './SchoolLogo';
import { Shield, Wrench, Package, RotateCcw, CheckCircle2, Clock, XCircle, AlertTriangle, Sheet, RefreshCw, ChevronRight, Settings, Sparkles, FolderOpen, UserCheck } from 'lucide-react';

interface AdminDashboardProps {
  damageReports: DamageReport[];
  loans: ItemLoan[];
  returns: ItemReturn[];
  config: AppConfig;
  onRefreshData: () => void;
  onOpenConfigModal: () => void;
  onSelectDamage: (report: DamageReport) => void;
  onSelectLoan: (loan: ItemLoan) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  damageReports,
  loans,
  returns,
  config,
  onRefreshData,
  onOpenConfigModal,
  onSelectDamage,
  onSelectLoan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kerusakan' | 'peminjaman' | 'pengembalian' | 'rekap'>('kerusakan');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Status update states
  const [selectedDamageToEdit, setSelectedDamageToEdit] = useState<DamageReport | null>(null);
  const [catatanPetugasInput, setCatatanPetugasInput] = useState('');
  const [targetDamageStatus, setTargetDamageStatus] = useState<DamageStatus>('DIPROSES');

  const todayStr = getTodayISODate();

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
  };

  const handleUpdateLoanStatus = (loan: ItemLoan, newStatus: LoanStatus) => {
    StorageService.updateLoanStatus(loan.id, newStatus, 'Waka Sarpras');
    onRefreshData();
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMessage(null);

    const token = GoogleDriveService.getStoredToken();
    let sheetId = config.googleSpreadsheetId;
    if (!sheetId && config.googleSpreadsheetUrl) {
      const match = config.googleSpreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) sheetId = match[1];
    }

    if (token && sheetId) {
      // Direct Google Drive & Sheets API sync
      const res = await GoogleDriveService.syncAllToSpreadsheet(token.accessToken, sheetId, {
        damageReports,
        loans,
        returns,
      });
      setSyncing(false);
      setSyncMessage({ text: res.message, success: res.success });
      if (res.success) {
        const updated = { ...config, lastSyncedAt: new Date().toISOString() };
        StorageService.saveConfig(updated);
        onRefreshData();
      }
      setTimeout(() => setSyncMessage(null), 5000);
      return;
    }

    if (config.appsScriptWebhookUrl) {
      const res = await StorageService.syncAllToGoogleSheets();
      setSyncing(false);
      setSyncMessage({ text: res.message, success: res.success });
      setTimeout(() => setSyncMessage(null), 5000);
      return;
    }

    setSyncing(false);
    // If not configured, open modal so user can click "Buat Database Otomatis"
    onOpenConfigModal();
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
                Persetujuan peminjaman, perbaikan sarana, dan sinkronisasi Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Google Sheets Link */}
            {config.googleSpreadsheetUrl && (
              <a
                id="btn-admin-open-sheet"
                href={config.googleSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl transition-all shadow-md shadow-emerald-900/20"
              >
                <Sheet className="w-4 h-4" />
                <span>Buka Google Sheets</span>
              </a>
            )}

            {/* Sync Now button */}
            <button
              id="btn-admin-sync-sheets"
              onClick={handleSyncAll}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-2xl transition-all shadow-md shadow-indigo-900/20 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sinkronisasi...' : 'Sinkronkan Data'}</span>
            </button>

            {/* Config modal button */}
            <button
              id="btn-admin-open-settings"
              onClick={onOpenConfigModal}
              className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
              title="Pengaturan Google Sheets"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {syncMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              syncMessage.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <span>{syncMessage.success ? '✅' : 'ℹ️'}</span>
            <span>{syncMessage.text}</span>
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
              <Sheet className="w-4 h-4 text-amber-600" />
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
                Belum ada laporan kerusakan.
              </div>
            ) : (
              damageReports.map((report) => (
                <div
                  key={report.id}
                  id={`admin-damage-item-${report.id}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg">
                        {report.id}
                      </span>
                      <span className="text-xs text-slate-500">{report.tanggalLapor}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Sarana & Kerusakan:</span>
                      <span className="text-sm font-black text-slate-900">{report.namaSarana}</span>
                      <span className="text-rose-600 font-bold block">{report.jenisKerusakan}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Lokasi:</span>
                      <span className="font-bold text-slate-800">{report.lokasi} - {report.detailLokasi || '-'}</span>
                      <span className="text-slate-500 block">Pelapor: {report.namaPelapor} ({report.statusPelapor})</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-0.5">Deskripsi:</span>
                    <p>{report.deskripsi}</p>
                    {report.catatanPetugas && (
                      <p className="mt-2 text-indigo-800 font-medium bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                        <strong>Catatan Petugas:</strong> {report.catatanPetugas}
                      </p>
                    )}
                  </div>

                  {/* Actions for Admin */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectDamage(report)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Lihat Foto & Detail
                    </button>

                    <div className="flex items-center gap-2">
                      {report.status !== 'DIPROSES' && report.status !== 'SELESAI' && (
                        <button
                          id={`btn-set-process-${report.id}`}
                          onClick={() => {
                            const notes = prompt('Masukkan catatan tindak lanjut (opsional):', 'Sedang dalam penanganan teknisi');
                            handleUpdateDamageStatus(report, 'DIPROSES', notes || undefined);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          🟡 Tandai Diproses
                        </button>
                      )}

                      {report.status !== 'SELESAI' && (
                        <button
                          id={`btn-set-done-${report.id}`}
                          onClick={() => {
                            const notes = prompt('Catatan penyelesaian perbaikan:', report.catatanPetugas || 'Kerusakan telah selesai diperbaiki.');
                            handleUpdateDamageStatus(report, 'SELESAI', notes || undefined);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          🟢 Tandai Selesai
                        </button>
                      )}
                    </div>
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
              Daftar Permohonan & Peminjaman Barang
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {pendingLoans.length} menunggu persetujuan
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
                  id={`admin-loan-item-${loan.id}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                        {loan.id}
                      </span>
                      <span className="text-xs text-slate-500">Tgl Pinjam: {loan.tanggalPinjam}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          loan.status === 'SELESAI'
                            ? 'bg-slate-100 text-slate-700'
                            : loan.status === 'SEDANG DIPINJAM'
                            ? 'bg-indigo-100 text-indigo-800'
                            : loan.status === 'DISETUJUI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : loan.status === 'DITOLAK'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Barang & Jumlah:</span>
                      <span className="text-sm font-black text-slate-900">{loan.namaBarang}</span>
                      <span className="text-indigo-600 font-bold block">{loan.jumlah}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Peminjam:</span>
                      <span className="font-bold text-slate-800">{loan.namaPeminjam}</span>
                      <span className="text-slate-500 block">{loan.kelasUnit || loan.statusPeminjam} • Kontak: {loan.kontak || '-'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl text-xs text-slate-700 border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-0.5">Keperluan:</span>
                    <p>{loan.keperluan}</p>
                    <div className="mt-1 text-slate-500">
                      Rencana Kembali: <strong className="text-slate-700 font-bold">{loan.tanggalRencanaKembali}</strong>
                      {loan.waktu && ` (${loan.waktu})`}
                    </div>
                  </div>

                  {/* Actions for Admin */}
                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectLoan(loan)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                    >
                      Lihat Rincian
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {loan.status === 'MENUNGGU' && (
                        <>
                          <button
                            id={`btn-approve-loan-${loan.id}`}
                            onClick={() => handleUpdateLoanStatus(loan, 'DISETUJUI')}
                            className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            🟢 Setujui
                          </button>
                          <button
                            id={`btn-reject-loan-${loan.id}`}
                            onClick={() => handleUpdateLoanStatus(loan, 'DITOLAK')}
                            className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            🔴 Tolak
                          </button>
                        </>
                      )}

                      {loan.status === 'DISETUJUI' && (
                        <button
                          id={`btn-give-item-${loan.id}`}
                          onClick={() => handleUpdateLoanStatus(loan, 'SEDANG DIPINJAM')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          🔵 Serahkan Barang (Dipinjam)
                        </button>
                      )}

                      {loan.status === 'SEDANG DIPINJAM' && (
                        <button
                          id={`btn-mark-done-loan-${loan.id}`}
                          onClick={() => handleUpdateLoanStatus(loan, 'SELESAI')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                        >
                          ⚫ Tandai Selesai
                        </button>
                      )}
                    </div>
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
              💡 <strong>Integrasi Google Sheets:</strong> Seluruh data disimpan secara otomatis ke Spreadsheet Google Drive sekolah. Anda dapat melihat, memfilter, membuat pivot table, atau mencetak laporan resmi langsung dari Google Sheets.
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
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  v1.2 Official
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
