import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { 
  INITIAL_TRANSACTIONS, 
  INITIAL_EMIS, 
  INITIAL_RDS, 
  INITIAL_CATEGORIES, 
  INITIAL_MONTH_SALARIES,
  DEFAULT_SALARY_SPLIT 
} from '../data/initialData';
import { Transaction, RecurringDeposit, LoanEMI, CategoryBudget, MonthSalaryRecord, SalarySplitCriteria } from '../types/finance';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionsCount: number;
  emisCount: number;
  rdsCount: number;
  onClearAllData: () => void;
  onRestoreSampleData: () => void;
  allAppData: {
    transactions: Transaction[];
    rds: RecurringDeposit[];
    emis: LoanEMI[];
    categories: CategoryBudget[];
    monthSalaries: Record<string, MonthSalaryRecord>;
    splitCriteria: SalarySplitCriteria;
  };
  onImportBackup: (data: any) => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  transactionsCount,
  emisCount,
  rdsCount,
  onClearAllData,
  onRestoreSampleData,
  allAppData,
  onImportBackup,
}) => {
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClear = () => {
    onClearAllData();
    setConfirmClear(false);
    setSuccessMessage('All sample transactions, EMIs, and RDs have been cleared! You now have a clean slate.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  const handleRestore = () => {
    onRestoreSampleData();
    setSuccessMessage('Sample demo data restored successfully.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allAppData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `PaisaPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportBackup(parsed);
        setSuccessMessage('Backup data successfully restored!');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1500);
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Data & Clean Slate</h2>
              <p className="text-xs text-slate-400">Manage sample data or wipe clean</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4">
          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current records summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-center">
            <div>
              <div className="text-[10px] text-slate-400">Transactions</div>
              <div className="text-sm font-bold text-white font-mono">{transactionsCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Active EMIs</div>
              <div className="text-sm font-bold text-white font-mono">{emisCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Active RDs</div>
              <div className="text-sm font-bold text-white font-mono">{rdsCount}</div>
            </div>
          </div>

          {/* Option 1: Clean Slate (Wipe Sample Data) */}
          {!confirmClear ? (
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <span>Start Fresh (Clear All Pre-filled Data)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Remove all sample transactions, sample EMIs, and sample RDs so you can start with a 100% clean account and import your own real bank/card statements.
              </p>
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Wipe Pre-filled Data & Start Fresh
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Are you sure? This will delete sample entries.</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your transactions, EMIs, and RDs will be set to zero so you can enter your own real accounts.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmClear(false)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                >
                  Yes, Clear Everything
                </button>
              </div>
            </div>
          )}

          {/* Option 2: Restore Sample Data if ever needed */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Sample Data</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Load demo transactions and loan entries to test features
              </p>
            </div>
            <button
              onClick={handleRestore}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-semibold transition"
            >
              Restore
            </button>
          </div>

          {/* Option 3: Backup & Restore */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleExportBackup}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Backup</span>
            </button>
            <label className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer text-center">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Data stored locally on your device</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
