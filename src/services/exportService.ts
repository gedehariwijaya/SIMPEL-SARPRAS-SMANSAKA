import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { DamageReport, ItemLoan, ItemReturn } from '../types';

export const ExportService = {
  /**
   * Export all or filtered data to an Excel (.xlsx) file with styled worksheets
   */
  exportToExcel(
    damageReports: DamageReport[],
    loans: ItemLoan[],
    returns: ItemReturn[],
    schoolName = 'SMA Negeri 1 Tejakula'
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Laporan Kerusakan
    const damageData = damageReports.map((d, index) => ({
      No: index + 1,
      'ID Laporan': d.id,
      'Tanggal Lapor': d.tanggalLapor,
      'Nama Pelapor': d.namaPelapor,
      'Status Pelapor': d.statusPelapor,
      Kontak: d.kontak,
      Lokasi: d.lokasi,
      'Detail Lokasi': d.detailLokasi,
      'Nama Sarana / Fasilitas': d.namaSarana,
      'Jenis Kerusakan': d.jenisKerusakan,
      'Deskripsi Kerusakan': d.deskripsi,
      'Status Perbaikan': d.status,
      'Catatan Petugas': d.catatanPetugas || '-',
      'Tanggal Selesai': d.tanggalSelesai || '-',
    }));

    const wsDamage = XLSX.utils.json_to_sheet(damageData);
    XLSX.utils.book_append_sheet(wb, wsDamage, 'Laporan Kerusakan');

    // 2. Sheet Peminjaman Sarana
    const loanData = loans.map((l, index) => ({
      No: index + 1,
      'ID Peminjaman': l.id,
      'Tanggal Pinjam': l.tanggalPinjam,
      'Nama Peminjam': l.namaPeminjam,
      'Status Peminjam': l.statusPeminjam,
      'Kelas / Unit Kerja': l.kelasUnit,
      Kontak: l.kontak,
      'Nama Barang / Sarana': l.namaBarang,
      Jumlah: l.jumlah,
      Waktu: l.waktu,
      'Rencana Kembali': l.tanggalRencanaKembali,
      Keperluan: l.keperluan,
      Catatan: l.catatan || '-',
      'Status Peminjaman': l.status,
      'Disetujui Oleh': l.persetujuanOleh || '-',
      'Tanggal Disetujui': l.tanggalDisetujui || '-',
    }));

    const wsLoan = XLSX.utils.json_to_sheet(loanData);
    XLSX.utils.book_append_sheet(wb, wsLoan, 'Peminjaman Sarana');

    // 3. Sheet Pengembalian Sarana
    const returnData = returns.map((r, index) => ({
      No: index + 1,
      'ID Pengembalian': r.id,
      'ID Peminjaman Ref': r.idPeminjaman || '-',
      'Tanggal Pengembalian': r.tanggalPengembalian,
      'Nama Peminjam': r.namaPeminjam,
      'Nama Barang': r.namaBarang,
      Jumlah: r.jumlah,
      'Tanggal Pinjam': r.tanggalPinjam,
      'Kondisi Barang': r.kondisiBarang,
      'Catatan Pengembalian': r.catatan || '-',
      'Petugas Penerima': r.penerimaPetugas || '-',
      Status: r.status,
    }));

    const wsReturn = XLSX.utils.json_to_sheet(returnData);
    XLSX.utils.book_append_sheet(wb, wsReturn, 'Pengembalian Sarana');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Laporan_SIMPEL_SARPRAS_${schoolName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
  },

  /**
   * Export single category to Excel (.xlsx)
   */
  exportCategoryToExcel(
    category: 'kerusakan' | 'peminjaman' | 'pengembalian',
    data: DamageReport[] | ItemLoan[] | ItemReturn[],
    schoolName = 'SMA Negeri 1 Tejakula'
  ) {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().slice(0, 10);

    if (category === 'kerusakan') {
      const rows = (data as DamageReport[]).map((d, i) => ({
        No: i + 1,
        'ID Laporan': d.id,
        'Tanggal Lapor': d.tanggalLapor,
        'Nama Pelapor': d.namaPelapor,
        'Status Pelapor': d.statusPelapor,
        Kontak: d.kontak,
        Lokasi: d.lokasi,
        'Detail Lokasi': d.detailLokasi,
        'Nama Sarana': d.namaSarana,
        'Jenis Kerusakan': d.jenisKerusakan,
        Deskripsi: d.deskripsi,
        Status: d.status,
        'Catatan Petugas': d.catatanPetugas || '-',
        'Tanggal Selesai': d.tanggalSelesai || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Kerusakan');
      XLSX.writeFile(wb, `Laporan_Kerusakan_${schoolName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
    } else if (category === 'peminjaman') {
      const rows = (data as ItemLoan[]).map((l, i) => ({
        No: i + 1,
        'ID Peminjaman': l.id,
        'Tanggal Pinjam': l.tanggalPinjam,
        'Nama Peminjam': l.namaPeminjam,
        'Status Peminjam': l.statusPeminjam,
        'Kelas / Unit': l.kelasUnit,
        Kontak: l.kontak,
        'Nama Barang': l.namaBarang,
        Jumlah: l.jumlah,
        Waktu: l.waktu,
        'Rencana Kembali': l.tanggalRencanaKembali,
        Keperluan: l.keperluan,
        Status: l.status,
        'Disetujui Oleh': l.persetujuanOleh || '-',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Peminjaman');
      XLSX.writeFile(wb, `Laporan_Peminjaman_${schoolName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
    } else {
      const rows = (data as ItemReturn[]).map((r, i) => ({
        No: i + 1,
        'ID Pengembalian': r.id,
        'ID Pinjam Ref': r.idPeminjaman,
        'Tanggal Kembali': r.tanggalPengembalian,
        'Nama Peminjam': r.namaPeminjam,
        'Nama Barang': r.namaBarang,
        Jumlah: r.jumlah,
        'Kondisi Barang': r.kondisiBarang,
        Catatan: r.catatan || '-',
        'Petugas Penerima': r.penerimaPetugas || '-',
        Status: r.status,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Pengembalian');
      XLSX.writeFile(wb, `Laporan_Pengembalian_${schoolName.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
    }
  },

  /**
   * Export formal Official PDF Document with Letterhead / Kop Sekolah
   */
  exportToPDF(
    category: 'semua' | 'kerusakan' | 'peminjaman' | 'pengembalian',
    damageReports: DamageReport[],
    loans: ItemLoan[],
    returns: ItemReturn[],
    schoolName = 'SMA Negeri 1 Tejakula'
  ) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Helper header
    const addHeader = (title: string) => {
      // Top Bar Accent
      doc.setFillColor(30, 27, 75); // Dark Indigo
      doc.rect(0, 0, 297, 6, 'F');

      // School Identity
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 27, 75);
      doc.text(`PEMERINTAH PROVINSI BALI - DINAS PENDIDIKAN`, 148.5, 14, { align: 'center' });
      doc.setFontSize(16);
      doc.text(schoolName.toUpperCase(), 148.5, 21, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Sistem Informasi Manajemen Pelayanan Sarana & Prasarana (SIMPEL SARPRAS)',
        148.5,
        26,
        { align: 'center' }
      );

      // Line separator
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(14, 29, 283, 29);

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(title.toUpperCase(), 14, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${formattedDate} | Database Realtime Firebase`, 283, 36, {
        align: 'right',
      });
    };

    const addSignature = (finalY: number) => {
      const pageHeight = doc.internal.pageSize.height;
      let sigY = finalY + 12;
      if (sigY + 35 > pageHeight) {
        doc.addPage();
        sigY = 20;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      const xPos = 220;
      doc.text(`Tejakula, ${formattedDate}`, xPos, sigY);
      doc.text('Wakil Kepala Sekolah Bidang Sarpras,', xPos, sigY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text('(..................................................)', xPos, sigY + 26);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('NIP. .............................................', xPos, sigY + 30);
    };

    if (category === 'kerusakan' || category === 'semua') {
      addHeader('LAPORAN KERUSAKAN FASILITAS & SARANA PRASARANA');

      const headers = [
        ['No', 'ID Lapor', 'Tanggal', 'Pelapor', 'Lokasi & Sarana', 'Jenis Kerusakan', 'Deskripsi', 'Status', 'Catatan Petugas'],
      ];

      const rows = damageReports.map((d, index) => [
        index + 1,
        d.id,
        d.tanggalLapor,
        `${d.namaPelapor}\n(${d.statusPelapor})`,
        `${d.lokasi}\n${d.detailLokasi}\n[${d.namaSarana}]`,
        d.jenisKerusakan,
        d.deskripsi,
        d.status,
        d.catatanPetugas || '-',
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [225, 29, 72], // Rose 600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [255, 241, 242], // Rose 50
        },
        margin: { left: 14, right: 14 },
      });

      if (category === 'kerusakan') {
        const finalY = (doc as any).lastAutoTable?.finalY || 40;
        addSignature(finalY);
      }
    }

    if (category === 'peminjaman' || (category === 'semua' && damageReports.length > 0)) {
      if (category === 'semua') {
        doc.addPage();
      }

      addHeader('DAFTAR REKAPITULASI PEMINJAMAN SARANA PRASARANA');

      const headers = [
        ['No', 'ID Pinjam', 'Tgl Pinjam', 'Peminjam & Unit', 'Barang & Jml', 'Waktu / Keperluan', 'Rencana Kembali', 'Status', 'Persetujuan'],
      ];

      const rows = loans.map((l, index) => [
        index + 1,
        l.id,
        l.tanggalPinjam,
        `${l.namaPeminjam}\n(${l.statusPeminjam} - ${l.kelasUnit})`,
        `${l.namaBarang}\n(${l.jumlah})`,
        `${l.waktu}\n${l.keperluan}`,
        l.tanggalRencanaKembali,
        l.status,
        l.persetujuanOleh ? `${l.persetujuanOleh}\n(${l.tanggalDisetujui || '-'})` : '-',
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229], // Indigo 600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [238, 242, 255], // Indigo 50
        },
        margin: { left: 14, right: 14 },
      });

      if (category === 'peminjaman') {
        const finalY = (doc as any).lastAutoTable?.finalY || 40;
        addSignature(finalY);
      }
    }

    if (category === 'pengembalian' || (category === 'semua' && loans.length > 0)) {
      if (category === 'semua') {
        doc.addPage();
      }

      addHeader('DAFTAR REKAPITULASI PENGEMBALIAN SARANA PRASARANA');

      const headers = [
        ['No', 'ID Kembali', 'ID Ref Pinjam', 'Tgl Kembali', 'Peminjam', 'Barang & Jml', 'Kondisi Barang', 'Catatan', 'Penerima'],
      ];

      const rows = returns.map((r, index) => [
        index + 1,
        r.id,
        r.idPeminjaman,
        r.tanggalPengembalian,
        r.namaPeminjam,
        `${r.namaBarang} (${r.jumlah})`,
        r.kondisiBarang,
        r.catatan || '-',
        r.penerimaPetugas || 'Petugas Sarpras',
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 40,
        theme: 'striped',
        headStyles: {
          fillColor: [5, 150, 105], // Emerald 600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [236, 253, 245], // Emerald 50
        },
        margin: { left: 14, right: 14 },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 40;
      addSignature(finalY);
    }

    const dateStr = now.toISOString().slice(0, 10);
    doc.save(`Laporan_SIMPEL_SARPRAS_${category.toUpperCase()}_${dateStr}.pdf`);
  },
};
