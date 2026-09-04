import React, { useState, useEffect } from 'react';
import { ActiveTab, DamageReport, ItemLoan, ItemReturn, AppConfig, ActivityLog } from './types';
import { StorageService } from './services/storageService';
import { FirebaseService } from './services/firebaseService';
import { Header } from './components/Header';
import { QuickHome } from './components/QuickHome';
import { DamageReportForm } from './components/DamageReportForm';
import { LoanRequestForm } from './components/LoanRequestForm';
import { ReturnForm } from './components/ReturnForm';
import { HistoryView } from './components/HistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { DetailModal } from './components/DetailModal';
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

  const loadAllData = () => {
    const d = StorageService.getDamageReports();
    const l = StorageService.getLoans();
    const r = StorageService.getReturns();
    const c = StorageService.getConfig();

    setDamageReports(d);
    setLoans(l);
    setReturns(r);
    setActivities(StorageService.getRecentActivities(d, l, r));
    setConfig(c);
  };

  // Keep activities strictly synchronized whenever damageReports, loans, or returns change
  useEffect(() => {
    setActivities(StorageService.getRecentActivities(damageReports, loans, returns));
  }, [damageReports, loans, returns]);

  useEffect(() => {
    loadAllData();

    // Setup Realtime Firebase Firestore Subscriptions automatically
    let unsubDamage: (() => void) | null = null;
    let unsubLoans: (() => void) | null = null;
    let unsubReturns: (() => void) | null = null;

    if (FirebaseService.isConfigured()) {
      unsubDamage = FirebaseService.subscribeDamageReports((reports) => {
        if (reports) {
          setDamageReports(reports);
          StorageService.setDamageReports(reports);
        }
      });

      unsubLoans = FirebaseService.subscribeLoans((itemLoans) => {
        if (itemLoans) {
          setLoans(itemLoans);
          StorageService.setLoans(itemLoans);
        }
      });

      unsubReturns = FirebaseService.subscribeReturns((itemReturns) => {
        if (itemReturns) {
          setReturns(itemReturns);
          StorageService.setReturns(itemReturns);
        }
      });
    }

    return () => {
      if (unsubDamage) unsubDamage();
      if (unsubLoans) unsubLoans();
      if (unsubReturns) unsubReturns();
    };
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
      />

      {/* Main Content Area */}
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
            onSuccess={() => {
              loadAllData();
            }}
            onCancel={() => setActiveTab('beranda')}
          />
        )}

        {activeTab === 'peminjaman' && (
          <LoanRequestForm
            onSuccess={() => {
              loadAllData();
            }}
            onCancel={() => setActiveTab('beranda')}
          />
        )}

        {activeTab === 'pengembalian' && (
          <ReturnForm
            loans={loans}
            onSuccess={() => {
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
            onSelectDamage={(report) => setSelectedDetail({ type: 'kerusakan', data: report })}
            onSelectLoan={(loan) => setSelectedDetail({ type: 'peminjaman', data: loan })}
            onBackToHome={() => setActiveTab('beranda')}
          />
        )}
      </main>

      {/* Modal: Item Detail Inspection */}
      <DetailModal
        item={selectedDetail}
        onClose={() => setSelectedDetail(null)}
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
