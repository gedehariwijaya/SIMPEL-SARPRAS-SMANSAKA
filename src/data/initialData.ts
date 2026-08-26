import { DamageReport, ItemLoan, ItemReturn, AppConfig } from '../types';

export const INITIAL_CONFIG: AppConfig = {
  googleSpreadsheetId: '',
  googleSpreadsheetUrl: '',
  appsScriptWebhookUrl: '',
  schoolName: 'SMA Negeri 1 Tejakula',
  autoSync: false,
};

// Database awal dikosongkan untuk database baru Firebase Firestore
export const INITIAL_DAMAGE_REPORTS: DamageReport[] = [];

export const INITIAL_LOANS: ItemLoan[] = [];

export const INITIAL_RETURNS: ItemReturn[] = [];

export const LOCATION_OPTIONS = [
  'Ruang kelas',
  'Laboratorium',
  'Ruang guru',
  'Kantor',
  'Toilet',
  'Lapangan',
  'Gudang',
  'Perpustakaan',
  'UKS',
  'Aula / Wantilan',
  'Kantin',
  'Lainnya',
];

export const DAMAGE_TYPE_OPTIONS = [
  'Rusak ringan',
  'Rusak sedang',
  'Rusak berat',
  'Tidak berfungsi',
  'Hilang',
  'Lainnya',
];

export const USER_ROLES = [
  'Guru',
  'Tenaga Kependidikan',
  'Siswa',
  'Waka Sarpras / Petugas',
  'Lainnya',
];

