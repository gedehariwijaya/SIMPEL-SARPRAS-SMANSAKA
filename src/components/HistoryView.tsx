import React, { useState } from 'react';
import { DamageReport, ItemLoan, ItemReturn } from '../types';
import { ClipboardList, Search, Filter, Wrench, Package, RotateCcw, Eye, Download, Printer } from 'lucide-react';

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

  // Export CSV generator
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (category === 'peminjaman') {
      csvContent += 'ID_PEMINJAMAN,TIMESTAMP,NAMA_PEMINJAM,STATUS_PEMINJAM,KELAS_UNIT,KONTAK,NAMA_BARANG,JUMLAH,KEPERLUAN,TANGGAL_PINJAM,TANGGAL_RENCANA_KEMBALI,STATUS\n';
      loans.forEach((l) => {
        csvContent += `"${l.id}","${l.timestamp}","${l.namaPeminjam}","${l.statusPeminjam}","${l.kelasUnit}","${l.kontak}","${l.namaBarang}","${l.jumlah}","${l.keperluan}","${l.tanggalPinjam}","${l.tanggalRencanaKembali}","${l.status}"\n`;
      });
    } else if (category === 'kerusakan') {
      csvContent += 'ID_LAPORAN,TIMESTAMP,NAMA_PELAPOR,STATUS_PELAPOR,KONTAK,LOKASI,DETAIL_LOKASI,NAMA_SARANA,JENIS_KERUSAKAN,DESKRIPSI,TANGGAL_LAPOR,STATUS,CATATAN_PETUGAS\n';
      damageReports.forEach((d) => {
        csvContent += `"${d.id}","${d.timestamp}","${d.namaPelapor}","${d.statusPelapor}","${d.kontak}","${d.lokasi}","${d.detailLokasi}","${d.namaSarana}","${d.jenisKerusakan}","${d.deskripsi}","${d.tanggalLapor}","${d.status}","${d.catatanPetugas || ''}"\n`;
      });
    } else {
      csvContent += 'ID_PENGEMBALIAN,ID_PEMINJAMAN,TIMESTAMP,NAMA_PEMINJAM,NAMA_BARANG,JUMLAH,TANGGAL_PINJAM,TANGGAL_PENGEMBALIAN,KONDISI_BARANG,CATATAN,STATUS\n';
      returns.forEach((r) => {
        csvContent += `"${r.id}","${r.idPeminjaman}","${r.timestamp}","${r.namaPeminjam}","${r.namaBarang}","${r.jumlah}","${r.tanggalPinjam}","${r.tanggalPengembalian}","${r.kondisiBarang}","${r.catatan || ''}","${r.status}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIMPEL_SARPRAS_${category.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
                Riwayat & Arsip Sarpras
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pencarian dan pemantauan data terstruktur tersinkronisasi Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              title="Unduh CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              id="btn-print-table"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center space-x-2 mt-5 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            id="tab-history-peminjaman"
            onClick={() => { setCategory('peminjaman'); setStatusFilter('Semua'); }}
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
            onClick={() => { setCategory('kerusakan'); setStatusFilter('Semua'); }}
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
            onClick={() => { setCategory('pengembalian'); setStatusFilter('Semua'); }}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="sm:col-span-2 relative">
            <input
              id="input-history-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${category}... (Ketik nama, barang, atau ID)`}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-hidden transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="select-history-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-hidden font-medium"
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

      {/* CONTENT: Responsive Reflow (Desktop Table -> Mobile Touch Cards) */}

      {/* Category: PEMINJAMAN */}
      {category === 'peminjaman' && (
        <div>
          {/* Mobile Cards (Visible on screens < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data peminjaman yang sesuai filter.
              </div>
            ) : (
              filteredLoans.map((item) => (
                <div
                  key={item.id}
                  id={`loan-card-mobile-${item.id}`}
                  onClick={() => onSelectLoan(item)}
                  className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'SELESAI'
                          ? 'bg-slate-100 text-slate-700'
                          : item.status === 'SEDANG DIPINJAM'
                          ? 'bg-indigo-100 text-indigo-800'
                          : item.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'DITOLAK'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800">{item.namaBarang}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Jumlah: <strong className="text-slate-800 font-bold">{item.jumlah}</strong>
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Peminjam: <strong className="text-slate-700 font-bold">{item.namaPeminjam}</strong></span>
                    <span>Kembali: <strong className="text-slate-700 font-bold">{item.tanggalRencanaKembali}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (Visible on screens >= 768px) */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">No. Pinjam</th>
                    <th className="py-3.5 px-4">Peminjam</th>
                    <th className="py-3.5 px-4">Barang & Jumlah</th>
                    <th className="py-3.5 px-4">Tgl Pinjam</th>
                    <th className="py-3.5 px-4">Tgl Kembali</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data peminjaman yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{item.namaPeminjam}</div>
                          <div className="text-[11px] text-slate-500">{item.kelasUnit || item.statusPeminjam}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.namaBarang}</div>
                          <div className="text-[11px] text-slate-500">{item.jumlah}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{item.tanggalPinjam}</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{item.tanggalRencanaKembali}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'SELESAI'
                                ? 'bg-slate-100 text-slate-700'
                                : item.status === 'SEDANG DIPINJAM'
                                ? 'bg-indigo-100 text-indigo-800'
                                : item.status === 'DISETUJUI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'DITOLAK'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-detail-loan-${item.id}`}
                            onClick={() => onSelectLoan(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category: KERUSAKAN */}
      {category === 'kerusakan' && (
        <div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredDamages.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data laporan kerusakan yang sesuai filter.
              </div>
            ) : (
              filteredDamages.map((item) => (
                <div
                  key={item.id}
                  id={`damage-card-mobile-${item.id}`}
                  onClick={() => onSelectDamage(item)}
                  className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-rose-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'DIPROSES'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800">{item.namaSarana}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Lokasi: <strong className="text-slate-800 font-bold">{item.lokasi} - {item.detailLokasi}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.deskripsi}</p>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Pelapor: <strong className="text-slate-700 font-bold">{item.namaPelapor}</strong></span>
                    <span>Tgl: <strong className="text-slate-700 font-bold">{item.tanggalLapor}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">No. Laporan</th>
                    <th className="py-3.5 px-4">Pelapor</th>
                    <th className="py-3.5 px-4">Lokasi & Detail</th>
                    <th className="py-3.5 px-4">Sarana / Barang</th>
                    <th className="py-3.5 px-4">Jenis Kerusakan</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDamages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data kerusakan yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredDamages.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-700 whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{item.namaPelapor}</div>
                          <div className="text-[11px] text-slate-500">{item.statusPelapor}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{item.lokasi}</div>
                          <div className="text-[11px] text-slate-500">{item.detailLokasi || '-'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.namaSarana}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.jenisKerusakan}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'DIPROSES'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-detail-damage-${item.id}`}
                            onClick={() => onSelectDamage(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category: PENGEMBALIAN */}
      {category === 'pengembalian' && (
        <div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredReturns.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                Tidak ada data pengembalian yang sesuai filter.
              </div>
            ) : (
              filteredReturns.map((item) => (
                <div
                  key={item.id}
                  id={`return-card-mobile-${item.id}`}
                  onClick={() => onSelectReturn(item)}
                  className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.kondisiBarang === 'Baik'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.kondisiBarang === 'Ada kerusakan'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Kondisi: {item.kondisiBarang}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-800">{item.namaBarang} ({item.jumlah})</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Ref No. Pinjam: {item.idPeminjaman}</p>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Peminjam: <strong className="text-slate-700 font-bold">{item.namaPeminjam}</strong></span>
                    <span>Tgl Kembali: <strong className="text-slate-700 font-bold">{item.tanggalPengembalian}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">No. Pengembalian</th>
                    <th className="py-3.5 px-4">Ref No. Pinjam</th>
                    <th className="py-3.5 px-4">Peminjam</th>
                    <th className="py-3.5 px-4">Barang</th>
                    <th className="py-3.5 px-4">Tgl Kembali</th>
                    <th className="py-3.5 px-4">Kondisi</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        Tidak ada data pengembalian yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {item.id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {item.idPeminjaman}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.namaPeminjam}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{item.namaBarang} ({item.jumlah})</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{item.tanggalPengembalian}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.kondisiBarang === 'Baik'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.kondisiBarang === 'Ada kerusakan'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.kondisiBarang}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            id={`btn-detail-return-${item.id}`}
                            onClick={() => onSelectReturn(item)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
