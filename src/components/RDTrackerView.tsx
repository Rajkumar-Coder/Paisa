import React, { useState } from 'react';
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Landmark,
  ChevronRight,
  AlertTriangle,
  Users,
  Infinity as InfinityIcon,
  Tag,
  Calculator,
  UserCheck,
  Info
} from 'lucide-react';
import { RecurringDeposit } from '../types/finance';

interface RDTrackerViewProps {
  rds: RecurringDeposit[];
  onSelectRD: (rd: RecurringDeposit) => void;
  onAddRD: (newRD: RecurringDeposit) => void;
}

export const RDTrackerView: React.FC<RDTrackerViewProps> = ({
  rds,
  onSelectRD,
  onAddRD,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInst, setNewInst] = useState('');
  const [newCategory, setNewCategory] = useState<'bank_rd' | 'gold_rd' | 'family_rd' | 'stock_market' | 'shared_rd'>('shared_rd');
  const [isPerpetualSIP, setIsPerpetualSIP] = useState(false);
  const [newTenure, setNewTenure] = useState('36');
  const [newMonthsPaid, setNewMonthsPaid] = useState('0');

  // Partnership Split controls (Split of 2, Split of 3, Solo, Custom)
  const [splitMode, setSplitMode] = useState<'solo' | 'split2' | 'split3' | 'custom'>('split3');
  const [customPartners, setCustomPartners] = useState('3');
  const [poolMonthlyAmount, setPoolMonthlyAmount] = useState('21000');
  const [poolTargetReturn, setPoolTargetReturn] = useState('216000');
  const [excludeMonth2, setExcludeMonth2] = useState(true);

  const totalMonthlyCommitment = rds.reduce((acc, rd) => acc + rd.monthlyAmount, 0);
  const totalAccumulated = rds.reduce((acc, rd) => acc + (rd.monthsPaid * rd.monthlyAmount), 0);
  const activeCount = rds.filter(r => !r.isClosed).length;
  const closedCount = rds.filter(r => r.isClosed).length;

  // Compute calculated user share
  const activePartners = splitMode === 'solo' ? 1 : splitMode === 'split2' ? 2 : splitMode === 'split3' ? 3 : Math.max(2, parseInt(customPartners, 10) || 3);
  const fractionLabel = splitMode === 'solo' ? '1/1' : splitMode === 'split2' ? '1/2' : splitMode === 'split3' ? '1/3' : `1/${activePartners}`;
  const calculatedMyMonthlyShare = splitMode === 'solo' ? (parseFloat(poolMonthlyAmount) || 7000) : Math.round((parseFloat(poolMonthlyAmount) || 0) / activePartners);
  const calculatedMyReturnShare = splitMode === 'solo' ? (parseFloat(poolTargetReturn) || 200000) : Math.round((parseFloat(poolTargetReturn) || 0) / activePartners);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const tenure = isPerpetualSIP ? 999 : parseInt(newTenure, 10);
    const paid = parseInt(newMonthsPaid, 10) || 0;
    const poolMonthly = parseFloat(poolMonthlyAmount) || 0;
    const poolReturn = parseFloat(poolTargetReturn) || 0;

    if (!newTitle.trim() || poolMonthly <= 0 || (!isPerpetualSIP && (isNaN(tenure) || tenure <= 0))) return;

    const startDate = new Date().toISOString().slice(0, 10);
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + (isPerpetualSIP ? 120 : tenure));
    const maturityDate = isPerpetualSIP ? 'Open-Ended (∞)' : maturity.toISOString().slice(0, 10);

    const isShared = splitMode !== 'solo';
    const myMonthly = isShared ? calculatedMyMonthlyShare : poolMonthly;
    const myReturn = isShared ? calculatedMyReturnShare : poolReturn;

    const historyLen = isPerpetualSIP ? Math.max(paid, 12) : tenure;
    const history = Array.from({ length: historyLen }, (_, i) => {
      const idx = i + 1;
      const isPaid = idx <= paid;
      const isCompanyMonth = isShared && excludeMonth2 && idx === 2;
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthIndex: idx,
        amount: myMonthly,
        status: isPaid ? ('paid' as const) : ('pending' as const),
        paidDate: isPaid ? startDate : undefined,
        isExcludedFromReturn: isCompanyMonth,
        note: isCompanyMonth ? '⚠️ Month 2: Company Commission (Excluded from payout return)' : undefined,
      };
    });

    let typeLabel = '🏦 Regular RD';
    if (isShared) {
      typeLabel = `🤝 Split of ${activePartners} (${fractionLabel} My Share)`;
    } else if (isPerpetualSIP) {
      typeLabel = '📈 Perpetual Equity SIP (∞)';
    } else if (newCategory === 'gold_rd') {
      typeLabel = '🪙 Gold Bullion RD';
    } else if (newCategory === 'family_rd') {
      typeLabel = '👨‍👩‍👧 Family RD / Chit';
    }

    const newRDItem: RecurringDeposit = {
      id: `rd_${Date.now()}`,
      title: newTitle.trim(),
      institution: newInst.trim() || (isShared ? 'Bank Registered RD / Chit' : 'Bank / Savings Group'),
      category: isShared ? 'shared_rd' : newCategory,
      investmentTypeLabel: typeLabel,
      monthlyAmount: myMonthly,
      totalTenureMonths: tenure,
      monthsPaid: paid,
      isPerpetual: isPerpetualSIP,
      isShared,
      totalPartners: isShared ? activePartners : undefined,
      myShareFraction: isShared ? fractionLabel : undefined,
      totalPoolMonthlyAmount: isShared ? poolMonthly : undefined,
      totalPoolTargetAmount: isShared ? poolReturn : undefined,
      myShareReturnAmount: isShared ? myReturn : undefined,
      excludeMonthIndexFromReturn: isShared && excludeMonth2 ? 2 : undefined,
      startDate,
      maturityDate,
      targetAmount: myReturn,
      history,
    };

    onAddRD(newRDItem);
    setShowAddForm(false);
    setNewTitle('');
    setNewInst('');
    setPoolMonthlyAmount('21000');
    setPoolTargetReturn('216000');
    setNewTenure('36');
    setNewMonthsPaid('0');
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 truncate">
            <span>Recurring Deposits & SIPs</span>
          </h2>
          <p className="text-[11px] text-slate-400 truncate">
            Partnership splits (2 or 3 friends), investment shares & returns
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Close' : '+ New RD / SIP'}</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">My Monthly Share</span>
          <span className="text-sm sm:text-base font-bold font-mono-num text-white mt-0.5 block truncate">
            ₹{totalMonthlyCommitment.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 truncate block">Committed / mo</span>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">Total Deposited</span>
          <span className="text-sm sm:text-base font-bold font-mono-num text-emerald-400 mt-0.5 block truncate">
            ₹{totalAccumulated.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 truncate block">Till date</span>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">Portfolios</span>
          <span className="text-sm sm:text-base font-bold font-mono-num text-teal-300 mt-0.5 block truncate">
            {activeCount} Active
          </span>
          <span className="text-[10px] text-slate-500 truncate block">
            {closedCount > 0 ? `${closedCount} Settled` : 'Continuous'}
          </span>
        </div>
      </div>

      {/* Add RD Form with PARTNERSHIP SPLIT (SPLIT OF 2 OR 3) */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Create RD / SIP with Split Option</span>
            </h3>
            <span className="text-[10px] text-slate-400">Configure 2 or 3 way split</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">RD / Plan Name *</label>
              <input
                type="text"
                placeholder="e.g. Devi RD, Friends Gold Chit, HDFC RD..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Institution / Bank</label>
              <input
                type="text"
                placeholder="e.g. Bank Registered RD / Chit Group..."
                value={newInst}
                onChange={(e) => setNewInst(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* PARTNERSHIP SPLIT SELECTOR: SPLIT OF 2, SPLIT OF 3, SOLO */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Partnership Split (My Share on Investment & Return)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {fractionLabel} Individual Share
              </span>
            </div>

            {/* Split Switcher */}
            <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSplitMode('solo')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  splitMode === 'solo'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo (100%)
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('split2')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  splitMode === 'split2'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Split of 2 (1/2)
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('split3')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  splitMode === 'split3'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Split of 3 (1/3)
              </button>
              <button
                type="button"
                onClick={() => setSplitMode('custom')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  splitMode === 'custom'
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Total Pool Amounts and Auto-calculated user share */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {splitMode === 'solo' ? 'Monthly Deposit (₹)' : `Total Pool Monthly Contribution (₹)`}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 21000"
                  value={poolMonthlyAmount}
                  onChange={(e) => setPoolMonthlyAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {splitMode === 'solo' ? 'Expected Maturity Return (₹)' : `Total Pool Expected Return (₹)`}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 216000"
                  value={poolTargetReturn}
                  onChange={(e) => setPoolTargetReturn(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Custom Partners field */}
            {splitMode === 'custom' && (
              <div>
                <label className="text-slate-400 block mb-1">Number of Partners</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={customPartners}
                  onChange={(e) => setCustomPartners(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>
            )}

            {/* Live Share Calculation Preview */}
            {splitMode !== 'solo' && (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 space-y-1">
                <div className="flex justify-between items-center font-semibold">
                  <span>📈 Your Monthly Deposit ({fractionLabel} Share):</span>
                  <span className="font-mono-num font-extrabold text-emerald-300 text-xs">
                    ₹{calculatedMyMonthlyShare.toLocaleString('en-IN')}/mo
                  </span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>💰 Your Maturity Return ({fractionLabel} Share):</span>
                  <span className="font-mono-num font-extrabold text-cyan-300 text-xs">
                    ₹{calculatedMyReturnShare.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Devi RD Company Deduction Checkbox */}
            {splitMode !== 'solo' && (
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-300 text-[11px]">
                <input
                  type="checkbox"
                  checked={excludeMonth2}
                  onChange={(e) => setExcludeMonth2(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Devi RD Rule: Month 2 is company commission (excluded from return)</span>
              </label>
            )}
          </div>

          {/* Tenure and History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {!isPerpetualSIP && (
              <div>
                <label className="text-slate-400 block mb-1">Total Tenure (Months) *</label>
                <input
                  type="number"
                  placeholder="e.g. 36"
                  value={newTenure}
                  onChange={(e) => setNewTenure(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required={!isPerpetualSIP}
                />
              </div>
            )}

            <div>
              <label className="text-slate-400 block mb-1">Months Paid So Far</label>
              <input
                type="number"
                placeholder="e.g. 0"
                value={newMonthsPaid}
                onChange={(e) => setNewMonthsPaid(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={isPerpetualSIP}
                onChange={(e) => setIsPerpetualSIP(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Perpetual SIP (Stock market ongoing ∞)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
            >
              Save RD / Plan
            </button>
          </div>
        </form>
      )}

      {/* RD Cards List */}
      <div className="space-y-3">
        {rds.map((rd) => {
          const isPerpetual = !!rd.isPerpetual;
          const isShared = !!rd.isShared;
          const isPayoutEarly = !!rd.isPayoutReceivedEarly;
          const isClosed = !!rd.isClosed;

          const pct = isPerpetual ? 100 : Math.min(100, Math.round((rd.monthsPaid / rd.totalTenureMonths) * 100));
          const totalPaid = rd.monthsPaid * rd.monthlyAmount;
          const remainingMonths = isPerpetual ? '∞' : Math.max(0, rd.totalTenureMonths - rd.monthsPaid);

          const partners = rd.totalPartners || (isShared ? 3 : 1);
          const poolMonthly = rd.totalPoolMonthlyAmount || (isShared ? rd.monthlyAmount * partners : rd.monthlyAmount);
          const returnShare = rd.myShareReturnAmount || rd.targetAmount;
          const poolReturn = rd.totalPoolTargetAmount || (isShared ? rd.targetAmount * partners : rd.targetAmount);

          return (
            <div
              key={rd.id}
              onClick={() => onSelectRD(rd)}
              className={`p-3.5 rounded-3xl border transition-all cursor-pointer hover:border-slate-600 active:scale-98 group space-y-2.5 ${
                isPayoutEarly
                  ? 'bg-amber-950/15 border-amber-500/30'
                  : isClosed
                  ? 'bg-slate-900/60 border-slate-800 opacity-90'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isPayoutEarly
                      ? 'bg-amber-500/10 text-amber-400'
                      : isShared
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : isPerpetual
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {rd.category === 'gold_rd' ? (
                      <Coins className="w-5 h-5 text-amber-400" />
                    ) : isShared ? (
                      <Users className="w-5 h-5 text-cyan-400" />
                    ) : isPerpetual ? (
                      <InfinityIcon className="w-5 h-5 text-purple-400" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                        {rd.investmentTypeLabel || rd.category.replace('_', ' ')}
                      </span>
                      {isShared && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          <span>Split of {partners} ({rd.myShareFraction || '1/3'})</span>
                        </span>
                      )}
                      {isPayoutEarly && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          💰 Payout Received Early
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Settled (+{rd.gainLossPercentage}%)
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate mt-1">
                      {rd.title}
                    </h3>
                    
                    {/* Explicit Investment Share vs Return Share */}
                    <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
                      {isShared ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>Deposit: <strong className="text-emerald-300">₹{rd.monthlyAmount.toLocaleString('en-IN')}/mo</strong> <span className="text-slate-500">(Pool: ₹{poolMonthly.toLocaleString('en-IN')})</span></span>
                          <span>·</span>
                          <span>Return: <strong className="text-cyan-300">₹{returnShare.toLocaleString('en-IN')}</strong> <span className="text-slate-500">(Pool: ₹{poolReturn.toLocaleString('en-IN')})</span></span>
                        </div>
                      ) : (
                        <span>₹{rd.monthlyAmount.toLocaleString('en-IN')}/mo · {rd.institution}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold font-mono-num text-white">
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isPerpetual ? 'Deposited' : `${rd.monthsPaid}/${rd.totalTenureMonths} Mos`}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isPerpetual 
                        ? 'bg-purple-500 w-full' 
                        : isPayoutEarly 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
                  <span>Sent: {rd.monthsPaid} mos</span>
                  <span>{isPerpetual ? '∞ Perpetual' : `Remaining: ${remainingMonths} mos`}</span>
                </div>
              </div>

              {/* Tap to View Timeline cue */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-800/60">
                <span>{isShared ? `🤝 ${fractionLabel} partnership split configured` : 'Solo investment account'}</span>
                <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  <span>Timeline & Split</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
