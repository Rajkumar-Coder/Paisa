import React, { useState, useEffect } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { DashboardView } from './components/DashboardView';
import { RDTrackerView } from './components/RDTrackerView';
import { EMITrackerView } from './components/EMITrackerView';
import { TransactionListView } from './components/TransactionListView';
import { RecurringDepositModal } from './components/RecurringDepositModal';
import { StatementImportModal } from './components/StatementImportModal';
import { BudgetManagerModal } from './components/BudgetManagerModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { AddLoanModal } from './components/AddLoanModal';
import { EditLoanTenureModal } from './components/EditLoanTenureModal';
import { MonthClosureModal } from './components/MonthClosureModal';
import { SalaryAndCriteriaModal } from './components/SalaryAndCriteriaModal';
import { MobileInstallModal } from './components/MobileInstallModal';
import { DataManagementModal } from './components/DataManagementModal';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_EMIS, 
  INITIAL_RDS, 
  INITIAL_TRANSACTIONS,
  INITIAL_MONTH_SALARIES,
  DEFAULT_SALARY_SPLIT
} from './data/initialData';
import { 
  CategoryBudget, 
  LoanEMI, 
  ParsedRecordPreview, 
  RecurringDeposit, 
  Transaction,
  MonthSalaryRecord,
  SalarySplitCriteria
} from './types/finance';

const STORAGE_KEYS = {
  TXNS: 'paisapulse_transactions_v2',
  RDS: 'paisapulse_rds_v2',
  EMIS: 'paisapulse_emis_v2',
  CATEGORIES: 'paisapulse_categories_v2',
  SELECTED_MONTH: 'paisapulse_selected_month_v2',
  SALARIES: 'paisapulse_salaries_v2',
  SPLIT_CRITERIA: 'paisapulse_criteria_v2',
};

export default function App() {
  // Persistence state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TXNS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [rds, setRds] = useState<RecurringDeposit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RDS);
      return saved ? JSON.parse(saved) : INITIAL_RDS;
    } catch {
      return INITIAL_RDS;
    }
  });

  const [emis, setEmis] = useState<LoanEMI[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMIS);
      return saved ? JSON.parse(saved) : INITIAL_EMIS;
    } catch {
      return INITIAL_EMIS;
    }
  });

  const [categories, setCategories] = useState<CategoryBudget[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MONTH);
      return saved || '2026-03';
    } catch {
      return '2026-03';
    }
  });

  // Monthly Salaries & Rollover balances
  const [monthSalaries, setMonthSalaries] = useState<Record<string, MonthSalaryRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALARIES);
      return saved ? JSON.parse(saved) : INITIAL_MONTH_SALARIES;
    } catch {
      return INITIAL_MONTH_SALARIES;
    }
  });

  // 5-Criteria Percentage Split (40% / 10% / 20% / 10% / 20%)
  const [splitCriteria, setSplitCriteria] = useState<SalarySplitCriteria>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_CRITERIA);
      return saved ? JSON.parse(saved) : DEFAULT_SALARY_SPLIT;
    } catch {
      return DEFAULT_SALARY_SPLIT;
    }
  });

  // UI Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedRD, setSelectedRD] = useState<RecurringDeposit | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isBudgetsOpen, setIsBudgetsOpen] = useState<boolean>(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState<boolean>(false);
  const [isMonthClosureOpen, setIsMonthClosureOpen] = useState<boolean>(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [selectedLoanForEdit, setSelectedLoanForEdit] = useState<LoanEMI | null>(null);

  const handleClearAllData = () => {
    setTransactions([]);
    setEmis([]);
    setRds([]);
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonthKey);
    try {
      localStorage.setItem(STORAGE_KEYS.TXNS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EMIS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.RDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, currentMonthKey);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRestoreSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setEmis(INITIAL_EMIS);
    setRds(INITIAL_RDS);
    setCategories(INITIAL_CATEGORIES);
    setMonthSalaries(INITIAL_MONTH_SALARIES);
    setSplitCriteria(DEFAULT_SALARY_SPLIT);
    setSelectedMonth('2026-03');
  };

  const handleImportBackup = (data: any) => {
    if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (data.emis && Array.isArray(data.emis)) setEmis(data.emis);
    if (data.rds && Array.isArray(data.rds)) setRds(data.rds);
    if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
    if (data.monthSalaries) setMonthSalaries(data.monthSalaries);
    if (data.splitCriteria) setSplitCriteria(data.splitCriteria);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TXNS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage limit reached', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RDS, JSON.stringify(rds));
    } catch (e) {
      console.warn(e);
    }
  }, [rds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMIS, JSON.stringify(emis));
    } catch (e) {
      console.warn(e);
    }
  }, [emis]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn(e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MONTH, selectedMonth);
    } catch (e) {
      console.warn(e);
    }
  }, [selectedMonth]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALARIES, JSON.stringify(monthSalaries));
    } catch (e) {
      console.warn(e);
    }
  }, [monthSalaries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPLIT_CRITERIA, JSON.stringify(splitCriteria));
    } catch (e) {
      console.warn(e);
    }
  }, [splitCriteria]);

  // Keep selected RD updated if RD state modifies
  useEffect(() => {
    if (selectedRD) {
      const current = rds.find(r => r.id === selectedRD.id);
      if (current) setSelectedRD(current);
    }
  }, [rds]);

  // Calculate overspending count for selected month
  const categorySpends: Record<string, number> = {};
  transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .forEach(t => {
      const cat = t.category || 'Additional & Family Occasions';
      categorySpends[cat] = (categorySpends[cat] || 0) + t.amount;
    });

  const overspendingCount = categories.filter(c => {
    const spent = categorySpends[c.name] || 0;
    return spent > c.monthlyLimit;
  }).length;

  // HANDLERS
  const handleImportConfirm = (newRecords: ParsedRecordPreview[]) => {
    const newTxns: Transaction[] = newRecords.map(rec => ({
      id: `txn_imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: rec.date,
      amount: rec.amount,
      description: rec.description,
      category: rec.category,
      paymentMode: rec.paymentMode,
      type: rec.type,
      tags: rec.tags,
      creditCycleMonth: rec.creditCycleMonth,
      fingerprint: rec.fingerprint,
      status: 'completed',
    }));

    // 1. Combine and sort all transactions strictly chronologically by date
    setTransactions(prev => {
      const combined = [...newTxns, ...prev];
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    // 2. Extract all distinct months affected by imported records to fill previous records
    const importedMonths = Array.from(new Set(newRecords.map(r => r.date.slice(0, 7)))).sort();

    setMonthSalaries(prevSalaries => {
      const updatedSalaries = { ...prevSalaries };

      importedMonths.forEach(m => {
        // Calculate debits for this month from all new and existing transactions
        const existingTxnsInMonth = transactions.filter(t => t.date.startsWith(m) && t.type !== 'income');
        const newTxnsInMonth = newTxns.filter(t => t.date.startsWith(m) && t.type !== 'income');
        const monthDebit = [...existingTxnsInMonth, ...newTxnsInMonth].reduce((sum, t) => sum + t.amount, 0);

        const existing = updatedSalaries[m];
        if (existing) {
          const newClosing = existing.startOfMonthAmount - monthDebit;
          updatedSalaries[m] = {
            ...existing,
            actualDebits: monthDebit,
            closingBalance: newClosing,
          };
        } else {
          // Fill previous month records in app as requested!
          const defaultSalary = 125608;
          const prevClosing = 30000;
          const startOfMo = defaultSalary + prevClosing;
          const closing = startOfMo - monthDebit;

          updatedSalaries[m] = {
            month: m,
            salary: defaultSalary,
            previousClosingBalance: prevClosing,
            startOfMonthAmount: startOfMo,
            actualDebits: monthDebit,
            closingBalance: closing,
            isClosed: m < selectedMonth, // Past months automatically set to closed/settled
            closedAt: m < selectedMonth ? `${m}-28` : undefined,
          };
        }
      });

      return updatedSalaries;
    });
  };

  const handleAddTransaction = (newTxn: Transaction) => {
    setTransactions(prev => [newTxn, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleMarkRDMonthPaid = (rdId: string) => {
    const targetRD = rds.find(r => r.id === rdId);
    if (!targetRD || targetRD.monthsPaid >= targetRD.totalTenureMonths) return;

    const nextMonthIndex = targetRD.monthsPaid + 1;
    const nowStr = new Date().toISOString().slice(0, 10);

    const updatedRds = rds.map(rd => {
      if (rd.id === rdId) {
        const updatedHistory = rd.history.map(item => {
          if (item.monthIndex === nextMonthIndex) {
            return {
              ...item,
              status: 'paid' as const,
              paidDate: nowStr,
            };
          }
          return item;
        });

        return {
          ...rd,
          monthsPaid: nextMonthIndex,
          history: updatedHistory,
        };
      }
      return rd;
    });

    setRds(updatedRds);

    // Also auto-log transaction to passbook
    const logDate = `${selectedMonth}-05`;
    const newTxn: Transaction = {
      id: `txn_rd_${Date.now()}`,
      date: logDate,
      amount: targetRD.monthlyAmount,
      description: `${targetRD.title} (Installment ${nextMonthIndex}/${targetRD.totalTenureMonths})`,
      category: 'Investment & RDs',
      paymentMode: 'debit_card',
      type: 'investment',
      fingerprint: `${logDate}_${targetRD.title}_${targetRD.monthlyAmount}_rd`,
      status: 'completed',
    };
    setTransactions(prev => [newTxn, ...prev]);
  };

  const handleCloseInvestment = (rdId: string, actualReturn: number, gainLossPct: number) => {
    setRds(prev => prev.map(r => {
      if (r.id === rdId) {
        return {
          ...r,
          isClosed: true,
          actualReturnReceived: actualReturn,
          gainLossPercentage: gainLossPct,
        };
      }
      return r;
    }));
  };

  const handleMarkEMIPaid = (emiId: string) => {
    const targetEMI = emis.find(e => e.id === emiId);
    if (!targetEMI || targetEMI.isSettled) return;

    const newPaidCount = targetEMI.paidEMIs + 1;
    const isNowSettled = newPaidCount >= targetEMI.totalEMIs;

    setEmis(emis.map(e => {
      if (e.id === emiId) {
        return {
          ...e,
          paidEMIs: newPaidCount,
          isSettled: isNowSettled,
        };
      }
      return e;
    }));

    // Auto-log transaction
    const logDate = `${selectedMonth}-10`;
    const newTxn: Transaction = {
      id: `txn_emi_${Date.now()}`,
      date: logDate,
      amount: targetEMI.monthlyEMI,
      description: `${targetEMI.title} EMI #${newPaidCount}`,
      category: 'Card & Device EMIs',
      paymentMode: targetEMI.paymentMode,
      type: 'emi',
      fingerprint: `${logDate}_${targetEMI.title}_${targetEMI.monthlyEMI}_emi`,
      status: 'completed',
    };
    setTransactions(prev => [newTxn, ...prev]);
  };

  const handleAddRD = (newRD: RecurringDeposit) => {
    setRds(prev => [newRD, ...prev]);
  };

  const handleUpdateRD = (updatedRD: RecurringDeposit) => {
    setRds(prev => prev.map(r => r.id === updatedRD.id ? updatedRD : r));
    setSelectedRD(updatedRD);
  };

  const handleAddLoan = (newLoan: LoanEMI) => {
    setEmis(prev => [newLoan, ...prev]);
  };

  const handleUpdateLoan = (updatedLoan: LoanEMI) => {
    setEmis(prev => prev.map(e => e.id === updatedLoan.id ? updatedLoan : e));
  };

  // Salary & Month-Closure Handlers
  const handleUpdateSalary = (month: string, newSalary: number) => {
    setMonthSalaries(prev => {
      const existing = prev[month] || {
        month,
        salary: newSalary,
        previousClosingBalance: 35000,
        startOfMonthAmount: newSalary + 35000,
        actualDebits: 0,
        closingBalance: newSalary + 35000,
        isClosed: false,
      };

      const startOfMonth = newSalary + existing.previousClosingBalance;
      const closing = startOfMonth - existing.actualDebits;

      return {
        ...prev,
        [month]: {
          ...existing,
          salary: newSalary,
          startOfMonthAmount: startOfMonth,
          closingBalance: closing,
        },
      };
    });
  };

  const handleConfirmCloseMonth = (month: string, closingBalance: number, nextMonthSalary: number) => {
    // 1. Mark current month as closed
    const nowIso = new Date().toISOString();
    
    // 2. Compute next month key
    const [yStr, mStr] = month.split('-');
    const nextDate = new Date(parseInt(yStr, 10), parseInt(mStr, 10), 1);
    const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    setMonthSalaries(prev => {
      const currentRec = prev[month] || {
        month,
        salary: 125608,
        previousClosingBalance: 0,
        startOfMonthAmount: 125608,
        actualDebits: 0,
        closingBalance,
        isClosed: true,
      };

      const nextStartOfMonth = nextMonthSalary + closingBalance;

      return {
        ...prev,
        [month]: {
          ...currentRec,
          isClosed: true,
          closedAt: nowIso,
          closingBalance,
        },
        [nextMonthKey]: {
          month: nextMonthKey,
          salary: nextMonthSalary,
          previousClosingBalance: closingBalance,
          startOfMonthAmount: nextStartOfMonth,
          actualDebits: 0,
          closingBalance: nextStartOfMonth,
          isClosed: false,
        },
      };
    });

    // Advance to the new month
    setSelectedMonth(nextMonthKey);
  };

  const handleReopenMonth = (month: string) => {
    setMonthSalaries(prev => {
      if (!prev[month]) return prev;
      return {
        ...prev,
        [month]: {
          ...prev[month],
          isClosed: false,
          closedAt: undefined,
        },
      };
    });
  };

  // Helper to get active month salary record for modal
  const currentMonthRecord: MonthSalaryRecord = monthSalaries[selectedMonth] || {
    month: selectedMonth,
    salary: 125608,
    previousClosingBalance: 35000,
    startOfMonthAmount: 160608,
    actualDebits: 0,
    closingBalance: 160608,
    isClosed: false,
  };

  return (
    <AndroidFrame
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onOpenImport={() => setIsImportOpen(true)}
      onOpenBudgets={() => setIsBudgetsOpen(true)}
      onOpenInstallModal={() => setIsInstallModalOpen(true)}
      onOpenDataManagement={() => setIsDataModalOpen(true)}
      overspendingCount={overspendingCount}
    >
      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <DashboardView
          transactions={transactions}
          categories={categories}
          emis={emis}
          rds={rds}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onOpenBudgets={() => setIsBudgetsOpen(true)}
          onSelectRD={(rd) => setSelectedRD(rd)}
          onAddExpense={() => setIsAddExpenseOpen(true)}
          monthSalaries={monthSalaries}
          onUpdateSalary={handleUpdateSalary}
          onOpenMonthClosure={() => setIsMonthClosureOpen(true)}
          onOpenSalaryModal={() => setIsSalaryModalOpen(true)}
          splitCriteria={splitCriteria}
          onOpenAddLoan={() => setIsAddLoanOpen(true)}
          onOpenDataManagement={() => setIsDataModalOpen(true)}
        />
      )}

      {activeTab === 'rds' && (
        <RDTrackerView
          rds={rds}
          onSelectRD={(rd) => setSelectedRD(rd)}
          onAddRD={handleAddRD}
        />
      )}

      {activeTab === 'emis' && (
        <EMITrackerView
          emis={emis}
          onMarkEMIPaid={handleMarkEMIPaid}
          onOpenAddLoan={() => setIsAddLoanOpen(true)}
          onEditLoan={(loan) => setSelectedLoanForEdit(loan)}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionListView
          transactions={transactions}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          onDeleteTransaction={handleDeleteTransaction}
          onAddExpense={() => setIsAddExpenseOpen(true)}
        />
      )}

      {/* MODALS */}
      {/* 1. RD Timeline Progress Bar Modal */}
      <RecurringDepositModal
        rd={selectedRD}
        onClose={() => setSelectedRD(null)}
        onMarkMonthPaid={handleMarkRDMonthPaid}
        onCloseInvestment={handleCloseInvestment}
        onUpdateRD={handleUpdateRD}
      />

      {/* 2. Statement Import with Duplicate Detection Modal */}
      <StatementImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        existingTransactions={transactions}
        onImportConfirm={handleImportConfirm}
      />

      {/* 3. Budget & Category Manager Modal */}
      <BudgetManagerModal
        isOpen={isBudgetsOpen}
        onClose={() => setIsBudgetsOpen(false)}
        categories={categories}
        onUpdateCategory={setCategories}
        transactions={transactions}
        selectedMonth={selectedMonth}
      />

      {/* 4. Add Manual Expense Modal (with tags) */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        existingTransactions={transactions}
        selectedMonth={selectedMonth}
      />

      {/* 5. Add Loan & Tenure Modal */}
      <AddLoanModal
        isOpen={isAddLoanOpen}
        onClose={() => setIsAddLoanOpen(false)}
        onAddLoan={handleAddLoan}
      />

      {/* 5b. Edit Loan Tenure & EMIs Modal */}
      <EditLoanTenureModal
        isOpen={!!selectedLoanForEdit}
        loan={selectedLoanForEdit}
        onClose={() => setSelectedLoanForEdit(null)}
        onUpdateLoan={handleUpdateLoan}
      />

      {/* 6. Month End Closure & Confirmation Modal */}
      <MonthClosureModal
        isOpen={isMonthClosureOpen}
        onClose={() => setIsMonthClosureOpen(false)}
        currentMonth={selectedMonth}
        record={currentMonthRecord}
        onConfirmClose={handleConfirmCloseMonth}
        onReopenMonth={handleReopenMonth}
      />

      {/* 7. Salary & 5-Criteria Split Modal */}
      <SalaryAndCriteriaModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        currentMonth={selectedMonth}
        record={currentMonthRecord}
        onUpdateSalary={handleUpdateSalary}
        splitCriteria={splitCriteria}
        onUpdateCriteria={setSplitCriteria}
      />

      {/* 8. Download / Install on Mobile PWA & APK Modal */}
      <MobileInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onOpenDataManagement={() => setIsDataModalOpen(true)}
      />

      {/* 9. Data Management & Clean Slate Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        transactionsCount={transactions.length}
        emisCount={emis.length}
        rdsCount={rds.length}
        onClearAllData={handleClearAllData}
        onRestoreSampleData={handleRestoreSampleData}
        allAppData={{
          transactions,
          rds,
          emis,
          categories,
          monthSalaries,
          splitCriteria,
        }}
        onImportBackup={handleImportBackup}
      />
    </AndroidFrame>
  );
}
