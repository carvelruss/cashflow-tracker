import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, Lock, Edit2, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatDate, currentMonthStart, currentMonthEnd } from '../utils/date';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import type { BudgetPeriod } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine(d => d.start_date < d.end_date, { message: 'Start date must be before end date', path: ['end_date'] });
type FormData = z.infer<typeof schema>;

function PeriodForm({ period, onSubmit, onCancel }: { period?: BudgetPeriod; onSubmit: (d: FormData) => Promise<void>; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: period ? { name: period.name, start_date: period.start_date, end_date: period.end_date }
      : { start_date: currentMonthStart(), end_date: currentMonthEnd() },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Period Name" placeholder="e.g., June 2026 Budget" required error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" required error={errors.start_date?.message} {...register('start_date')} />
        <Input label="End Date" type="date" required error={errors.end_date?.message} {...register('end_date')} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>{period ? 'Update' : 'Create Period'}</Button>
      </div>
    </form>
  );
}

export default function BudgetPeriodsPage() {
  const { periods, refresh, setActivePeriod } = useBudgetPeriod();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<BudgetPeriod | null>(null);
  const [deleting, setDeleting] = useState<BudgetPeriod | null>(null);
  const [closing, setClosing] = useState<BudgetPeriod | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async (data: FormData) => {
    await api.budgetPeriods.create(data);
    await refresh();
    setShowAdd(false);
  };

  const handleUpdate = async (data: FormData) => {
    if (!editing) return;
    await api.budgetPeriods.update(editing.id, data);
    await refresh();
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setLoadingId(deleting.id);
    try { await api.budgetPeriods.delete(deleting.id); await refresh(); setDeleting(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to delete'); }
    finally { setLoadingId(null); }
  };

  const handleClose = async () => {
    if (!closing) return;
    setLoadingId(closing.id);
    try {
      const updated = await api.budgetPeriods.close(closing.id);
      await refresh();
      setActivePeriod(updated);
      setClosing(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to close'); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Periods</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your monthly budget periods</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>New Period</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {periods.length === 0 ? (
        <EmptyState icon={<Calendar className="w-6 h-6" />} title="No budget periods" description="Create your first budget period to start tracking." action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Create Period</Button>} />
      ) : (
        <div className="space-y-3">
          {periods.map(p => (
            <Card key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{p.name}</h3>
                  <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(p.start_date)} – {formatDate(p.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.status === 'active' && (
                  <Button size="sm" variant="ghost" icon={<Lock className="w-4 h-4" />} onClick={() => setClosing(p)}>Close</Button>
                )}
                <Button size="sm" variant="ghost" icon={<Edit2 className="w-4 h-4" />} onClick={() => setEditing(p)} />
                <Button size="sm" variant="ghost" icon={<Trash2 className="w-4 h-4 text-red-500" />} onClick={() => setDeleting(p)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Budget Period">
        <PeriodForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Budget Period">
        {editing && <PeriodForm period={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={loadingId === deleting?.id} message={`Delete "${deleting?.name}"? This will also delete all associated income, bills, expenses, debts, and savings.`} />
      <ConfirmDialog isOpen={!!closing} onClose={() => setClosing(null)} onConfirm={handleClose} loading={loadingId === closing?.id} title="Close Budget Period" message={`Close "${closing?.name}"? Closed periods are read-only but their data is preserved.`} confirmLabel="Close Period" />
    </div>
  );
}
