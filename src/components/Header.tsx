import React from 'react';
import { ActiveTab, AppConfig } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { Home, Wrench, Package, RotateCcw, ClipboardList, Shield, Flame } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  config: AppConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    { id: 'beranda' as ActiveTab, label: 'Beranda', icon: Home },
    { id: 'kerusakan' as ActiveTab, label: 'Lapor Kerusakan', icon: Wrench },
    { id: 'peminjaman' as ActiveTab, label: 'Peminjaman', icon: Package },
    { id: 'pengembalian' as ActiveTab, label: 'Pengembalian', icon: RotateCcw },
    { id: 'riwayat' as ActiveTab, label: 'Riwayat & Unduh', icon: ClipboardList },
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

          {/* Right Header: Realtime Firebase Status Badge */}
          <div className="flex items-center space-x-2">
            <div
              id="header-firebase-status"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-amber-950/80 text-amber-200 border border-amber-500/60 shadow-md select-none"
              title="Database Cloud Firebase Firestore Realtime Aktif"
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="inline font-bold">
                Firebase Realtime
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
            </div>
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

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 py-1.5 px-3 z-50 shadow-2xl">
        <div className="grid grid-cols-6 gap-1 max-w-lg mx-auto">
          {navItems.map((item) => {
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
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-full font-medium">
                  {item.id === 'kerusakan' ? 'Kerusakan' : item.id === 'peminjaman' ? 'Pinjam' : item.id === 'pengembalian' ? 'Kembali' : item.id === 'riwayat' ? 'Unduh' : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
