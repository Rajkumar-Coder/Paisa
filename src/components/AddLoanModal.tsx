import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CreditCard, Building2, Calculator, Calendar, Info } from 'lucide-react';
import { LoanEMI } from '../types/finance';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan: (newLoan: LoanEMI) => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onAddLoan,
}) => {
  const [title, setTitle] = useState('');
  const [borrowerOrItem, setBorrowerOrItem] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [tenureMonths, setTenureMonths] = useState('12');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [isManualEMI, setIsManualEMI] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'credit_card' | 'debit_card'>('debit_card');
  const [cardOrLender, setCardOrLender] = useState('');
  const [startMonth, setStartMonth] = useState('Apr 2026');
  const [interestAmount, setInterestAmount] = useState('0');
  const [gstAmount, setGstAmount] = useState('0');
  const [processingFee, setProcessingFee] = useState('0');
  const [notes, setNotes] = useState('');

  // Auto-calculate approximate EMI if not manually entered
  useEffect(() => {
    if (!isManualEMI && actualAmount && tenureMonths) {
      const p = parseFloat(actualAmount);
      const n = parseInt(tenureMonths, 10);
      if (!isNaN(p) && !isNaN(n) && n > 0) {
        const estEMI = (p / n).toFixed(2);
        setMonthlyEMI(estEMI);
      }
    }
  }, [actualAmount, tenureMonths, isManualEMI]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(actualAmount);
    const tenure = parseInt(tenureMonths, 10);
    const emi = parseFloat(monthlyEMI);

    if (!title.trim() || isNaN(principal) || principal <= 0 || isNaN(tenure) || tenure <= 0 || isNaN(emi) || emi <= 0) {
      return;
    }

    // Calculate end month string
    const startParts = startMonth.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let mIdx = monthNames.indexOf(startParts[0]);
    let yr = parseInt(startParts[1] || '2026', 10);
    if (mIdx === -1) mIdx = 3; // Apr default

    const endTotalMonths = mIdx + tenure - 1;
    const endMIdx = endTotalMonths % 12;
    const endYr = yr + Math.floor(endTotalMonths / 12);
    const endMonthStr = `${monthNames[endMIdx]} ${endYr}`;

    const newLoan: LoanEMI = {
      id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      borrowerOrItem: borrowerOrItem.trim() || title.trim(),
      actualAmount: principal,
      monthlyEMI: emi,
      totalEMIs: tenure,
      paidEMIs: 0,
      startMonth: startMonth.trim(),
      endMonth: endMonthStr,
      principalAmount: principal,
      interestAmount: parseFloat(interestAmount) || 0,
      gstAmount: parseFloat(gstAmount) || 0,
      processingFee: parseFloat(processingFee) || 0,
      paymentMode,
      cardOrLender: cardOrLender.trim() || (paymentMode === 'credit_card' ? 'HDFC / ICICI Credit Card' : 'Direct Bank Auto Debit'),
      isSettled: false,
      notes: notes.trim() || undefined,
    };

    onAddLoan(newLoan);
    onClose();

    // Reset form
    setTitle('');
    setBorrowerOrItem('');
    setActualAmount('');
    setTenureMonths('12');
    setMonthlyEMI('');
    setIsManualEMI(false);
    setCardOrLender('');
    setNotes('');
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
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Add Loan & EMI Details
              </h2>
              <p className="text-xs text-slate-400">
                Enter loan amount, tenure months, and repayment schedule
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Payment Type Switch */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Loan Type & Payment Mode *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('debit_card')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'debit_card'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <Building2 className="w-4 h-4 text-rose-400" />
                Personal / Bank Loan
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('credit_card')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'credit_card'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-400" />
                Card / Device EMI
              </button>
            </div>
          </div>

          {/* Title and Borrower/Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Loan / EMI Title *
              </label>
              <input
                type="text"
                placeholder="e.g. TVS Scooty, Kalai Loan, Home AC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Borrower / Item Description
              </label>
              <input
                type="text"
                placeholder="e.g. Vehicle, Family Emergency, Gadget"
                value={borrowerOrItem}
                onChange={(e) => setBorrowerOrItem(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Core Fields: Amount and Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-rose-400 block mb-1">
                Total Loan Amount (Principal ₹) *
              </label>
              <input
                type="number"
                step="1"
                placeholder="e.g. 50000"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500 font-bold"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-rose-400">
                  Tenure (Repayment Duration) *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {tenureMonths} months
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="360"
                placeholder="e.g. 6, 12, 24, 30"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-500 font-bold"
                required
              />
              
              {/* Quick Tenure Preset Chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[3, 6, 9, 12, 18, 24, 30, 36].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTenureMonths(m.toString())}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      tenureMonths === m.toString()
                        ? 'bg-rose-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m} Mos
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly EMI Calculation */}
          <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-purple-400" />
                <span>Monthly EMI Amount (₹) *</span>
              </label>
              <button
                type="button"
                onClick={() => setIsManualEMI(!isManualEMI)}
                className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold"
              >
                {isManualEMI ? 'Auto-calculate from tenure' : 'Enter exact custom EMI'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="Monthly installment"
                value={monthlyEMI}
                onChange={(e) => {
                  setIsManualEMI(true);
                  setMonthlyEMI(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-purple-500/40 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-purple-400"
                required
              />
            </div>
            <p className="text-[10px] text-purple-300/80">
              {actualAmount && tenureMonths
                ? `Calculated as ₹${(parseFloat(actualAmount) || 0).toLocaleString('en-IN')} spread across ${tenureMonths} installments`
                : 'Will auto-calculate once amount and tenure are entered'}
            </p>
          </div>

          {/* Lender and Start Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Lender / Card Name
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, ICICI Amazon Pay, Friend"
                value={cardOrLender}
                onChange={(e) => setCardOrLender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Start Month (e.g. Apr 2026)
              </label>
              <input
                type="text"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                required
              />
            </div>
          </div>

          {/* Additional fees (Optional) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Total Interest (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={interestAmount}
                onChange={(e) => setInterestAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                GST (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Processing Fee (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={processingFee}
                onChange={(e) => setProcessingFee(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Account number, friend support terms, early foreclosure terms"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
            />
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
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold transition-all shadow-md shadow-rose-500/20"
            >
              Add Loan & Tenure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
