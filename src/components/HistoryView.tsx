import React, { useState } from 'react';
import { DamageReport, ItemLoan, ItemReturn } from '../types';
import { ExportService } from '../services/exportService';
import { FirebaseService } from '../services/firebaseService';
import {
  ClipboardList,
  Search,
  Filter,
  Wrench,
  Package,
  RotateCcw,
  Eye,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Flame,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface HistoryViewProps {
  damageReports: DamageReport[];
  loans: ItemLoan[];
  returns: ItemReturn[];
  onSelectDamage: (report: DamageReport) => void;
  onSelectLoan: (loan: ItemLoan) => void;
  onSelectReturn: (returnItem: ItemReturn) => void;
}

type HistoryCategory = 'peminjaman' | 'kerusakan' | 'pengembalian';

export const HistoryView: React.FC<HistoryViewProps> = ({
  damageReports,
  loans,
  returns,
  onSelectDamage,
  onSelectLoan,
  onSelectReturn,
}) => {
  const [category, setCategory] = useState<HistoryCategory>('peminjaman');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const isFirebaseConnected = FirebaseService.isConfigured();

  // Excel Export Handler
  const handleExportExcel = (type: 'current' | 'all') => {
    setIsExporting(true);
    try {
      if (type === 'all') {
        ExportService.exportToExcel(damageReports, loans, returns);
        setExportMessage('File Excel seluruh data (3 Sheet) berhasil diunduh!');
      } else {
        if (category === 'peminjaman') {
          ExportService.exportCategoryToExcel('peminjaman', filteredLoans);
        } else if (category === 'kerusakan') {
          ExportService.exportCategoryToExcel('kerusakan', filteredDamages);
        } else {
          ExportService.exportCategoryToExcel('pengembalian', filteredReturns);
        }
        setExportMessage(`File Excel data ${category} berhasil diunduh!`);
      }
    } catch (e) {
      console.error(e);
      setExportMessage('Gagal mengunduh Excel.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  // PDF Export Handler
  const handleExportPDF = (type: 'current' | 'all') => {
    setIsExporting(true);
    try {
      if (type === 'all') {
        ExportService.exportToPDF('semua', damageReports, loans, returns);
        setExportMessage('Dokumen PDF resmi seluruh data berhasil diunduh!');
      } else {
        ExportService.exportToPDF(category, damageReports, loans, returns);
        setExportMessage(`Dokumen PDF laporan ${category} berhasil diunduh!`);
      }
    } catch (e) {
      console.error(e);
      setExportMessage('Gagal mengunduh PDF.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  // Filtered Loans
  const filteredLoans = loans.filter((l) => {
    const matchesSearch =
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.namaPeminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.kelasUnit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'Semua' ||
      (statusFilter === 'Menunggu' && l.status === 'MENUNGGU') ||
      (statusFilter === 'Disetujui' && l.status === 'DISETUJUI') ||
      (statusFilter === 'Sedang Dipinjam' && l.status === 'SEDANG DIPINJAM') ||
      (statusFilter === 'Selesai' && l.status === 'SELESAI');

    return matchesSearch && matchesStatus;
  });

  // Filtered Damages
  const filteredDamages = damageReports.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.namaPelapor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.namaSarana.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.detailLokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.lokasi.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'Semua' ||
      (statusFilter === 'Baru' && d.status === 'DILAPORKAN') ||
      (statusFilter === 'Diproses' && d.status === 'DIPROSES') ||
      (statusFilter === 'Selesai' && d.status === 'SELESAI');

    return matchesSearch && matchesStatus;
  });

  // Filtered Returns
  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.idPeminjaman.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.namaPeminjam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.namaBarang.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'Semua' ||
      (statusFilter === 'Baik' && r.kondisiBarang === 'Baik') ||
      (statusFilter === 'Ada kerusakan' && r.kondisiBarang === 'Ada kerusakan') ||
      (statusFilter === 'Rusak' && r.kondisiBarang === 'Rusak');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in pb-20 md:pb-8">
      {/* Top Header Card & Direct Real-time Export Buttons */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                  Riwayat & Unduh Laporan Realtime
                </h2>
                {isFirebaseConnected && (
                  <span className="px-2.5 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-600" />
                    <span>Live Firebase</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Unduh laporan sarana prasarana dalam format PDF resmi & Excel (.xlsx) secara instan
              </p>
            </div>
          </div>

          {/* Quick Action Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download PDF Button */}
            <button
              id="btn-download-pdf-category"
              onClick={() => handleExportPDF('current')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-2xl transition-all shadow-md shadow-rose-900/20 cursor-pointer disabled:opacity-50"
              title="Unduh PDF Resmi dengan Kop Surat Sekolah"
            >
              <FileText className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* Download Excel Button */}
            <button
              id="btn-download-excel-category"
              onClick={() => handleExportExcel('current')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer disabled:opacity-50"
              title="Unduh Spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>

            {/* Download All in One Excel Package */}
            <button
              id="btn-download-excel-all"
              onClick={() => handleExportExcel('all')}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-md shadow-slate-900/20 cursor-pointer disabled:opacity-50"
              title="Unduh Semua Data (Kerusakan, Peminjaman, Pengembalian)"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Download Semua Data (Excel)</span>
              <span className="sm:hidden">Semua Data</span>
            </button>

            {/* Print button */}
            <button
              id="btn-print-table"
              onClick={() => window.print()}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
              title="Cetak Langsung (Browser Print)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert for Export */}
        {exportMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportMessage}</span>
          </div>
        )}

        {/* Category Switcher Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            id="tab-history-peminjaman"
            onClick={() => {
              setCategory('peminjaman');
              setStatusFilter('Semua');
            }}
            className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-extrabold rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              category === 'peminjaman'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-900/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Peminjaman ({loans.length})</span>
          </button>

          <button
            id="tab-history-kerusakan"
            onClick={() => {
              setCategory('kerusakan');
              setStatusFilter('Semua');
            }}
            className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-extrabold rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              category === 'kerusakan'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-900/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Kerusakan ({damageReports.length})</span>
          </button>

          <button
            id="tab-history-pengembalian"
            onClick={() => {
              setCategory('pengembalian');
              setStatusFilter('Semua');
            }}
            className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-extrabold rounded-2xl transition-all whitespace-nowrap cursor-pointer ${
              category === 'pengembalian'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Pengembalian ({returns.length})</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="sm:col-span-2 relative">
            <input
              id="input-history-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${category}... (Ketik nama, barang, kelas, atau ID)`}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-hidden transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="select-history-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-hidden font-medium cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              {category === 'peminjaman' && (
                <>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Sedang Dipinjam">Sedang Dipinjam</option>
                  <option value="Selesai">Selesai</option>
                </>
              )}
              {category === 'kerusakan' && (
                <>
                  <option value="Baru">Dilaporkan (Baru)</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </>
              )}
              {category === 'pengembalian' && (
                <>
                  <option value="Baik">Kondisi Baik</option>
                  <option value="Ada kerusakan">Ada Kerusakan</option>
                  <option value="Rusak">Rusak</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT LISTING: Mobile Cards vs Desktop Table */}

      {/* Category: PEMINJAMAN */}
      {category === 'peminjaman' && (
        <div>
          {/* Mobile Cards (Visible on screens < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data peminjaman yang cocok.
              </div>
            ) : (
              filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  id={`history-card-${loan.id}`}
                  onClick={() => onSelectLoan(loan)}
                  className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {loan.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {loan.namaBarang} ({loan.jumlah})
                    </p>
                    <p className="text-slate-600">
                      Peminjam: <strong className="text-slate-800 font-bold">{loan.namaPeminjam}</strong> ({loan.statusPeminjam} - {loan.kelasUnit})
                    </p>
                    <p className="text-slate-500">
                      Tgl: {loan.tanggalPinjam} s/d {loan.tanggalRencanaKembali}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (Visible on screens >= 768px) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Barang & Jml</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Rencana Kembali</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      Tidak ada data peminjaman yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{loan.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{loan.namaPeminjam}</div>
                        <div className="text-[11px] text-slate-500">{loan.statusPeminjam} - {loan.kelasUnit}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {loan.namaBarang} <span className="text-slate-500 font-normal">({loan.jumlah})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{loan.tanggalPinjam}</td>
                      <td className="py-3.5 px-4 text-slate-600">{loan.tanggalRencanaKembali}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onSelectLoan(loan)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                          title="Lihat Rincian"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category: KERUSAKAN */}
      {category === 'kerusakan' && (
        <div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredDamages.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data kerusakan yang cocok.
              </div>
            ) : (
              filteredDamages.map((report) => (
                <div
                  key={report.id}
                  id={`history-damage-card-${report.id}`}
                  onClick={() => onSelectDamage(report)}
                  className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                      {report.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {report.namaSarana} ({report.lokasi} - {report.detailLokasi})
                    </p>
                    <p className="text-slate-600">
                      Pelapor: <strong className="text-slate-800 font-bold">{report.namaPelapor}</strong> ({report.statusPelapor})
                    </p>
                    <p className="text-slate-500">
                      Jenis: {report.jenisKerusakan} • Tgl: {report.tanggalLapor}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Pelapor</th>
                  <th className="py-3 px-4">Lokasi & Sarana</th>
                  <th className="py-3 px-4">Jenis Kerusakan</th>
                  <th className="py-3 px-4">Tgl Lapor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDamages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      Tidak ada data kerusakan yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredDamages.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{report.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{report.namaPelapor}</div>
                        <div className="text-[11px] text-slate-500">{report.statusPelapor}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{report.namaSarana}</div>
                        <div className="text-[11px] text-slate-500">{report.lokasi} ({report.detailLokasi})</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{report.jenisKerusakan}</td>
                      <td className="py-3.5 px-4 text-slate-600">{report.tanggalLapor}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            report.status === 'SELESAI'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'DIPROSES'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onSelectDamage(report)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Lihat Rincian"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category: PENGEMBALIAN */}
      {category === 'pengembalian' && (
        <div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredReturns.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data pengembalian yang cocok.
              </div>
            ) : (
              filteredReturns.map((ret) => (
                <div
                  key={ret.id}
                  id={`history-return-card-${ret.id}`}
                  onClick={() => onSelectReturn(ret)}
                  className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {ret.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        ret.kondisiBarang === 'Baik'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ret.kondisiBarang === 'Ada kerusakan'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ret.kondisiBarang}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-slate-900 text-sm">
                      {ret.namaBarang} ({ret.jumlah})
                    </p>
                    <p className="text-slate-600">
                      Peminjam: <strong className="text-slate-800 font-bold">{ret.namaPeminjam}</strong>
                    </p>
                    <p className="text-slate-500">
                      Tgl Pengembalian: {ret.tanggalPengembalian}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">ID Kembali</th>
                  <th className="py-3 px-4">Ref ID Pinjam</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Barang & Jml</th>
                  <th className="py-3 px-4">Tgl Kembali</th>
                  <th className="py-3 px-4">Kondisi Barang</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                      Tidak ada data pengembalian yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{ret.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{ret.idPeminjaman}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{ret.namaPeminjam}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {ret.namaBarang} <span className="text-slate-500 font-normal">({ret.jumlah})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{ret.tanggalPengembalian}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            ret.kondisiBarang === 'Baik'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ret.kondisiBarang === 'Ada kerusakan'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ret.kondisiBarang}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onSelectReturn(ret)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="Lihat Rincian"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
