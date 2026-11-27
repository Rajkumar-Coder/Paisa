import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  CreditCard, 
  Building2, 
  TrendingUp, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Filter, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { Transaction, PaymentMode } from '../types/finance';
import { getCreditCardCycleMonth } from '../data/initialData';

export type TimeHorizon = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PaymentBreakdownType = 'combined' | 'debit' | 'credit';

interface TransactionListViewProps {
  transactions: Transaction[];
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  onDeleteTransaction: (id: string) => void;
  onAddExpense: () => void;
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  transactions,
  selectedMonth,
  onMonthChange,
  onDeleteTransaction,
  onAddExpense,
}) => {
  // Default to weekly view to reduce initial render load as requested!
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('weekly');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.

  // 3-way breakdown switch: combined, debit, credit
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdownType>('combined');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Compute week range for 'weekly' filter
  const weekRange = useMemo(() => {
    const now = new Date();
    // Anchor to selectedMonth date if looking back
    const [y, m] = selectedMonth.split('-');
    const baseDate = new Date(parseInt(y), parseInt(m) - 1, 15);
    baseDate.setDate(baseDate.getDate() + (selectedWeekOffset * 7));

    const day = baseDate.getDay();
    const diffToMonday = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    
    const startOfWeek = new Date(baseDate.setDate(diffToMonday));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toISOString().slice(0, 10);
    const endStr = endOfWeek.toISOString().slice(0, 10);

    return {
      startStr,
      endStr,
      label: `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    };
  }, [selectedMonth, selectedWeekOffset]);

  // Compute quarter for 'quarterly'
  const quarterInfo = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const monthNum = parseInt(m);
    const qNum = Math.ceil(monthNum / 3);
    const qStartMonth = (qNum - 1) * 3 + 1;
    const months = [
      `${y}-${String(qStartMonth).padStart(2, '0')}`,
      `${y}-${String(qStartMonth + 1).padStart(2, '0')}`,
      `${y}-${String(qStartMonth + 2).padStart(2, '0')}`,
    ];
    return {
      qLabel: `Q${qNum} ${y} (${months[0]} to ${months[2]})`,
      months,
      year: y,
    };
  }, [selectedMonth]);

  // Filter transactions based on timeHorizon, paymentBreakdown, search & type
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Time Horizon Filter
      if (timeHorizon === 'weekly') {
        if (t.date < weekRange.startStr || t.date > weekRange.endStr) {
          return false;
        }
      } else if (timeHorizon === 'monthly') {
        if (!t.date.startsWith(selectedMonth)) {
          return false;
        }
      } else if (timeHorizon === 'quarterly') {
        const matchesQuarter = quarterInfo.months.some(m => t.date.startsWith(m));
        if (!matchesQuarter) return false;
      } else if (timeHorizon === 'yearly') {
        const year = selectedMonth.slice(0, 4);
        if (!t.date.startsWith(year)) return false;
      }

      // 2. Payment Breakdown Switch (Credit Card 13th cycle vs Debit vs Combined)
      if (paymentBreakdown === 'debit') {
        if (t.paymentMode !== 'debit_card') return false;
      } else if (paymentBreakdown === 'credit') {
        if (t.paymentMode !== 'credit_card') return false;
        // In monthly mode, check if creditCycleMonth matches
        if (timeHorizon === 'monthly') {
          const cycleMonth = t.creditCycleMonth || getCreditCardCycleMonth(t.date);
          if (cycleMonth !== selectedMonth) return false;
        }
      }

      // 3. Category / Type filter
      if (filterType === 'investment' && t.type !== 'investment') return false;
      if (filterType === 'emi' && t.type !== 'emi') return false;
      if (filterType === 'loan' && t.type !== 'loan') return false;

      // 4. Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(q);
        const catMatch = t.category.toLowerCase().includes(q);
        const noteMatch = t.note?.toLowerCase().includes(q) || false;
        if (!descMatch && !catMatch && !noteMatch) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, timeHorizon, weekRange, selectedMonth, quarterInfo, paymentBreakdown, filterType, searchTerm]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const debitTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.paymentMode === 'debit_card')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const creditTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.paymentMode === 'credit_card')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Passbook Statement</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Categorized card swipes, bank debits & monthly statements
          </p>
        </div>

        <button
          onClick={onAddExpense}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* 1. TIME HORIZON TABS: Weekly (Default), Monthly, Quarterly, Yearly */}
      <div className="p-1 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-4 gap-1">
        <button
          onClick={() => setTimeHorizon('weekly')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
            timeHorizon === 'weekly'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Weekly (Fast)
        </button>
        <button
          onClick={() => setTimeHorizon('monthly')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
            timeHorizon === 'monthly'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setTimeHorizon('quarterly')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
            timeHorizon === 'quarterly'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Quarterly
        </button>
        <button
          onClick={() => setTimeHorizon('yearly')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
            timeHorizon === 'yearly'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Yearly
        </button>
      </div>

      {/* 2. TIME HORIZON CONTROLLER */}
      {timeHorizon === 'weekly' && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedWeekOffset(prev => prev - 1)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="font-semibold text-white block">
              {selectedWeekOffset === 0 ? 'Current Week' : `Week (${selectedWeekOffset > 0 ? `+${selectedWeekOffset}` : selectedWeekOffset})`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono-num">{weekRange.label}</span>
          </div>
          <button
            onClick={() => setSelectedWeekOffset(prev => prev + 1)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {timeHorizon === 'quarterly' && (
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-center">
          <span className="font-semibold text-white">{quarterInfo.qLabel}</span>
          <span className="text-[10px] text-slate-400 block">3-Month aggregated passbook view</span>
        </div>
      )}

      {/* 3. CARD BREAKDOWN SWITCH: Combined, Debit, Credit Card */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
        <button
          onClick={() => setPaymentBreakdown('combined')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
            paymentBreakdown === 'combined'
              ? 'bg-slate-800 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Combined Outflow
        </button>
        <button
          onClick={() => setPaymentBreakdown('debit')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            paymentBreakdown === 'debit'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Debit Only</span>
        </button>
        <button
          onClick={() => setPaymentBreakdown('credit')}
          className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
            paymentBreakdown === 'credit'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-purple-400" />
          <span>Credit Card</span>
        </button>
      </div>

      {/* 13th Billing Cycle Explainer when Credit Card is active */}
      {paymentBreakdown === 'credit' && (
        <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-purple-300">
              13th Monthly Bill Cycle Attribution
            </span>
            <span>
              Transactions from 14th of previous month to 13th of current month are bundled into current credit card cycle.
            </span>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search passbook by merchant, bills, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Subtotal Card */}
      <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div>
          <span>Showing <strong>{filteredTransactions.length}</strong> transactions</span>
          <span className="text-[10px] text-slate-400 block font-mono-num">
            Debit: ₹{debitTotal.toLocaleString('en-IN')} | Credit: ₹{creditTotal.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block uppercase">Selected Period Total</span>
          <span className="font-mono-num font-bold text-emerald-400 text-sm">
            ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-slate-300">No transactions in this view</p>
            <p className="text-[11px] text-slate-500 mt-1">Try toggling to Monthly, adjusting the week, or clearing filters.</p>
          </div>
        ) : (
          filteredTransactions.map((txn) => {
            const isCredit = txn.paymentMode === 'credit_card';
            return (
              <div
                key={txn.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    txn.type === 'investment'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : txn.type === 'emi'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : txn.type === 'loan'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : isCredit
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {txn.type === 'investment' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : txn.type === 'emi' ? (
                      <CreditCard className="w-4 h-4" />
                    ) : txn.type === 'loan' ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : isCredit ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">
                        {txn.description}
                      </span>
                      {txn.isExpected && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          Mandatory
                        </span>
                      )}
                      {txn.tags && txn.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono-num">{txn.date}</span>
                      <span>·</span>
                      <span className="truncate">{txn.category}</span>
                      <span>·</span>
                      <span className={`font-semibold ${isCredit ? 'text-purple-300' : 'text-cyan-300'}`}>
                        {isCredit ? 'Credit Card' : 'Debit Bank'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold font-mono-num text-white">
                      -₹{txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[9px] text-slate-500">
                      {isCredit ? '13th Cycle' : 'Bank Outflow'}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(txn.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
