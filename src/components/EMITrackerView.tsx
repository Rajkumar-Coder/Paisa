import React, { useState } from 'react';
import { 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ChevronRight, 
  AlertCircle,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { LoanEMI } from '../types/finance';

interface EMITrackerViewProps {
  emis: LoanEMI[];
  onMarkEMIPaid: (emiId: string) => void;
  onOpenAddLoan?: () => void;
  onEditLoan?: (loan: LoanEMI) => void;
}

export const EMITrackerView: React.FC<EMITrackerViewProps> = ({
  emis,
  onMarkEMIPaid,
  onOpenAddLoan,
  onEditLoan,
}) => {
  const [filterSettled, setFilterSettled] = useState<'active' | 'settled' | 'all'>('active');

  const activeEMIs = emis.filter(e => !e.isSettled);
  const settledEMIs = emis.filter(e => e.isSettled);

  const displayedEMIs = emis.filter(e => {
    if (filterSettled === 'active') return !e.isSettled;
    if (filterSettled === 'settled') return e.isSettled;
    return true;
  });

  const totalMonthlyEMIDebit = activeEMIs.reduce((acc, e) => acc + e.monthlyEMI, 0);
  const totalPrincipalRemaining = activeEMIs.reduce((acc, e) => {
    const remainingEMIs = Math.max(0, e.totalEMIs - e.paidEMIs);
    return acc + (remainingEMIs * e.monthlyEMI);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Loan & Device EMIs
          </h2>
          <p className="text-xs text-slate-400">
            Credit card installment plans, vehicle loans & debt support
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddLoan && (
            <button
              onClick={onOpenAddLoan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
              title="Add a new loan and specify repayment tenure in months"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Loan & Set Tenure</span>
            </button>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterSettled('active')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                filterSettled === 'active'
                  ? 'bg-purple-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({activeEMIs.length})
            </button>
            <button
              onClick={() => setFilterSettled('settled')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                filterSettled === 'settled'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Settled ({settledEMIs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">
            Active Monthly Commitment
          </span>
          <span className="text-xl font-bold font-mono-num text-purple-400 mt-1 block">
            ₹{totalMonthlyEMIDebit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Across {activeEMIs.length} active devices & loans
          </span>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">
            Remaining EMI Outflow
          </span>
          <span className="text-xl font-bold font-mono-num text-white mt-1 block">
            ₹{totalPrincipalRemaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Outstanding balance to close
          </span>
        </div>
      </div>

      {/* EMI Cards List */}
      <div className="space-y-3">
        {displayedEMIs.map((emi) => {
          const percent = Math.min(100, Math.round((emi.paidEMIs / emi.totalEMIs) * 100));
          const remainingEMIs = Math.max(0, emi.totalEMIs - emi.paidEMIs);

          return (
            <div
              key={emi.id}
              className={`p-4 rounded-3xl border transition-all ${
                emi.isSettled
                  ? 'bg-slate-900/60 border-slate-800/80 opacity-75'
                  : 'bg-slate-900 border-slate-800 shadow-md space-y-3'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      emi.isSettled
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{emi.title}</span>
                      {emi.isSettled && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Closed / Paid Off
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{emi.cardOrLender}</span>
                      <span>·</span>
                      <span className="font-mono-num font-semibold text-white">
                        ₹{emi.monthlyEMI.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold font-mono-num text-slate-300">
                    {emi.paidEMIs} / {emi.totalEMIs} EMIs
                  </span>
                  <div className="text-[10px] text-purple-400 font-mono">
                    {percent}% Completed
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      emi.isSettled ? 'bg-emerald-400' : 'bg-purple-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 font-mono-num">
                  <span>Tenure: {emi.startMonth} - {emi.endMonth}</span>
                  <span>{remainingEMIs === 0 ? 'Fully Paid' : `${remainingEMIs} EMIs Remaining`}</span>
                </div>
              </div>

              {/* Financial Spec Details (Principal, Interest, GST, Total) */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Actual Amount</span>
                  <span className="font-mono-num font-semibold text-white">
                    ₹{emi.actualAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Interest + GST</span>
                  <span className="font-mono-num font-semibold text-slate-300">
                    ₹{(emi.interestAmount + emi.gstAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Processing Fee</span>
                  <span className="font-mono-num font-semibold text-slate-300">
                    ₹{emi.processingFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Note and Quick Action */}
              <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                  {emi.notes || emi.borrowerOrItem}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onEditLoan && (
                    <button
                      onClick={() => onEditLoan(emi)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-[11px] transition-colors"
                      title="Adjust loan tenure, paid EMIs, or monthly amount"
                    >
                      <SlidersHorizontal className="w-3 h-3 text-purple-400" />
                      <span>Edit Tenure</span>
                    </button>
                  )}

                  {!emi.isSettled && (
                    <button
                      onClick={() => onMarkEMIPaid(emi.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-semibold text-[11px] transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pay EMI {emi.paidEMIs + 1}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
