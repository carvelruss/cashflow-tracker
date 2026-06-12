import { useEffect, useState, useCallback } from 'react';
import { Receipt, Plus, Edit2, Trash2, Search, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso } from '../utils/currency';
import { formatDate, isOverdue, isDueSoon } from '../utils/date';
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
import BillForm from '../components/bills/BillForm';
import type { Bill } from '../types';
import { BILL_CATEGORIES } from '../types';
import { cn } from '../utils/cn';

export default function BillsPage() {
  const { activePeriod } = useBudgetPeriod();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState<Bill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (statusFilter) params.status = statusFilter;
      const data = await api.bills.getAll(activePeriod.id, params);
      setBills(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [activePeriod?.id, search, category, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (bill: Bill) => {
    try { await api.bills.toggle(bill.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to update'); }
  };

  const handleCreate = async (data: Partial<Bill>) => { await api.bills.create(data); setShowAdd(false); await load(); };
  const handleUpdate = async (data: Partial<Bill>) => { if (!editing) return; await api.bills.update(editing.id, data); setEditing(null); await load(); };
  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await api.bills.delete(deleting.id); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete'); }
    finally { setDeleteLoading(false); }
  };

  const paid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const unpaid = bills.filter(b => b.status === 'unpaid').reduce((s, b) => s + b.amount, 0);
  const categoryOptions = BILL_CATEGORIES.map(c => ({ value: c, label: c }));

  if (!activePeriod) return <EmptyState icon={<Receipt className="w-6 h-6" />} title="No Budget Period Selected" />;
  if (loading && bills.length === 0) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bills</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span className="text-emerald-600 font-medium">{formatPeso(paid)} paid</span>
            {' · '}
            <span className="text-amber-600 font-medium">{formatPeso(unpaid)} unpaid</span>
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Bill</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col sm:flex-row gap-2">
        <Input placeholder="Search bills…" leftIcon={<Search className="w-4 h-4" />} value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select options={categoryOptions} placeholder="All categories" value={category} onChange={e => setCategory(e.target.value)} className="sm:w-44" />
        <Select options={[{ value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' }]} placeholder="All statuses" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-36" />
      </div>

      {bills.length === 0 && !loading ? (
        <EmptyState icon={<Receipt className="w-6 h-6" />} title="No bills found" action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Bill</Button>} />
      ) : (
        <Card padding="none">
          <CardHeader title="Bills" action={<span className="text-sm text-slate-500">{bills.length} items</span>} />
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {bills.map(bill => {
              const overdue = bill.status === 'unpaid' && isOverdue(bill.due_date);
              const soon = bill.status === 'unpaid' && !overdue && isDueSoon(bill.due_date);
              return (
                <div key={bill.id} className={cn('flex items-center gap-3 px-5 py-3', overdue && 'bg-red-50/50 dark:bg-red-900/10')}>
                  <button onClick={() => handleToggle(bill)} className="shrink-0 text-slate-400 hover:text-primary-600 transition-colors">
                    {bill.status === 'paid' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm font-medium truncate', bill.status === 'paid' && 'line-through text-slate-400')}>{bill.name}</p>
                      {overdue && <Badge variant="danger" size="sm">Overdue</Badge>}
                      {soon && <Badge variant="warning" size="sm">Due Soon</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{bill.category} · Due {formatDate(bill.due_date)}</p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{formatPeso(bill.amount)}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(bill)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleting(bill)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Bill">
        {activePeriod && <BillForm budgetPeriodId={activePeriod.id} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />}
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Bill">
        {editing && activePeriod && <BillForm bill={editing} budgetPeriodId={activePeriod.id} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Delete bill "${deleting?.name}"?`} />
    </div>
  );
}
