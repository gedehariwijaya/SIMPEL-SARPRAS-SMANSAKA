import { DamageReport, ItemLoan, ItemReturn } from '../types';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets';
const TOKEN_STORAGE_KEY = 'simpel_sarpras_google_token_v1';

export interface GoogleAuthToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
  email?: string;
}

export const GoogleDriveService = {
  // Get stored OAuth token
  getStoredToken(): GoogleAuthToken | null {
    try {
      const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) return null;
      const token: GoogleAuthToken = JSON.parse(raw);
      if (Date.now() > token.expiresAt) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return null;
      }
      return token;
    } catch {
      return null;
    }
  },

  // Save OAuth token
  saveToken(token: GoogleAuthToken): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  },

  // Clear token (disconnect)
  clearToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  // Check if connected
  isConnected(): boolean {
    return this.getStoredToken() !== null;
  },

  // Request Access Token using Google Identity Services (GIS)
  async requestAccessToken(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        reject(
          new Error(
            'Google Identity Services belum termuat di browser. Periksa koneksi internet Anda atau muat ulang halaman.'
          )
        );
        return;
      }

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id:
            clientId ||
            (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
            '346680234786-9mke0bkh0i0l5k7j3o1d2g7e4f9b8a1c.apps.googleusercontent.com', // standard client fallback or configured
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              const expiresIn = (parseInt(response.expires_in, 10) || 3599) * 1000;
              const tokenData: GoogleAuthToken = {
                accessToken: response.access_token,
                expiresAt: Date.now() + expiresIn,
              };
              this.saveToken(tokenData);
              resolve(response.access_token);
            } else {
              reject(new Error('Gagal mendapatkan access token dari Google'));
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  },

  // 1-Click: Create complete SIMPEL SARPRAS Spreadsheet directly in Google Drive!
  async createSpreadsheetInDrive(
    token: string,
    initialData: {
      damageReports: DamageReport[];
      loans: ItemLoan[];
      returns: ItemReturn[];
    }
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const title = 'SIMPEL SARPRAS SMA Negeri 1 Tejakula';

    // 1. Create Spreadsheet via Google Sheets API v4
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
          locale: 'id_ID',
          autoRecalc: 'ON_CHANGE',
        },
        sheets: [
          {
            properties: {
              sheetId: 0,
              title: 'KERUSAKAN',
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 15,
                rowCount: 100,
              },
            },
          },
          {
            properties: {
              sheetId: 1,
              title: 'PEMINJAMAN',
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 13,
                rowCount: 100,
              },
            },
          },
          {
            properties: {
              sheetId: 2,
              title: 'PENGEMBALIAN',
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 13,
                rowCount: 100,
              },
            },
          },
          {
            properties: {
              sheetId: 3,
              title: 'INVENTARIS_SARANA',
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 8,
                rowCount: 50,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message ||
          `Gagal membuat spreadsheet di Google Drive (Status ${createRes.status})`
      );
    }

    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Format Header Colors & Styling via batchUpdate
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              // Style Sheet 0: KERUSAKAN (Dark Blue / Indigo #1E3A8A)
              {
                repeatCell: {
                  range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.12, green: 0.23, blue: 0.54 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
              },
              // Style Sheet 1: PEMINJAMAN (Indigo #4338CA)
              {
                repeatCell: {
                  range: {
                    sheetId: 1,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.26, green: 0.22, blue: 0.79 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
              },
              // Style Sheet 2: PENGEMBALIAN (Emerald #047857)
              {
                repeatCell: {
                  range: {
                    sheetId: 2,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.02, green: 0.47, blue: 0.34 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
              },
              // Style Sheet 3: INVENTARIS_SARANA (Cyan #0E7490)
              {
                repeatCell: {
                  range: {
                    sheetId: 3,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.05, green: 0.45, blue: 0.56 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1, green: 1, blue: 1 },
                        fontSize: 10,
                      },
                      horizontalAlignment: 'CENTER',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
              },
            ],
          }),
        }
      );
    } catch (e) {
      console.warn('Formatting spreadsheet headers had a minor notice:', e);
    }

    // 3. Populate Initial Rows to each sheet
    await this.populateInitialData(token, spreadsheetId, initialData);

    return { spreadsheetId, spreadsheetUrl };
  },

  // Populate data into the newly created spreadsheet
  async populateInitialData(
    token: string,
    spreadsheetId: string,
    data: {
      damageReports: DamageReport[];
      loans: ItemLoan[];
      returns: ItemReturn[];
    }
  ): Promise<void> {
    // 1. KERUSAKAN Rows
    const kerusakanHeader = [
      'ID_LAPORAN',
      'TIMESTAMP',
      'NAMA_PELAPOR',
      'STATUS_PELAPOR',
      'KONTAK',
      'LOKASI',
      'DETAIL_LOKASI',
      'NAMA_SARANA',
      'JENIS_KERUSAKAN',
      'DESKRIPSI',
      'FOTO_BUKTI',
      'TANGGAL_LAPOR',
      'STATUS',
      'CATATAN_PETUGAS',
      'TANGGAL_SELESAI',
    ];
    const kerusakanRows = data.damageReports.map((d) => [
      d.id,
      d.timestamp,
      d.namaPelapor,
      d.statusPelapor,
      d.kontak || '-',
      d.lokasi,
      d.detailLokasi || '-',
      d.namaSarana,
      d.jenisKerusakan,
      d.deskripsi,
      d.foto ? '(Foto Terlampir)' : '-',
      d.tanggalLapor,
      d.status,
      d.catatanPetugas || '-',
      d.tanggalSelesai || '-',
    ]);

    // 2. PEMINJAMAN Rows
    const peminjamanHeader = [
      'ID_PEMINJAMAN',
      'TIMESTAMP',
      'NAMA_PEMINJAM',
      'STATUS_PEMINJAM',
      'KELAS_UNIT',
      'KONTAK',
      'NAMA_BARANG',
      'JUMLAH',
      'KEPERLUAN',
      'TANGGAL_PINJAM',
      'RENCANA_KEMBALI',
      'CATATAN',
      'STATUS',
    ];
    const peminjamanRows = data.loans.map((l) => [
      l.id,
      l.timestamp,
      l.namaPeminjam,
      l.statusPeminjam,
      l.kelasUnit || '-',
      l.kontak || '-',
      l.namaBarang,
      l.jumlah,
      l.keperluan,
      l.tanggalPinjam,
      l.tanggalRencanaKembali,
      l.catatan || '-',
      l.status,
    ]);

    // 3. PENGEMBALIAN Rows
    const pengembalianHeader = [
      'ID_PENGEMBALIAN',
      'ID_PEMINJAMAN',
      'TIMESTAMP',
      'NAMA_PEMINJAM',
      'NAMA_BARANG',
      'JUMLAH',
      'TANGGAL_PINJAM',
      'RENCANA_KEMBALI',
      'TANGGAL_PENGEMBALIAN',
      'KONDISI_BARANG',
      'CATATAN',
      'FOTO_BUKTI',
      'STATUS',
    ];
    const pengembalianRows = data.returns.map((r) => [
      r.id,
      r.idPeminjaman,
      r.timestamp,
      r.namaPeminjam,
      r.namaBarang,
      r.jumlah,
      r.tanggalPinjam,
      r.tanggalRencanaKembali,
      r.tanggalPengembalian,
      r.kondisiBarang,
      r.catatan || '-',
      r.foto ? '(Foto Terlampir)' : '-',
      r.status,
    ]);

    // 4. INVENTARIS_SARANA Rows
    const inventarisHeader = [
      'KODE_BARANG',
      'NAMA_SARANA_BARANG',
      'KATEGORI',
      'LOKASI_STANDAR',
      'TOTAL_UNIT',
      'TERSEDIA',
      'KONDISI_BAIK',
      'KONDISI_RUSAK',
    ];
    const inventarisRows = [
      ['BRG-001', 'LCD Proyektor Epson EB-X500', 'Elektronik & Multimedia', 'Ruang Sarpras', '8 Unit', '6 Unit', '7 Unit', '1 Unit'],
      ['BRG-002', 'Sound System Portable + Wireless Mic', 'Audio & Acara', 'Ruang Sarpras', '3 Unit', '2 Unit', '3 Unit', '0 Unit'],
      ['BRG-003', 'Kabel HDMI 10 Meter & VGA Adapter', 'Aksesoris IT', 'Lab Komputer', '10 Pcs', '8 Pcs', '10 Pcs', '0 Pcs'],
      ['BRG-004', 'Kamera DSLR Dokumentasi Sekolah', 'Multimedia & Humas', 'Ruang Waka', '2 Unit', '2 Unit', '2 Unit', '0 Unit'],
      ['BRG-005', 'Terminal Colokan Kabel Roll 15M', 'Kelistrikan', 'Ruang Sarpras', '12 Roll', '9 Roll', '11 Roll', '1 Roll'],
      ['BRG-006', 'Genset Cadangan 5000W', 'Peralatan Listrik', 'Gudang Sarpras', '1 Unit', '1 Unit', '1 Unit', '0 Unit'],
      ['BRG-007', 'Pointer Presentasi Wireless Laser', 'Multimedia', 'Ruang Guru', '6 Pcs', '5 Pcs', '6 Pcs', '0 Pcs'],
      ['BRG-008', 'Tenda Lipat Kegiatan 3x3M', 'Perlengkapan Lapangan', 'Gudang Lapangan', '4 Set', '4 Set', '4 Set', '0 Set'],
    ];

    // Batch update values
    const valueRanges = [
      {
        range: 'KERUSAKAN!A1:O',
        values: [kerusakanHeader, ...kerusakanRows],
      },
      {
        range: 'PEMINJAMAN!A1:M',
        values: [peminjamanHeader, ...peminjamanRows],
      },
      {
        range: 'PENGEMBALIAN!A1:M',
        values: [pengembalianHeader, ...pengembalianRows],
      },
      {
        range: 'INVENTARIS_SARANA!A1:H',
        values: [inventarisHeader, ...inventarisRows],
      },
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: valueRanges,
        }),
      }
    );
  },

  // Synchronize current local data into existing Google Spreadsheet
  async syncAllToSpreadsheet(
    token: string,
    spreadsheetId: string,
    data: {
      damageReports: DamageReport[];
      loans: ItemLoan[];
      returns: ItemReturn[];
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.populateInitialData(token, spreadsheetId, data);
      return {
        success: true,
        message: 'Data SIMPEL SARPRAS berhasil disinkronkan ke Google Spreadsheet Anda!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal sinkronisasi: ' + (err.message || 'Periksa koneksi Google Drive'),
      };
    }
  },

  // Pull / Import data from Google Sheets into the application
  async pullDataFromSpreadsheet(
    token: string,
    spreadsheetId: string
  ): Promise<{
    damageReports: DamageReport[];
    loans: ItemLoan[];
    returns: ItemReturn[];
  }> {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=KERUSAKAN!A2:O&ranges=PEMINJAMAN!A2:M&ranges=PENGEMBALIAN!A2:M`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari Google Sheets (Status ${res.status})`);
    }

    const json = await res.json();
    const [kerusakanData, peminjamanData, pengembalianData] = json.valueRanges || [];

    const damageReports: DamageReport[] = (kerusakanData?.values || []).map((row: any[]) => ({
      id: row[0] || '',
      timestamp: row[1] || new Date().toISOString(),
      namaPelapor: row[2] || '',
      statusPelapor: row[3] || 'Guru',
      kontak: row[4] || '',
      lokasi: row[5] || '',
      detailLokasi: row[6] || '',
      namaSarana: row[7] || '',
      jenisKerusakan: row[8] || 'Rusak ringan',
      deskripsi: row[9] || '',
      foto: row[10] && row[10] !== '-' && row[10] !== '(Foto Terlampir)' ? row[10] : undefined,
      tanggalLapor: row[11] || '',
      status: (row[12] as any) || 'DILAPORKAN',
      catatanPetugas: row[13] || '',
      tanggalSelesai: row[14] || '',
    }));

    const loans: ItemLoan[] = (peminjamanData?.values || []).map((row: any[]) => ({
      id: row[0] || '',
      timestamp: row[1] || new Date().toISOString(),
      namaPeminjam: row[2] || '',
      statusPeminjam: row[3] || 'Guru',
      kelasUnit: row[4] || '',
      kontak: row[5] || '',
      namaBarang: row[6] || '',
      jumlah: row[7] || '1 unit',
      keperluan: row[8] || '',
      tanggalPinjam: row[9] || '',
      tanggalRencanaKembali: row[10] || '',
      catatan: row[11] || '',
      status: (row[12] as any) || 'MENUNGGU',
    }));

    const returns: ItemReturn[] = (pengembalianData?.values || []).map((row: any[]) => ({
      id: row[0] || '',
      idPeminjaman: row[1] || '',
      timestamp: row[2] || new Date().toISOString(),
      namaPeminjam: row[3] || '',
      namaBarang: row[4] || '',
      jumlah: row[5] || '1 unit',
      tanggalPinjam: row[6] || '',
      tanggalRencanaKembali: row[7] || '',
      tanggalPengembalian: row[8] || '',
      kondisiBarang: (row[9] as any) || 'Baik',
      catatan: row[10] || '',
      foto: row[11] && row[11] !== '-' && row[11] !== '(Foto Terlampir)' ? row[11] : undefined,
      status: 'SELESAI',
    }));

    return { damageReports, loans, returns };
  },
};
