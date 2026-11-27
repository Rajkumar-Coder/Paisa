import { 
  CategoryBudget, 
  LoanEMI, 
  RecurringDeposit, 
  Transaction, 
  ExpectedExpenseItem,
  MonthSalaryRecord,
  SalarySplitCriteria
} from '../types/finance';
import { generateFingerprint } from '../utils/statementParser';

export const INITIAL_CATEGORIES: CategoryBudget[] = [
  { id: 'cat_basic', name: 'Basic & Bills', monthlyLimit: 30000, color: '#3b82f6', iconName: 'Home', isDefault: true },
  { id: 'cat_loan', name: 'Loan & Debt Support', monthlyLimit: 16000, color: '#ef4444', iconName: 'ShieldAlert', isDefault: true },
  { id: 'cat_investment', name: 'Investment & RDs', monthlyLimit: 25000, color: '#10b981', iconName: 'TrendingUp', isDefault: true },
  { id: 'cat_emi', name: 'Card & Device EMIs', monthlyLimit: 35000, color: '#8b5cf6', iconName: 'CreditCard', isDefault: true },
  { id: 'cat_food', name: 'Food & Dining', monthlyLimit: 12000, color: '#f59e0b', iconName: 'Utensils', isDefault: true },
  { id: 'cat_travel', name: 'Fuel & Travel', monthlyLimit: 9000, color: '#06b6d4', iconName: 'Car', isDefault: true },
  { id: 'cat_entertainment', name: 'Entertainment & Subs', monthlyLimit: 5000, color: '#ec4899', iconName: 'Tv', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping & Home Goods', monthlyLimit: 15000, color: '#6366f1', iconName: 'ShoppingBag', isDefault: true },
  { id: 'cat_additional', name: 'Additional & Family Occasions', monthlyLimit: 15000, color: '#64748b', iconName: 'Layers', isDefault: true },
];

/**
 * Expected mandatory expenses at the start of the month (from PDF page 1, 8, 11)
 */
export const EXPECTED_MANDATORY_EXPENSES: ExpectedExpenseItem[] = [
  { id: 'exp_home', area: 'Home Rent / Basic Expense', expectedAmount: 16100, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Monthly mandatory family base' },
  { id: 'exp_maint', area: 'Home Maintenance', expectedAmount: 1600, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Apartment monthly maintenance' },
  { id: 'exp_paint', area: 'Home Maintenance (Paint)', expectedAmount: 1500, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Installment till Sept 2026' },
  { id: 'exp_dad', area: 'Dad Monthly Expense', expectedAmount: 2500, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Monthly family allowance' },
  { id: 'exp_aishu', area: 'Aishu Allowance', expectedAmount: 2500, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Monthly allowance' },
  { id: 'exp_dad_mob', area: 'Dad Airtel Mobile Recharge', expectedAmount: 211, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Monthly Airtel plan' },
  { id: 'exp_ott', area: 'OTT (YouTube + Netflix)', expectedAmount: 498, category: 'Entertainment & Subs', isMandatory: true, status: 'done', note: 'YouTube ₹299 + Netflix ₹199' },
  { id: 'exp_wifi', area: 'Jio / BSNL WiFi Broadband', expectedAmount: 1060.82, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'High speed fiber' },
  { id: 'exp_tneb', area: 'TNEB Electricity Bill', expectedAmount: 2312, category: 'Basic & Bills', isMandatory: true, status: 'done', note: 'Summer bill varies' },
  { id: 'exp_loan', area: 'Loan Support Installment', expectedAmount: 3000, category: 'Loan & Debt Support', isMandatory: true, status: 'done', note: 'Mandatory 30-mo support plan' },
  { id: 'exp_home_rd', area: 'Home - Family RD', expectedAmount: 10000, category: 'Investment & RDs', isMandatory: true, status: 'done', note: 'Installment 1-30' },
  { id: 'exp_raj_rd', area: 'Raj - Family RD (Chit)', expectedAmount: 2500, category: 'Investment & RDs', isMandatory: true, status: 'done', note: '5 remaining payments' },
  { id: 'exp_devi_rd', area: 'Devi RD (My 1/3rd Share)', expectedAmount: 7000, category: 'Investment & RDs', isMandatory: true, status: 'done', note: '3-way partnership pool' },
  { id: 'exp_uti_sip', area: 'UTI Nifty 50 Index Fund SIP', expectedAmount: 6000, category: 'Investment & RDs', isMandatory: true, status: 'done', note: 'Automated 2nd of month' },
];

export const INITIAL_RDS: RecurringDeposit[] = [
  // 1. DEVI RD: Combined with 2 friends, user's share is 1/3rd. 2nd month is company charge excluded from return!
  {
    id: 'rd_devi_shared',
    title: 'Devi RD (3-Way Shared with 2 Friends)',
    institution: 'Bank Registered RD / Chit',
    category: 'shared_rd',
    investmentTypeLabel: '🤝 3-Way Shared RD (1/3rd My Share)',
    isShared: true,
    totalPartners: 3,
    myShareFraction: '1/3',
    totalPoolMonthlyAmount: 21000, // Total pool collected from all 3 friends
    monthlyAmount: 7000, // User's 1/3rd share
    totalTenureMonths: 36,
    monthsPaid: 18,
    excludeMonthIndexFromReturn: 2, // Month 2 is for company so excluded from return calculation!
    startDate: '2024-11-15',
    maturityDate: '2027-11-15',
    targetAmount: 72000, // User's 1/3 share of payout
    totalPoolTargetAmount: 216000, // Full 3-partner maturity pool
    myShareReturnAmount: 72000, // My 1/3rd share of return
    notes: 'Combined with 2 friends (1/3rd share = ₹7,000/mo). Month 2 was taken by company as commission, so it is strictly excluded from return calculation.',
    history: Array.from({ length: 36 }, (_, i) => {
      const idx = i + 1;
      const isPaid = idx <= 18;
      const isCompanyMonth = idx === 2;
      const date = new Date(2024, 10 + i, 15);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return {
        month: monthStr,
        monthIndex: idx,
        amount: 7000,
        status: isPaid ? 'paid' : ('pending' as const),
        paidDate: isPaid ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-15` : undefined,
        isExcludedFromReturn: isCompanyMonth,
        note: isCompanyMonth ? '⚠️ Month 2: Company Commission (Excluded from payout return)' : undefined,
      };
    }),
  },

  // 2. RAJ - FAMILY RD: Payout already received in advance (orange badge), 5 installments still need to be paid!
  {
    id: 'rd_raj_family',
    title: 'Raj - Family RD (Chit Auction)',
    institution: 'Family Savings Group',
    category: 'family_rd',
    investmentTypeLabel: '👨‍👩‍👧 Family RD (Payout Received Early)',
    monthlyAmount: 2500,
    totalTenureMonths: 15,
    monthsPaid: 10,
    isPayoutReceivedEarly: true,
    payoutAmountReceived: 37500,
    payoutNote: 'Money already received in advance from chit pot. Still 5 mandatory monthly installments remaining to be paid!',
    startDate: '2025-07-01',
    maturityDate: '2026-10-01',
    targetAmount: 37500,
    notes: 'Payout received early. Currently paid 10 of 15 installments; remaining 5 months are actively owed.',
    history: [
      { month: 'Jul 2025', monthIndex: 1, amount: 2500, status: 'paid', paidDate: '2025-07-10' },
      { month: 'Aug 2025', monthIndex: 2, amount: 2500, status: 'paid', paidDate: '2025-08-10' },
      { month: 'Sep 2025', monthIndex: 3, amount: 2500, status: 'paid', paidDate: '2025-09-10' },
      { month: 'Oct 2025', monthIndex: 4, amount: 2500, status: 'paid', paidDate: '2025-10-10' },
      { month: 'Nov 2025', monthIndex: 5, amount: 2500, status: 'paid', paidDate: '2025-11-10' },
      { month: 'Dec 2025', monthIndex: 6, amount: 2500, status: 'paid', paidDate: '2025-12-10' },
      { month: 'Jan 2026', monthIndex: 7, amount: 2500, status: 'paid', paidDate: '2026-01-10' },
      { month: 'Feb 2026', monthIndex: 8, amount: 2500, status: 'paid', paidDate: '2026-02-10' },
      { month: 'Mar 2026', monthIndex: 9, amount: 2500, status: 'paid', paidDate: '2026-03-10' },
      { month: 'Apr 2026', monthIndex: 10, amount: 2500, status: 'paid', paidDate: '2026-04-10', note: '💰 Payout Received from Pot' },
      { month: 'May 2026', monthIndex: 11, amount: 2500, status: 'pending', note: 'Pending installment 11' },
      { month: 'Jun 2026', monthIndex: 12, amount: 2500, status: 'pending', note: 'Pending installment 12' },
      { month: 'Jul 2026', monthIndex: 13, amount: 2500, status: 'pending', note: 'Pending installment 13' },
      { month: 'Aug 2026', monthIndex: 14, amount: 2500, status: 'pending', note: 'Pending installment 14' },
      { month: 'Sep 2026', monthIndex: 15, amount: 2500, status: 'pending', note: 'Final installment 15' },
    ],
  },

  // 3. STOCK MARKET / INDEX FUND SIP: Perpetual Ongoing SIP (shows ∞ instead of 0 or 10 mos)
  {
    id: 'sip_uti_nifty50',
    title: 'Groww - UTI Nifty 50 Direct Index SIP',
    institution: 'Groww Mutual Funds',
    category: 'stock_market',
    investmentTypeLabel: '📈 Perpetual Equity SIP (∞ Ongoing)',
    monthlyAmount: 6000,
    totalTenureMonths: 999, // Perpetual
    monthsPaid: 18,
    isPerpetual: true,
    startDate: '2024-10-01',
    maturityDate: 'Open-Ended (∞)',
    targetAmount: 0,
    notes: 'Perpetual index equity SIP. No fixed maturity or remaining end date (∞). Automated debit on 2nd of each month.',
    history: Array.from({ length: 18 }, (_, i) => {
      const idx = i + 1;
      const d = new Date(2024, 9 + i, 1);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthIndex: idx,
        amount: 6000,
        status: 'paid' as const,
        paidDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-02`,
      };
    }),
  },

  // 4. STOCK MARKET DIRECT (Groww Stocks): Perpetual
  {
    id: 'sip_stocks_market',
    title: 'Groww - Stock Market Equity Investment',
    institution: 'Groww Direct Stocks',
    category: 'stock_market',
    investmentTypeLabel: '📈 Stock Market Equity (∞ Ongoing)',
    monthlyAmount: 2500,
    totalTenureMonths: 999,
    monthsPaid: 14,
    isPerpetual: true,
    startDate: '2025-01-01',
    maturityDate: 'Open-Ended (∞)',
    targetAmount: 0,
    notes: 'Direct equity portfolio allocation. Ongoing perpetual wealth compounding (∞).',
    history: Array.from({ length: 14 }, (_, i) => {
      const idx = i + 1;
      const d = new Date(2025, 0 + i, 5);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthIndex: idx,
        amount: 2500,
        status: 'paid' as const,
        paidDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-05`,
      };
    }),
  },

  // 5. GOLD DEPOSIT - HDFC RD: Completed & Settled with Actual Returns
  {
    id: 'rd_gold_hdfc',
    title: 'Gold Deposit - HDFC RD',
    institution: 'HDFC Bank',
    category: 'gold_rd',
    investmentTypeLabel: '🪙 Gold Bullion RD (Physical Gold)',
    monthlyAmount: 5000,
    totalTenureMonths: 12,
    monthsPaid: 12,
    startDate: '2024-03-01',
    maturityDate: '2025-03-01',
    targetAmount: 60000,
    goldGrams: 10.02,
    isClosed: true,
    actualReturnReceived: 65003.75,
    gainLossPercentage: 37.38,
    notes: 'Matured & Settled! 10.02 grams physical gold accumulated. Profit: +37.38% (Gain ₹22,494.90).',
    history: [
      { month: 'Apr 2024', monthIndex: 1, amount: 5000, status: 'paid', paidDate: '2024-04-05' },
      { month: 'May 2024', monthIndex: 2, amount: 5000, status: 'paid', paidDate: '2024-05-05' },
      { month: 'Jun 2024', monthIndex: 3, amount: 5000, status: 'paid', paidDate: '2024-06-05' },
      { month: 'Jul 2024', monthIndex: 4, amount: 5000, status: 'paid', paidDate: '2024-07-05' },
      { month: 'Aug 2024', monthIndex: 5, amount: 5000, status: 'paid', paidDate: '2024-08-05' },
      { month: 'Sep 2024', monthIndex: 6, amount: 5000, status: 'paid', paidDate: '2024-09-05' },
      { month: 'Oct 2024', monthIndex: 7, amount: 5000, status: 'paid', paidDate: '2024-10-05' },
      { month: 'Nov 2024', monthIndex: 8, amount: 5000, status: 'paid', paidDate: '2024-11-05' },
      { month: 'Dec 2024', monthIndex: 9, amount: 5000, status: 'paid', paidDate: '2024-12-05' },
      { month: 'Jan 2025', monthIndex: 10, amount: 5000, status: 'paid', paidDate: '2025-01-05' },
      { month: 'Feb 2025', monthIndex: 11, amount: 5000, status: 'paid', paidDate: '2025-02-05' },
      { month: 'Mar 2025', monthIndex: 12, amount: 5000, status: 'paid', paidDate: '2025-03-05' },
    ],
  },

  // 6. HOME - FAMILY RD (1-30): Long-term
  {
    id: 'rd_home_family',
    title: 'Home - Family RD (Installment 1-30)',
    institution: 'Post Office / Bank RD',
    category: 'family_rd',
    investmentTypeLabel: '🏠 Home Long-term Family RD',
    monthlyAmount: 10000,
    totalTenureMonths: 30,
    monthsPaid: 21,
    startDate: '2024-09-01',
    maturityDate: '2027-02-01',
    targetAmount: 300000,
    notes: 'Home long-term RD. ₹10,000 debited each month. 21 of 30 installments complete.',
    history: Array.from({ length: 30 }, (_, i) => {
      const idx = i + 1;
      const isPaid = idx <= 21;
      const date = new Date(2024, 8 + i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return {
        month: monthStr,
        monthIndex: idx,
        amount: 10000,
        status: isPaid ? 'paid' : ('pending' as const),
        paidDate: isPaid ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-05` : undefined,
      };
    }),
  },
];

export const INITIAL_EMIS: LoanEMI[] = [
  {
    id: 'emi_ac_home',
    title: 'AC - Home (2026-2027)',
    borrowerOrItem: 'Home Air Conditioner',
    actualAmount: 37000,
    monthlyEMI: 6394.82,
    totalEMIs: 6,
    paidEMIs: 4,
    startMonth: 'Aug 2026',
    endMonth: 'Jan 2027',
    principalAmount: 10848,
    interestAmount: 1028,
    gstAmount: 238.86,
    processingFee: 299,
    paymentMode: 'credit_card',
    cardOrLender: 'HDFC Millennia Credit Card',
    isSettled: false,
    notes: 'EMI processing fee ₹299 + SGST ₹26.91 + CGST ₹26.91. 4 of 6 paid.',
  },
  {
    id: 'emi_tvs_scooty',
    title: 'TVS Scooty - Iswarya (2026-2027)',
    borrowerOrItem: 'TVS Scooty Vehicle',
    actualAmount: 150000,
    monthlyEMI: 12500,
    totalEMIs: 12,
    paidEMIs: 6,
    startMonth: 'Aug 2026',
    endMonth: 'Jul 2027',
    principalAmount: 150000,
    interestAmount: 0,
    gstAmount: 0,
    processingFee: 0,
    paymentMode: 'debit_card',
    cardOrLender: 'Auto Debit Account',
    isSettled: false,
    notes: 'Monthly ₹12,500 direct principal debit. 6 of 12 paid.',
  },
  {
    id: 'emi_mac_mini',
    title: 'Mac Mini - Rajkumar (2026)',
    borrowerOrItem: 'Apple Mac Mini M2',
    actualAmount: 49900,
    monthlyEMI: 8759.78,
    totalEMIs: 6,
    paidEMIs: 6,
    startMonth: 'May 2026',
    endMonth: 'Oct 2026',
    principalAmount: 41321,
    interestAmount: 2432,
    gstAmount: 473.58,
    processingFee: 199,
    paymentMode: 'credit_card',
    cardOrLender: 'ICICI Amazon Pay Credit Card',
    isSettled: true,
    notes: 'Fully paid off! 6 of 6 EMIs completed.',
  },
  {
    id: 'emi_nothing_akash',
    title: 'Nothing 2A Plus - Akash',
    borrowerOrItem: 'Smartphone for Akash',
    actualAmount: 24058,
    monthlyEMI: 2874.67,
    totalEMIs: 9,
    paidEMIs: 8,
    startMonth: 'Nov 2025',
    endMonth: 'Jul 2026',
    principalAmount: 24058,
    interestAmount: 1653.51,
    gstAmount: 295.5,
    processingFee: 299,
    paymentMode: 'credit_card',
    cardOrLender: 'HDFC Credit Card',
    isSettled: false,
    notes: 'EMI closing value ₹20,999. 8 of 9 paid.',
  },
  {
    id: 'emi_kerala_trip',
    title: 'Kerala Trip - Kovalam / Alleppey',
    borrowerOrItem: 'Vacation Travel Expenses',
    actualAmount: 38208,
    monthlyEMI: 7567.33,
    totalEMIs: 3,
    paidEMIs: 3,
    startMonth: 'Aug 2026',
    endMonth: 'Oct 2026',
    principalAmount: 38208,
    interestAmount: 0,
    gstAmount: 0,
    processingFee: 0,
    paymentMode: 'credit_card',
    cardOrLender: 'Shared Card Split',
    isSettled: true,
    notes: 'Trip split with Bala and Kalai. Completed.',
  },
  {
    id: 'emi_kalai_loan',
    title: 'Kalai Bhai - Loan Support',
    borrowerOrItem: 'Emergency Family Loan',
    actualAmount: 25000,
    monthlyEMI: 8333.33,
    totalEMIs: 3,
    paidEMIs: 3,
    startMonth: 'Feb 2027',
    endMonth: 'Apr 2027',
    principalAmount: 25000,
    interestAmount: 0,
    gstAmount: 0,
    processingFee: 0,
    paymentMode: 'debit_card',
    cardOrLender: 'Direct Bank Transfer',
    isSettled: true,
    notes: 'Completed in 3 scheduled installments.',
  },
];

/**
 * Helper to compute Credit Card billing cycle month based on 13th cutoff.
 * If date <= 13th, it belongs to current month's bill.
 * If date > 13th, it rolls into the next month's bill cycle.
 * For example: Jan 14 - Feb 13 -> bill generated Feb 13th -> Feb expenses!
 */
export function getCreditCardCycleMonth(dateStr: string): string {
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = parseInt(yStr);
  const m = parseInt(mStr);
  const d = parseInt(dStr);

  if (d <= 13) {
    // Current month bill
    return `${y}-${String(m).padStart(2, '0')}`;
  } else {
    // Rolls into next month's bill!
    const nextDate = new Date(y, m, 1); // m is 1-indexed so month + 1
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  }
}

// Helper to construct transactions
const rawTxns = [
  // March 2026
  { date: '2026-03-01', amount: 16500, desc: 'Home - Family Monthly Expense', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-01', amount: 1600, desc: 'Home - Maintenance', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-01', amount: 1500, desc: 'Home - Maintenance (Paint 19-24)', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-02', amount: 2500, desc: 'Home - Dad Monthly Expense', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-02', amount: 2500, desc: 'Home - Aishu Allowance', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-03', amount: 1300, desc: 'Home - Amma Expense', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-03-05', amount: 3000, desc: 'Loan Support Installment 20-30', cat: 'Loan & Debt Support', mode: 'debit_card', type: 'loan', isExp: true },
  { date: '2026-03-05', amount: 10000, desc: 'Home - Family RD 20-30', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-03-07', amount: 6000, desc: 'UTI Nifty 50 Index Fund Direct SIP', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-03-08', amount: 2500, desc: 'Raj - Family RD Month 10', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-03-08', amount: 7000, desc: 'Devi RD (My 1/3rd Share)', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-03-10', amount: 299, desc: 'Subscription - YouTube Premium', cat: 'Entertainment & Subs', mode: 'credit_card', type: 'expense', isExp: true },
  { date: '2026-03-10', amount: 199, desc: 'Subscription - Netflix Monthly', cat: 'Entertainment & Subs', mode: 'credit_card', type: 'expense', isExp: true },
  { date: '2026-03-11', amount: 1060.82, desc: 'Jio Fiber - WiFi Broadband Bill', cat: 'Basic & Bills', mode: 'credit_card', type: 'expense', isExp: true },
  { date: '2026-03-12', amount: 3148.62, desc: 'Petrol + LPG Fuel Swipe', cat: 'Fuel & Travel', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-03-14', amount: 1143.42, desc: 'Jones Expense Payment', cat: 'Additional & Family Occasions', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-03-16', amount: 1137.00, desc: 'Dheva Transfer / Payment', cat: 'Additional & Family Occasions', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-03-18', amount: 1537.74, desc: 'Swiggy & Food Dining Swipes', cat: 'Food & Dining', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-03-20', amount: 8759.78, desc: 'Mac Mini - EMI 5 Monthly Debit', cat: 'Card & Device EMIs', mode: 'credit_card', type: 'emi', isExp: true },
  { date: '2026-03-22', amount: 5000.00, desc: "Vicky's Valagappu Celebration Gift", cat: 'Additional & Family Occasions', mode: 'debit_card', type: 'expense', isExp: false },

  // April 2026
  { date: '2026-04-01', amount: 16500, desc: 'Home - Family Monthly Expense', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-01', amount: 1600, desc: 'Home - Maintenance', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-01', amount: 1500, desc: 'Home - Maintenance (Paint 20-24)', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-02', amount: 2500, desc: 'Home - Dad Monthly Expense', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-02', amount: 2500, desc: 'Home - Aishu Allowance', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-03', amount: 6141, desc: 'TNEB Electricity Bill Payment', cat: 'Basic & Bills', mode: 'debit_card', type: 'expense', isExp: true },
  { date: '2026-04-05', amount: 3000, desc: 'Loan Support Installment 21-30', cat: 'Loan & Debt Support', mode: 'debit_card', type: 'loan', isExp: true },
  { date: '2026-04-05', amount: 10000, desc: 'Home - Family RD 21-30', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-04-06', amount: 6000, desc: 'UTI Nifty 50 Index Fund Direct SIP', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-04-06', amount: 2500, desc: 'Raj - Family RD Month 11', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-04-07', amount: 7000, desc: 'Devi RD (My 1/3rd Share)', cat: 'Investment & RDs', mode: 'debit_card', type: 'investment', isExp: true },
  { date: '2026-04-10', amount: 8404.82, desc: 'Petrol & LPG Cylinder Credit Swipe', cat: 'Fuel & Travel', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-04-12', amount: 8856.26, desc: 'Mac Mini Final EMI + Charges', cat: 'Card & Device EMIs', mode: 'credit_card', type: 'emi', isExp: true },
  { date: '2026-04-14', amount: 6417.00, desc: 'Food & Restaurant Outings Swipes', cat: 'Food & Dining', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-04-15', amount: 1548.80, desc: 'Movie Tickets & Snacks (PVR)', cat: 'Entertainment & Subs', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-04-16', amount: 3300.00, desc: 'Dheva Payment', cat: 'Additional & Family Occasions', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-04-18', amount: 3736.00, desc: 'Self Furniture & Household Order', cat: 'Shopping & Home Goods', mode: 'credit_card', type: 'expense', isExp: false },
  { date: '2026-04-20', amount: 20000.00, desc: 'Manoj Repayment / Family Support', cat: 'Loan & Debt Support', mode: 'debit_card', type: 'loan', isExp: false },
  { date: '2026-04-24', amount: 2100.00, desc: 'DR Mottai Function Expense', cat: 'Additional & Family Occasions', mode: 'debit_card', type: 'expense', isExp: false },
];

export const INITIAL_TRANSACTIONS: Transaction[] = rawTxns.map((t, idx) => {
  const fp = generateFingerprint(t.date, t.desc, t.amount, t.mode);
  const cycle = getCreditCardCycleMonth(t.date);
  return {
    id: `txn_init_${idx + 1}`,
    date: t.date,
    amount: t.amount,
    description: t.desc,
    category: t.cat,
    paymentMode: t.mode as any,
    type: t.type as any,
    fingerprint: fp,
    status: 'completed',
    isExpected: t.isExp,
    creditCycleMonth: cycle,
  };
});

export const SALARY_PROFILE = {
  currentCTC: 1346760,
  monthlyGross: 112230,
  monthlyTakeHome: 125608,
  annualEmployerBenefit: 23400,
  gratuity: 20100,
  creditCardBillDate: '13th of Every Month',
  creditCardDueDate: '02nd of Next Month',
  activeCreditCard: 'HDFC Millennia (..4291) & ICICI Amazon Pay (..8102)',
};

export const DEFAULT_SALARY_SPLIT: SalarySplitCriteria = {
  basicPct: 40,
  investmentPct: 10,
  loanEmiPct: 20,
  entertainmentPct: 10,
  additionalPct: 20,
};

export const INITIAL_MONTH_SALARIES: Record<string, MonthSalaryRecord> = {
  '2026-01': {
    month: '2026-01',
    salary: 125608,
    previousClosingBalance: 24500,
    startOfMonthAmount: 150108,
    actualDebits: 118400,
    closingBalance: 31708,
    isClosed: true,
    closedAt: '2026-01-31',
  },
  '2026-02': {
    month: '2026-02',
    salary: 125608,
    previousClosingBalance: 31708,
    startOfMonthAmount: 157316,
    actualDebits: 122150,
    closingBalance: 35166,
    isClosed: true,
    closedAt: '2026-02-28',
  },
  '2026-03': {
    month: '2026-03',
    salary: 125608,
    previousClosingBalance: 35166,
    startOfMonthAmount: 160774,
    actualDebits: 67347.16,
    closingBalance: 93426.84,
    isClosed: false,
  },
  '2026-04': {
    month: '2026-04',
    salary: 125608,
    previousClosingBalance: 93426.84,
    startOfMonthAmount: 219034.84,
    actualDebits: 84666.08,
    closingBalance: 134368.76,
    isClosed: false,
  },
};

export const SAMPLE_STATEMENTS = {
  // 1. Exact HDFC Millennia Credit Card Bill (Aug 14 - Sep 13, 2026 from user's PDF)
  hdfcCreditCardAugSep2026: `DATE & TIME,TRANSACTION DESCRIPTION,AMOUNT,TYPE,CARD
13/08/2026| 00:00,CGST-VPS2722641287310-RATE 9.0,28.62,Debit,Credit Card
13/08/2026| 00:00,SGST-VPS2722641287310-RATE 9.0,28.62,Debit,Credit Card
13/08/2026| 00:00,CGST-VPS2722641287314-RATE 9.0,58.86,Debit,Credit Card
13/08/2026| 00:00,SGST-VPS2722641287314-RATE 9.0,58.86,Debit,Credit Card
13/08/2026| 20:03,BOOKMYSHOW COMGURGAON,427.20,Debit,Credit Card
14/08/2026| 23:07,M S KINGS CHIC SIGNATUR TIRUNELVEL,2279.00,Debit,Credit Card
14/08/2026| 22:06,NETFLIX DI SIMUMBAI,199.00,Debit,Credit Card
15/08/2026| 01:04,GOOGLE PLAY CONTENT PUMUMBAI,299.00,Debit,Credit Card
19/08/2026| 13:17,MUTHAMIL HOSPITALTIRUNELVEL,535.00,Debit,Credit Card
19/08/2026| 23:44,ASSPLBangalore,1952.56,Debit,Credit Card
20/08/2026| 13:56,SWIGGY FOODBANGALORE,99.00,Debit,Credit Card
20/08/2026| 16:01,SWIGGY FOODBANGALORE,418.00,Debit,Credit Card
20/08/2026| 21:16,SWIGGY FOODBANGALORE,913.00,Debit,Credit Card
21/08/2026| 19:15,IRCTC MPPNEW DELHI,1081.56,Debit,Credit Card
21/08/2026| 18:53,IRCTC MPPNEW DELHI,1081.56,Debit,Credit Card
22/08/2026| 17:39,SwiggyBENGALURU,607.00,Debit,Credit Card
22/08/2026| 17:57,ELECTRA PETROLEUM ANDETIRUNELVELI,336.12,Debit,Credit Card
22/08/2026| 03:13,MYJIOMUMBAI,1060.82,Debit,Credit Card
24/08/2026| 13:34,SWIGGY FOODBANGALORE,745.00,Debit,Credit Card
28/08/2026| 18:59,ANISH PETRO FUEL SERVICTIRUNELVELI,1075.24,Debit,Credit Card
28/08/2026| 00:00,PETRO SURCHARGE WAIVER,10.65,Credit,Credit Card
29/08/2026| 19:47,SwiggyBENGALURU,494.00,Debit,Credit Card
29/08/2026| 15:56,ELECTRA PETROLEUM ANDETIRUNELVELI,2445.60,Debit,Credit Card
29/08/2026| 00:00,PETRO SURCHARGE WAIVER,24.21,Credit,Credit Card
31/08/2026| 17:46,CC PAYMENT 128178570593 PayZapp,49759.00,Credit,Credit Card
04/09/2026| 12:45,BALAJI MEDICALTIRUNELVEL (EMI),5085.00,Debit,Credit Card
05/09/2026| 20:09,M/S RADHA AGENCIESKanchipura,1010.00,Debit,Credit Card
05/09/2026| 00:00,PETRO SURCHARGE WAIVER,10.00,Credit,Credit Card
06/09/2026| 15:12,SwiggyBENGALURU,478.00,Debit,Credit Card
07/09/2026| 19:46,SWIGGY FOODBANGALORE,420.00,Debit,Credit Card
11/09/2026| 14:55,ELECTRA PETROLEUM ANDE Tirunelvel (EMI),2784.50,Debit,Credit Card
11/09/2026| 00:00,PETRO SURCHARGE WAIVER,27.57,Credit,Credit Card
12/09/2026| 17:00,CHANDRU FUELSTIRUNELVEL,315.94,Debit,Credit Card
13/09/2026| 00:00,OFFUS EMI PRIN NB:05 (Loan 139036641),8471.00,Debit,Credit Card
13/09/2026| 00:00,OFFUS EMI PRIN NB:02 (Loan 143298160),5460.00,Debit,Credit Card
13/09/2026| 00:00,OFFUS EMI INT NBR:05,213.00,Debit,Credit Card
13/09/2026| 00:00,OFFUS EMI INT NBR:02,374.00,Debit,Credit Card`,

  // 2. Exact HDFC Bank Savings/Debit Account Statement (Aug 01 - Aug 31, 2026 from user's PDF)
  hdfcDebitAccountAug2026: `Date,Narration,Withdrawal,Deposit,PaymentMode
01/08/26,UPI-JONES WESSLEY K-JONESWESSLEY@OKSBI,5000.00,,Debit Card
02/08/26,UPI-ESAKKIYAMMAL M-BHARATPE,40.00,,Debit Card
03/08/26,ATW-541919XXXXXX9569-CHTNU164-TIRUNELVELI ATM Cash,20000.00,,Debit Card
03/08/26,ATW-541919XXXXXX9569-CHTNU164-TIRUNELVELI ATM Cash,20000.00,,Debit Card
03/08/26,UPI-KALAISELVAN-9987917965@YBL-HDFC0000013,4000.00,,Debit Card
03/08/26,UPI-VV CATERING-Q835148977@YBL-YESB0YBLU,72.00,,Debit Card
03/08/26,UPI-DEEN PORATA STALL-Q479367642@YBL-YES,655.00,,Debit Card
03/08/26,UPI-VIGNESHWAR S-VIGNESHWARVICKY989,2240.00,,Debit Card
03/08/26,UPI-MS SUBBULAKSHMI K-SUBBULAKSHMIKATHIRES,18000.00,,Debit Card
04/08/26,UPI-BALAMURUGAN KATHIRES-KERALA TRIP,5960.33,,Debit Card
04/08/26,UPI-M MAHALINGAM-PAYTM,20.00,,Debit Card
04/08/26,IMPS-621618336714-RAJKUMARVELLAISWAMY-TMBL,,33000.00,Debit Card
05/08/26,UPI-MAHESWARI-MAHESWARIVELLAICHAMY@OKICICI,,8000.00,Debit Card
06/08/26,NEFT CR-SBIN0000TBU-ITDTAX REFUND 2026-27,,740.00,Debit Card
06/08/26,UPI-JEBASUNDARRAJ JACKSO-LAPTOP SERVICE,7000.00,,Debit Card
06/08/26,UPI-RAMAKRISHNAN J P-JPRAMAKRISHNANJPR,15000.00,,Debit Card
08/08/26,UPI-PSS CAR PARKING 2,10.00,,Debit Card
09/08/26,UPI-DEIVENDRAN S SENDING 1,,1.00,Debit Card
09/08/26,UPI-DEIVENDRAN S SENT USING PAYTM,,7000.00,Debit Card
15/08/26,UPI-XXXXXXXXXXX6388-TMBL0000139,500.00,,Debit Card
18/08/26,UPI-ISWARYALAKSHMI R-LAKSHMIISWARYA746,1000.00,,Debit Card
18/08/26,UPI-MANOJ BABURAJ PILLAI Support,6466.66,,Debit Card
21/08/26,UPI-MULTIPL FINTECH SOLU,1.00,,Debit Card
21/08/26,UPI-RAJKUMAR VELLAISWAMY Verification,,1.00,Debit Card
23/08/26,UPI-BALAN SUPER MARKET Groceries,729.00,,Debit Card
23/08/26,UPI-VV CATERING Food,80.00,,Debit Card
23/08/26,UPI-HOTEL MATHINA Dining,280.00,,Debit Card
23/08/26,UPI-SWIGGY INSTAMART Groceries,223.00,,Debit Card
25/08/26,UPI-RAMAKRISHNAN J Repayment,5000.00,,Debit Card
29/08/26,UPI-M S MUTTON SHOP Meat,300.00,,Debit Card
29/08/26,UPI-TEJASWENI MEDICALS Pharmacy,740.00,,Debit Card
31/08/26,FT- SALARY 2026-08 ZIFFITY SOLUTIONS PRIVATE LIMITED,,125608.00,Debit Card
31/08/26,UPI-PZ HDFC CC BILLPAY Millennia Card,49759.00,,Debit Card
31/08/26,IMPS-624322577078-DEIVENDRANS,,17210.00,Debit Card
31/08/26,UPI-KALAISELVAN-9987917965 DIEVENDANATHAN,17210.00,,Debit Card`,

  // 3. Full 1-Year Multi-Month Master Statement (All 12 Months of 2026 Ordered by Date)
  fullOneYearExport2026: `Date,Description,Amount,Type,PaymentMode
2026-01-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-01-02,Home - Maintenance & Apartment,1600.00,expense,debit_card
2026-01-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-01-05,Home - Family RD Installment,10000.00,investment,debit_card
2026-01-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-01-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-01-12,Jio Fiber - WiFi Broadband Bill,1060.82,expense,credit_card
2026-01-15,Swiggy & Dining Family Outing,1840.00,expense,credit_card
2026-01-20,Petrol + LPG Cylinder Credit Swipe,3250.00,expense,credit_card
2026-01-31,FT- SALARY 2026-01 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-02-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-02-02,Home - Maintenance & Apartment,1600.00,expense,debit_card
2026-02-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-02-05,Home - Family RD Installment,10000.00,investment,debit_card
2026-02-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-02-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-02-12,Jio Fiber - WiFi Broadband Bill,1060.82,expense,credit_card
2026-02-18,Car Service & Periodic Maintenance,4200.00,expense,debit_card
2026-02-28,FT- SALARY 2026-02 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-05-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-05-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-05-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-05-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-05-15,Temple Function & Family Contribution,5000.00,expense,debit_card
2026-05-31,FT- SALARY 2026-05 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-06-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-06-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-06-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-06-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-06-20,Swiggy & Food Dining Swipes,2150.00,expense,credit_card
2026-06-30,FT- SALARY 2026-06 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-07-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-07-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-07-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-07-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-07-22,Car Periodic Tyre & Oil Service,3800.00,expense,debit_card
2026-07-31,FT- SALARY 2026-07 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-09-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-09-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-09-07,UTI Nifty 50 Index Fund Direct SIP,6000.00,investment,debit_card
2026-09-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-09-30,FT- SALARY 2026-09 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-10-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-10-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-10-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-10-25,Diwali Celebration & Gifts,8500.00,expense,credit_card
2026-10-31,FT- SALARY 2026-10 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-11-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-11-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-11-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-11-30,FT- SALARY 2026-11 ZIFFITY SOLUTIONS,125608.00,income,debit_card
2026-12-01,Home - Family Monthly Base Expense,16100.00,expense,debit_card
2026-12-05,Devi RD (3-Way Shared 1/3rd Share),7000.00,investment,debit_card
2026-12-10,TVS Scooty Monthly EMI,12500.00,emi,debit_card
2026-12-31,FT- SALARY 2026-12 ZIFFITY SOLUTIONS,125608.00,income,debit_card`,
};
