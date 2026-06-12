import { useEffect, useState, useCallback } from 'react';
import { TrendingDown, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso, calcPercent } from '../utils/currency';
import { formatDate } from '../utils/date';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ProgressBar from '../components/ui/ProgressBar';
import { PageLoader } from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';
import DebtForm from '../components/debt/DebtForm';
import PaymentForm from '../components/debt/PaymentForm';
import type { Debt } from '../types';

export default function DebtPage() {
  const { activePeriod } = useBudgetPeriod();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    try { setDebts(await api.debts.getAll(activePeriod.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [activePeriod?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<Debt>) => { await api.debts.create(data); setShowAdd(false); await load(); };
  const handleUpdate = async (data: Partial<Debt>) => { if (!editing) return; await api.debts.update(editing.id, data); setEditing(null); await load(); };
  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await api.debts.delete(deleting.id); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
    finally { setDeleteLoading(false); }
  };
  const handlePayment = async (data: { amount: number; payment_date: string; notes?: string }) => {
    if (!paying) return;
    await api.debts.addPayment(paying.id, data);
    setPaying(null);
    await load();
  };

  const totalBalance = debts.reduce((s, d) => s + d.remaining_balance, 0);
  const totalOriginal = debts.reduce((s, d) => s + d.original_amount, 0);

  if (!activePeriod) return <EmptyState icon={<TrendingDown className="w-6 h-6" />} title="No Budget Period Selected" />;
  if (loading && debts.length === 0) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Debt</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Remaining: <span className="font-semibold text-violet-600 dark:text-violet-400">{formatPeso(totalBalance)}</span>
            {totalOriginal > 0 && <span className="ml-2 text-xs">({calcPercent(totalBalance, totalOriginal).toFixed(0)}% of original)</span>}
          </p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Debt</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {debts.length === 0 && !loading ? (
        <EmptyState icon={<TrendingDown className="w-6 h-6" />} title="No debts tracked" description="Add debts to track your repayment progress." action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Debt</Button>} />
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const paidPct = calcPercent(debt.original_amount - debt.remaining_balance, debt.original_amount);
            return (
              <Card key={debt.id}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{debt.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{debt.creditor}{debt.due_date ? ` · Due ${formatDate(debt.due_date)}` : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-violet-600 dark:text-violet-400">{formatPeso(debt.remaining_balance)}</p>
                        <p className="text-xs text-slate-400">of {formatPeso(debt.original_amount)}</p>
                      </div>
                    </div>
                    <ProgressBar value={paidPct} color="purple" size="sm" className="mb-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Monthly: <span className="font-medium">{formatPeso(debt.monthly_payment)}</span> · Paid off: <span className="font-medium">{paidPct.toFixed(0)}%</span></p>
                      <div className="flex gap-1">
                        <Button size="xs" variant="secondary" icon={<DollarSign className="w-3 h-3" />} onClick={() => setPaying(debt)}>Pay</Button>
                        <button onClick={() => setEditing(debt)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleting(debt)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Debt">
        {activePeriod && <DebtForm budgetPeriodId={activePeriod.id} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />}
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Debt">
        {editing && activePeriod && <DebtForm debt={editing} budgetPeriodId={activePeriod.id} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title="Record Payment">
        {paying && <PaymentForm debtName={paying.name} onSubmit={handlePayment} onCancel={() => setPaying(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Delete debt "${deleting?.name}"? This will also remove all payment history.`} />
    </div>
  );
}
