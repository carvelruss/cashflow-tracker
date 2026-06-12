import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso } from '../utils/currency';
import { formatDate } from '../utils/date';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import ExpenseForm from '../components/expenses/ExpenseForm';
import type { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../types';

const CATEGORY_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'sky'> = {
  Food: 'warning', Transportation: 'info', Shopping: 'purple', Entertainment: 'sky',
  Healthcare: 'success', Education: 'info', Utilities: 'default', 'Personal Care': 'purple', Miscellaneous: 'default',
};

export default function ExpensesPage() {
  const { activePeriod } = useBudgetPeriod();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const data = await api.expenses.getAll(activePeriod.id, params);
      setExpenses(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [activePeriod?.id, search, category]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Expense>) => { await api.expenses.create(data); setShowAdd(false); await load(); };
  const handleUpdate = async (data: Partial<Expense>) => { if (!editing) return; await api.expenses.update(editing.id, data); setEditing(null); await load(); };
  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await api.expenses.delete(deleting.id); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const catOptions = EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }));

  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  if (!activePeriod) return <EmptyState icon={<CreditCard className="w-6 h-6" />} title="No Budget Period Selected" />;
  if (loading && expenses.length === 0) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total: <span className="font-semibold text-red-600 dark:text-red-400">{formatPeso(total)}</span></p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Expense</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Category summary */}
      {Object.keys(byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <button key={cat} onClick={() => setCategory(category === cat ? '' : cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 text-xs font-medium hover:border-primary-400 transition-colors">
              <span>{cat}</span>
              <span className="text-slate-400">{formatPeso(amt)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Search expenses…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select options={catOptions} placeholder="All categories" value={category} onChange={e => setCategory(e.target.value)} className="sm:w-44" />
      </div>

      {expenses.length === 0 && !loading ? (
        <EmptyState icon={<CreditCard className="w-6 h-6" />} title="No expenses found" action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Expense</Button>} />
      ) : (
        <Card padding="none">
          <CardHeader title="Expenses" action={<span className="text-sm font-semibold text-red-600">{formatPeso(total)}</span>} />
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {expenses.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                    <Badge variant={CATEGORY_COLORS[item.category] ?? 'default'} size="sm">{item.category}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.date)}</p>
                </div>
                <p className="font-semibold text-red-600 dark:text-red-400 text-sm shrink-0">{formatPeso(item.amount)}</p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleting(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        {activePeriod && <ExpenseForm budgetPeriodId={activePeriod.id} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />}
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Expense">
        {editing && activePeriod && <ExpenseForm expense={editing} budgetPeriodId={activePeriod.id} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Delete "${deleting?.name}"?`} />
    </div>
  );
}
