import React, { useState } from 'react';
import { X, PlusCircle, CreditCard, Building2, Calendar, Tag, FileText, CheckCircle2 } from 'lucide-react';
import { PaymentMode, Transaction, CategoryBudget, TransactionType } from '../types/finance';
import { generateFingerprint, detectDuplicate } from '../utils/statementParser';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryBudget[];
  onAddTransaction: (newTxn: Transaction) => void;
  existingTransactions: Transaction[];
  selectedMonth: string;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddTransaction,
  existingTransactions,
  selectedMonth,
}) => {
  const defaultDate = `${selectedMonth}-05`;
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState(categories[0]?.name || 'Basic & Bills');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('credit_card');
  const [type, setType] = useState<TransactionType>('expense');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const PRESET_TAGS = ['function', 'car service', 'medical', 'celebration', 'gift', 'home repair', 'emergency', 'one-time'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return;

    // Check duplicate
    const check = detectDuplicate({ date, description, amount: numAmount, paymentMode }, existingTransactions);
    if (check.isDuplicate && !duplicateWarning) {
      setDuplicateWarning(`${check.duplicateReason}. Click 'Add Anyway' if you really want to create this.`);
      return;
    }

    const fingerprint = generateFingerprint(date, description, numAmount, paymentMode);
    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      date,
      amount: numAmount,
      description: description.trim(),
      category,
      paymentMode,
      type,
      note: note.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      fingerprint,
      status: 'completed',
    };

    onAddTransaction(newTxn);
    onClose();
    setDescription('');
    setAmount('');
    setNote('');
    setSelectedTags([]);
    setCustomTagInput('');
    setDuplicateWarning(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Add Manual Expense
              </h2>
              <p className="text-xs text-slate-400">
                Log debit or credit card swipe, loan or investment payment
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

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {duplicateWarning && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300">
              <div className="font-bold flex items-center gap-1.5">
                ⚠️ Duplicate Warning
              </div>
              <p className="text-[11px] text-amber-200/90 mt-1">{duplicateWarning}</p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Payment Source
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('credit_card')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'credit_card'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Credit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('debit_card')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMode === 'debit_card'
                    ? 'bg-teal-500/15 border-teal-500/50 text-teal-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400'
                }`}
              >
                <Building2 className="w-4 h-4 text-teal-400" />
                Debit Card / Bank
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Description / Merchant *
            </label>
            <input
              type="text"
              placeholder="e.g. Petrol at Indian Oil, Home Groceries, Netflix"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Transaction Nature
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Direct Expense</option>
                <option value="investment">Investment / RD</option>
                <option value="loan">Loan Support</option>
                <option value="emi">Device / Card EMI</option>
              </select>
            </div>
          </div>

          {/* Unplanned / Occasion Tags */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Additional / Unplanned Tags
              </label>
              <span className="text-[10px] text-slate-500">
                Maps to Additional 20% criteria
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom tag (e.g. car service, wedding)"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0"
              >
                + Tag
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bill reference, shared split note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

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
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              {duplicateWarning ? 'Add Anyway' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
