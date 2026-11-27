import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, ArrowRight, Wallet, Calendar, Sparkles } from 'lucide-react';
import { MonthSalaryRecord } from '../types/finance';

interface MonthClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string; // YYYY-MM
  record: MonthSalaryRecord;
  onConfirmClose: (month: string, closingBalance: number, nextMonthSalary: number) => void;
  onReopenMonth?: (month: string) => void;
}

export const MonthClosureModal: React.FC<MonthClosureModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  record,
  onConfirmClose,
  onReopenMonth,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [nextSalaryInput, setNextSalaryInput] = useState(record.salary.toString());

  if (!isOpen) return null;

  // Format month name (e.g. "2026-03" -> "March 2026")
  const formatMonthName = (mStr: string) => {
    try {
      const [y, m] = mStr.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mStr;
    }
  };

  // Next month calculation
  const getNextMonth = (mStr: string) => {
    const [y, m] = mStr.split('-');
    const curY = parseInt(y);
    const curM = parseInt(m);
    const nextDate = new Date(curY, curM, 1); // curM is 1-indexed so Date(curY, curM, 1) advances 1 month
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  };

  const nextMonth = getNextMonth(currentMonth);

  const handleCloseMonth = () => {
    if (!confirmed) return;
    const salaryVal = parseFloat(nextSalaryInput) || record.salary;
    onConfirmClose(currentMonth, record.closingBalance, salaryVal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              record.isClosed
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {record.isClosed ? 'Month Already Closed' : `Close Month: ${formatMonthName(currentMonth)}`}
              </h2>
              <p className="text-xs text-slate-400">
                Confirm closing balance & rollover to {formatMonthName(nextMonth)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Summary Breakdown Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Previous Month Closing Rollover</span>
              <span className="font-mono-num font-semibold text-white">
                ₹{record.previousClosingBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <span>+ Monthly Salary Added</span>
              </span>
              <span className="font-mono-num font-semibold text-emerald-400">
                +₹{record.salary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-semibold text-slate-300">
              <span>= Start of Month Available Funds</span>
              <span className="font-mono-num font-bold text-white">
                ₹{record.startOfMonthAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>- Total Outflow Debited (Spends, RD, Loan, EMI)</span>
              <span className="font-mono-num font-semibold text-rose-400">
                -₹{record.actualDebits.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Final Closing Balance
                </span>
                <span className="text-[10px] text-slate-500">
                  Carried forward to {formatMonthName(nextMonth)}
                </span>
              </div>
              <span className={`font-mono-num text-base font-extrabold ${
                record.closingBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}>
                ₹{record.closingBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Rollover preview banner */}
          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-[11px] text-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                Next Month Rollover Rule
              </span>
              <span>
                {formatMonthName(nextMonth)} will open with <strong>₹{record.closingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> from this month, combined with the new salary for that month.
              </span>
            </div>
          </div>

          {/* Next month's salary input */}
          {!record.isClosed && (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Salary for {formatMonthName(nextMonth)} (₹)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  value={nextSalaryInput}
                  onChange={(e) => setNextSalaryInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">
                You can change this anytime in the new month.
              </span>
            </div>
          )}

          {/* Confirmation Checkbox */}
          {!record.isClosed ? (
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="confirmCloseMonth"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-900 cursor-pointer"
              />
              <label htmlFor="confirmCloseMonth" className="text-[11px] text-slate-300 cursor-pointer select-none">
                I have reviewed all debit card and credit card transactions for <strong>{formatMonthName(currentMonth)}</strong> and confirm closing this month to start <strong>{formatMonthName(nextMonth)}</strong>.
              </label>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>This month is marked closed</span>
              </div>
              <p className="text-[11px] text-amber-200/80 mt-1">
                You can reopen this month if you need to add or edit past transactions.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>

            {record.isClosed ? (
              <button
                type="button"
                onClick={() => {
                  if (onReopenMonth) onReopenMonth(currentMonth);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md"
              >
                Reopen Month
              </button>
            ) : (
              <button
                type="button"
                disabled={!confirmed}
                onClick={handleCloseMonth}
                className={`px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  confirmed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Start New Month</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
