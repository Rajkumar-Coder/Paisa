export type PaymentMode = 'debit_card' | 'credit_card' | 'bank_transfer' | 'cash' | 'upi';
export type TransactionType = 'expense' | 'investment' | 'loan' | 'emi' | 'income';

export type InvestmentCategoryType = 
  | 'bank_rd'
  | 'gold_rd'
  | 'family_rd'
  | 'shared_rd'
  | 'mutual_fund_sip'
  | 'stock_market';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  paymentMode: PaymentMode;
  type: TransactionType;
  note?: string;
  tags?: string[]; // e.g. "function", "car service", "medical", "celebration", "gift"
  fingerprint: string; // hash for duplicate detection
  statementRef?: string;
  status: 'completed' | 'pending' | 'settled';
  cardLast4?: string;
  isExpected?: boolean; // Part of start-of-month mandatory planned expenses
  creditCycleMonth?: string; // YYYY-MM based on 13th bill cutoff
}

export interface MonthlyHistoryItem {
  month: string; // e.g. "Mar 2026"
  monthIndex: number; // 1-indexed installment
  amount: number;
  status: 'paid' | 'pending' | 'due';
  paidDate?: string;
  note?: string;
  isExcludedFromReturn?: boolean; // For Devi RD 2nd month company deduction
}

export interface RecurringDeposit {
  id: string;
  title: string;
  institution: string;
  category: InvestmentCategoryType;
  investmentTypeLabel: string; // Distinct naming to avoid confusion
  monthlyAmount: number; // User's actual monthly share
  totalTenureMonths: number;
  monthsPaid: number;
  startDate: string;
  maturityDate: string;
  targetAmount: number;
  
  // Shared investment (Devi RD with 2 friends -> 1/3 share)
  isShared?: boolean;
  totalPartners?: number;
  myShareFraction?: string; // e.g. "1/3", "1/2"
  totalPoolMonthlyAmount?: number;
  totalPoolTargetAmount?: number;
  myShareReturnAmount?: number;
  
  // Devi RD company deduction on 2nd month
  excludeMonthIndexFromReturn?: number; // e.g. 2
  
  // Raj - Family RD early payout received
  isPayoutReceivedEarly?: boolean;
  payoutAmountReceived?: number;
  payoutNote?: string;
  
  // Perpetual stock market / index fund SIP
  isPerpetual?: boolean; // shows ∞ instead of remaining months
  
  // Settled / Closed return recording
  isClosed?: boolean;
  actualReturnReceived?: number;
  gainLossPercentage?: number;
  
  goldGrams?: number;
  notes?: string;
  history: MonthlyHistoryItem[];
}

export interface LoanEMI {
  id: string;
  title: string;
  borrowerOrItem: string;
  actualAmount: number;
  monthlyEMI: number;
  totalEMIs: number;
  paidEMIs: number;
  startMonth: string;
  endMonth: string;
  principalAmount: number;
  interestAmount: number;
  gstAmount: number;
  processingFee: number;
  paymentMode: 'credit_card' | 'debit_card';
  cardOrLender: string;
  isSettled: boolean;
  notes?: string;
}

export interface CategoryBudget {
  id: string;
  name: string;
  monthlyLimit: number;
  color: string;
  iconName: string;
  isDefault?: boolean;
}

export interface ExpectedExpenseItem {
  id: string;
  area: string;
  expectedAmount: number;
  actualAmount?: number;
  category: string;
  isMandatory: boolean;
  status: 'pending' | 'done' | 'overspent';
  note?: string;
}

/**
 * Monthly Salary & Rollover Record
 * Start of Month = Salary + Previous Month Closing Balance
 */
export interface MonthSalaryRecord {
  month: string; // YYYY-MM
  salary: number;
  previousClosingBalance: number;
  startOfMonthAmount: number; // salary + previousClosingBalance
  actualDebits: number;
  closingBalance: number; // startOfMonthAmount - actualDebits
  isClosed: boolean;
  closedAt?: string;
}

/**
 * Salary Split Criteria percentages (Must sum to 100%)
 * Default: Basic 40%, Investment 10%, Loans+EMI 20%, Entertainment 10%, Additional 20%
 */
export interface SalarySplitCriteria {
  basicPct: number; // 40
  investmentPct: number; // 10
  loanEmiPct: number; // 20
  entertainmentPct: number; // 10
  additionalPct: number; // 20
}

export interface ParsedRecordPreview {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMode: PaymentMode;
  fingerprint: string;
  tags?: string[];
  creditCycleMonth?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  matchedTransactionId?: string;
  selected: boolean;
}

export interface MonthImportSummary {
  month: string;
  count: number;
  totalDebit: number;
  newCount: number;
}

export interface StatementImportResult {
  fileName: string;
  totalParsed: number;
  newCount: number;
  duplicateCount: number;
  items: ParsedRecordPreview[];
  dateRange?: {
    startDate: string;
    endDate: string;
    totalMonths: number;
    monthsList: string[];
  };
  monthsSummary?: MonthImportSummary[];
}
