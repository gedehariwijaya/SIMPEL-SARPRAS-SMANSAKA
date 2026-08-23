import React from 'react';
import { ActiveTab, AppConfig } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { Home, Wrench, Package, RotateCcw, ClipboardList, Shield, Sheet, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: AppConfig;
  onOpenConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  onOpenConfig,
}) => {
  const isSheetsConnected = !!config.appsScriptWebhookUrl;

  const navItems = [
    { id: 'beranda' as ActiveTab, label: 'Beranda', icon: Home },
    { id: 'kerusakan' as ActiveTab, label: 'Lapor Kerusakan', icon: Wrench },
    { id: 'peminjaman' as ActiveTab, label: 'Peminjaman', icon: Package },
    { id: 'pengembalian' as ActiveTab, label: 'Pengembalian', icon: RotateCcw },
    { id: 'riwayat' as ActiveTab, label: 'Riwayat', icon: ClipboardList },
    { id: 'admin' as ActiveTab, label: 'Admin Sarpras', icon: Shield },
  ];

  return (
    <header className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 text-white shadow-lg sticky top-0 z-40 border-b border-indigo-800/40">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo & School Identity */}
          <div 
            id="header-brand"
            onClick={() => setActiveTab('beranda')}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/10 p-1 border border-indigo-400/40 flex items-center justify-center shadow-md shadow-indigo-950/40 group-hover:scale-105 transition-transform">
              <SchoolLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-base md:text-lg tracking-tight leading-tight text-white">
                  SIMPEL SARPRAS
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold bg-indigo-500/30 rounded-full border border-indigo-400/40 text-indigo-200">
                  SMAN 1 Tejakula
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-indigo-200/90 font-medium tracking-wide">
                Pelaporan Kerusakan • Peminjaman • Pengembalian
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Google Sheets Connection Pill */}
            <button
              id="btn-sheets-indicator"
              onClick={onOpenConfig}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
                isSheetsConnected
                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-800/60'
                  : 'bg-indigo-950/80 text-indigo-200 border border-indigo-700/60 hover:bg-indigo-900/80'
              }`}
              title="Status Integrasi Google Sheets"
            >
              <Sheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isSheetsConnected ? 'Sheets Terhubung' : 'Google Sheets'}
              </span>
              {isSheetsConnected ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
              )}
            </button>

            {/* Quick Sheets External Link */}
            {config.googleSpreadsheetUrl && (
              <a
                id="link-open-spreadsheet"
                href={config.googleSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center space-x-1 px-3 py-1.5 bg-indigo-800/60 hover:bg-indigo-700/70 text-indigo-100 rounded-xl text-xs font-semibold border border-indigo-500/40 transition-colors shadow-xs"
                title="Buka Spreadsheet di Google Drive"
              >
                <span>📊 Buka Sheet</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block bg-indigo-950/95 border-t border-indigo-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1.5 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/50 ring-1 ring-white/20'
                      : 'text-indigo-200 hover:text-white hover:bg-indigo-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Fixed for super convenient one-thumb reach) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 py-1.5 px-3 z-50 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-2xl transition-all ${
                  isActive
                    ? 'text-indigo-400 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isActive ? 'bg-indigo-600/30 text-indigo-300 shadow-inner' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full font-medium">
                  {item.id === 'kerusakan' ? 'Kerusakan' : item.id === 'peminjaman' ? 'Pinjam' : item.id === 'pengembalian' ? 'Kembali' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
