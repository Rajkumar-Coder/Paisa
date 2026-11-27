import React, { useState } from 'react';
import { X, Calendar, Clock, Calculator, CreditCard, Building2, CheckCircle2 } from 'lucide-react';
import { LoanEMI } from '../types/finance';

interface EditLoanTenureModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanEMI | null;
  onUpdateLoan: (updatedLoan: LoanEMI) => void;
}

export const EditLoanTenureModal: React.FC<EditLoanTenureModalProps> = ({
  isOpen,
  onClose,
  loan,
  onUpdateLoan,
}) => {
  if (!isOpen || !loan) return null;

  const [tenure, setTenure] = useState(loan.totalEMIs.toString());
  const [paidEMIs, setPaidEMIs] = useState(loan.paidEMIs.toString());
  const [monthlyEMI, setMonthlyEMI] = useState(loan.monthlyEMI.toString());
  const [startMonth, setStartMonth] = useState(loan.startMonth);
  const [actualAmount, setActualAmount] = useState(loan.actualAmount.toString());

  const TENURE_PRESETS = [3, 6, 9, 12, 18, 24, 30, 36, 48, 60];

  const handleApplyPreset = (months: number) => {
    setTenure(months.toString());
    const principal = parseFloat(actualAmount) || loan.actualAmount;
    if (principal > 0) {
      setMonthlyEMI((principal / months).toFixed(2));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newTenure = parseInt(tenure, 10);
    const newPaid = parseInt(paidEMIs, 10);
    const newEMI = parseFloat(monthlyEMI);
    const newAmt = parseFloat(actualAmount);

    if (isNaN(newTenure) || newTenure <= 0 || isNaN(newPaid) || newPaid < 0 || isNaN(newEMI) || newEMI <= 0) {
      return;
    }

    // Compute updated end month
    const startParts = startMonth.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let mIdx = monthNames.indexOf(startParts[0]);
    let yr = parseInt(startParts[1] || '2026', 10);
    if (mIdx === -1) mIdx = 3;

    const endTotalMonths = mIdx + newTenure - 1;
    const endMIdx = endTotalMonths % 12;
    const endYr = yr + Math.floor(endTotalMonths / 12);
    const endMonthStr = `${monthNames[endMIdx]} ${endYr}`;

    const isSettled = newPaid >= newTenure;

    onUpdateLoan({
      ...loan,
      totalEMIs: newTenure,
      paidEMIs: Math.min(newPaid, newTenure),
      monthlyEMI: newEMI,
      actualAmount: newAmt || loan.actualAmount,
      principalAmount: newAmt || loan.principalAmount,
      startMonth,
      endMonth: endMonthStr,
      isSettled,
    });

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
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Update Loan Tenure & EMIs
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[230px]">
                {loan.title}
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
          {/* Quick Tenure Presets */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <label className="text-[11px] font-bold text-slate-300 block">
              Quick Tenure Presets (Months)
            </label>
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {TENURE_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleApplyPreset(m)}
                  className={`py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                    tenure === m.toString()
                      ? 'bg-purple-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Tenure and Paid EMIs Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-purple-400 block mb-1">
                Total Tenure (Months) *
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-xl text-white font-mono text-sm font-bold focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                EMIs Paid So Far
              </label>
              <input
                type="number"
                min="0"
                max={tenure}
                value={paidEMIs}
                onChange={(e) => setPaidEMIs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-400"
                required
              />
            </div>
          </div>

          {/* Monthly EMI & Loan Principal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Monthly EMI (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={monthlyEMI}
                onChange={(e) => setMonthlyEMI(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Principal Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Start Month (e.g. Aug 2026)
            </label>
            <input
              type="text"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Timeline Summary Box */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Remaining EMIs:</span>
              <span className="font-mono-num font-bold text-white">
                {Math.max(0, parseInt(tenure, 10) - parseInt(paidEMIs, 10))} months remaining
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Remaining Outflow:</span>
              <span className="font-mono-num font-bold text-purple-300">
                ₹{(Math.max(0, parseInt(tenure, 10) - parseInt(paidEMIs, 10)) * (parseFloat(monthlyEMI) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Actions */}
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
              className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all shadow-md shadow-purple-500/20"
            >
              Save Tenure Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
