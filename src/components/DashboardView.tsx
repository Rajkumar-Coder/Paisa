import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Building2, 
  PiggyBank, 
  ShieldAlert, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Info, 
  Layers, 
  ArrowUpRight,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Check,
  Wallet,
  Lock,
  Unlock,
  SlidersHorizontal,
  AlertCircle,
  Tag,
  ArrowRight
} from 'lucide-react';
import { 
  Transaction, 
  CategoryBudget, 
  LoanEMI, 
  RecurringDeposit, 
  MonthSalaryRecord, 
  SalarySplitCriteria 
} from '../types/finance';
import { EXPECTED_MANDATORY_EXPENSES, getCreditCardCycleMonth } from '../data/initialData';

interface DashboardViewProps {
  transactions: Transaction[];
  categories: CategoryBudget[];
  emis: LoanEMI[];
  rds: RecurringDeposit[];
  selectedMonth: string; // YYYY-MM
  onMonthChange: (m: string) => void;
  onOpenBudgets: () => void;
  onSelectRD: (rd: RecurringDeposit) => void;
  onAddExpense: () => void;
  monthSalaries: Record<string, MonthSalaryRecord>;
  onUpdateSalary: (month: string, newSalary: number) => void;
  onOpenMonthClosure: () => void;
  onOpenSalaryModal: () => void;
  splitCriteria: SalarySplitCriteria;
  onOpenAddLoan?: () => void;
  onOpenDataManagement?: () => void;
}

export type PaymentBreakdownFilter = 'combined' | 'debit' | 'credit';

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  categories,
  emis,
  rds,
  selectedMonth,
  onMonthChange,
  onOpenBudgets,
  onSelectRD,
  onAddExpense,
  monthSalaries,
  onUpdateSalary,
  onOpenMonthClosure,
  onOpenSalaryModal,
  splitCriteria,
  onOpenAddLoan,
  onOpenDataManagement,
}) => {
  // Switch between Monthly and Yearly view
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // 3-way breakdown switch: Combined, Debit Only, Credit Card Only
  const [breakdownFilter, setBreakdownFilter] = useState<PaymentBreakdownFilter>('combined');

  // Toggle for Expected vs Actual mandatory checklist
  const [showExpectedBreakdown, setShowExpectedBreakdown] = useState<boolean>(false);

  // Available months list extracted from transactions and records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    });
    Object.keys(monthSalaries).forEach(m => set.add(m));
    ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'].forEach(m => set.add(m));
    return Array.from(set).sort();
  }, [transactions, monthSalaries]);

  // Format month name (e.g. "2026-04" -> "April 2026")
  const formatMonthLabel = (mStr: string) => {
    try {
      const [y, m] = mStr.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return mStr;
    }
  };

  // Filter transactions according to breakdown switch and credit card 13th cutoff
  const filteredMonthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (breakdownFilter === 'debit') {
        // Only debit card/bank transactions matching calendar month
        return t.paymentMode === 'debit_card' && t.date.startsWith(selectedMonth);
      } else if (breakdownFilter === 'credit') {
        // Credit card transactions matching billing cycle (generated on 13th)
        if (t.paymentMode !== 'credit_card') return false;
        const cycle = t.creditCycleMonth || getCreditCardCycleMonth(t.date);
        return cycle === selectedMonth;
      } else {
        // Combined
        return t.date.startsWith(selectedMonth);
      }
    });
  }, [transactions, selectedMonth, breakdownFilter]);

  // MONTHLY TOTALS
  const monthlyTotals = useMemo(() => {
    let spendsDebit = 0;
    let spendsCredit = 0;
    let investments = 0;
    let loans = 0;
    let emiTotal = 0;

    filteredMonthlyTransactions.forEach(t => {
      if (t.type === 'investment') {
        investments += t.amount;
      } else if (t.type === 'loan') {
        loans += t.amount;
      } else if (t.type === 'emi') {
        emiTotal += t.amount;
      } else {
        if (t.paymentMode === 'credit_card') {
          spendsCredit += t.amount;
        } else {
          spendsDebit += t.amount;
        }
      }
    });

    const totalSpends = spendsDebit + spendsCredit;
    const totalOutflow = totalSpends + investments + loans + emiTotal;

    return {
      spendsDebit,
      spendsCredit,
      totalSpends,
      investments,
      loans,
      emiTotal,
      totalOutflow,
    };
  }, [filteredMonthlyTransactions]);

  // ACTIVE MONTH SALARY & ROLLOVER RECORD
  const activeSalaryRecord = useMemo((): MonthSalaryRecord => {
    if (monthSalaries[selectedMonth]) {
      const rec = monthSalaries[selectedMonth];
      const startOfMonth = rec.salary + rec.previousClosingBalance;
      const closing = startOfMonth - monthlyTotals.totalOutflow;
      return {
        ...rec,
        startOfMonthAmount: startOfMonth,
        actualDebits: monthlyTotals.totalOutflow,
        closingBalance: closing,
      };
    }

    // Default fallback calculation if month is not in records
    // Find prior month closing
    const [yStr, mStr] = selectedMonth.split('-');
    const prevDate = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const prevClosing = monthSalaries[prevKey]?.closingBalance || 35000;
    const defaultSalary = 125608;
    const startOfMonth = defaultSalary + prevClosing;

    return {
      month: selectedMonth,
      salary: defaultSalary,
      previousClosingBalance: prevClosing,
      startOfMonthAmount: startOfMonth,
      actualDebits: monthlyTotals.totalOutflow,
      closingBalance: startOfMonth - monthlyTotals.totalOutflow,
      isClosed: false,
    };
  }, [monthSalaries, selectedMonth, monthlyTotals.totalOutflow]);

  // 5-CRITERIA SALARY SPLIT AND LIMIT CHECKER
  const criteriaAnalysis = useMemo(() => {
    const salary = activeSalaryRecord.salary;

    // Budget Limits based on salary split percentages
    const basicLimit = Math.round((salary * (splitCriteria.basicPct || 40)) / 100);
    const investmentLimit = Math.round((salary * (splitCriteria.investmentPct || 10)) / 100);
    const loanEmiLimit = Math.round((salary * (splitCriteria.loanEmiPct || 20)) / 100);
    const entertainmentLimit = Math.round((salary * (splitCriteria.entertainmentPct || 10)) / 100);
    const additionalLimit = Math.round((salary * (splitCriteria.additionalPct || 20)) / 100);

    // Track spends per bucket
    let basicSpent = 0;
    let investmentSpent = 0;
    let loanEmiSpent = 0;
    let entertainmentSpent = 0;
    let additionalSpent = 0;

    const unplannedTagList: { id: string; desc: string; amount: number; tags: string[]; date: string }[] = [];

    const UNPLANNED_TAG_KEYWORDS = ['function', 'car service', 'medical', 'celebration', 'gift', 'home repair', 'emergency', 'one-time'];

    filteredMonthlyTransactions.forEach(t => {
      const hasUnplannedTag = t.tags && t.tags.some(tag => UNPLANNED_TAG_KEYWORDS.some(k => tag.toLowerCase().includes(k)));
      const descLower = t.description.toLowerCase();
      const isUnplannedKeywordInDesc = UNPLANNED_TAG_KEYWORDS.some(k => descLower.includes(k));
      const isAdditionalCategory = t.category === 'Additional & Family Occasions' || t.category === 'Shopping & Home Goods';

      if (t.type === 'investment' || t.category === 'Investment & RDs') {
        investmentSpent += t.amount;
      } else if (t.type === 'loan' || t.type === 'emi' || t.category === 'Loan & Debt Support' || t.category === 'Card & Device EMIs') {
        loanEmiSpent += t.amount;
      } else if (t.category === 'Entertainment & Subs' || descLower.includes('netflix') || descLower.includes('youtube') || descLower.includes('movie')) {
        entertainmentSpent += t.amount;
      } else if (hasUnplannedTag || isUnplannedKeywordInDesc || (isAdditionalCategory && !t.isExpected)) {
        additionalSpent += t.amount;
        unplannedTagList.push({
          id: t.id,
          desc: t.description,
          amount: t.amount,
          tags: t.tags || [t.category],
          date: t.date,
        });
      } else {
        // Basic: Groceries, rent, maintenance, wifi, tneb, utilities, food, fuel
        basicSpent += t.amount;
      }
    });

    return [
      {
        id: 'crit_basic',
        name: 'Basic & Bills',
        pct: splitCriteria.basicPct,
        limit: basicLimit,
        spent: basicSpent,
        color: '#3b82f6',
        isOver: basicSpent > basicLimit,
        difference: basicSpent - basicLimit,
        utilizationPct: basicLimit > 0 ? Math.round((basicSpent / basicLimit) * 100) : 0,
        desc: 'Rent, maintenance, electricity, WiFi, groceries, allowances',
      },
      {
        id: 'crit_investment',
        name: 'Investment',
        pct: splitCriteria.investmentPct,
        limit: investmentLimit,
        spent: investmentSpent,
        color: '#10b981',
        isOver: investmentSpent > investmentLimit,
        difference: investmentSpent - investmentLimit,
        utilizationPct: investmentLimit > 0 ? Math.round((investmentSpent / investmentLimit) * 100) : 0,
        desc: 'Devi RD (1/3), Raj RD, UTI Nifty 50 SIP, Gold',
      },
      {
        id: 'crit_loan_emi',
        name: 'Loans + EMI',
        pct: splitCriteria.loanEmiPct,
        limit: loanEmiLimit,
        spent: loanEmiSpent,
        color: '#8b5cf6',
        isOver: loanEmiSpent > loanEmiLimit,
        difference: loanEmiSpent - loanEmiLimit,
        utilizationPct: loanEmiLimit > 0 ? Math.round((loanEmiSpent / loanEmiLimit) * 100) : 0,
        desc: 'Scooty, AC, TV, Phone EMIs & debt support',
      },
      {
        id: 'crit_entertainment',
        name: 'Entertainment',
        pct: splitCriteria.entertainmentPct,
        limit: entertainmentLimit,
        spent: entertainmentSpent,
        color: '#ec4899',
        isOver: entertainmentSpent > entertainmentLimit,
        difference: entertainmentSpent - entertainmentLimit,
        utilizationPct: entertainmentLimit > 0 ? Math.round((entertainmentSpent / entertainmentLimit) * 100) : 0,
        desc: 'Dining out, movies, OTT subscriptions (YouTube/Netflix)',
      },
      {
        id: 'crit_additional',
        name: 'Additional (Unplanned)',
        pct: splitCriteria.additionalPct,
        limit: additionalLimit,
        spent: additionalSpent,
        color: '#f59e0b',
        isOver: additionalSpent > additionalLimit,
        difference: additionalSpent - additionalLimit,
        utilizationPct: additionalLimit > 0 ? Math.round((additionalSpent / additionalLimit) * 100) : 0,
        desc: 'Unplanned tags: function, car service, medical, celebrations',
        unplannedItems: unplannedTagList,
      },
    ];
  }, [activeSalaryRecord.salary, splitCriteria, filteredMonthlyTransactions]);

  // Check if any criteria bucket is crossing limits
  const overLimitCriteria = useMemo(() => {
    return criteriaAnalysis.filter(c => c.isOver);
  }, [criteriaAnalysis]);

  // EXPECTED VS ACTUAL MANDATORY ANALYSIS
  const expectedSummary = useMemo(() => {
    const totalExpected = EXPECTED_MANDATORY_EXPENSES.reduce((sum, item) => sum + item.expectedAmount, 0);

    let actualMandatoryPaid = 0;
    const matchedList = EXPECTED_MANDATORY_EXPENSES.map(exp => {
      const match = transactions.find(t => 
        t.date.startsWith(selectedMonth) &&
        (t.description.toLowerCase().includes(exp.area.toLowerCase().slice(0, 7)) ||
         exp.area.toLowerCase().includes(t.description.toLowerCase().slice(0, 7)))
      );

      const actualAmt = match ? match.amount : exp.expectedAmount;
      actualMandatoryPaid += actualAmt;

      return {
        ...exp,
        actualAmount: actualAmt,
        status: match ? ('done' as const) : ('pending' as const),
      };
    });

    const discretionaryBuffer = activeSalaryRecord.startOfMonthAmount - totalExpected;

    return {
      totalExpected,
      actualMandatoryPaid,
      discretionaryBuffer,
      items: matchedList,
    };
  }, [transactions, selectedMonth, activeSalaryRecord.startOfMonthAmount]);

  // YEARLY AGGREGATIONS (12 Months of selected Year)
  const yearlyMonths = [
    `${selectedYear}-01`,
    `${selectedYear}-02`,
    `${selectedYear}-03`,
    `${selectedYear}-04`,
    `${selectedYear}-05`,
    `${selectedYear}-06`,
    `${selectedYear}-07`,
    `${selectedYear}-08`,
    `${selectedYear}-09`,
    `${selectedYear}-10`,
    `${selectedYear}-11`,
    `${selectedYear}-12`,
  ];

  const yearlyData = useMemo(() => {
    const monthsData = yearlyMonths.map(mKey => {
      const txns = transactions.filter(t => t.date.startsWith(mKey));
      let spends = 0;
      let investment = 0;
      let loan = 0;
      let emi = 0;

      txns.forEach(t => {
        if (t.type === 'investment') investment += t.amount;
        else if (t.type === 'loan') loan += t.amount;
        else if (t.type === 'emi') emi += t.amount;
        else spends += t.amount;
      });

      const total = spends + investment + loan + emi;
      const monthShort = new Date(parseInt(selectedYear, 10), parseInt(mKey.split('-')[1], 10) - 1, 1)
        .toLocaleDateString('en-US', { month: 'short' });

      return {
        key: mKey,
        monthLabel: monthShort,
        spends,
        investment,
        loan,
        emi,
        total,
      };
    });

    const annualSpends = monthsData.reduce((acc, m) => acc + m.spends, 0);
    const annualInvestment = monthsData.reduce((acc, m) => acc + m.investment, 0);
    const annualLoan = monthsData.reduce((acc, m) => acc + m.loan, 0);
    const annualEMI = monthsData.reduce((acc, m) => acc + m.emi, 0);
    const annualTotalOutflow = annualSpends + annualInvestment + annualLoan + annualEMI;

    const maxMonthTotal = Math.max(...monthsData.map(m => m.total), 1);

    return {
      monthsData,
      annualSpends,
      annualInvestment,
      annualLoan,
      annualEMI,
      annualTotalOutflow,
      maxMonthTotal,
    };
  }, [transactions, selectedYear]);

  return (
    <div className="space-y-3.5">
      {/* Top Header & Switch: Monthly vs Yearly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Financial Dashboard
            </h2>
            {transactions.length > 0 && onOpenDataManagement && (
              <button
                onClick={onOpenDataManagement}
                className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-semibold transition"
                title="Wipe demo records and start fresh"
              >
                Clear Demo Data
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            Debit card, credit card, RDs, loans & monthly rollover
          </p>
        </div>

        {/* Segmented Controls: Monthly vs Yearly Switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner self-start sm:self-auto shrink-0">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Graph
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'yearly'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly Graph
          </button>
        </div>
      </div>

      {/* Month Selector Carousel */}
      {viewMode === 'monthly' ? (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          {availableMonths.map((mStr) => {
            const isSelected = selectedMonth === mStr;
            const isClosed = monthSalaries[mStr]?.isClosed;
            return (
              <button
                key={mStr}
                onClick={() => onMonthChange(mStr)}
                className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all font-medium flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 font-bold shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <span>{formatMonthLabel(mStr)}</span>
                {isClosed && (
                  <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Selected Year:</span>
          {['2024', '2025', '2026', '2027'].map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      )}

      {/* SALARY & START-OF-THE-MONTH ROLLOVER CARD */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-lg space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Start of Month Available Funds
                </h3>
                {activeSalaryRecord.isClosed ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Closed
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Active Month
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Previous Closing (₹{Math.round(activeSalaryRecord.previousClosingBalance).toLocaleString('en-IN')}) + Monthly Salary (₹{Math.round(activeSalaryRecord.salary).toLocaleString('en-IN')})
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSalaryModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
            title="Edit salary and percentage split"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Edit Salary / Split</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>

        {/* Start-of-month Amount & Balances Row */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Start of Month
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono-num text-white block mt-0.5">
              ₹{Math.round(activeSalaryRecord.startOfMonthAmount).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] text-slate-500 block">Total Pool</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Debited Outflow
            </span>
            <span className="text-sm sm:text-base font-extrabold font-mono-num text-rose-400 block mt-0.5">
              -₹{Math.round(activeSalaryRecord.actualDebits).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] text-slate-500 block">All deductions</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">
              Closing Balance
            </span>
            <span className={`text-sm sm:text-base font-extrabold font-mono-num block mt-0.5 ${
              activeSalaryRecord.closingBalance >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}>
              ₹{Math.round(activeSalaryRecord.closingBalance).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] text-slate-500 block">Rollover funds</span>
          </div>
        </div>

        {/* Month-End Close Trigger */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">
            {activeSalaryRecord.isClosed 
              ? `Month closed. Balance rolled over to next month.` 
              : `Ready to wrap up ${formatMonthLabel(selectedMonth)}?`}
          </span>

          <button
            onClick={onOpenMonthClosure}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
              activeSalaryRecord.isClosed
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {activeSalaryRecord.isClosed ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Reopen / Review</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Close Month & Rollover</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-WAY BREAKDOWN SWITCH: Combined, Debit Only, Credit Card (13th Cycle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Card Breakdown Filter:</span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setBreakdownFilter('combined')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
              breakdownFilter === 'combined'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Combined
          </button>
          <button
            onClick={() => setBreakdownFilter('debit')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              breakdownFilter === 'debit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3 h-3 text-cyan-400" />
            <span>Debit</span>
          </button>
          <button
            onClick={() => setBreakdownFilter('credit')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 ${
              breakdownFilter === 'credit'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3 h-3 text-purple-400" />
            <span>Credit Card</span>
          </button>
        </div>
      </div>

      {/* Credit Card Billing Cycle Notice (Generated on 13th) */}
      {breakdownFilter === 'credit' && (
        <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-[11px] text-purple-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-purple-300">
              Credit Card Billing Cycle Cutoff (13th of Month)
            </span>
            <span>
              Bill generated every month on the 13th (e.g. Jan 14 to Feb 13 swipes are bundled into February expenses).
            </span>
          </div>
        </div>
      )}

      {/* 4 CORE PILLARS KPI CARDS: 2 AT UP AND 2 BELOW THAT (AMOUNTS NEVER HIDDEN!) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Card 1 (Top Left): Spends */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 min-w-0 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-slate-200 truncate">Spends</span>
              <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            </div>
            {/* Amount is NEVER hidden or truncated */}
            <div className="text-base sm:text-xl font-extrabold font-mono-num text-white break-normal tracking-tight">
              ₹{(viewMode === 'monthly' ? monthlyTotals.totalSpends : yearlyData.annualSpends).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">
            {viewMode === 'monthly' ? (
              <span>{breakdownFilter === 'credit' ? 'Credit Swipes' : breakdownFilter === 'debit' ? 'Bank Debits' : 'Debit + Credit'}</span>
            ) : (
              <span>{selectedYear} Outflows</span>
            )}
          </div>
        </div>

        {/* Card 2 (Top Right): Investment */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 min-w-0 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-emerald-400 truncate">Investment</span>
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            {/* Amount is NEVER hidden or truncated */}
            <div className="text-base sm:text-xl font-extrabold font-mono-num text-emerald-300 break-normal tracking-tight">
              ₹{(viewMode === 'monthly' ? monthlyTotals.investments : yearlyData.annualInvestment).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">
            <span>{rds.length} Active RDs & SIPs</span>
          </div>
        </div>

        {/* Card 3 (Bottom Left): Loan Support */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 min-w-0 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-rose-400 truncate">Loans & Debt</span>
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            </div>
            {/* Amount is NEVER hidden or truncated */}
            <div className="text-base sm:text-xl font-extrabold font-mono-num text-rose-300 break-normal tracking-tight">
              ₹{(viewMode === 'monthly' ? monthlyTotals.loans : yearlyData.annualLoan).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-400 font-medium truncate">Support transfers</span>
            {onOpenAddLoan && (
              <button
                type="button"
                onClick={onOpenAddLoan}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-lg transition-colors shrink-0"
              >
                + Set Tenure
              </button>
            )}
          </div>
        </div>

        {/* Card 4 (Bottom Right): Device EMI */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 sm:p-4 min-w-0 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-purple-400 truncate">Device EMI</span>
              <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
            </div>
            {/* Amount is NEVER hidden or truncated */}
            <div className="text-base sm:text-xl font-extrabold font-mono-num text-purple-300 break-normal tracking-tight">
              ₹{(viewMode === 'monthly' ? monthlyTotals.emiTotal : yearlyData.annualEMI).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-400 font-medium truncate">Scooty, AC, TV, Phone</span>
            {onOpenAddLoan && (
              <button
                type="button"
                onClick={onOpenAddLoan}
                className="text-[10px] font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-0.5 rounded-lg transition-colors shrink-0"
              >
                + Set Tenure
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5-CRITERIA SALARY SPLIT AND LIMIT CHECKER (DEBIT, CREDIT & COMBINED) */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Salary Split & Budget Limits (5 Criteria)</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Allocated ratio from monthly salary ({breakdownFilter.toUpperCase()} view)
            </p>
          </div>

          <button
            onClick={onOpenSalaryModal}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>Ratio Settings</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Over limit alert banner if any criteria crossed */}
        {overLimitCriteria.length > 0 && (
          <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-white block">
                Crossing Limit in {overLimitCriteria.length} Area{overLimitCriteria.length > 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-rose-300/90">
                {overLimitCriteria.map(c => `${c.name} (+₹${c.difference.toLocaleString('en-IN')})`).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* 5 Progress Bars */}
        <div className="space-y-3 pt-1">
          {criteriaAnalysis.map((crit) => {
            const isOver = crit.isOver;
            return (
              <div key={crit.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: crit.color }} />
                    <span className="font-bold text-white truncate">
                      {crit.name} ({crit.pct}%)
                    </span>
                    {isOver ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0">
                        Exceeded by ₹{crit.difference.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-emerald-400 shrink-0">
                        ₹{(crit.limit - crit.spent).toLocaleString('en-IN')} left
                      </span>
                    )}
                  </div>

                  <div className="text-right font-mono-num shrink-0 ml-2">
                    <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-slate-200'}`}>
                      ₹{crit.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-slate-500 text-[10px] font-normal">
                      {' '}/ ₹{crit.limit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver 
                        ? 'bg-rose-500' 
                        : crit.utilizationPct >= 80 
                        ? 'bg-amber-400' 
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, crit.utilizationPct)}%` }}
                  />
                </div>

                {/* Subtitle description */}
                <div className="text-[10px] text-slate-400 truncate">
                  {crit.desc}
                </div>

                {/* Unplanned tags breakdown for 'Additional' */}
                {crit.id === 'crit_additional' && crit.unplannedItems && crit.unplannedItems.length > 0 && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-400 block uppercase">
                      Unplanned Items Logged This Month ({crit.unplannedItems.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {crit.unplannedItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                        >
                          <Tag className="w-2.5 h-2.5 text-amber-400" />
                          <span className="font-medium text-white">{item.desc}</span>
                          <span className="text-amber-300 font-mono-num font-bold">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* START OF MONTH: EXPECTED VS ACTUAL MANDATORY EXPENSES TRACKER */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/90 border border-slate-800 shadow-md space-y-2.5">
        <div 
          onClick={() => setShowExpectedBreakdown(!showExpectedBreakdown)}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                <span>Start-of-Month: Expected vs Actual</span>
                <span className="text-[10px] text-slate-400 font-normal">({formatMonthLabel(selectedMonth)})</span>
              </h3>
              <div className="text-[10px] text-slate-400 font-mono-num">
                Expected: ₹{expectedSummary.totalExpected.toLocaleString('en-IN')} · Actual Paid: ₹{expectedSummary.actualMandatoryPaid.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-white transition-colors">
            <span className="text-[11px] font-medium hidden sm:inline">
              {showExpectedBreakdown ? 'Hide List' : 'View Planned'}
            </span>
            {showExpectedBreakdown ? (
              <ChevronUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Progress of Expected vs Mandatory Outflow */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((expectedSummary.actualMandatoryPaid / expectedSummary.totalExpected) * 100))}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
            <span>Mandatory Debits: {Math.round((expectedSummary.actualMandatoryPaid / expectedSummary.totalExpected) * 100)}% Fulfilled</span>
            <span className="text-teal-400">
              Buffer Remaining: ₹{Math.max(0, expectedSummary.discretionaryBuffer).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Expandable Expected Items Breakdown */}
        {showExpectedBreakdown && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {expectedSummary.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-200 font-medium truncate block">
                      {item.area}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block">
                      {item.note}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="font-bold font-mono-num text-white">
                    ₹{item.expectedAmount.toLocaleString('en-IN')}
                  </span>
                  <div className="text-[9px] text-emerald-400 font-semibold">
                    Mandatory
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GRAPH VISUALIZATION SECTION: MONTHLY OR YEARLY */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            {viewMode === 'monthly' ? (
              <>
                <span>Monthly Allocation</span>
                <span className="text-[11px] font-normal text-slate-400">({formatMonthLabel(selectedMonth)})</span>
              </>
            ) : (
              <>
                <span>Yearly Trends ({selectedYear})</span>
                <span className="text-[11px] font-normal text-slate-400">(12-Month Outflow)</span>
              </>
            )}
          </h3>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono-num">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Spends
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> RD
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Loan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> EMI
            </span>
          </div>
        </div>

        {/* YEARLY STACKED CHART */}
        {viewMode === 'yearly' ? (
          <div className="space-y-3">
            <div className="h-44 w-full flex items-end justify-between gap-1 pt-6 pb-2 px-1">
              {yearlyData.monthsData.map((m, idx) => {
                const heightPercent = yearlyData.maxMonthTotal > 0 ? (m.total / yearlyData.maxMonthTotal) * 100 : 0;
                const spendsPct = m.total > 0 ? (m.spends / m.total) * 100 : 0;
                const investPct = m.total > 0 ? (m.investment / m.total) * 100 : 0;
                const loanPct = m.total > 0 ? (m.loan / m.total) * 100 : 0;
                const emiPct = m.total > 0 ? (m.emi / m.total) * 100 : 0;

                const isHovered = hoveredBarIndex === idx;

                return (
                  <div
                    key={m.key}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    onClick={() => {
                      onMonthChange(m.key);
                      setViewMode('monthly');
                    }}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {isHovered && (
                      <div className="absolute -top-12 z-30 bg-slate-950 border border-slate-700 p-1.5 rounded-xl shadow-xl text-[10px] font-mono-num text-white whitespace-nowrap pointer-events-none">
                        <div className="font-bold text-emerald-400">{m.monthLabel} {selectedYear}</div>
                        <div>₹{m.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                    )}

                    <div 
                      className={`w-full max-w-[24px] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-200 ${
                        isHovered ? 'ring-2 ring-emerald-400 shadow-md' : 'opacity-90 hover:opacity-100'
                      }`}
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    >
                      <div style={{ height: `${spendsPct}%` }} className="bg-cyan-500 w-full" />
                      <div style={{ height: `${investPct}%` }} className="bg-emerald-500 w-full" />
                      <div style={{ height: `${loanPct}%` }} className="bg-rose-500 w-full" />
                      <div style={{ height: `${emiPct}%` }} className="bg-purple-500 w-full" />
                    </div>

                    <span className="text-[9px] text-slate-400 font-mono mt-1 group-hover:text-emerald-400">
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex flex-wrap items-center justify-between text-[11px] text-slate-300">
              <span>Annual Outflow: <strong className="font-mono-num text-white">₹{yearlyData.annualTotalOutflow.toLocaleString('en-IN')}</strong></span>
              <span>Spends: <strong className="font-mono-num text-cyan-300">₹{yearlyData.annualSpends.toLocaleString('en-IN')}</strong></span>
              <span>Investments: <strong className="font-mono-num text-emerald-300">₹{yearlyData.annualInvestment.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>
        ) : (
          /* MONTHLY VIEW GRAPHS */
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Outflow: ₹{monthlyTotals.totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                <span className="font-mono-num">100%</span>
              </div>

              <div className="h-3.5 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800">
                {monthlyTotals.totalOutflow > 0 && (
                  <>
                    <div 
                      style={{ width: `${(monthlyTotals.totalSpends / monthlyTotals.totalOutflow) * 100}%` }}
                      className="bg-cyan-500 h-full hover:opacity-90 transition-all"
                      title={`Spends: ₹${monthlyTotals.totalSpends.toLocaleString('en-IN')}`}
                    />
                    <div 
                      style={{ width: `${(monthlyTotals.investments / monthlyTotals.totalOutflow) * 100}%` }}
                      className="bg-emerald-500 h-full hover:opacity-90 transition-all"
                      title={`Investments: ₹${monthlyTotals.investments.toLocaleString('en-IN')}`}
                    />
                    <div 
                      style={{ width: `${(monthlyTotals.loans / monthlyTotals.totalOutflow) * 100}%` }}
                      className="bg-rose-500 h-full hover:opacity-90 transition-all"
                      title={`Loans: ₹${monthlyTotals.loans.toLocaleString('en-IN')}`}
                    />
                    <div 
                      style={{ width: `${(monthlyTotals.emiTotal / monthlyTotals.totalOutflow) * 100}%` }}
                      className="bg-purple-500 h-full hover:opacity-90 transition-all"
                      title={`EMI: ₹${monthlyTotals.emiTotal.toLocaleString('en-IN')}`}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QUICK SHORTCUT TO RD TIMELINES WITH DISTINCT LABELS */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-3xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Active Recurring Deposits (Tap to Open)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Timelines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rds.slice(0, 4).map((rd) => {
            const isPerpetual = rd.isPerpetual;
            const pct = isPerpetual ? 100 : Math.min(100, Math.round((rd.monthsPaid / rd.totalTenureMonths) * 100));

            return (
              <div
                key={rd.id}
                onClick={() => onSelectRD(rd)}
                className="p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all duration-200 active:scale-98 group space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                        {rd.investmentTypeLabel}
                      </span>
                      {rd.isPayoutReceivedEarly && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          💰 Payout Received Early
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate mt-1">
                      {rd.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {rd.isShared ? `My 1/3rd: ₹${rd.monthlyAmount.toLocaleString('en-IN')}/mo (Total: ₹${rd.totalPoolMonthlyAmount?.toLocaleString('en-IN')})` : `₹${rd.monthlyAmount.toLocaleString('en-IN')}/mo · ${rd.institution}`}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                    {isPerpetual ? '∞' : `${pct}%`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
                  <span>Sent: {rd.monthsPaid} mos</span>
                  <span>
                    {isPerpetual ? (
                      <span className="text-cyan-400 font-bold">∞ Ongoing SIP</span>
                    ) : (
                      `Remaining: ${Math.max(0, rd.totalTenureMonths - rd.monthsPaid)} mos`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Add Expense Quick Trigger */}
      <div className="pt-1">
        <button
          onClick={onAddExpense}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-98 shadow-lg shadow-emerald-500/20"
        >
          <span>+ Add Manual Debit or Credit Expense</span>
        </button>
      </div>
    </div>
  );
};
