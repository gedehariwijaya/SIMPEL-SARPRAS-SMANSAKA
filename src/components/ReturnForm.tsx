import React, { useState, useRef } from 'react';
import { ItemLoan, ItemReturn, ItemCondition } from '../types';
import { StorageService, getTodayISODate } from '../services/storageService';
import { RotateCcw, Search, CheckCircle2, Copy, Share2, ArrowLeft, RefreshCw, AlertCircle, Camera, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReturnFormProps {
  loans: ItemLoan[];
  onSuccess: (returnedItem: ItemReturn) => void;
  onCancel: () => void;
}

export const ReturnForm: React.FC<ReturnFormProps> = ({ loans, onSuccess, onCancel }) => {
  const todayDate = getTodayISODate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<ItemLoan | null>(null);

  // Form fields
  const [tanggalPengembalian, setTanggalPengembalian] = useState(todayDate);
  const [kondisiBarang, setKondisiBarang] = useState<ItemCondition>('Baik');
  const [catatan, setCatatan] = useState('');
  const [foto, setFoto] = useState<string | undefined>(undefined);
  const [penerimaPetugas, setPenerimaPetugas] = useState('Petugas Sarpras');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedReturn, setSubmittedReturn] = useState<ItemReturn | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter loan items that are currently active or not yet completed
  const activeLoans = loans.filter((l) => l.status === 'SEDANG DIPINJAM' || l.status === 'DISETUJUI' || l.status === 'MENUNGGU');

  // Search filtered loans
  const filteredLoans = activeLoans.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.id.toLowerCase().includes(q) ||
      l.namaPeminjam.toLowerCase().includes(q) ||
      l.namaBarang.toLowerCase().includes(q) ||
      l.kelasUnit.toLowerCase().includes(q)
    );
  });

  const handleSelectLoan = (loan: ItemLoan) => {
    setSelectedLoan(loan);
    setErrorMsg('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran foto terlalu besar (maksimal 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.src = uploadEvent.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFoto(dataUrl);
      };
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFoto(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      setErrorMsg('Pilih peminjaman yang akan dikembalikan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newReturn = StorageService.saveReturn({
        idPeminjaman: selectedLoan.id,
        namaPeminjam: selectedLoan.namaPeminjam,
        namaBarang: selectedLoan.namaBarang,
        jumlah: selectedLoan.jumlah,
        tanggalPinjam: selectedLoan.tanggalPinjam,
        tanggalRencanaKembali: selectedLoan.tanggalRencanaKembali,
        tanggalPengembalian,
        kondisiBarang,
        catatan: catatan.trim(),
        foto,
        penerimaPetugas,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSubmittedReturn(newReturn);
      onSuccess(newReturn);
    } catch (err) {
      setErrorMsg('Gagal memproses pengembalian. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedReturn) return;
    navigator.clipboard.writeText(submittedReturn.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!submittedReturn) return;
    const text = `*BUKTI PENGEMBALIAN SARPRAS SMAN 1 TEJAKULA*\n\n` +
      `No. Pengembalian: *${submittedReturn.id}*\n` +
      `Ref No. Pinjam: *${submittedReturn.idPeminjaman}*\n` +
      `Peminjam: ${submittedReturn.namaPeminjam}\n` +
      `Barang: *${submittedReturn.namaBarang}* (${submittedReturn.jumlah})\n` +
      `Tgl Kembali: ${submittedReturn.tanggalPengembalian}\n` +
      `Kondisi: *${submittedReturn.kondisiBarang}*\n` +
      `Catatan: ${submittedReturn.catatan || 'Lengkap & Baik'}\n` +
      `Penerima: ${submittedReturn.penerimaPetugas || 'Petugas Sarpras'}\n\n` +
      `_Status: SELESAI / BARANG SUDAH DITERIMA KEMBALI._`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetForm = () => {
    setSelectedLoan(null);
    setSearchQuery('');
    setTanggalPengembalian(todayDate);
    setKondisiBarang('Baik');
    setCatatan('');
    setFoto(undefined);
    setSubmittedReturn(null);
  };

  if (submittedReturn) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 animate-fade-in my-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Pengembalian Berhasil Dicatat!
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Status peminjaman telah diubah menjadi <strong className="text-slate-800 font-bold">SELESAI</strong> di Database Realtime Firebase Sarpras.
          </p>

          {/* Return ID Box */}
          <div className="my-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Nomor Bukti Pengembalian
            </span>
            <span className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight block mt-1 font-mono">
              {submittedReturn.id}
            </span>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                id="btn-copy-return-id"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copied ? 'Tersalin!' : 'Salin Nomor'}</span>
              </button>

              <button
                id="btn-wa-share-return"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="text-left bg-emerald-50/60 p-4 rounded-2xl text-xs space-y-1.5 text-slate-700 border border-emerald-100">
            <p><span className="font-bold text-slate-900">No. Peminjaman:</span> {submittedReturn.idPeminjaman}</p>
            <p><span className="font-bold text-slate-900">Peminjam:</span> {submittedReturn.namaPeminjam}</p>
            <p><span className="font-bold text-slate-900">Barang:</span> {submittedReturn.namaBarang} ({submittedReturn.jumlah})</p>
            <p><span className="font-bold text-slate-900">Kondisi:</span> <span className={`px-2.5 py-0.5 font-bold rounded-full ${submittedReturn.kondisiBarang === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{submittedReturn.kondisiBarang}</span></p>
            <p><span className="font-bold text-slate-900">Tgl Kembali:</span> {submittedReturn.tanggalPengembalian}</p>
            {submittedReturn.catatan && <p><span className="font-bold text-slate-900">Catatan:</span> {submittedReturn.catatan}</p>}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              id="btn-process-another-return"
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-sm font-bold rounded-2xl transition-all shadow-md shadow-emerald-900/20 cursor-pointer"
            >
              + Proses Pengembalian Lain
            </button>
            <button
              id="btn-back-home-from-return"
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Pencatatan Pengembalian Barang
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cari peminjaman aktif & konfirmasi kondisi fisik sarana yang dikembalikan
            </p>
          </div>
        </div>
        <button
          id="btn-cancel-return"
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

      {/* Step 1: Search / Select Active Loan */}
      {!selectedLoan ? (
        <div className="space-y-4">
          <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              1. Cari Data Peminjaman Aktif
            </h3>

            <div className="relative">
              <input
                id="input-search-loan-for-return"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Nomor Pinjam (PJ-...), Nama Peminjam, atau Nama Barang..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Menampilkan barang yang sedang dipinjam / belum selesai ({activeLoans.length} item aktif)
            </p>
          </div>

          {/* List of active loans */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredLoans.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs font-medium">
                {searchQuery ? 'Tidak ditemukan data peminjaman yang cocok.' : 'Tidak ada barang yang sedang dipinjam saat ini.'}
              </div>
            ) : (
              filteredLoans.map((loan) => (
                <div
                  key={loan.id}
                  id={`loan-select-item-${loan.id}`}
                  onClick={() => handleSelectLoan(loan)}
                  className="p-4 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                        {loan.id}
                      </span>
                      <span className="text-xs font-black text-slate-800 truncate">
                        {loan.namaBarang} ({loan.jumlah})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Peminjam: <strong className="text-slate-700 font-bold">{loan.namaPeminjam}</strong></span>
                      <span>•</span>
                      <span>Batas Kembali: <strong className="text-slate-700 font-bold">{loan.tanggalRencanaKembali}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 text-xs font-bold text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    Pilih
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Step 2: Confirmation & Inspection Form */
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          {/* Selected Loan Info Card */}
          <div className="bg-emerald-50/60 p-4.5 rounded-2xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                Data Peminjaman Terpilih
              </span>
              <button
                type="button"
                id="btn-change-selected-loan"
                onClick={() => setSelectedLoan(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                Ganti Peminjaman
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 mt-2">
              <div>
                <span className="text-slate-500 block">Nomor Pinjam:</span>
                <span className="font-mono font-black text-indigo-800">{selectedLoan.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nama Peminjam:</span>
                <span className="font-bold text-slate-900">{selectedLoan.namaPeminjam} ({selectedLoan.kelasUnit || selectedLoan.statusPeminjam})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Barang & Jumlah:</span>
                <span className="font-bold text-slate-900">{selectedLoan.namaBarang} ({selectedLoan.jumlah})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jadwal Pinjam:</span>
                <span className="font-semibold text-slate-800">{selectedLoan.tanggalPinjam} s/d {selectedLoan.tanggalRencanaKembali}</span>
              </div>
            </div>
          </div>

          {/* Form Pengembalian */}
          <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              2. Formulir Kondisi Barang & Pengembalian
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-tgl-pengembalian" className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pengembalian <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-tgl-pengembalian"
                  type="date"
                  value={tanggalPengembalian}
                  onChange={(e) => setTanggalPengembalian(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
                />
              </div>

              <div>
                <label htmlFor="input-petugas-penerima" className="block text-xs font-bold text-slate-700 mb-1">
                  Petugas Penerima
                </label>
                <input
                  id="input-petugas-penerima"
                  type="text"
                  value={penerimaPetugas}
                  onChange={(e) => setPenerimaPetugas(e.target.value)}
                  placeholder="Contoh: Petugas Sarpras / Pak Ketut"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Kondisi Fisik Barang Setelah Dikembalikan <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  id="btn-condition-baik"
                  onClick={() => setKondisiBarang('Baik')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    kondisiBarang === 'Baik'
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg block">🟢</span>
                  <span className="text-xs block mt-1 font-bold">Baik & Lengkap</span>
                </button>

                <button
                  type="button"
                  id="btn-condition-kerusakan"
                  onClick={() => setKondisiBarang('Ada kerusakan')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    kondisiBarang === 'Ada kerusakan'
                      ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-900 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg block">🟡</span>
                  <span className="text-xs block mt-1 font-bold">Ada Kerusakan</span>
                </button>

                <button
                  type="button"
                  id="btn-condition-rusak"
                  onClick={() => setKondisiBarang('Rusak')}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    kondisiBarang === 'Rusak'
                      ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 text-rose-900 font-black'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg block">🔴</span>
                  <span className="text-xs block mt-1 font-bold">Rusak / Hilang</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="input-catatan-pengembalian" className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Pemeriksaan Barang <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                id="input-catatan-pengembalian"
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Kabel HDMI lengkap, remote sudah dicek, atau catatan lainnya"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all"
              />
            </div>

            {/* Photo of returned item */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                📷 Foto Kondisi Setelah Pengembalian <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                id="input-photo-return"
              />

              {!foto ? (
                <button
                  type="button"
                  id="btn-add-return-photo"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3.5 flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600 bg-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>Ambil Foto Kondisi Barang (Kamera / Galeri)</span>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-48">
                  <img
                    src={foto}
                    alt="Foto Pengembalian"
                    className="max-h-48 w-auto object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-700 shadow-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              id="btn-confirm-return-submission"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>⏳ Menyimpan...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>KONFIRMASI PENGEMBALIAN</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-cancel-return-details"
              onClick={() => setSelectedLoan(null)}
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
