import { DamageReport, ItemLoan, ItemReturn, AppConfig, ActivityLog, DamageStatus, LoanStatus } from '../types';
import { INITIAL_CONFIG, INITIAL_DAMAGE_REPORTS, INITIAL_LOANS, INITIAL_RETURNS } from '../data/initialData';
import { FirebaseService } from './firebaseService';

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

  setDamageReports(reports: DamageReport[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save damage reports', e);
    }
  },

  saveDamageReport(report: Omit<DamageReport, 'id' | 'timestamp' | 'status'> & { id?: string }): DamageReport {
    const list = this.getDamageReports();
    const dateStr = getDateStringForId();
    
    // Generate sequential ID for today
    const todayReports = list.filter(r => r.id.startsWith(`KR-${dateStr}`));
    const seq = String(todayReports.length + 1).padStart(3, '0');
    const newId = report.id || `KR-${dateStr}-${seq}`;

    const newReport: DamageReport = {
      ...report,
      id: newId,
      timestamp: new Date().toISOString(),
      status: 'DILAPORKAN',
    };

    const updated = [newReport, ...list.filter(r => r.id !== newId)];
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(updated));

    // Save directly to Firebase Firestore
    if (FirebaseService.isConfigured()) {
      FirebaseService.saveDamageReport(newReport).catch(err => {
        console.warn('Firestore write failed for damage report:', err);
      });
    }

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

    if (FirebaseService.isConfigured()) {
      FirebaseService.updateDamageReport(id, {
        status: updatedItem.status,
        catatanPetugas: updatedItem.catatanPetugas,
        tanggalSelesai: updatedItem.tanggalSelesai,
      }).catch(err => console.warn('Firestore update failed:', err));
    }

    return updatedItem;
  },

  deleteDamageReport(id: string): void {
    const list = this.getDamageReports().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(list));

    if (FirebaseService.isConfigured()) {
      FirebaseService.deleteDamageReport(id).catch(err => console.warn('Firestore delete failed:', err));
    }
  },

  getLoans(): ItemLoan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOANS);
      return data ? JSON.parse(data) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  },

  setLoans(loans: ItemLoan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error('Failed to save loans', e);
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

    const updated = [newLoan, ...list.filter(l => l.id !== newId)];
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(updated));

    // Save directly to Firebase Firestore
    if (FirebaseService.isConfigured()) {
      FirebaseService.saveLoan(newLoan).catch(err => {
        console.warn('Firestore write failed for loan:', err);
      });
    }

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

    if (FirebaseService.isConfigured()) {
      FirebaseService.updateLoan(id, {
        status: updatedItem.status,
        persetujuanOleh: updatedItem.persetujuanOleh,
        tanggalDisetujui: updatedItem.tanggalDisetujui,
      }).catch(err => console.warn('Firestore loan update failed:', err));
    }

    return updatedItem;
  },

  deleteLoan(id: string): void {
    const list = this.getLoans().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(list));

    if (FirebaseService.isConfigured()) {
      FirebaseService.deleteLoan(id).catch(err => console.warn('Firestore loan delete failed:', err));
    }
  },

  getReturns(): ItemReturn[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RETURNS);
      return data ? JSON.parse(data) : INITIAL_RETURNS;
    } catch {
      return INITIAL_RETURNS;
    }
  },

  setReturns(returns: ItemReturn[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
    } catch (e) {
      console.error('Failed to save returns', e);
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

    const updatedReturns = [newReturn, ...list.filter(r => r.id !== newId)];
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(updatedReturns));

    // Also update the corresponding Loan status to 'SELESAI'
    if (returnItem.idPeminjaman) {
      this.updateLoanStatus(returnItem.idPeminjaman, 'SELESAI', 'Otomatis via Pengembalian');
    }

    // Save directly to Firebase Firestore
    if (FirebaseService.isConfigured()) {
      FirebaseService.saveReturn(newReturn).catch(err => {
        console.warn('Firestore write failed for return:', err);
      });
    }

    return newReturn;
  },

  deleteReturn(id: string): void {
    const list = this.getReturns().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(list));

    if (FirebaseService.isConfigured()) {
      FirebaseService.deleteReturn(id).catch(err => console.warn('Firestore delete failed:', err));
    }
  },

  // Compute live activity logs from reports, loans, returns
  getRecentActivities(): ActivityLog[] {
    const damage = this.getDamageReports();
    const loans = this.getLoans();
    const returns = this.getReturns();

    const activities: ActivityLog[] = [];

    damage.forEach(d => {
      const date = new Date(d.timestamp);
      const timeFormatted = isNaN(date.getTime()) ? 'Baru saja' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      activities.push({
        id: `act-dm-${d.id}`,
        type: 'kerusakan',
        refId: d.id,
        timestamp: d.timestamp,
        timeFormatted,
        title: `Lapor Kerusakan: ${d.namaSarana}`,
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

  // Clear all local & remote data
  async clearAllData(): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));

    if (FirebaseService.isConfigured()) {
      await FirebaseService.clearAllFirestoreData();
    }
  },

  // Reset to clean empty database
  resetToInitialData(): void {
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
  },
};
