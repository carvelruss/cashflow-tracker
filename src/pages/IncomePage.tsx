import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso } from '../utils/currency';
import { formatDate } from '../utils/date';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import IncomeForm from '../components/income/IncomeForm';
import type { Income } from '../types';

export default function IncomePage() {
  const { activePeriod } = useBudgetPeriod();
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleting, setDeleting] = useState<Income | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await api.income.getAll(activePeriod.id, search ? { search } : undefined);
      setIncome(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [activePeriod?.id, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Income>) => {
    await api.income.create(data);
    setShowAdd(false);
    await load();
  };

  const handleUpdate = async (data: Partial<Income>) => {
    if (!editing) return;
    await api.income.update(editing.id, data);
    setEditing(null);
    await load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await api.income.delete(deleting.id); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const total = income.reduce((s, i) => s + i.amount, 0);
  const isClosed = activePeriod?.status === 'closed';

  if (!activePeriod) return <EmptyState icon={<TrendingUp className="w-6 h-6" />} title="No Budget Period Selected" description="Select or create a budget period to manage income." />;
  if (loading && income.length === 0) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Income</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatPeso(total)}</span></p>
        </div>
        {!isClosed && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Income</Button>}
      </div>

      {isClosed && <Alert variant="warning">This period is closed and read-only. <Link to="/budget-periods" className="underline font-medium">Create a new period</Link> to add entries.</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <Input placeholder="Search income sources…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} />

      {income.length === 0 && !loading ? (
        <EmptyState icon={<TrendingUp className="w-6 h-6" />} title="No income entries" description="Add your first income entry for this period." />
      ) : (
        <Card padding="none">
          <CardHeader title="Income Entries" className="px-5 pt-5" />
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {income.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.source}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.date_received)}{item.description ? ` · ${item.description}` : ''}</p>
                </div>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm shrink-0">{formatPeso(item.amount)}</p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleting(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Income">
        {activePeriod && <IncomeForm budgetPeriodId={activePeriod.id} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />}
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Income">
        {editing && activePeriod && <IncomeForm income={editing} budgetPeriodId={activePeriod.id} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Delete income from "${deleting?.source}" (${formatPeso(deleting?.amount ?? 0)})?`} />
    </div>
  );
}
