export type UserRole = 'Guru' | 'Tenaga Kependidikan' | 'Siswa' | 'Waka Sarpras / Petugas' | 'Lainnya';

export type DamageStatus = 'DILAPORKAN' | 'DIPROSES' | 'SELESAI';

export type LoanStatus = 'MENUNGGU' | 'DISETUJUI' | 'SEDANG DIPINJAM' | 'DITOLAK' | 'SELESAI';

export type ItemCondition = 'Baik' | 'Ada kerusakan' | 'Rusak';

export interface DamageReport {
  id: string; // ID_LAPORAN (KR-YYYYMMDD-XXX)
  timestamp: string; // TIMESTAMP
  namaPelapor: string; // NAMA_PELAPOR
  statusPelapor: string; // STATUS_PELAPOR (Guru/Pegawai/dll)
  kontak: string; // KONTAK
  lokasi: string; // LOKASI (Ruang kelas, Laboratorium, dll)
  detailLokasi: string; // DETAIL_LOKASI (e.g. Ruang X3)
  namaSarana: string; // NAMA_SARANA (e.g. AC)
  jenisKerusakan: string; // JENIS_KERUSAKAN (Rusak ringan, sedang, berat, dll)
  deskripsi: string; // DESKRIPSI
  foto?: string; // FOTO (Data URL or Drive URL)
  tanggalLapor: string; // TANGGAL_LAPOR (YYYY-MM-DD)
  status: DamageStatus; // STATUS
  catatanPetugas?: string; // CATATAN_PETUGAS
  tanggalSelesai?: string; // TANGGAL_SELESAI
}

export interface ItemLoan {
  id: string; // ID_PEMINJAMAN (PJ-YYYYMMDD-XXX)
  timestamp: string; // TIMESTAMP
  namaPeminjam: string; // NAMA_PEMINJAM
  statusPeminjam: string; // STATUS_PEMINJAM
  kelasUnit: string; // KELAS_UNIT
  kontak: string; // KONTAK
  namaBarang: string; // NAMA_BARANG
  jumlah: string; // JUMLAH (e.g. 1 unit)
  keperluan: string; // KEPERLUAN
  tanggalPinjam: string; // TANGGAL_PINJAM (YYYY-MM-DD)
  waktu?: string; // WAKTU (e.g. 08:00 - 13:00)
  tanggalRencanaKembali: string; // TANGGAL_RENCANA_KEMBALI (YYYY-MM-DD)
  catatan?: string; // CATATAN
  status: LoanStatus; // STATUS
  persetujuanOleh?: string;
  tanggalDisetujui?: string;
}

export interface ItemReturn {
  id: string; // ID_PENGEMBALIAN (PB-YYYYMMDD-XXX)
  idPeminjaman: string; // ID_PEMINJAMAN (e.g. PJ-20260823-001)
  timestamp: string; // TIMESTAMP
  namaPeminjam: string; // NAMA_PEMINJAM
  namaBarang: string; // NAMA_BARANG
  jumlah: string; // JUMLAH
  tanggalPinjam: string; // TANGGAL_PINJAM
  tanggalRencanaKembali: string; // TANGGAL_RENCANA_KEMBALI
  tanggalPengembalian: string; // TANGGAL_PENGEMBALIAN (YYYY-MM-DD)
  kondisiBarang: ItemCondition; // KONDISI_BARANG (Baik, Ada kerusakan, Rusak)
  catatan?: string; // CATATAN
  foto?: string; // FOTO
  status: 'SELESAI'; // STATUS
  penerimaPetugas?: string;
}

export interface ActivityLog {
  id: string;
  type: 'kerusakan' | 'peminjaman' | 'pengembalian';
  refId: string;
  timestamp: string;
  timeFormatted: string;
  title: string;
  subtitle: string;
  statusBadge: string;
  statusColor: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

export interface AppConfig {
  googleSpreadsheetId: string;
  googleSpreadsheetUrl: string;
  appsScriptWebhookUrl: string;
  schoolName: string;
  autoSync: boolean;
  lastSyncedAt?: string;
  useFirebase?: boolean;
}

export type ActiveTab = 'beranda' | 'kerusakan' | 'peminjaman' | 'pengembalian' | 'riwayat' | 'admin';
