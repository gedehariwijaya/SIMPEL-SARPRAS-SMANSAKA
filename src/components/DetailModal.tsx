import React, { useState } from 'react';
import { DamageReport, ItemLoan, ItemReturn, ActivityLog } from '../types';
import { X, Copy, Share2, Wrench, Package, RotateCcw, CheckCircle2, Clock, MapPin, User, Calendar } from 'lucide-react';

interface DetailModalProps {
  item: {
    type: 'kerusakan' | 'peminjaman' | 'pengembalian';
    data: DamageReport | ItemLoan | ItemReturn;
  } | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDamage = item.type === 'kerusakan';
  const isLoan = item.type === 'peminjaman';
  const isReturn = item.type === 'pengembalian';

  const damageData = isDamage ? (item.data as DamageReport) : null;
  const loanData = isLoan ? (item.data as ItemLoan) : null;
  const returnData = isReturn ? (item.data as ItemReturn) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        id="detail-modal-container"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                isDamage
                  ? 'bg-rose-100 text-rose-600'
                  : isLoan
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isDamage && <Wrench className="w-5 h-5" />}
              {isLoan && <Package className="w-5 h-5" />}
              {isReturn && <RotateCcw className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {isDamage ? 'Rincian Laporan Kerusakan' : isLoan ? 'Rincian Peminjaman' : 'Rincian Pengembalian'}
              </h3>
              <span className="font-mono text-xs font-bold text-slate-500">
                {item.data.id}
              </span>
            </div>
          </div>

          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* KERUSAKAN VIEW */}
          {damageData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs text-slate-500 font-bold">Status Tindak Lanjut</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    damageData.status === 'SELESAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : damageData.status === 'DIPROSES'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {damageData.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Pelapor</span>
                  <strong className="text-slate-900 font-bold">{damageData.namaPelapor}</strong>
                  <span className="text-slate-500 block">({damageData.statusPelapor})</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Kontak</span>
                  <strong className="text-slate-900 font-bold">{damageData.kontak || '-'}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Lokasi</span>
                  <strong className="text-slate-900 font-bold">{damageData.lokasi}</strong>
                  <span className="text-slate-500 block">{damageData.detailLokasi || '-'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Tanggal Lapor</span>
                  <strong className="text-slate-900 font-bold">{damageData.tanggalLapor}</strong>
                </div>
                {damageData.tanggalSelesai && (
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                    <span className="text-emerald-700 block font-medium">Tanggal Selesai</span>
                    <strong className="text-emerald-900 font-bold">{damageData.tanggalSelesai}</strong>
                  </div>
                )}
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                <span className="text-xs font-black text-rose-900 uppercase">Sarana / Barang:</span>
                <p className="text-sm font-black text-slate-900">{damageData.namaSarana}</p>
                <p className="text-xs text-rose-700 font-bold">Tingkat Kerusakan: {damageData.jenisKerusakan}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-xs font-black text-slate-700 uppercase">Deskripsi:</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{damageData.deskripsi}</p>
              </div>

              {damageData.catatanPetugas && (
                <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1">
                  <span className="text-xs font-black text-indigo-900 uppercase">Catatan Petugas Sarpras:</span>
                  <p className="text-xs text-slate-700 font-medium">{damageData.catatanPetugas}</p>
                </div>
              )}

              {damageData.foto && (
                <div>
                  <span className="text-xs font-black text-slate-700 block mb-1.5">Foto Bukti Kerusakan:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-60 flex items-center justify-center">
                    <img src={damageData.foto} alt="Foto Kerusakan" className="max-h-60 object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PEMINJAMAN VIEW */}
          {loanData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs text-slate-500 font-bold">Status Peminjaman</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    loanData.status === 'SELESAI'
                      ? 'bg-slate-100 text-slate-700'
                      : loanData.status === 'SEDANG DIPINJAM'
                      ? 'bg-indigo-100 text-indigo-800'
                      : loanData.status === 'DISETUJUI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : loanData.status === 'DITOLAK'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {loanData.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Peminjam</span>
                  <strong className="text-slate-900 font-bold">{loanData.namaPeminjam}</strong>
                  <span className="text-slate-500 block">({loanData.kelasUnit || loanData.statusPeminjam})</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Kontak</span>
                  <strong className="text-slate-900 font-bold">{loanData.kontak || '-'}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Tanggal Pinjam</span>
                  <strong className="text-slate-900 font-bold">{loanData.tanggalPinjam}</strong>
                  <span className="text-slate-500 block">{loanData.waktu || ''}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Rencana Kembali</span>
                  <strong className="text-slate-900 font-bold">{loanData.tanggalRencanaKembali}</strong>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-1">
                <span className="text-xs font-black text-indigo-900 uppercase">Barang & Jumlah:</span>
                <p className="text-sm font-black text-slate-900">{loanData.namaBarang}</p>
                <p className="text-xs text-indigo-700 font-bold">Jumlah: {loanData.jumlah}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-xs font-black text-slate-700 uppercase">Keperluan:</span>
                <p className="text-xs text-slate-700 font-medium">{loanData.keperluan}</p>
              </div>

              {loanData.catatan && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-black text-slate-700 uppercase">Catatan:</span>
                  <p className="text-xs text-slate-700 font-medium">{loanData.catatan}</p>
                </div>
              )}
            </div>
          )}

          {/* PENGEMBALIAN VIEW */}
          {returnData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs text-slate-500 font-bold">Kondisi Barang</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    returnData.kondisiBarang === 'Baik'
                      ? 'bg-emerald-100 text-emerald-800'
                      : returnData.kondisiBarang === 'Ada kerusakan'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {returnData.kondisiBarang}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Nomor Peminjaman</span>
                  <strong className="text-slate-900 font-mono font-bold">{returnData.idPeminjaman}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Peminjam</span>
                  <strong className="text-slate-900 font-bold">{returnData.namaPeminjam}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Tgl Pengembalian</span>
                  <strong className="text-slate-900 font-bold">{returnData.tanggalPengembalian}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <span className="text-slate-500 block">Petugas Penerima</span>
                  <strong className="text-slate-900 font-bold">{returnData.penerimaPetugas || 'Petugas Sarpras'}</strong>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-xs font-black text-emerald-900 uppercase">Barang:</span>
                <p className="text-sm font-black text-slate-900">{returnData.namaBarang} ({returnData.jumlah})</p>
              </div>

              {returnData.catatan && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-xs font-black text-slate-700 uppercase">Catatan Pengembalian:</span>
                  <p className="text-xs text-slate-700 font-medium">{returnData.catatan}</p>
                </div>
              )}

              {returnData.foto && (
                <div>
                  <span className="text-xs font-black text-slate-700 block mb-1.5">Foto Bukti Pengembalian:</span>
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-60 flex items-center justify-center">
                    <img src={returnData.foto} alt="Foto Pengembalian" className="max-h-60 object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            id="btn-modal-copy-id"
            onClick={() => handleCopy(item.data.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Tersalin!' : 'Salin Nomor'}</span>
          </button>

          <button
            id="btn-modal-close"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
