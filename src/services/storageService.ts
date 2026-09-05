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

// Friendly Relative / Absolute Time Formatter (Indonesian)
export function formatFriendlyTime(timestampStr: string): string {
  if (!timestampStr) return 'Baru saja';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return 'Baru saja';

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;

  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return `Hari ini, ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Kemarin, ${timeStr}`;

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} ${timeStr}`;
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

    const nowIso = new Date().toISOString();
    const updatedItem: DamageReport = {
      ...list[index],
      status,
      catatanPetugas: catatanPetugas !== undefined ? catatanPetugas : list[index].catatanPetugas,
      tanggalSelesai: status === 'SELESAI' ? getTodayISODate() : list[index].tanggalSelesai,
      updatedAt: nowIso,
    };

    list[index] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.DAMAGE, JSON.stringify(list));

    if (FirebaseService.isConfigured()) {
      FirebaseService.updateDamageReport(id, updatedItem).catch(err => console.warn('Firestore update failed:', err));
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

    const nowIso = new Date().toISOString();
    const updatedItem: ItemLoan = {
      ...list[index],
      status,
      persetujuanOleh,
      tanggalDisetujui: (status === 'DISETUJUI' || status === 'SEDANG DIPINJAM') ? getTodayISODate() : list[index].tanggalDisetujui,
      updatedAt: nowIso,
    };

    list[index] = updatedItem;
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(list));

    if (FirebaseService.isConfigured()) {
      FirebaseService.updateLoan(id, updatedItem).catch(err => console.warn('Firestore loan update failed:', err));
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
  // Accepts optional in-memory lists for instant reactive UI updates
  getRecentActivities(
    damageList?: DamageReport[],
    loansList?: ItemLoan[],
    returnsList?: ItemReturn[]
  ): ActivityLog[] {
    const damage = damageList || this.getDamageReports();
    const loans = loansList || this.getLoans();
    const returns = returnsList || this.getReturns();

    const activities: ActivityLog[] = [];

    damage.forEach(d => {
      if (d.status === 'DIPROSES') {
        // Status update to DIPROSES (Sedang Dikerjakan/Diproses)
        const effectiveTime = d.updatedAt || d.timestamp;
        activities.push({
          id: `act-dm-proc-${d.id}`,
          type: 'kerusakan',
          refId: d.id,
          timestamp: effectiveTime,
          timeFormatted: formatFriendlyTime(effectiveTime),
          title: `Proses Perbaikan: ${d.namaSarana}`,
          subtitle: `${d.catatanPetugas ? `Catatan: "${d.catatanPetugas}" • ` : ''}${d.detailLokasi || d.lokasi} • Pelapor: ${d.namaPelapor}`,
          statusBadge: 'DIPROSES',
          statusColor: 'bg-amber-100 text-amber-800 border border-amber-300',
        });

        // Also preserve initial report entry if timestamp is distinct
        if (d.updatedAt && d.updatedAt !== d.timestamp) {
          activities.push({
            id: `act-dm-init-${d.id}`,
            type: 'kerusakan',
            refId: d.id,
            timestamp: d.timestamp,
            timeFormatted: formatFriendlyTime(d.timestamp),
            title: `Lapor Kerusakan: ${d.namaSarana}`,
            subtitle: `${d.detailLokasi || d.lokasi} • Oleh ${d.namaPelapor} (${d.statusPelapor})`,
            statusBadge: 'DILAPORKAN',
            statusColor: 'bg-slate-100 text-slate-700 border border-slate-200',
          });
        }
      } else if (d.status === 'SELESAI') {
        // Status update to SELESAI (Perbaikan Rampung)
        const effectiveTime = d.updatedAt || d.timestamp;
        activities.push({
          id: `act-dm-done-${d.id}`,
          type: 'kerusakan',
          refId: d.id,
          timestamp: effectiveTime,
          timeFormatted: formatFriendlyTime(effectiveTime),
          title: `Selesai Diperbaiki: ${d.namaSarana}`,
          subtitle: `${d.tanggalSelesai ? `Tgl Selesai: ${d.tanggalSelesai} • ` : ''}${d.catatanPetugas ? `Catatan: "${d.catatanPetugas}" • ` : ''}${d.detailLokasi || d.lokasi}`,
          statusBadge: 'SELESAI',
          statusColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        });

        // Also preserve initial report entry if timestamp is distinct
        if (d.updatedAt && d.updatedAt !== d.timestamp) {
          activities.push({
            id: `act-dm-init-${d.id}`,
            type: 'kerusakan',
            refId: d.id,
            timestamp: d.timestamp,
            timeFormatted: formatFriendlyTime(d.timestamp),
            title: `Lapor Kerusakan: ${d.namaSarana}`,
            subtitle: `${d.detailLokasi || d.lokasi} • Oleh ${d.namaPelapor} (${d.statusPelapor})`,
            statusBadge: 'DILAPORKAN',
            statusColor: 'bg-slate-100 text-slate-700 border border-slate-200',
          });
        }
      } else {
        // Status DILAPORKAN
        activities.push({
          id: `act-dm-${d.id}`,
          type: 'kerusakan',
          refId: d.id,
          timestamp: d.timestamp,
          timeFormatted: formatFriendlyTime(d.timestamp),
          title: `Lapor Kerusakan: ${d.namaSarana}`,
          subtitle: `${d.detailLokasi || d.lokasi} • Oleh ${d.namaPelapor} (${d.statusPelapor})`,
          statusBadge: d.status,
          statusColor: 'bg-rose-100 text-rose-800 border border-rose-200',
        });
      }
    });

    loans.forEach(l => {
      const effectiveTime = l.updatedAt || l.timestamp;
      let title = `Permohonan Pinjam: ${l.namaBarang} (${l.jumlah})`;
      let subtitle = `${l.namaPeminjam} (${l.kelasUnit || l.statusPeminjam}) • Tgl Pinjam: ${l.tanggalPinjam}`;
      let statusColor = 'bg-amber-100 text-amber-800 border border-amber-200';

      if (l.status === 'DISETUJUI') {
        title = `Pinjaman Disetujui: ${l.namaBarang} (${l.jumlah})`;
        subtitle = `Disetujui oleh ${l.persetujuanOleh || 'Sarpras'} • Peminjam: ${l.namaPeminjam}`;
        statusColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      } else if (l.status === 'SEDANG DIPINJAM') {
        title = `Sedang Dipinjam: ${l.namaBarang} (${l.jumlah})`;
        subtitle = `Dalam pemakaian oleh ${l.namaPeminjam} • Rencana kembali: ${l.tanggalRencanaKembali}`;
        statusColor = 'bg-blue-100 text-blue-800 border border-blue-200';
      } else if (l.status === 'SELESAI') {
        title = `Peminjaman Selesai: ${l.namaBarang}`;
        subtitle = `Barang telah dikembalikan oleh ${l.namaPeminjam}`;
        statusColor = 'bg-slate-200 text-slate-800 border border-slate-300';
      } else if (l.status === 'DITOLAK') {
        title = `Peminjaman Ditolak: ${l.namaBarang}`;
        subtitle = `Ditolak oleh ${l.persetujuanOleh || 'Sarpras'} • ${l.namaPeminjam}`;
        statusColor = 'bg-red-100 text-red-800 border border-red-200';
      }

      activities.push({
        id: `act-ln-${l.id}`,
        type: 'peminjaman',
        refId: l.id,
        timestamp: effectiveTime,
        timeFormatted: formatFriendlyTime(effectiveTime),
        title,
        subtitle,
        statusBadge: l.status,
        statusColor,
      });

      // Preserve initial loan request entry if status updated later
      if (l.updatedAt && l.updatedAt !== l.timestamp) {
        activities.push({
          id: `act-ln-init-${l.id}`,
          type: 'peminjaman',
          refId: l.id,
          timestamp: l.timestamp,
          timeFormatted: formatFriendlyTime(l.timestamp),
          title: `Pengajuan Pinjam: ${l.namaBarang} (${l.jumlah})`,
          subtitle: `${l.namaPeminjam} (${l.kelasUnit || l.statusPeminjam}) • Tgl Pinjam: ${l.tanggalPinjam}`,
          statusBadge: 'MENUNGGU',
          statusColor: 'bg-slate-100 text-slate-600 border border-slate-200',
        });
      }
    });

    returns.forEach(r => {
      activities.push({
        id: `act-rt-${r.id}`,
        type: 'pengembalian',
        refId: r.id,
        timestamp: r.timestamp,
        timeFormatted: formatFriendlyTime(r.timestamp),
        title: `Pengembalian: ${r.namaBarang}`,
        subtitle: `Oleh ${r.namaPeminjam} • Kondisi: ${r.kondisiBarang}${r.catatan ? ` • "${r.catatan}"` : ''}`,
        statusBadge: `Kondisi: ${r.kondisiBarang}`,
        statusColor: r.kondisiBarang === 'Baik' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : r.kondisiBarang === 'Ada kerusakan' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-rose-100 text-rose-800 border border-rose-200',
      });
    });

    // Helper to safely parse timestamp
    const getTimeMs = (timeStr?: string) => {
      if (!timeStr) return 0;
      const t = new Date(timeStr).getTime();
      return isNaN(t) ? 0 : t;
    };

    // Sort by timestamp descending (latest action/update always on top)
    return activities.sort((a, b) => getTimeMs(b.timestamp) - getTimeMs(a.timestamp)).slice(0, 20);
  },

  // Smart Sync & Merge between Firestore remote snapshots and Local Storage
  mergeDamageReportsWithLocal(remoteReports: DamageReport[]): DamageReport[] {
    const localReports = this.getDamageReports();
    if (!remoteReports || remoteReports.length === 0) {
      // If remote is empty but local has items, don't wipe local! Sync local to remote instead
      if (localReports.length > 0 && FirebaseService.isConfigured()) {
        localReports.forEach(item => {
          FirebaseService.saveDamageReport(item).catch(() => {});
        });
      }
      return localReports;
    }

    const mergedMap = new Map<string, DamageReport>();

    // 1. Index local reports
    localReports.forEach(item => {
      mergedMap.set(item.id, item);
    });

    // 2. Merge remote reports, keeping whichever has the newer status/update
    remoteReports.forEach(remote => {
      const local = mergedMap.get(remote.id);
      if (!local) {
        mergedMap.set(remote.id, remote);
      } else {
        const localTime = new Date(local.updatedAt || local.timestamp || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.timestamp || 0).getTime();

        if (remoteTime >= localTime) {
          // Remote is fresher or equal
          mergedMap.set(remote.id, { ...local, ...remote });
        } else {
          // Local has a newer update (e.g. status marked 'DIPROSES' just before refresh)
          // Keep local status and push update to Firestore
          if (FirebaseService.isConfigured()) {
            FirebaseService.updateDamageReport(local.id, local).catch(() => {});
          }
        }
      }
    });

    const result = Array.from(mergedMap.values()).sort((a, b) => {
      const tB = new Date(b.updatedAt || b.timestamp || 0).getTime();
      const tA = new Date(a.updatedAt || a.timestamp || 0).getTime();
      return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
    });

    this.setDamageReports(result);
    return result;
  },

  mergeLoansWithLocal(remoteLoans: ItemLoan[]): ItemLoan[] {
    const localLoans = this.getLoans();
    if (!remoteLoans || remoteLoans.length === 0) {
      if (localLoans.length > 0 && FirebaseService.isConfigured()) {
        localLoans.forEach(item => {
          FirebaseService.saveLoan(item).catch(() => {});
        });
      }
      return localLoans;
    }

    const mergedMap = new Map<string, ItemLoan>();
    localLoans.forEach(item => mergedMap.set(item.id, item));

    remoteLoans.forEach(remote => {
      const local = mergedMap.get(remote.id);
      if (!local) {
        mergedMap.set(remote.id, remote);
      } else {
        const localTime = new Date(local.updatedAt || local.timestamp || 0).getTime();
        const remoteTime = new Date(remote.updatedAt || remote.timestamp || 0).getTime();
        if (remoteTime >= localTime) {
          mergedMap.set(remote.id, { ...local, ...remote });
        } else {
          if (FirebaseService.isConfigured()) {
            FirebaseService.updateLoan(local.id, local).catch(() => {});
          }
        }
      }
    });

    const result = Array.from(mergedMap.values()).sort((a, b) => {
      const tB = new Date(b.updatedAt || b.timestamp || 0).getTime();
      const tA = new Date(a.updatedAt || a.timestamp || 0).getTime();
      return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
    });

    this.setLoans(result);
    return result;
  },

  mergeReturnsWithLocal(remoteReturns: ItemReturn[]): ItemReturn[] {
    const localReturns = this.getReturns();
    if (!remoteReturns || remoteReturns.length === 0) {
      if (localReturns.length > 0 && FirebaseService.isConfigured()) {
        localReturns.forEach(item => {
          FirebaseService.saveReturn(item).catch(() => {});
        });
      }
      return localReturns;
    }

    const mergedMap = new Map<string, ItemReturn>();
    localReturns.forEach(item => mergedMap.set(item.id, item));

    remoteReturns.forEach(remote => {
      mergedMap.set(remote.id, remote);
    });

    const result = Array.from(mergedMap.values()).sort((a, b) => {
      const tB = new Date(b.timestamp || 0).getTime();
      const tA = new Date(a.timestamp || 0).getTime();
      return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
    });

    this.setReturns(result);
    return result;
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
