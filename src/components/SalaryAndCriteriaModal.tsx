import React, { useState } from 'react';
import { X, Wallet, Percent, CheckCircle2, AlertCircle, RotateCcw, PieChart, Sparkles } from 'lucide-react';
import { SalarySplitCriteria, MonthSalaryRecord } from '../types/finance';
import { DEFAULT_SALARY_SPLIT } from '../data/initialData';

interface SalaryAndCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  record: MonthSalaryRecord;
  onUpdateSalary: (month: string, newSalary: number) => void;
  splitCriteria: SalarySplitCriteria;
  onUpdateCriteria: (newCriteria: SalarySplitCriteria) => void;
}

export const SalaryAndCriteriaModal: React.FC<SalaryAndCriteriaModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  record,
  onUpdateSalary,
  splitCriteria,
  onUpdateCriteria,
}) => {
  const [salaryInput, setSalaryInput] = useState(record.salary.toString());
  const [basicPct, setBasicPct] = useState(splitCriteria.basicPct);
  const [investmentPct, setInvestmentPct] = useState(splitCriteria.investmentPct);
  const [loanEmiPct, setLoanEmiPct] = useState(splitCriteria.loanEmiPct);
  const [entertainmentPct, setEntertainmentPct] = useState(splitCriteria.entertainmentPct);
  const [additionalPct, setAdditionalPct] = useState(splitCriteria.additionalPct);

  if (!isOpen) return null;

  const totalPct = basicPct + investmentPct + loanEmiPct + entertainmentPct + additionalPct;
  const is100Pct = totalPct === 100;

  const salaryNum = parseFloat(salaryInput) || 0;
  const startOfMonthTotal = salaryNum + record.previousClosingBalance;

  const handleReset = () => {
    setBasicPct(DEFAULT_SALARY_SPLIT.basicPct);
    setInvestmentPct(DEFAULT_SALARY_SPLIT.investmentPct);
    setLoanEmiPct(DEFAULT_SALARY_SPLIT.loanEmiPct);
    setEntertainmentPct(DEFAULT_SALARY_SPLIT.entertainmentPct);
    setAdditionalPct(DEFAULT_SALARY_SPLIT.additionalPct);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!is100Pct || salaryNum <= 0) return;

    onUpdateSalary(currentMonth, salaryNum);
    onUpdateCriteria({
      basicPct,
      investmentPct,
      loanEmiPct,
      entertainmentPct,
      additionalPct,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Salary & 5-Criteria Split
              </h2>
              <p className="text-xs text-slate-400">
                Configure monthly take-home & percentage allocation rules
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
        <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Monthly Salary Input */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monthly Take-Home Salary (₹)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono-num">
                Active Month: {currentMonth}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="1"
                placeholder="e.g. 125608"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Live calculation banner */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>+ Previous Month Closing Rollover:</span>
                <span className="font-mono-num text-white">₹{record.previousClosingBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-300 pt-1 border-t border-slate-800">
                <span>= Start of Month Combined Funds:</span>
                <span className="font-mono-num font-bold">₹{startOfMonthTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Section 2: 5-Criteria Percentage Split Configuration */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Salary Split Criteria (Must equal 100%)</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Defines spending limits for Debit, Credit & Combined
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/80 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset (40/10/20/10/20)</span>
              </button>
            </div>

            {/* Sliders / Inputs */}
            <div className="space-y-2.5">
              {/* 1. Basic (40%) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-200 block">
                    1. Basic & Bills
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Rent, electricity, maintenance, groceries, WiFi
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={basicPct}
                    onChange={(e) => setBasicPct(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                  <span className="text-[10px] text-slate-400 font-mono-num w-20 text-right">
                    ₹{Math.round((salaryNum * basicPct) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 2. Investment (10%) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-emerald-400 block">
                    2. Investment
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Devi RD, Raj-family RD, UTI Nifty 50 SIP, Gold
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={investmentPct}
                    onChange={(e) => setInvestmentPct(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                  <span className="text-[10px] text-slate-400 font-mono-num w-20 text-right">
                    ₹{Math.round((salaryNum * investmentPct) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 3. Loans + EMI (20%) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-purple-400 block">
                    3. Loans + EMI
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Device EMIs (Scooty, AC, TV) & personal loans
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={loanEmiPct}
                    onChange={(e) => setLoanEmiPct(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-purple-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                  <span className="text-[10px] text-slate-400 font-mono-num w-20 text-right">
                    ₹{Math.round((salaryNum * loanEmiPct) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 4. Entertainment (10%) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-pink-400 block">
                    4. Entertainment
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Dining out, movies, YouTube/Netflix subscriptions
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={entertainmentPct}
                    onChange={(e) => setEntertainmentPct(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-pink-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                  <span className="text-[10px] text-slate-400 font-mono-num w-20 text-right">
                    ₹{Math.round((salaryNum * entertainmentPct) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* 5. Additional / Unplanned (20%) */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-semibold text-amber-400 block">
                    5. Additional (Unplanned)
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Tags: function, car service, medical, emergency
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={additionalPct}
                    onChange={(e) => setAdditionalPct(parseInt(e.target.value) || 0)}
                    className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-300 font-mono text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                  <span className="text-[10px] text-slate-400 font-mono-num w-20 text-right">
                    ₹{Math.round((salaryNum * additionalPct) / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Check Status */}
            <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold border ${
              is100Pct
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-1.5">
                {is100Pct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>Total Ratio: {totalPct}% / 100%</span>
              </div>
              <span>
                {is100Pct ? 'Perfect 100% Split' : totalPct < 100 ? `Need ${100 - totalPct}% more` : `Exceeds by ${totalPct - 100}%`}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!is100Pct || salaryNum <= 0}
              className={`px-5 py-2 rounded-xl font-bold transition-all ${
                is100Pct && salaryNum > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Save Salary & Criteria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
