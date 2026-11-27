import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Smartphone, 
  Maximize2, 
  Minimize2,
  PieChart,
  CreditCard,
  TrendingUp,
  Receipt,
  UploadCloud,
  SlidersHorizontal,
  Download,
  Share2,
  Database
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenImport: () => void;
  onOpenBudgets: () => void;
  onOpenInstallModal: () => void;
  onOpenDataManagement?: () => void;
  overspendingCount: number;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeTab,
  onTabChange,
  onOpenImport,
  onOpenBudgets,
  onOpenInstallModal,
  onOpenDataManagement,
  overspendingCount,
}) => {
  const { isInstallable, isInstalled, isIOS, isMobileDevice, install } = usePWAInstall();
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [isRealMobileScreen, setIsRealMobileScreen] = useState<boolean>(false);

  useEffect(() => {
    const checkMobileScreen = () => {
      const isSmall = window.innerWidth < 640;
      setIsRealMobileScreen(isSmall);
      if (isSmall) {
        setIsPhoneFrame(false); // On real phone, render edge-to-edge
      }
    };
    checkMobileScreen();
    window.addEventListener('resize', checkMobileScreen);
    return () => window.removeEventListener('resize', checkMobileScreen);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'rds', label: 'RD Timelines', icon: TrendingUp },
    { id: 'emis', label: 'Loans & EMI', icon: CreditCard },
    { id: 'transactions', label: 'Passbook', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 transition-all duration-300">
      {/* Top Floating Control Bar for Previewers & Mobile Users */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 mb-1 sm:mb-2 bg-slate-900/80 backdrop-blur-md rounded-none sm:rounded-2xl border-b sm:border border-slate-800/80 shadow-lg text-xs sticky top-0 sm:static z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20 shrink-0">
            ₹
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              PaisaPulse
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PWA
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Install / Download Mobile App Button */}
          {!isInstalled && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all active:scale-95 shadow-sm shadow-emerald-500/20 text-xs border border-emerald-400/20 animate-pulse"
              title="Download & Install PaisaPulse on Mobile"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
              <span>Install App</span>
            </button>
          )}

          {/* Quick statement import button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all active:scale-95 text-xs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Clean Slate & Data Management */}
          {onOpenDataManagement && (
            <button
              onClick={onOpenDataManagement}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-all active:scale-95 text-xs"
              title="Start Fresh / Clear Demo Data"
            >
              <Database className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Clean Slate</span>
            </button>
          )}

          {/* Budget & alerts button */}
          <button
            onClick={onOpenBudgets}
            className="relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all active:scale-95 text-xs"
            title="Manage Categories & Budgets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Budgets</span>
            {overspendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {overspendingCount}
              </span>
            )}
          </button>

          {/* Toggle Phone Frame vs Expanded View (Only shown on Desktop/Tablet) */}
          {!isRealMobileScreen && (
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors text-xs"
              title={isPhoneFrame ? 'Expand to Full View' : 'Switch to Android Handheld Frame'}
            >
              {isPhoneFrame ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline text-[11px]">Full View</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden md:inline text-[11px]">Phone Frame</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Container: Android Handheld Frame on Desktop OR Edge-to-Edge on Mobile */}
      <main
        className={`w-full transition-all duration-300 ${
          isRealMobileScreen
            ? 'flex-1 max-w-full bg-slate-900 flex flex-col pb-0'
            : isPhoneFrame
            ? 'max-w-[440px] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] bg-slate-900 relative overflow-hidden flex flex-col min-h-[840px] max-h-[92vh]'
            : 'max-w-5xl rounded-3xl border border-slate-800 shadow-2xl bg-slate-900 flex flex-col min-h-[820px]'
        }`}
      >
        {/* Android Punch Hole & Speaker Notch (Only in desktop Phone Mode) */}
        {!isRealMobileScreen && isPhoneFrame && (
          <div className="absolute top-0 left-0 right-0 h-7 z-50 pointer-events-none flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 shadow-inner mt-1"></div>
          </div>
        )}

        {/* Android Status Bar (Only in desktop Phone Mode) */}
        {!isRealMobileScreen && isPhoneFrame && (
          <div className="w-full px-6 pt-2.5 pb-1 flex items-center justify-between text-xs text-slate-300 font-medium select-none z-40 bg-slate-900/90 backdrop-blur-sm">
            <span className="font-mono-num font-semibold text-xs tracking-tight text-slate-200">
              {currentTime}
            </span>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px] font-mono font-bold text-emerald-400/90">5G</span>
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono">92%</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 pb-24 space-y-4">
          {children}
        </div>

        {/* Android Bottom Navigation Bar (Persistent Thumb Zone) */}
        <nav className="sticky bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 sm:py-2">
          <div className="grid grid-cols-4 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 min-h-[48px] relative active:scale-95 ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${isActive ? 'font-bold text-emerald-400' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Android Home Navigation Gesture Bar Indicator */}
          {!isRealMobileScreen && isPhoneFrame && (
            <div className="w-32 h-1 bg-slate-700/80 rounded-full mx-auto mt-2 mb-0.5"></div>
          )}
        </nav>
      </main>
    </div>
  );
};
