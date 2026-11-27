import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Calendar,
  Sparkles,
  ArrowUpDown,
  FileCheck,
  Loader2,
  Layers,
  Filter
} from 'lucide-react';
import { PaymentMode, Transaction, ParsedRecordPreview, StatementImportResult } from '../types/finance';
import { parseStatementContent } from '../utils/statementParser';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { SAMPLE_STATEMENTS } from '../data/initialData';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTransactions: Transaction[];
  onImportConfirm: (newTransactions: ParsedRecordPreview[]) => void;
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  existingTransactions,
  onImportConfirm,
}) => {
  const [statementText, setStatementText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('credit_card_bill.pdf');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('credit_card');
  const [parsedResult, setParsedResult] = useState<StatementImportResult | null>(null);
  const [filterDuplicateView, setFilterDuplicateView] = useState<'all' | 'new' | 'duplicates'>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [pdfExtractError, setPdfExtractError] = useState<string | null>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = (textToParse: string, name: string = fileName, mode: PaymentMode = paymentMode) => {
    if (!textToParse.trim()) {
      setParsedResult(null);
      return;
    }
    const result = parseStatementContent(textToParse, name, mode, existingTransactions);
    setParsedResult(result);
    setSelectedMonthFilter('all');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPdfExtractError(null);

    // Auto-detect mode based on file name
    let detectedMode: PaymentMode = paymentMode;
    if (/debit|bank|account|passbook|savings/i.test(file.name)) {
      detectedMode = 'debit_card';
      setPaymentMode('debit_card');
    } else if (/credit|card|bill|statement|millennia/i.test(file.name)) {
      detectedMode = 'credit_card';
      setPaymentMode('credit_card');
    }

    // Check if it's a PDF file
    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      try {
        setIsExtractingPdf(true);
        const extractedText = await extractTextFromPDF(file);
        setIsExtractingPdf(false);

        if (!extractedText.trim()) {
          setPdfExtractError('PDF extracted with no readable text. It might be a scanned image PDF.');
          return;
        }

        setStatementText(extractedText);
        handleParse(extractedText, file.name, detectedMode);
      } catch (err: any) {
        setIsExtractingPdf(false);
        setPdfExtractError(err?.message || 'Failed to extract text from PDF file. Please try pasting raw statement lines.');
      }
    } else {
      // Standard CSV or TXT file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setStatementText(text);
        handleParse(text, file.name, detectedMode);
      };
      reader.readAsText(file);
    }
  };

  const loadSample = (sampleKey: 'hdfcCreditCardAugSep2026' | 'hdfcDebitAccountAug2026' | 'fullOneYearExport2026') => {
    const content = SAMPLE_STATEMENTS[sampleKey];
    let name = 'HDFC_Millennia_CreditCard_Bill.pdf';
    let mode: PaymentMode = 'credit_card';

    if (sampleKey === 'hdfcDebitAccountAug2026') {
      name = 'HDFC_Debit_LastMonth_Account.pdf';
      mode = 'debit_card';
    } else if (sampleKey === 'fullOneYearExport2026') {
      name = 'Annual_MultiMonth_Export_2026.pdf';
      mode = 'debit_card';
    }

    setFileName(name);
    setPaymentMode(mode);
    setStatementText(content);
    handleParse(content, name, mode);
  };

  const toggleSelectRecord = (id: string) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      items: parsedResult.items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    });
  };

  const selectAllNew = () => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      items: parsedResult.items.map(item => ({
        ...item,
        selected: !item.isDuplicate,
      }))
    });
  };

  const deselectAll = () => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      items: parsedResult.items.map(item => ({
        ...item,
        selected: false,
      }))
    });
  };

  const handleConfirm = () => {
    if (!parsedResult) return;
    const selectedNewItems = parsedResult.items.filter(i => i.selected);
    if (selectedNewItems.length === 0) {
      alert('Please select at least one record to import.');
      return;
    }

    onImportConfirm(selectedNewItems);

    const monthsCount = new Set(selectedNewItems.map(i => i.date.slice(0, 7))).size;
    setImportNotification(
      `Successfully imported ${selectedNewItems.length} records across ${monthsCount} month(s)! Previous records & balances populated.`
    );

    setTimeout(() => {
      onClose();
      setParsedResult(null);
      setStatementText('');
      setImportNotification(null);
    }, 1400);
  };

  // Filter and sort items for display
  const displayItems = (parsedResult?.items || [])
    .filter(item => {
      // Duplicate filter
      if (filterDuplicateView === 'new' && item.isDuplicate) return false;
      if (filterDuplicateView === 'duplicates' && !item.isDuplicate) return false;

      // Month filter
      if (selectedMonthFilter !== 'all' && !item.date.startsWith(selectedMonthFilter)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortDirection === 'asc' ? cmp : -cmp;
    });

  const selectedCount = parsedResult?.items.filter(i => i.selected).length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Smart Statement Import</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  PDF & CSV Supported
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Import Credit Card statement or Debit Card last month spends by date across past year
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

        {/* Success Alert Banner if imported */}
        {importNotification && (
          <div className="p-4 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{importNotification}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Statement Type & Preset Buttons */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>1. Select Statement Type & Source</span>
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('credit_card');
                    if (statementText) handleParse(statementText, fileName, 'credit_card');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    paymentMode === 'credit_card'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Credit Card Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('debit_card');
                    if (statementText) handleParse(statementText, fileName, 'debit_card');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    paymentMode === 'debit_card'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Debit Card / Last Month Spends</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-sets for Instant Testing */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  One-Click Sample Statements (Fill Previous Records):
                </span>
                <span className="text-[10px] text-slate-500">Click to instantly populate</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => loadSample('hdfcCreditCardAugSep2026')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-emerald-400 flex items-center gap-1.5 transition-colors text-left"
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">💳 Credit Card Bill</p>
                    <p className="text-[10px] text-slate-400 truncate">HDFC Millennia (13th Cycle)</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('hdfcDebitAccountAug2026')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-teal-400 flex items-center gap-1.5 transition-colors text-left"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">🏦 Debit Card Spends</p>
                    <p className="text-[10px] text-slate-400 truncate">Last Month Bank Debits</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('fullOneYearExport2026')}
                  className="px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-purple-500/30 text-[11px] text-purple-300 flex items-center gap-1.5 transition-colors text-left"
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">📅 1-Year Full Statement</p>
                    <p className="text-[10px] text-slate-400 truncate">12-Month Past Spends</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Upload Drop Zone & Text Area */}
          <div className="space-y-2.5">
            <div className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-4 text-center transition-colors bg-slate-800/20 relative">
              <input
                type="file"
                id="statementFileInput"
                accept=".pdf,.csv,.txt,.json,.tsv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isExtractingPdf}
              />
              <label htmlFor="statementFileInput" className="cursor-pointer block">
                {isExtractingPdf ? (
                  <div className="py-2 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Extracting text pages from PDF statement...
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Parsing bank transactions and dates chronologically
                    </span>
                  </div>
                ) : (
                  <>
                    <FileText className="w-7 h-7 text-emerald-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-white block">
                      Click to Browse 1-Year or Monthly PDF / CSV Statement File
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Supports PDF statements from HDFC, SBI, ICICI, Axis, Kotak, Amex, or CSV/TXT exports
                    </span>
                  </>
                )}
              </label>
            </div>

            {pdfExtractError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{pdfExtractError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Or Paste Raw Statement / Bill Transactions (Ordered by Date)
                </label>
                {statementText && (
                  <button
                    onClick={() => {
                      setStatementText('');
                      setParsedResult(null);
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={statementText}
                onChange={(e) => {
                  setStatementText(e.target.value);
                  handleParse(e.target.value);
                }}
                rows={3}
                placeholder="Paste CSV rows or statement lines like:&#10;13/08/2026, BOOKMYSHOW GURGAON, 427.20, Debit, Credit Card&#10;01/08/26, UPI-JONES WESSLEY, 5000.00, , Debit Card"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Date-Sorted Analysis Panel */}
          {parsedResult && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {/* Date Span & Detection Summary Header */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Date-Ordered Statement Analysis</span>
                        {parsedResult.dateRange && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {parsedResult.dateRange.totalMonths} Month(s) Detected
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>Total: {parsedResult.totalParsed}</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-semibold">
                          {parsedResult.newCount} New
                        </span>
                        <span>·</span>
                        <span className="text-amber-400">
                          {parsedResult.duplicateCount} Duplicates
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date sort toggle */}
                  <button
                    type="button"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors self-start sm:self-auto"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Order: {sortDirection === 'asc' ? 'Oldest Date First' : 'Newest Date First'}</span>
                  </button>
                </div>

                {/* Date Span Banner */}
                {parsedResult.dateRange && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Date Range: {parsedResult.dateRange.startDate} to {parsedResult.dateRange.endDate}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      💡 Automatically fills & updates past records in your app upon import
                    </span>
                  </div>
                )}

                {/* Multi-Month Filter Chips (if statement spans multiple months) */}
                {parsedResult.monthsSummary && parsedResult.monthsSummary.length > 1 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" />
                        Filter Preview by Month:
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setSelectedMonthFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                          selectedMonthFilter === 'all'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        All Months ({parsedResult.totalParsed})
                      </button>
                      {parsedResult.monthsSummary.map(m => (
                        <button
                          key={m.month}
                          type="button"
                          onClick={() => setSelectedMonthFilter(m.month)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                            selectedMonthFilter === m.month
                              ? 'bg-purple-500 text-white font-bold'
                              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>{m.month}</span>
                          <span className="text-[10px] opacity-75">({m.count} · ₹{m.totalDebit.toLocaleString('en-IN')})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Duplicate Filter Controls & Batch Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterDuplicateView('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      filterDuplicateView === 'all'
                        ? 'bg-slate-700 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({parsedResult.totalParsed})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDuplicateView('new')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      filterDuplicateView === 'new'
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    New Only ({parsedResult.newCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDuplicateView('duplicates')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      filterDuplicateView === 'duplicates'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Duplicates ({parsedResult.duplicateCount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllNew}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    Select All New
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[11px] text-slate-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Records Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold z-10">
                    <tr>
                      <th className="p-2.5 w-8">#</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Category & Tags</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                          No transactions found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      displayItems.map((item) => (
                        <tr 
                          key={item.id}
                          onClick={() => toggleSelectRecord(item.id)}
                          className={`cursor-pointer transition-colors ${
                            item.isDuplicate 
                              ? 'bg-amber-950/15 hover:bg-amber-950/30' 
                              : item.selected 
                                ? 'bg-emerald-950/20 hover:bg-emerald-950/30' 
                                : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => toggleSelectRecord(item.id)}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/20 bg-slate-900"
                            />
                          </td>
                          <td className="p-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="p-2.5 font-medium text-slate-200">
                            <p className="truncate max-w-[180px] sm:max-w-[220px]" title={item.description}>
                              {item.description}
                            </p>
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                                {item.category}
                              </span>
                              {item.tags?.map(tag => (
                                <span key={tag} className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-300 bg-slate-800/80 font-mono">
                              {item.paymentMode === 'credit_card' ? 'Credit' : 'Debit'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-white font-mono whitespace-nowrap">
                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {item.isDuplicate ? (
                              <span 
                                title={item.duplicateReason}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium cursor-help"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                New Record
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {parsedResult ? (
              <span>
                Selected: <strong className="text-white">{selectedCount}</strong> records to import
              </span>
            ) : (
              <span>Upload a 1-year PDF or monthly statement to inspect records by date</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!parsedResult || selectedCount === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5"
            >
              <FileCheck className="w-4 h-4" />
              <span>Import {selectedCount > 0 ? `${selectedCount} Records` : 'Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
