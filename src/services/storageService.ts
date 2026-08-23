import { DamageReport, ItemLoan, ItemReturn, AppConfig, ActivityLog, DamageStatus, LoanStatus } from '../types';
import { INITIAL_CONFIG, INITIAL_DAMAGE_REPORTS, INITIAL_LOANS, INITIAL_RETURNS } from '../data/initialData';

const STORAGE_KEYS = {
  CONFIG: 'simpel_sarpras_config_v1',
  DAMAGE: 'simpel_sarpras_damage_v1',
  LOANS: 'simpel_sarpras_loans_v1',
  RETURNS: 'simpel_sarpras_returns_v1',
};

// Helper: Format Date to YYYYMMDD
export function getDateStringForId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

// Format Today as YYYY-MM-DD
export function getTodayISODate(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const StorageService = {
  getConfig(): AppConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? { ...INITIAL_CONFIG, ...JSON.parse(data) } : INITIAL_CONFIG;
    } catch {
      return INITIAL_CONFIG;
    }
  },

  saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config to local storage', e);
    }
  },

  getDamageReports(): DamageReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAMAGE);
      return data ? JSON.parse(data) : INITIAL_DAMAGE_REPORTS;
    } catch {
      return INITIAL_DAMAGE_REPORTS;
    }
  },

  saveDamageReport(report: Omit<DamageReport, 'id' | 'timestamp' | 'tanggalLapor' | 'status'> & { id?: string }): DamageReport {
    const list = this.getDamageReports();
    const dateStr = getDateStringForId();
    
    // Count today's items to make sequence number 001, 002, etc.
    const todayReports = list.filter(r => r.id.startsWith(`KR-${dateStr}`));
    const seq = String(todayReports.length + 1).padStart(3, '0');
    const newId = report.id || `KR-${dateStr}-${seq}`;

    const newReport: DamageReport = {
      ...report,
      id: newId,
      timestamp: new Date().toISOString(),
      tanggalLapor: getTodayISODate(),
      status: 'DILAPORKAN',
    };

    const updated = [newReport, ...list];
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(updated));

    // Try background sync if configured
    this.triggerAutoSync('submit_kerusakan', newReport);

    return newReport;
  },

  updateDamageReportStatus(id: string, status: DamageStatus, catatanPetugas?: string): DamageReport | null {
    const list = this.getDamageReports();
    const index = list.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedItem: DamageReport = {
      ...list[index],
      status,
      catatanPetugas: catatanPetugas !== undefined ? catatanPetugas : list[index].catatanPetugas,
      tanggalSelesai: status === 'SELESAI' ? getTodayISODate() : list[index].tanggalSelesai,
    };

    list[index] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(list));

    this.triggerAutoSync('update_kerusakan_status', updatedItem);
    return updatedItem;
  },

  getLoans(): ItemLoan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOANS);
      return data ? JSON.parse(data) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  },

  saveLoan(loan: Omit<ItemLoan, 'id' | 'timestamp' | 'status'> & { id?: string }): ItemLoan {
    const list = this.getLoans();
    const dateStr = getDateStringForId();
    
    const todayLoans = list.filter(l => l.id.startsWith(`PJ-${dateStr}`));
    const seq = String(todayLoans.length + 1).padStart(3, '0');
    const newId = loan.id || `PJ-${dateStr}-${seq}`;

    const newLoan: ItemLoan = {
      ...loan,
      id: newId,
      timestamp: new Date().toISOString(),
      status: 'MENUNGGU',
    };

    const updated = [newLoan, ...list];
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updated));

    this.triggerAutoSync('submit_peminjaman', newLoan);
    return newLoan;
  },

  updateLoanStatus(id: string, status: LoanStatus, persetujuanOleh: string = 'Waka Sarpras'): ItemLoan | null {
    const list = this.getLoans();
    const index = list.findIndex(l => l.id === id);
    if (index === -1) return null;

    const updatedItem: ItemLoan = {
      ...list[index],
      status,
      persetujuanOleh,
      tanggalDisetujui: (status === 'DISETUJUI' || status === 'SEDANG DIPINJAM') ? getTodayISODate() : list[index].tanggalDisetujui,
    };

    list[index] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(list));

    this.triggerAutoSync('update_peminjaman_status', updatedItem);
    return updatedItem;
  },

  getReturns(): ItemReturn[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RETURNS);
      return data ? JSON.parse(data) : INITIAL_RETURNS;
    } catch {
      return INITIAL_RETURNS;
    }
  },

  saveReturn(returnItem: Omit<ItemReturn, 'id' | 'timestamp' | 'status'> & { id?: string }): ItemReturn {
    const list = this.getReturns();
    const dateStr = getDateStringForId();

    const todayReturns = list.filter(r => r.id.startsWith(`PB-${dateStr}`));
    const seq = String(todayReturns.length + 1).padStart(3, '0');
    const newId = returnItem.id || `PB-${dateStr}-${seq}`;

    const newReturn: ItemReturn = {
      ...returnItem,
      id: newId,
      timestamp: new Date().toISOString(),
      status: 'SELESAI',
    };

    const updatedReturns = [newReturn, ...list];
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(updatedReturns));

    // Also update the corresponding Loan status to 'SELESAI'
    if (returnItem.idPeminjaman) {
      this.updateLoanStatus(returnItem.idPeminjaman, 'SELESAI');
    }

    this.triggerAutoSync('submit_pengembalian', newReturn);
    return newReturn;
  },

  getRecentActivities(): ActivityLog[] {
    const damages = this.getDamageReports();
    const loans = this.getLoans();
    const returns = this.getReturns();

    const activities: ActivityLog[] = [];

    damages.forEach(d => {
      const date = new Date(d.timestamp);
      const timeFormatted = isNaN(date.getTime()) ? 'Baru saja' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      activities.push({
        id: `act-dm-${d.id}`,
        type: 'kerusakan',
        refId: d.id,
        timestamp: d.timestamp,
        timeFormatted,
        title: `Laporan Kerusakan: ${d.namaSarana}`,
        subtitle: `${d.detailLokasi || d.lokasi} • Oleh ${d.namaPelapor} (${d.statusPelapor})`,
        statusBadge: d.status,
        statusColor: d.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' : d.status === 'DIPROSES' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800',
      });
    });

    loans.forEach(l => {
      const date = new Date(l.timestamp);
      const timeFormatted = isNaN(date.getTime()) ? 'Baru saja' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      activities.push({
        id: `act-ln-${l.id}`,
        type: 'peminjaman',
        refId: l.id,
        timestamp: l.timestamp,
        timeFormatted,
        title: `Peminjaman: ${l.namaBarang} (${l.jumlah})`,
        subtitle: `${l.namaPeminjam} (${l.kelasUnit || l.statusPeminjam}) • Tgl Pinjam: ${l.tanggalPinjam}`,
        statusBadge: l.status,
        statusColor: l.status === 'SELESAI' ? 'bg-slate-200 text-slate-800' : l.status === 'SEDANG DIPINJAM' ? 'bg-blue-100 text-blue-800' : l.status === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' : l.status === 'DITOLAK' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800',
      });
    });

    returns.forEach(r => {
      const date = new Date(r.timestamp);
      const timeFormatted = isNaN(date.getTime()) ? 'Baru saja' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      activities.push({
        id: `act-rt-${r.id}`,
        type: 'pengembalian',
        refId: r.id,
        timestamp: r.timestamp,
        timeFormatted,
        title: `Pengembalian: ${r.namaBarang}`,
        subtitle: `Oleh ${r.namaPeminjam} • Kondisi: ${r.kondisiBarang}`,
        statusBadge: `Kondisi: ${r.kondisiBarang}`,
        statusColor: r.kondisiBarang === 'Baik' ? 'bg-emerald-100 text-emerald-800' : r.kondisiBarang === 'Ada kerusakan' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800',
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  },

  async triggerAutoSync(action: string, data: any): Promise<boolean> {
    const config = this.getConfig();
    if (!config.appsScriptWebhookUrl) return false;

    try {
      const res = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.appsScriptWebhookUrl,
          action,
          data,
        }),
      });
      const result = await res.json();
      if (result.success) {
        config.lastSyncedAt = new Date().toISOString();
        this.saveConfig(config);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async syncAllToGoogleSheets(): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.appsScriptWebhookUrl) {
      return {
        success: false,
        message: 'URL Webhook Google Apps Script belum dimasukkan. Silakan atur di Pengaturan Admin.',
      };
    }

    const payload = {
      kerusakan: this.getDamageReports(),
      peminjaman: this.getLoans(),
      pengembalian: this.getReturns(),
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.appsScriptWebhookUrl,
          action: 'sync_all',
          data: payload,
        }),
      });

      const result = await res.json();
      if (result.success) {
        config.lastSyncedAt = new Date().toISOString();
        this.saveConfig(config);
        return {
          success: true,
          message: 'Berhasil menyinkronkan seluruh data ke Google Sheets!',
        };
      } else {
        return {
          success: false,
          message: result.message || 'Gagal mengirim data ke Google Sheets.',
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: 'Koneksi gagal: ' + (e.message || 'Periksa jaringan internet.'),
      };
    }
  },

  // Reset to default initial demo data
  resetToInitialData(): void {
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(INITIAL_DAMAGE_REPORTS));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
  },

  // Generate Google Apps Script code for 1-click copy by Admin
  getGoogleAppsScriptCode(): string {
    return `/**
 * SIMPEL SARPRAS SMA NEGERI 1 TEJAKULA
 * Google Apps Script Web App Backend
 * 
 * CARA PEMASANGAN:
 * 1. Buka Google Spreadsheet "SIMPEL SARPRAS SMA Negeri 1 Tejakula"
 * 2. Buat 3 Sheet: "KERUSAKAN", "PEMINJAMAN", "PENGEMBALIAN"
 * 3. Buka menu Extensions (Ekstensi) > Apps Script
 * 4. Hapus semua kode, paste kode ini dan Simpan (Ctrl+S)
 * 5. Klik "Deploy" (Terapkan) > "New deployment" (Penerapan baru)
 * 6. Pilih tipe "Web app" (Aplikasi Web)
 * 7. Set:
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)
 * 8. Klik "Deploy", izinkan akses Google, lalu salin Web App URL ke aplikasi SIMPEL SARPRAS.
 */

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet KERUSAKAN
  var s1 = ss.getSheetByName("KERUSAKAN") || ss.insertSheet("KERUSAKAN");
  if (s1.getLastRow() === 0) {
    s1.appendRow([
      "ID_LAPORAN", "TIMESTAMP", "NAMA_PELAPOR", "STATUS_PELAPOR", "KONTAK",
      "LOKASI", "DETAIL_LOKASI", "NAMA_SARANA", "JENIS_KERUSAKAN", "DESKRIPSI",
      "FOTO", "TANGGAL_LAPOR", "STATUS", "CATATAN_PETUGAS", "TANGGAL_SELESAI"
    ]);
    s1.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#1e3a8a").setFontColor("#ffffff");
  }

  // 2. Sheet PEMINJAMAN
  var s2 = ss.getSheetByName("PEMINJAMAN") || ss.insertSheet("PEMINJAMAN");
  if (s2.getLastRow() === 0) {
    s2.appendRow([
      "ID_PEMINJAMAN", "TIMESTAMP", "NAMA_PEMINJAM", "STATUS_PEMINJAM", "KELAS_UNIT",
      "KONTAK", "NAMA_BARANG", "JUMLAH", "KEPERLUAN", "TANGGAL_PINJAM",
      "TANGGAL_RENCANA_KEMBALI", "CATATAN", "STATUS"
    ]);
    s2.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
  }

  // 3. Sheet PENGEMBALIAN
  var s3 = ss.getSheetByName("PENGEMBALIAN") || ss.insertSheet("PENGEMBALIAN");
  if (s3.getLastRow() === 0) {
    s3.appendRow([
      "ID_PENGEMBALIAN", "ID_PEMINJAMAN", "TIMESTAMP", "NAMA_PEMINJAM", "NAMA_BARANG",
      "JUMLAH", "TANGGAL_PINJAM", "TANGGAL_RENCANA_KEMBALI", "TANGGAL_PENGEMBALIAN",
      "KONDISI_BARANG", "CATATAN", "FOTO", "STATUS"
    ]);
    s3.getRange(1, 1, 1, 13).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var payload = data.payload;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    setupSheets();

    if (action === "submit_kerusakan") {
      var s = ss.getSheetByName("KERUSAKAN");
      s.appendRow([
        payload.id,
        payload.timestamp,
        payload.namaPelapor,
        payload.statusPelapor,
        payload.kontak,
        payload.lokasi,
        payload.detailLokasi,
        payload.namaSarana,
        payload.jenisKerusakan,
        payload.deskripsi,
        payload.foto || "-",
        payload.tanggalLapor,
        payload.status,
        payload.catatanPetugas || "-",
        payload.tanggalSelesai || "-"
      ]);
    } else if (action === "submit_peminjaman") {
      var s = ss.getSheetByName("PEMINJAMAN");
      s.appendRow([
        payload.id,
        payload.timestamp,
        payload.namaPeminjam,
        payload.statusPeminjam,
        payload.kelasUnit,
        payload.kontak,
        payload.namaBarang,
        payload.jumlah,
        payload.keperluan,
        payload.tanggalPinjam,
        payload.tanggalRencanaKembali,
        payload.catatan || "-",
        payload.status
      ]);
    } else if (action === "submit_pengembalian") {
      var s = ss.getSheetByName("PENGEMBALIAN");
      s.appendRow([
        payload.id,
        payload.idPeminjaman,
        payload.timestamp,
        payload.namaPeminjam,
        payload.namaBarang,
        payload.jumlah,
        payload.tanggalPinjam,
        payload.tanggalRencanaKembali,
        payload.tanggalPengembalian,
        payload.kondisiBarang,
        payload.catatan || "-",
        payload.foto || "-",
        payload.status
      ]);
      
      // Update Loan status in PEMINJAMAN sheet
      var loanSheet = ss.getSheetByName("PEMINJAMAN");
      var values = loanSheet.getDataRange().getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === payload.idPeminjaman) {
          loanSheet.getRange(i + 1, 13).setValue("SELESAI");
          break;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil dicatat ke Google Sheets"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    school: "SMA Negeri 1 Tejakula",
    service: "SIMPEL SARPRAS Google Sheets Gateway"
  })).setMimeType(ContentService.MimeType.JSON);
}`;
  },
};
