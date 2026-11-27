import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  SlidersHorizontal,
  DollarSign,
  TrendingDown,
  Check
} from 'lucide-react';
import { CategoryBudget, Transaction } from '../types/finance';

interface BudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryBudget[];
  onUpdateCategory: (updated: CategoryBudget[]) => void;
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
}

export const BudgetManagerModal: React.FC<BudgetManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategory,
  transactions,
  selectedMonth,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState('');

  if (!isOpen) return null;

  // Compute spend per category in selected month
  const categorySpends: Record<string, number> = {};
  transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .forEach(t => {
      const cat = t.category || 'Additional & Family Occasions';
      categorySpends[cat] = (categorySpends[cat] || 0) + t.amount;
    });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatLimit) return;
    const newCategory: CategoryBudget = {
      id: `cat_custom_${Date.now()}`,
      name: newCatName.trim(),
      monthlyLimit: parseFloat(newCatLimit),
      color: newCatColor,
      iconName: 'Tag',
      isDefault: false,
    };
    onUpdateCategory([...categories, newCategory]);
    setNewCatName('');
    setNewCatLimit('');
  };

  const handleSaveEdit = (catId: string) => {
    const val = parseFloat(editingLimit);
    if (!isNaN(val) && val > 0) {
      onUpdateCategory(
        categories.map(c => (c.id === catId ? { ...c, monthlyLimit: val } : c))
      );
    }
    setEditingId(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm('Delete this custom expense category?')) {
      onUpdateCategory(categories.filter(c => c.id !== catId));
    }
  };

  // Find all overspent categories
  const overspentList = categories.filter(c => {
    const spent = categorySpends[c.name] || 0;
    return spent > c.monthlyLimit;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Categories & Monthly Budgets
              </h2>
              <p className="text-xs text-slate-400">
                Set monthly limits and configure overspending threshold alerts
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Overspending Alert Banner */}
          {overspentList.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-rose-950/25 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2.5 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-200">
                  {overspentList.length} Categories Exceeded Monthly Budget!
                </span>
                <span className="text-[11px] text-rose-300/80">
                  {overspentList.map(o => o.name).join(', ')} exceeded allocated limits for {selectedMonth}.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All expense categories are within planned monthly budgets for {selectedMonth}.</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              Add Manual Expense Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Category Name (e.g. Healthcare)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <input
                type="number"
                placeholder="Monthly Budget Limit (₹)"
                value={newCatLimit}
                onChange={(e) => setNewCatLimit(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  title="Choose Category Color"
                />
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Add Budget
                </button>
              </div>
            </div>
          </form>

          {/* Categories List with Progress and Alerts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Active Category Budgets ({selectedMonth})
            </h3>

            <div className="space-y-2">
              {categories.map((cat) => {
                const spent = categorySpends[cat.name] || 0;
                const percent = Math.round((spent / cat.monthlyLimit) * 100);
                const isOver = spent > cat.monthlyLimit;
                const isWarning = !isOver && percent >= 80;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-2xl border transition-colors ${
                      isOver
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : isWarning
                        ? 'bg-amber-950/15 border-amber-500/40'
                        : 'bg-slate-800/40 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-bold text-white">
                          {cat.name}
                        </span>
                        {isOver && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Overspent +₹{(spent - cat.monthlyLimit).toLocaleString('en-IN')}
                          </span>
                        )}
                        {isWarning && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Near Limit ({percent}%)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {editingId === cat.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editingLimit}
                              onChange={(e) => setEditingLimit(e.target.value)}
                              className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-600 rounded text-xs text-white font-mono"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(cat.id)}
                              className="p-1 rounded bg-emerald-500 text-slate-950"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditingLimit(cat.monthlyLimit.toString());
                            }}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-mono-num text-[11px]"
                            title="Click to change monthly budget limit"
                          >
                            Limit: ₹{cat.monthlyLimit.toLocaleString('en-IN')}
                          </button>
                        )}

                        {!cat.isDefault && (
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete custom category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono-num">
                      <span>Spent: ₹{spent.toLocaleString('en-IN')}</span>
                      <span>{percent}% of ₹{cat.monthlyLimit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
