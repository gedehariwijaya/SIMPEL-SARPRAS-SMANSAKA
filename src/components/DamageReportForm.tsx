import React, { useState, useRef } from 'react';
import { DamageReport } from '../types';
import { LOCATION_OPTIONS, DAMAGE_TYPE_OPTIONS, USER_ROLES } from '../data/initialData';
import { StorageService, getTodayISODate } from '../services/storageService';
import { Wrench, Camera, X, CheckCircle2, Copy, Share2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DamageReportFormProps {
  onSuccess: (report: DamageReport) => void;
  onCancel: () => void;
}

export const DamageReportForm: React.FC<DamageReportFormProps> = ({ onSuccess, onCancel }) => {
  const [namaPelapor, setNamaPelapor] = useState('');
  const [statusPelapor, setStatusPelapor] = useState('Guru');
  const [kontak, setKontak] = useState('');
  const [lokasi, setLokasi] = useState('Ruang kelas');
  const [detailLokasi, setDetailLokasi] = useState('');
  const [namaSarana, setNamaSarana] = useState('');
  const [jenisKerusakan, setJenisKerusakan] = useState('Rusak sedang');
  const [deskripsi, setDeskripsi] = useState('');
  const [foto, setFoto] = useState<string | undefined>(undefined);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedReport, setSubmittedReport] = useState<DamageReport | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const todayDate = getTodayISODate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran foto terlalu besar (maksimal 5MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.src = uploadEvent.target?.result as string;
      img.onload = () => {
        // Compress image using client-side canvas
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
        setErrorMsg('');
      };
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFoto(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!namaPelapor.trim()) {
      setErrorMsg('Nama pelapor wajib diisi.');
      return;
    }
    if (!namaSarana.trim()) {
      setErrorMsg('Nama sarana/barang yang rusak wajib diisi.');
      return;
    }
    if (!deskripsi.trim()) {
      setErrorMsg('Deskripsi kondisi kerusakan wajib dijelaskan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newReport = StorageService.saveDamageReport({
        namaPelapor: namaPelapor.trim(),
        statusPelapor,
        kontak: kontak.trim(),
        lokasi,
        detailLokasi: detailLokasi.trim(),
        namaSarana: namaSarana.trim(),
        jenisKerusakan,
        deskripsi: deskripsi.trim(),
        foto,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSubmittedReport(newReport);
      onSuccess(newReport);
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan laporan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submittedReport) return;
    navigator.clipboard.writeText(submittedReport.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!submittedReport) return;
    const text = `*LAPORAN KERUSAKAN SARPRAS SMAN 1 TEJAKULA*\n\n` +
      `No. Laporan: *${submittedReport.id}*\n` +
      `Pelapor: ${submittedReport.namaPelapor} (${submittedReport.statusPelapor})\n` +
      `Lokasi: ${submittedReport.lokasi} - ${submittedReport.detailLokasi || '-'}\n` +
      `Barang/Sarana: *${submittedReport.namaSarana}*\n` +
      `Kondisi: ${submittedReport.jenisKerusakan}\n` +
      `Deskripsi: ${submittedReport.deskripsi}\n` +
      `Tanggal: ${submittedReport.tanggalLapor}\n` +
      `Status: *${submittedReport.status}*\n\n` +
      `_Mohon tindak lanjut dari Tim Sarpras. Terima kasih._`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleResetForm = () => {
    setNamaPelapor('');
    setStatusPelapor('Guru');
    setKontak('');
    setLokasi('Ruang kelas');
    setDetailLokasi('');
    setNamaSarana('');
    setJenisKerusakan('Rusak sedang');
    setDeskripsi('');
    setFoto(undefined);
    setSubmittedReport(null);
  };

  // If successfully submitted, display clear confirmation screen with report ID
  if (submittedReport) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 animate-fade-in my-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Laporan Berhasil Dikirim!
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Data telah tercatat dan tersimpan ke Google Sheets Sarpras.
          </p>

          {/* Report ID Box */}
          <div className="my-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Nomor Laporan Kerusakan
            </span>
            <span className="text-2xl md:text-3xl font-black text-rose-600 tracking-tight block mt-1 font-mono">
              {submittedReport.id}
            </span>
            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                id="btn-copy-damage-id"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copied ? 'Tersalin!' : 'Salin Nomor'}</span>
              </button>

              <button
                id="btn-wa-share-damage"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim ke WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Quick Summary of Report */}
          <div className="text-left bg-rose-50/50 p-4 rounded-2xl text-xs space-y-1.5 text-slate-700 border border-rose-100">
            <p><span className="font-bold text-slate-900">Pelapor:</span> {submittedReport.namaPelapor} ({submittedReport.statusPelapor})</p>
            <p><span className="font-bold text-slate-900">Lokasi:</span> {submittedReport.lokasi} ({submittedReport.detailLokasi || '-'})</p>
            <p><span className="font-bold text-slate-900">Sarana/Barang:</span> {submittedReport.namaSarana}</p>
            <p><span className="font-bold text-slate-900">Jenis:</span> {submittedReport.jenisKerusakan}</p>
            <p><span className="font-bold text-slate-900">Status:</span> <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-extrabold rounded-full">{submittedReport.status}</span></p>
          </div>

          <p className="text-xs text-slate-500 mt-4 font-medium">
            Terima kasih. Laporan akan segera ditindaklanjuti oleh Petugas & Waka Sarpras.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              id="btn-report-another-damage"
              onClick={handleResetForm}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md shadow-rose-900/20 cursor-pointer"
            >
              + Buat Laporan Lain
            </button>
            <button
              id="btn-back-home-from-damage"
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
      {/* Header Form */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Formulir Laporan Kerusakan
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Laporkan fasilitas/sarana sekolah yang rusak untuk perbaikan
            </p>
          </div>
        </div>
        <button
          id="btn-cancel-damage"
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
        {/* Section 1: Identitas Pelapor */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            1. Identitas Pelapor
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-nama-pelapor" className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nama-pelapor"
                type="text"
                value={namaPelapor}
                onChange={(e) => setNamaPelapor(e.target.value)}
                placeholder="Contoh: I Ketut Suastika, S.Pd."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="select-status-pelapor" className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan / Status <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-status-pelapor"
                value={statusPelapor}
                onChange={(e) => setStatusPelapor(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="input-kontak-pelapor" className="block text-xs font-bold text-slate-700 mb-1">
              Nomor Kontak / WhatsApp <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              id="input-kontak-pelapor"
              type="tel"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              placeholder="Contoh: 081238xxxxxx"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Section 2: Lokasi & Sarana */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            2. Lokasi & Sarana Kerusakan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-lokasi-kerusakan" className="block text-xs font-bold text-slate-700 mb-1">
                Area / Lokasi <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-lokasi-kerusakan"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="input-detail-lokasi" className="block text-xs font-bold text-slate-700 mb-1">
                Detail Lokasi <span className="text-slate-400 font-normal">(Contoh: Ruang X-3 / Lab 1)</span>
              </label>
              <input
                id="input-detail-lokasi"
                type="text"
                value={detailLokasi}
                onChange={(e) => setDetailLokasi(e.target.value)}
                placeholder="Contoh: Ruang Kelas X-3 / Meja Guru"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-nama-sarana" className="block text-xs font-bold text-slate-700 mb-1">
                Nama Sarana / Barang <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nama-sarana"
                type="text"
                value={namaSarana}
                onChange={(e) => setNamaSarana(e.target.value)}
                placeholder="Contoh: AC Daikin / Proyektor / Kran Air"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              />
            </div>

            <div>
              <label htmlFor="select-jenis-kerusakan" className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Kerusakan <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-jenis-kerusakan"
                value={jenisKerusakan}
                onChange={(e) => setJenisKerusakan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
              >
                {DAMAGE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Deskripsi & Foto */}
        <div className="bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/70 space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            3. Deskripsi & Foto Bukti
          </h3>

          <div>
            <label htmlFor="textarea-deskripsi-kerusakan" className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Kondisi / Kerusakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="textarea-deskripsi-kerusakan"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Jelaskan kondisi kerusakan secara rinci (misal: AC tidak dingin, kabel putus, dsb.)"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-hidden transition-all"
            />
          </div>

          {/* Photo Upload / Mobile Camera */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              📷 Foto Kerusakan <span className="text-slate-400 font-normal">(Sangat disarankan)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
              id="input-photo-upload"
            />

            {!foto ? (
              <button
                type="button"
                id="btn-add-photo"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-slate-600 hover:text-rose-600 bg-white transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-slate-500" />
                </div>
                <span className="text-xs font-bold">Ambil Foto / Pilih dari Galeri</span>
                <span className="text-[10px] text-slate-400">Format JPG, PNG (Kompresi otomatis)</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-60">
                <img
                  src={foto}
                  alt="Foto Bukti Kerusakan"
                  className="max-h-60 w-auto object-contain rounded-xl"
                />
                <button
                  type="button"
                  id="btn-remove-photo"
                  onClick={removePhoto}
                  className="absolute top-2 right-2 bg-rose-600/90 text-white p-2 rounded-full hover:bg-rose-700 shadow-md transition-colors cursor-pointer"
                  title="Hapus Foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <span>Tanggal Lapor Otomatis: <strong className="text-slate-700">{todayDate}</strong></span>
            <span>Status Awal: <strong className="text-rose-600 font-bold">DILAPORKAN</strong></span>
          </div>
        </div>

        {/* Submit & Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            id="btn-submit-damage-report"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-700 hover:to-red-800 text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg hover:shadow-rose-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>⏳ Mengirim Laporan...</span>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                <span>KIRIM LAPORAN KERUSAKAN</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-cancel-damage-form"
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
