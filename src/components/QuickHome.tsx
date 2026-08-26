import React from 'react';
import { ActiveTab, DamageReport, ItemLoan, ItemReturn, ActivityLog } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { Wrench, Package, RotateCcw, AlertTriangle, Clock, ArrowRight, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';
import { getTodayISODate } from '../services/storageService';

interface QuickHomeProps {
  setActiveTab: (tab: ActiveTab) => void;
  damageReports: DamageReport[];
  loans: ItemLoan[];
  returns: ItemReturn[];
  activities: ActivityLog[];
  onSelectActivity: (activity: ActivityLog) => void;
}

export const QuickHome: React.FC<QuickHomeProps> = ({
  setActiveTab,
  damageReports,
  loans,
  returns,
  activities,
  onSelectActivity,
}) => {
  const todayStr = getTodayISODate();

  // Metrics computation
  const newDamageCount = damageReports.filter((d) => d.status === 'DILAPORKAN' || d.status === 'DIPROSES').length;
  const pendingLoanCount = loans.filter((l) => l.status === 'MENUNGGU').length;
  const activeLoanCount = loans.filter((l) => l.status === 'SEDANG DIPINJAM').length;
  const returnedTodayCount = returns.filter((r) => r.tanggalPengembalian === todayStr).length;

  // Overdue loans (planned return date < today & still being borrowed)
  const overdueCount = loans.filter(
    (l) => l.status === 'SEDANG DIPINJAM' && l.tanggalRencanaKembali < todayStr
  ).length;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20 md:pb-8">
      {/* Welcome Banner Card */}
      <div className="bg-white rounded-3xl p-6 md:p-7 shadow-xs border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50/80 p-1.5 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
              <SchoolLogo className="w-full h-full" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs font-black tracking-wide uppercase mb-1.5">
                <span>SMA Negeri 1 Tejakula</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Selamat Datang di SIMPEL SARPRAS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Layanan terpadu pelaporan kerusakan fasilitas, peminjaman sarana sekolah, dan pencatatan pengembalian barang terintegrasi Database Realtime Firebase dengan dukungan unduh laporan PDF & Excel.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100/90 px-3.5 py-2 rounded-2xl self-start md:self-center border border-slate-200/60 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400"></span>
            <span>Operasional Sekolah Aktif</span>
          </div>
        </div>
      </div>

      {/* 3 Main Action Cards (Big, Touch-Friendly, Core Focal Point in Vibrant Palette) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Aksi Cepat Layanan
          </h3>
          <span className="text-xs text-slate-500">Pilih salah satu menu di bawah</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {/* Card 1: LAPOR KERUSAKAN (Rose Vibrant) */}
          <button
            id="btn-main-lapor-kerusakan"
            onClick={() => setActiveTab('kerusakan')}
            className="group relative text-left bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 hover:from-rose-600 hover:to-red-800 text-white p-6 rounded-3xl shadow-md hover:shadow-xl hover:shadow-rose-900/20 transition-all duration-200 transform active:scale-[0.99] flex flex-col justify-between min-h-[160px] md:min-h-[180px] border border-rose-400/40 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <span>🔧</span>
                <span>LAPOR KERUSAKAN</span>
              </h4>
              <p className="text-xs md:text-sm text-rose-100 mt-1.5 line-clamp-2 leading-relaxed">
                Laporkan fasilitas kelas, lab, AC, listrik, atau sarana yang rusak untuk perbaikan cepat.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-white group-hover:translate-x-1.5 transition-transform">
              <span>Buka Formulir Laporan</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </button>

          {/* Card 2: AJUKAN PEMINJAMAN (Indigo/Violet Vibrant) */}
          <button
            id="btn-main-ajukan-peminjaman"
            onClick={() => setActiveTab('peminjaman')}
            className="group relative text-left bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 hover:from-indigo-700 hover:to-violet-900 text-white p-6 rounded-3xl shadow-md hover:shadow-xl hover:shadow-indigo-900/20 transition-all duration-200 transform active:scale-[0.99] flex flex-col justify-between min-h-[160px] md:min-h-[180px] border border-indigo-400/40 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <span>📦</span>
                <span>AJUKAN PEMINJAMAN</span>
              </h4>
              <p className="text-xs md:text-sm text-indigo-100 mt-1.5 line-clamp-2 leading-relaxed">
                Pinjam proyektor, sound system, laptop, kamera, kabel, atau sarana penunjang kegiatan belajar.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-white group-hover:translate-x-1.5 transition-transform">
              <span>Buka Formulir Peminjaman</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </button>

          {/* Card 3: PENGEMBALIAN BARANG (Emerald/Teal Vibrant) */}
          <button
            id="btn-main-pengembalian-barang"
            onClick={() => setActiveTab('pengembalian')}
            className="group relative text-left bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white p-6 rounded-3xl shadow-md hover:shadow-xl hover:shadow-emerald-900/20 transition-all duration-200 transform active:scale-[0.99] flex flex-col justify-between min-h-[160px] md:min-h-[180px] border border-emerald-400/40 cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3.5 shadow-inner group-hover:scale-110 transition-transform">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
                <span>↩️</span>
                <span>PENGEMBALIAN BARANG</span>
              </h4>
              <p className="text-xs md:text-sm text-emerald-100 mt-1.5 line-clamp-2 leading-relaxed">
                Cari nomor pinjam & catat kondisi fisik barang saat diserahkan kembali ke Sarpras.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-white group-hover:translate-x-1.5 transition-transform">
              <span>Proses Pengembalian</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Small Dashboard Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Status Sarpras Terkini
          </h3>
          <button
            id="btn-view-all-history"
            onClick={() => setActiveTab('riwayat')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Riwayat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* 1. Kerusakan Baru (Rose) */}
          <div
            id="metric-card-kerusakan"
            onClick={() => setActiveTab('admin')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kerusakan Aktif</span>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-400"></span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-black text-rose-600">
                {newDamageCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Laporan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate font-medium">
              {newDamageCount > 0 ? 'Perlu tindakan perbaikan' : 'Semua tertangani'}
            </p>
          </div>

          {/* 2. Peminjaman Menunggu (Amber) */}
          <div
            id="metric-card-menunggu"
            onClick={() => setActiveTab('admin')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Menunggu ACC</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-400"></span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-black text-amber-600">
                {pendingLoanCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Pengajuan</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate font-medium">
              {pendingLoanCount > 0 ? 'Menunggu persetujuan' : 'Tidak ada antrean'}
            </p>
          </div>

          {/* 3. Sedang Dipinjam (Indigo) */}
          <div
            id="metric-card-dipinjam"
            onClick={() => setActiveTab('riwayat')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sedang Dipinjam</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs shadow-indigo-400"></span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-black text-indigo-600">
                {activeLoanCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Barang</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate font-medium">
              {overdueCount > 0 ? (
                <span className="text-rose-600 font-bold">⚠️ {overdueCount} terlambat</span>
              ) : (
                'Dalam masa pemakaian'
              )}
            </p>
          </div>

          {/* 4. Pengembalian Hari Ini (Emerald) */}
          <div
            id="metric-card-pengembalian"
            onClick={() => setActiveTab('riwayat')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kembali Hari Ini</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-400"></span>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl md:text-3xl font-black text-emerald-600">
                {returnedTodayCount}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">Selesai</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate font-medium">
              Tercatat pada {todayStr}
            </p>
          </div>
        </div>
      </div>

      {/* Aktivitas Terbaru Feed */}
      <div className="bg-white rounded-3xl p-6 md:p-7 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm md:text-base font-black text-slate-800 tracking-tight">
              Aktivitas Terbaru Sarpras
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full">Real-time log</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm font-medium">
            Belum ada aktivitas tercatat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => (
              <div
                key={act.id}
                id={`activity-item-${act.refId}`}
                onClick={() => onSelectActivity(act)}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 text-lg shrink-0">
                    {act.type === 'kerusakan' ? '🔧' : act.type === 'peminjaman' ? '📦' : '↩️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {act.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                        {act.refId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md sm:max-w-lg">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${act.statusColor}`}>
                    {act.statusBadge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attribution Note */}
      <div className="text-center py-2 text-xs text-slate-500 font-medium flex items-center justify-center gap-2 flex-wrap">
        <span>SIMPEL SARPRAS SMA Negeri 1 Tejakula</span>
        <span className="hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1 text-slate-700 font-bold bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          Dibuat oleh : Gede Hari Wijaya, S.Pd. Gr.
        </span>
      </div>
    </div>
  );
};
