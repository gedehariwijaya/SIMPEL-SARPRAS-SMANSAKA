import React, { useState } from 'react';
import { ItemLoan } from '../types';
import { USER_ROLES } from '../data/initialData';
import { StorageService, getTodayISODate } from '../services/storageService';
import { Package, CheckCircle2, Copy, Share2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoanRequestFormProps {
  onSuccess: (loan: ItemLoan) => void;
  onCancel: () => void;
}

export const LoanRequestForm: React.FC<LoanRequestFormProps> = ({ onSuccess, onCancel }) => {
  const todayDate = getTodayISODate();

  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [statusPeminjam, setStatusPeminjam] = useState('Guru');
  const [kelasUnit, setKelasUnit] = useState('');
  const [kontak, setKontak] = useState('');
  const [namaBarang, setNamaBarang] = useState('');
  const [jumlah, setJumlah] = useState('1 unit');
  const [keperluan, setKeperluan] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(todayDate);
  const [waktu, setWaktu] = useState('08:00 - 13:30 WITA');
  const [tanggalRencanaKembali, setTanggalRencanaKembali] = useState(todayDate);
  const [catatan, setCatatan] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedLoan, setSubmittedLoan] = useState<ItemLoan | null>(null);
  const [copied, setCopied] = useState(false);

  // Common quick items in school for 1-tap fill
  const quickItems = [
    'Proyektor Epson EB-X400',
    'Sound Portable Wireless + 2 Mic',
    'Kabel Roll Listrik (15m)',
    'Kabel HDMI 10 Meter',
    'Kamera DSLR Canon EOS',
    'Pointer Laser Presentasi',
    'Layar Proyektor Tripod',
    'Laptop Sarpras',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!namaPeminjam.trim()) {
      setErrorMsg('Nama peminjam wajib diisi.');
      return;
    }
    if (!namaBarang.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }
    if (!keperluan.trim()) {
      setErrorMsg('Keperluan peminjaman wajib dijelaskan.');
      return;
    }
    if (!tanggalPinjam) {
      setErrorMsg('Tanggal peminjaman wajib diisi.');
      return;
    }
    if (!tanggalRencanaKembali) {
      setErrorMsg('Tanggal rencana pengembalian wajib diisi.');
      return;
    }
    if (tanggalRencanaKembali < tanggalPinjam) {
      setErrorMsg('Tanggal rencana pengembalian tidak valid (tidak boleh lebih awal dari tanggal pinjam).');
      return;
    }

    setIsSubmitting(true);

    try {
      const newLoan = StorageService.saveLoan({
        namaPeminjam: namaPeminjam.trim(),
        statusPeminjam,
        kelasUnit: kelasUnit.trim(),
        kontak: kontak.trim(),
        namaBarang: namaBarang.trim(),
        jumlah: jumlah.trim() || '1 unit',
        keperluan: keperluan.trim(),
        tanggalPinjam,
        waktu: waktu.trim(),
        tanggalRencanaKembali,
        catatan: catatan.trim(),
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSubmittedLoan(newLoan);
      onSuccess(newLoan);
    } catch (err) {
      setErrorMsg('Gagal menyimpan pengajuan peminjaman. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedLoan) return;
    navigator.clipboard.writeText(submittedLoan.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!submittedLoan) return;
    const text = `*PENGAJUAN PEMINJAMAN SARPRAS SMAN 1 TEJAKULA*\n\n` +
      `No. Peminjaman: *${submittedLoan.id}*\n` +
      `Peminjam: ${submittedLoan.namaPeminjam} (${submittedLoan.statusPeminjam})\n` +
      `Kelas/Unit: ${submittedLoan.kelasUnit || '-'}\n` +
      `Kontak: ${submittedLoan.kontak || '-'}\n` +
      `Barang: *${submittedLoan.namaBarang}*\n` +
      `Jumlah: ${submittedLoan.jumlah}\n` +
      `Keperluan: ${submittedLoan.keperluan}\n` +
      `Tgl Pinjam: ${submittedLoan.tanggalPinjam} (${submittedLoan.waktu || 'Fleksibel'})\n` +
      `Rencana Kembali: ${submittedLoan.tanggalRencanaKembali}\n` +
      `Status: *${submittedLoan.status}*\n\n` +
      `_Mohon persetujuan dari Waka / Petugas Sarpras. Terima kasih._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetForm = () => {
    setNamaPeminjam('');
    setStatusPeminjam('Guru');
    setKelasUnit('');
    setKontak('');
    setNamaBarang('');
    setJumlah('1 unit');
    setKeperluan('');
    setTanggalPinjam(todayDate);
    setWaktu('08:00 - 13:30 WITA');
    setTanggalRencanaKembali(todayDate);
    setCatatan('');
    setSubmittedLoan(null);
  };

  if (submittedLoan) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 animate-fade-in my-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-indigo-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Pengajuan Berhasil Dikirim!
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Data peminjaman telah tersimpan ke Database Realtime Firebase Sarpras sekolah.
          </p>

          {/* Loan ID Box */}
          <div className="my-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Nomor Peminjaman Barang
            </span>
            <span className="text-2xl md:text-3xl font-black text-indigo-700 tracking-tight block mt-1 font-mono">
              {submittedLoan.id}
            </span>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                id="btn-copy-loan-id"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copied ? 'Tersalin!' : 'Salin Nomor'}</span>
              </button>

              <button
                id="btn-wa-share-loan"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim ke WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="text-left bg-indigo-50/60 p-4 rounded-2xl text-xs space-y-1.5 text-slate-700 border border-indigo-100">
            <p><span className="font-bold text-slate-900">Peminjam:</span> {submittedLoan.namaPeminjam} ({submittedLoan.kelasUnit || submittedLoan.statusPeminjam})</p>
            <p><span className="font-bold text-slate-900">Barang:</span> {submittedLoan.namaBarang} ({submittedLoan.jumlah})</p>
            <p><span className="font-bold text-slate-900">Tgl Pinjam:</span> {submittedLoan.tanggalPinjam} s/d {submittedLoan.tanggalRencanaKembali}</p>
            <p><span className="font-bold text-slate-900">Keperluan:</span> {submittedLoan.keperluan}</p>
            <p><span className="font-bold text-slate-900">Status:</span> <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded-full">{submittedLoan.status}</span></p>
          </div>

          <p className="text-xs text-slate-500 mt-4 font-medium">
            Simpan nomor peminjaman ini. Nomor diperlukan saat proses pengembalian barang.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              id="btn-loan-another-item"
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-sm font-bold rounded-2xl transition-all shadow-md shadow-indigo-900/20 cursor-pointer"
            >
              + Ajukan Peminjaman Lain
            </button>
            <button
              id="btn-back-home-from-loan"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-slate-200/80 animate-fade-in pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Formulir Pengajuan Peminjaman
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Pinjam sarana dan prasarana pendukung pembelajaran di SMAN 1 Tejakula
            </p>
          </div>
        </div>
        <button
          id="btn-cancel-loan"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          title="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
        {/* Section 1: Identitas Peminjam */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            1. Identitas Peminjam
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-nama-peminjam" className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Peminjam <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nama-peminjam"
                type="text"
                value={namaPeminjam}
                onChange={(e) => setNamaPeminjam(e.target.value)}
                placeholder="Contoh: I Wayan Darmawan, M.Pd."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="select-status-peminjam" className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan / Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-status-peminjam"
                value={statusPeminjam}
                onChange={(e) => setStatusPeminjam(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-kelas-unit" className="block text-xs font-bold text-slate-700 mb-1">
                Kelas / Unit / Organisasi <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-kelas-unit"
                type="text"
                value={kelasUnit}
                onChange={(e) => setKelasUnit(e.target.value)}
                placeholder="Contoh: Kelas XII MIPA 2 / OSIS / Lab"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="input-kontak-peminjam" className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Kontak / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-kontak-peminjam"
                type="tel"
                value={kontak}
                onChange={(e) => setKontak(e.target.value)}
                placeholder="Contoh: 081338xxxxxx"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Barang & Keperluan */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            2. Sarana / Barang yang Dipinjam
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="input-nama-barang" className="block text-xs font-bold text-slate-700 mb-1">
                Nama Barang <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nama-barang"
                type="text"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Proyektor Epson EB-X400"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="input-jumlah-barang" className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-jumlah-barang"
                type="text"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Contoh: 1 unit"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Quick Item Chips */}
          <div>
            <span className="text-[11px] text-slate-500 font-bold block mb-1.5">
              Pilihan Cepat Sarana Populer:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickItems.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setNamaBarang(item)}
                  className="text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-xl transition-all font-semibold cursor-pointer shadow-2xs"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="textarea-keperluan-pinjam" className="block text-xs font-bold text-slate-700 mb-1">
              Keperluan Peminjaman <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="textarea-keperluan-pinjam"
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              rows={2}
              placeholder="Contoh: Pembelajaran Kurikulum Merdeka di Ruang X-2 / Presentasi Guru"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Section 3: Waktu & Jadwal Pengembalian */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            3. Jadwal Peminjaman & Rencana Kembali
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-tgl-pinjam" className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai Pinjam <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-tgl-pinjam"
                type="date"
                value={tanggalPinjam}
                onChange={(e) => {
                  setTanggalPinjam(e.target.value);
                  if (tanggalRencanaKembali < e.target.value) {
                    setTanggalRencanaKembali(e.target.value);
                  }
                }}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="input-tgl-kembali" className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Rencana Kembali <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-tgl-kembali"
                type="date"
                min={tanggalPinjam}
                value={tanggalRencanaKembali}
                onChange={(e) => setTanggalRencanaKembali(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-waktu-pinjam" className="block text-xs font-bold text-slate-700 mb-1">
                Jam / Waktu <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-waktu-pinjam"
                type="text"
                value={waktu}
                onChange={(e) => setWaktu(e.target.value)}
                placeholder="Contoh: 08:00 - 13:30 WITA"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="input-catatan-pinjam" className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-catatan-pinjam"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Termasuk kabel power & tas"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span>Status Awal Pengajuan: <strong className="text-amber-600 font-extrabold">MENUNGGU PERSETUJUAN</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            id="btn-submit-loan-request"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 hover:from-indigo-700 hover:to-violet-900 text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg hover:shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>⏳ Mengajukan...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>AJUKAN PEMINJAMAN</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-cancel-loan-form"
            onClick={onCancel}
            className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};
