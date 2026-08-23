import React, { useState, useEffect } from 'react';
import { ActiveTab, DamageReport, ItemLoan, ItemReturn, AppConfig, ActivityLog } from './types';
import { StorageService } from './services/storageService';
import { Header } from './components/Header';
import { QuickHome } from './components/QuickHome';
import { DamageReportForm } from './components/DamageReportForm';
import { LoanRequestForm } from './components/LoanRequestForm';
import { ReturnForm } from './components/ReturnForm';
import { HistoryView } from './components/HistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { DetailModal } from './components/DetailModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SchoolLogo } from './components/SchoolLogo';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('beranda');

  // Core Data state
  const [config, setConfig] = useState<AppConfig>(StorageService.getConfig());
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [loans, setLoans] = useState<ItemLoan[]>([]);
  const [returns, setReturns] = useState<ItemReturn[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Modals state
  const [selectedDetail, setSelectedDetail] = useState<{
    type: 'kerusakan' | 'peminjaman' | 'pengembalian';
    data: DamageReport | ItemLoan | ItemReturn;
  } | null>(null);
  
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  const loadAllData = () => {
    const d = StorageService.getDamageReports();
    const l = StorageService.getLoans();
    const r = StorageService.getReturns();
    const a = StorageService.getRecentActivities();
    const c = StorageService.getConfig();

    setDamageReports(d);
    setLoans(l);
    setReturns(r);
    setActivities(a);
    setConfig(c);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleActivitySelect = (act: ActivityLog) => {
    if (act.type === 'kerusakan') {
      const item = damageReports.find((d) => d.id === act.refId);
      if (item) setSelectedDetail({ type: 'kerusakan', data: item });
    } else if (act.type === 'peminjaman') {
      const item = loans.find((l) => l.id === act.refId);
      if (item) setSelectedDetail({ type: 'peminjaman', data: item });
    } else if (act.type === 'pengembalian') {
      const item = returns.find((r) => r.id === act.refId);
      if (item) setSelectedDetail({ type: 'pengembalian', data: item });
    }
  };

  const handleResetDemoData = () => {
    StorageService.resetToInitialData();
    loadAllData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        onOpenConfig={() => setIsSheetsModalOpen(true)}
      />

      {/* Main Content Area (Mobile-First Responsive Reflow) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'beranda' && (
          <QuickHome
            setActiveTab={setActiveTab}
            damageReports={damageReports}
            loans={loans}
            returns={returns}
            activities={activities}
            onSelectActivity={handleActivitySelect}
          />
        )}

        {activeTab === 'kerusakan' && (
          <DamageReportForm
            onSuccess={(newReport) => {
              loadAllData();
            }}
            onCancel={() => setActiveTab('beranda')}
          />
        )}

        {activeTab === 'peminjaman' && (
          <LoanRequestForm
            onSuccess={(newLoan) => {
              loadAllData();
            }}
            onCancel={() => setActiveTab('beranda')}
          />
        )}

        {activeTab === 'pengembalian' && (
          <ReturnForm
            loans={loans}
            onSuccess={(newReturn) => {
              loadAllData();
            }}
            onCancel={() => setActiveTab('beranda')}
          />
        )}

        {activeTab === 'riwayat' && (
          <HistoryView
            damageReports={damageReports}
            loans={loans}
            returns={returns}
            onSelectDamage={(report) => setSelectedDetail({ type: 'kerusakan', data: report })}
            onSelectLoan={(loan) => setSelectedDetail({ type: 'peminjaman', data: loan })}
            onSelectReturn={(ret) => setSelectedDetail({ type: 'pengembalian', data: ret })}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            damageReports={damageReports}
            loans={loans}
            returns={returns}
            config={config}
            onRefreshData={loadAllData}
            onOpenConfigModal={() => setIsSheetsModalOpen(true)}
            onSelectDamage={(report) => setSelectedDetail({ type: 'kerusakan', data: report })}
            onSelectLoan={(loan) => setSelectedDetail({ type: 'peminjaman', data: loan })}
          />
        )}
      </main>

      {/* Modal: Item Detail Inspection */}
      <DetailModal
        item={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />

      {/* Modal: Google Sheets Setup & Webhook Configuration */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={config}
        damageReports={damageReports}
        loans={loans}
        returns={returns}
        onSaveConfig={(updated) => setConfig(updated)}
        onRefreshAllData={loadAllData}
        onResetDemoData={handleResetDemoData}
      />

      {/* Footer */}
      <footer className="no-print bg-slate-900 text-slate-400 text-xs py-4 px-4 border-t border-slate-800 text-center mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/10 p-0.5 flex items-center justify-center">
              <SchoolLogo className="w-full h-full" />
            </div>
            <p className="font-semibold text-slate-200">
              SIMPEL SARPRAS • SMA Negeri 1 Tejakula
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-medium border border-slate-700">
              Dibuat oleh : <strong className="text-white font-bold">Gede Hari Wijaya, S.Pd. Gr.</strong>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
