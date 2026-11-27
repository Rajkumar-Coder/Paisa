import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Coins, 
  Check,
  AlertTriangle,
  Users,
  Infinity as InfinityIcon,
  ShieldCheck,
  DollarSign,
  Info,
  SlidersHorizontal,
  ArrowRight,
  Calculator,
  UserCheck
} from 'lucide-react';
import { RecurringDeposit } from '../types/finance';

interface RecurringDepositModalProps {
  rd: RecurringDeposit | null;
  onClose: () => void;
  onMarkMonthPaid?: (rdId: string) => void;
  onCloseInvestment?: (rdId: string, actualReturn: number, gainLossPct: number) => void;
  onUpdateRD?: (updatedRD: RecurringDeposit) => void;
}

export const RecurringDepositModal: React.FC<RecurringDepositModalProps> = ({
  rd,
  onClose,
  onMarkMonthPaid,
  onCloseInvestment,
  onUpdateRD,
}) => {
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [actualReturnInput, setActualReturnInput] = useState<string>('');

  // Split Configuration State
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [splitMode, setSplitMode] = useState<'solo' | 'split2' | 'split3' | 'custom'>(() => {
    if (!rd?.isShared) return 'solo';
    if (rd.totalPartners === 2) return 'split2';
    if (rd.totalPartners === 3) return 'split3';
    return 'custom';
  });
  const [customPartners, setCustomPartners] = useState<string>(rd?.totalPartners ? rd.totalPartners.toString() : '3');
  const [poolMonthlyInput, setPoolMonthlyInput] = useState<string>(
    rd?.totalPoolMonthlyAmount ? rd.totalPoolMonthlyAmount.toString() : (rd ? (rd.monthlyAmount * (rd.totalPartners || 3)).toString() : '21000')
  );
  const [poolReturnInput, setPoolReturnInput] = useState<string>(
    rd?.totalPoolTargetAmount ? rd.totalPoolTargetAmount.toString() : (rd ? ((rd.targetAmount || 70000) * (rd.totalPartners || 3)).toString() : '216000')
  );
  const [excludeMonth2, setExcludeMonth2] = useState<boolean>(!!rd?.excludeMonthIndexFromReturn);

  if (!rd) return null;

  const isPerpetual = !!rd.isPerpetual;
  const isShared = !!rd.isShared;
  const isPayoutEarly = !!rd.isPayoutReceivedEarly;
  const isClosed = !!rd.isClosed;

  const monthsSent = rd.monthsPaid;
  const monthsRemaining = isPerpetual ? '∞' : Math.max(0, rd.totalTenureMonths - rd.monthsPaid);
  const percentComplete = isPerpetual ? 100 : Math.min(100, Math.round((rd.monthsPaid / rd.totalTenureMonths) * 100));

  // User investment so far
  const totalInvestedSoFar = rd.monthsPaid * rd.monthlyAmount;

  // For Devi RD: Month 2 excluded from return calculation principal
  const eligiblePrincipalForReturn = rd.excludeMonthIndexFromReturn && rd.monthsPaid >= rd.excludeMonthIndexFromReturn
    ? (rd.monthsPaid - 1) * rd.monthlyAmount
    : totalInvestedSoFar;

  // Total pool metrics
  const partnersCount = rd.totalPartners || (isShared ? 3 : 1);
  const poolMonthly = rd.totalPoolMonthlyAmount || (isShared ? rd.monthlyAmount * partnersCount : rd.monthlyAmount);
  const poolReturn = rd.totalPoolTargetAmount || (isShared ? (rd.targetAmount * partnersCount) : rd.targetAmount);
  const userReturnShare = rd.myShareReturnAmount || rd.targetAmount;

  // Handle saving split adjustments
  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRD) return;

    let partners = 1;
    let fraction = '1/1';
    let isSharedFlag = false;

    if (splitMode === 'split2') {
      partners = 2;
      fraction = '1/2';
      isSharedFlag = true;
    } else if (splitMode === 'split3') {
      partners = 3;
      fraction = '1/3';
      isSharedFlag = true;
    } else if (splitMode === 'custom') {
      partners = Math.max(2, parseInt(customPartners, 10) || 3);
      fraction = `1/${partners}`;
      isSharedFlag = true;
    }

    const poolMonthlyVal = parseFloat(poolMonthlyInput) || (rd.monthlyAmount * partners);
    const poolReturnVal = parseFloat(poolReturnInput) || (poolMonthlyVal * rd.totalTenureMonths);
    const myMonthlyShare = isSharedFlag ? Math.round((poolMonthlyVal / partners) * 100) / 100 : poolMonthlyVal;
    const myReturnShare = isSharedFlag ? Math.round((poolReturnVal / partners) * 100) / 100 : poolReturnVal;

    let updatedTypeLabel = rd.investmentTypeLabel;
    if (isSharedFlag) {
      updatedTypeLabel = `🤝 Split of ${partners} (${fraction} My Share)`;
    } else if (isPerpetual) {
      updatedTypeLabel = '📈 Perpetual Equity SIP (∞)';
    } else {
      updatedTypeLabel = '🏦 Regular RD';
    }

    const updatedRD: RecurringDeposit = {
      ...rd,
      isShared: isSharedFlag,
      totalPartners: isSharedFlag ? partners : undefined,
      myShareFraction: isSharedFlag ? fraction : undefined,
      totalPoolMonthlyAmount: isSharedFlag ? poolMonthlyVal : undefined,
      totalPoolTargetAmount: isSharedFlag ? poolReturnVal : undefined,
      monthlyAmount: myMonthlyShare,
      targetAmount: myReturnShare,
      myShareReturnAmount: myReturnShare,
      excludeMonthIndexFromReturn: excludeMonth2 ? 2 : undefined,
      investmentTypeLabel: updatedTypeLabel,
      category: isSharedFlag ? 'shared_rd' : rd.category === 'shared_rd' ? 'bank_rd' : rd.category,
      history: rd.history.map(item => ({
        ...item,
        amount: myMonthlyShare,
        isExcludedFromReturn: excludeMonth2 && item.monthIndex === 2,
        note: excludeMonth2 && item.monthIndex === 2 ? '⚠️ Month 2: Company Commission (Excluded from payout return)' : item.note,
      })),
    };

    onUpdateRD(updatedRD);
    setIsEditingSplit(false);
  };

  // Handle closing investment and recording return
  const handleRecordClosure = (e: React.FormEvent) => {
    e.preventDefault();
    const retVal = parseFloat(actualReturnInput);
    if (isNaN(retVal) || retVal <= 0) return;

    const principal = eligiblePrincipalForReturn;
    const gainPct = principal > 0 ? ((retVal - principal) / principal) * 100 : 0;

    if (onCloseInvestment) {
      onCloseInvestment(rd.id, retVal, Math.round(gainPct * 100) / 100);
    }
    setShowCloseForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isPayoutEarly 
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                : isShared
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
                : isPerpetual
                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {rd.category === 'gold_rd' ? (
                <Coins className="w-5 h-5 text-amber-400" />
              ) : isShared ? (
                <Users className="w-5 h-5 text-cyan-400" />
              ) : isPerpetual ? (
                <InfinityIcon className="w-5 h-5 text-purple-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
                  {rd.investmentTypeLabel || rd.category.replace('_', ' ').toUpperCase()}
                </span>
                {isShared && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    🤝 {rd.myShareFraction || '1/3'} Share ({rd.totalPartners || 3} Partners)
                  </span>
                )}
                {isPayoutEarly && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    💰 Payout Received Early (5 Mos Still Due)
                  </span>
                )}
                {isClosed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ✅ Matured & Closed
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight truncate mt-1">
                {rd.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{rd.institution}</span>
                {isShared && (
                  <>
                    <span>·</span>
                    <span className="text-cyan-300 font-medium">{rd.totalPartners || 3} Friends Pool</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* SPECIAL ALERT FOR RAJ FAMILY RD: Payout Received Early */}
          {isPayoutEarly && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Advance Chit Payout Received (Active Obligation)</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                You have already received the lump-sum pot payout in advance. However, <strong>5 monthly installments</strong> are still pending and must be paid as committed!
              </p>
              <div className="flex items-center justify-between text-[11px] text-amber-400/80 pt-1 font-mono-num">
                <span>Paid: 10 / 15 Months</span>
                <span className="font-bold text-amber-300">Remaining to Pay: 5 Months (₹12,500)</span>
              </div>
            </div>
          )}

          {/* PARTNERSHIP SPLIT (SPLIT OF 2 OR 3) CARD: CLEAR INVESTMENT & RETURN SHARE */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Investment & Return Split Details</span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      ({isShared ? `${rd.myShareFraction || '1/3'} Share` : 'Solo 100%'})
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isShared ? `Combined with ${partnersCount - 1} friend${partnersCount > 2 ? 's' : ''}` : 'Individual account'}
                  </span>
                </div>
              </div>

              {onUpdateRD && (
                <button
                  type="button"
                  onClick={() => setIsEditingSplit(!isEditingSplit)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{isEditingSplit ? 'Cancel' : 'Change Split (2 or 3)'}</span>
                </button>
              )}
            </div>

            {/* Side-by-Side: Investment Share vs Return Share */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Box 1: Monthly Investment Share */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Monthly Investment Share
                </span>
                <div className="text-sm sm:text-base font-extrabold font-mono-num text-emerald-400 block">
                  ₹{rd.monthlyAmount.toLocaleString('en-IN')}/mo
                </div>
                {isShared ? (
                  <div className="text-[10px] text-slate-400 space-y-0.5 pt-0.5">
                    <div>Your Share: <strong className="text-white">{rd.myShareFraction}</strong> of Pool</div>
                    <div className="text-slate-500">Total Pool: ₹{poolMonthly.toLocaleString('en-IN')}/mo</div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500">Solo 100% Contribution</div>
                )}
              </div>

              {/* Box 2: Maturity Return Share */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">
                  Maturity Return Share
                </span>
                <div className="text-sm sm:text-base font-extrabold font-mono-num text-cyan-300 block">
                  ₹{userReturnShare.toLocaleString('en-IN')}
                </div>
                {isShared ? (
                  <div className="text-[10px] text-slate-400 space-y-0.5 pt-0.5">
                    <div>Your Share: <strong className="text-white">{rd.myShareFraction}</strong> of Payout</div>
                    <div className="text-slate-500">Total Return: ₹{poolReturn.toLocaleString('en-IN')}</div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500">Target Maturity: ₹{rd.targetAmount.toLocaleString('en-IN')}</div>
                )}
              </div>
            </div>

            {/* Devi RD Company Deduction Explainer */}
            {rd.excludeMonthIndexFromReturn && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Devi RD Month 2 Company Deduction Rule:</span>
                </div>
                <p className="text-[10px] leading-relaxed">
                  Month 2 payment was retained by the company as registration/commission fee. It is strictly excluded from your return calculations and eligible return principal!
                </p>
              </div>
            )}

            {/* Interactive Split Editor Panel */}
            {isEditingSplit && (
              <form onSubmit={handleSaveSplit} className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Configure Split: 2 or 3 Friends</span>
                  </span>
                  <span className="text-[10px] text-cyan-400">Updates share & returns</span>
                </div>

                {/* Split Option Selector */}
                <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSplitMode('solo')}
                    className={`py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      splitMode === 'solo'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('split2')}
                    className={`py-1 text-[11px] font-semibold rounded-lg transition-colors ${
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
                    className={`py-1 text-[11px] font-semibold rounded-lg transition-colors ${
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
                    className={`py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      splitMode === 'custom'
                        ? 'bg-purple-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {splitMode !== 'solo' && (
                  <div className="space-y-2 pt-1 text-xs">
                    {splitMode === 'custom' && (
                      <div>
                        <label className="text-slate-400 block mb-1">Number of Partners</label>
                        <input
                          type="number"
                          min="2"
                          max="20"
                          value={customPartners}
                          onChange={(e) => setCustomPartners(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1">Total Pool Monthly (₹)</label>
                        <input
                          type="number"
                          value={poolMonthlyInput}
                          onChange={(e) => setPoolMonthlyInput(e.target.value)}
                          placeholder="e.g. 21000"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Total Pool Return (₹)</label>
                        <input
                          type="number"
                          value={poolReturnInput}
                          onChange={(e) => setPoolReturnInput(e.target.value)}
                          placeholder="e.g. 216000"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Live Preview calculation */}
                    <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 flex justify-between">
                      <span>Your Monthly: <strong>₹{Math.round((parseFloat(poolMonthlyInput) || 0) / (splitMode === 'split2' ? 2 : splitMode === 'split3' ? 3 : (parseInt(customPartners, 10) || 3))).toLocaleString('en-IN')}</strong></span>
                      <span>Your Return: <strong>₹{Math.round((parseFloat(poolReturnInput) || 0) / (splitMode === 'split2' ? 2 : splitMode === 'split3' ? 3 : (parseInt(customPartners, 10) || 3))).toLocaleString('en-IN')}</strong></span>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-300">
                      <input
                        type="checkbox"
                        checked={excludeMonth2}
                        onChange={(e) => setExcludeMonth2(e.target.checked)}
                        className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Exclude Month 2 company deduction from return (Devi RD rule)</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingSplit(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    Save Partnership Split
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 4 Core Status KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Months Sent */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 font-medium block">Months Sent</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold font-mono-num text-emerald-400">
                  {monthsSent}
                </span>
                <span className="text-xs text-slate-500 font-mono-num">
                  {isPerpetual ? 'ongoing' : `/ ${rd.totalTenureMonths}`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {isPerpetual ? 'Continuous' : `${percentComplete}% paid`}
              </span>
            </div>

            {/* Remaining Months */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 font-medium block">Remaining</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                {isPerpetual ? (
                  <span className="text-xl font-bold font-mono text-purple-400">∞</span>
                ) : (
                  <span className={`text-lg font-bold font-mono-num ${isPayoutEarly ? 'text-amber-400' : 'text-slate-200'}`}>
                    {monthsRemaining}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {isPerpetual ? 'Perpetual' : 'mos'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
                {isPerpetual ? 'No end date' : isPayoutEarly ? '5 mos owed' : 'to finish'}
              </span>
            </div>

            {/* Total Deposited */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 font-medium block">
                {isShared ? 'My Share Sent' : 'Total Deposited'}
              </span>
              <span className="text-base font-bold font-mono-num text-white mt-0.5 block truncate">
                ₹{totalInvestedSoFar.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                ₹{rd.monthlyAmount.toLocaleString('en-IN')}/mo
              </span>
            </div>

            {/* Return / Status Display */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
              <span className="text-[10px] text-slate-400 font-medium block">Maturity Return</span>
              {isClosed ? (
                <>
                  <span className="text-base font-bold font-mono-num text-emerald-400 mt-0.5 block truncate">
                    ₹{rd.actualReturnReceived?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium block">
                    +{rd.gainLossPercentage}% Gain
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-300 mt-1 block">
                    ₹{userReturnShare.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {isShared ? `${rd.myShareFraction} of Pool` : 'Target Return'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visual Timeline Progress Bar */}
          <div className="space-y-2 p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Visual Timeline Progress</span>
              <span className="font-mono text-emerald-400 font-bold">
                {isPerpetual ? '∞ Ongoing' : `${monthsSent} / ${rd.totalTenureMonths} Mos (${percentComplete}%)`}
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isPerpetual 
                    ? 'bg-purple-500 w-full' 
                    : isPayoutEarly 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                }`}
                style={{ width: `${percentComplete}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
              <span>Start: {rd.startDate}</span>
              <span>{isPerpetual ? 'Open-Ended Perpetual' : `Target: ${rd.maturityDate}`}</span>
            </div>
          </div>

          {/* Close & Record Actual Return Section (When User gets return) */}
          {!isClosed ? (
            <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              {!showCloseForm ? (
                <div className="flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-300 block">Close RD & Record Actual Return</span>
                    <span className="text-[11px] text-slate-400">
                      Add actual return when received to see final gain/loss %.
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCloseForm(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700"
                  >
                    Close RD
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecordClosure} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Record Final Return Received</span>
                    <button
                      type="button"
                      onClick={() => setShowCloseForm(false)}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Actual return amount in ₹ (Your share)"
                      value={actualReturnInput}
                      onChange={(e) => setActualReturnInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-emerald-400"
                    >
                      Save Return & Gain %
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-emerald-300 block">Settled & Completed</span>
                <span className="text-[11px] text-slate-400">
                  Actual Return: ₹{rd.actualReturnReceived?.toLocaleString('en-IN')}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm">
                +{rd.gainLossPercentage}% Gain
              </span>
            </div>
          )}

          {/* Step-by-Step Installment Timeline Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Installment History & Schedule
              </h3>
              <span className="text-[10px] text-slate-400">
                {monthsSent} of {isPerpetual ? '∞' : rd.totalTenureMonths} Paid
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {rd.history.map((item) => {
                const isPaid = item.status === 'paid';
                const isCompanyCommission = item.isExcludedFromReturn;

                return (
                  <div
                    key={item.monthIndex}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors ${
                      isPaid
                        ? 'bg-slate-950/80 border-slate-800/80 text-white'
                        : 'bg-slate-900/40 border-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isPaid
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isPaid ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <span className="text-[10px] font-mono">{item.monthIndex}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-200">
                            {item.month}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            (Month {item.monthIndex})
                          </span>
                          {isCompanyCommission && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Company Commission
                            </span>
                          )}
                        </div>
                        {item.note && (
                          <span className="text-[10px] text-amber-300/80 truncate block">
                            {item.note}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono-num font-bold text-xs">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <div className="text-[9px] text-slate-500">
                        {isPaid ? (item.paidDate ? `Paid ${item.paidDate}` : 'Paid') : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action: Mark Next Month Paid */}
          {!isClosed && !isPayoutEarly && monthsSent < rd.totalTenureMonths && onMarkMonthPaid && (
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onMarkMonthPaid(rd.id)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all active:scale-98 shadow-md shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Month {monthsSent + 1} Paid (₹{rd.monthlyAmount.toLocaleString('en-IN')})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
