import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PiggyBank, Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';
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
import Badge from '../components/ui/Badge';
import SavingsForm from '../components/savings/SavingsForm';
import ContributionForm from '../components/savings/ContributionForm';
import type { SavingsGoal } from '../types';

export default function SavingsPage() {
  const { activePeriod } = useBudgetPeriod();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    try { setGoals(await api.savings.getAll(activePeriod.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [activePeriod?.id]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: Partial<SavingsGoal>) => { await api.savings.create(data); setShowAdd(false); await load(); };
  const handleUpdate = async (data: Partial<SavingsGoal>) => { if (!editing) return; await api.savings.update(editing.id, data); setEditing(null); await load(); };
  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try { await api.savings.delete(deleting.id); setDeleting(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed'); }
    finally { setDeleteLoading(false); }
  };
  const handleContribution = async (data: { amount: number; contribution_date: string; notes?: string }) => {
    if (!contributing) return;
    await api.savings.addContribution(contributing.id, data);
    setContributing(null);
    await load();
  };

  const totalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const isClosed = activePeriod?.status === 'closed';

  if (!activePeriod) return <EmptyState icon={<PiggyBank className="w-6 h-6" />} title="No Budget Period Selected" />;
  if (loading && goals.length === 0) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-semibold text-sky-600 dark:text-sky-400">{formatPeso(totalCurrent)}</span>
            {totalTarget > 0 && <span className="text-slate-400"> of {formatPeso(totalTarget)} target</span>}
          </p>
        </div>
        {!isClosed && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>Add Goal</Button>}
      </div>

      {isClosed && <Alert variant="warning">This period is closed and read-only. <Link to="/budget-periods" className="underline font-medium">Create a new period</Link> to add entries.</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {goals.length === 0 && !loading ? (
        <EmptyState icon={<PiggyBank className="w-6 h-6" />} title="No savings goals" description="Set savings goals and track your progress." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = calcPercent(goal.current_amount, goal.target_amount);
            const achieved = pct >= 100;
            return (
              <Card key={goal.id}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{goal.goal_name}</p>
                      {goal.target_date && <p className="text-xs text-slate-500">Target: {formatDate(goal.target_date)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {achieved && <Badge variant="success">Achieved!</Badge>}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{formatPeso(goal.current_amount)}</span>
                    <span className="text-slate-500">{formatPeso(goal.target_amount)}</span>
                  </div>
                  <ProgressBar value={pct} color={achieved ? 'success' : 'sky'} size="md" showLabel />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{formatPeso(goal.target_amount - goal.current_amount)} remaining</p>
                  <div className="flex gap-1">
                    {!isClosed && <Button size="xs" variant="secondary" icon={<PlusCircle className="w-3 h-3" />} onClick={() => setContributing(goal)}>Add</Button>}
                    <button onClick={() => setEditing(goal)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleting(goal)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Savings Goal">
        {activePeriod && <SavingsForm budgetPeriodId={activePeriod.id} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} />}
      </Modal>
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Savings Goal">
        {editing && activePeriod && <SavingsForm goal={editing} budgetPeriodId={activePeriod.id} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />}
      </Modal>
      <Modal isOpen={!!contributing} onClose={() => setContributing(null)} title="Add Contribution">
        {contributing && <ContributionForm goalName={contributing.goal_name} onSubmit={handleContribution} onCancel={() => setContributing(null)} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} loading={deleteLoading} message={`Delete savings goal "${deleting?.goal_name}"?`} />
    </div>
  );
}
