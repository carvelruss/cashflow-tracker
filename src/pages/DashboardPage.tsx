import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Receipt, CreditCard, TrendingDown, PiggyBank,
  Wallet, Activity, Plus, ArrowRight,
} from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso, calcPercent } from '../utils/currency';
import { formatDate } from '../utils/date';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { PageLoader } from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { DashboardSummary } from '../types';
import { cn } from '../utils/cn';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  subtext?: string;
}

function SummaryCard({ title, value, icon, color, bg, subtext }: SummaryCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <span className={cn('w-5 h-5', color)}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        <p className={cn('text-xl font-bold mt-0.5 truncate', color)}>{formatPeso(value)}</p>
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</p>}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { activePeriod } = useBudgetPeriod();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    api.analytics.getSummary(activePeriod.id)
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [activePeriod?.id]);

  if (!activePeriod && !loading) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-6 h-6" />}
        title="No Budget Period"
        description="Create a budget period to start tracking your cashflow."
        action={<Link to="/budget-periods" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline"><Plus className="w-4 h-4" />Create Budget Period</Link>}
      />
    );
  }

  if (loading) return <PageLoader />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!summary) return null;

  const spendPct = calcPercent(summary.totalOutflows, summary.totalIncome);
  const isNegative = summary.netCashflow < 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Period header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div>
          <h1 className="page-title">{activePeriod!.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(activePeriod!.start_date)} – {formatDate(activePeriod!.end_date)}
          </p>
        </div>
        <div className="sm:ml-auto">
          <Badge variant={activePeriod!.status === 'active' ? 'success' : 'default'} size="md">
            {activePeriod!.status}
          </Badge>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard title="Total Income" value={summary.totalIncome} icon={<TrendingUp />} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
        <SummaryCard title="Total Bills" value={summary.totalBills} icon={<Receipt />} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" subtext={`${formatPeso(summary.totalPaidBills)} paid`} />
        <SummaryCard title="Total Expenses" value={summary.totalExpenses} icon={<CreditCard />} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-900/20" />
        <SummaryCard title="Debt Payments" value={summary.totalDebtPayments} icon={<TrendingDown />} color="text-violet-600 dark:text-violet-400" bg="bg-violet-50 dark:bg-violet-900/20" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryCard title="Savings" value={summary.totalSavingsContributions} icon={<PiggyBank />} color="text-sky-600 dark:text-sky-400" bg="bg-sky-50 dark:bg-sky-900/20" />
        <SummaryCard
          title="Left to Spend"
          value={summary.leftToSpend}
          icon={<Wallet />}
          color={summary.leftToSpend >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}
          bg={summary.leftToSpend >= 0 ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-red-50 dark:bg-red-900/20'}
        />
        <SummaryCard
          title="Net Cashflow"
          value={summary.netCashflow}
          icon={<Activity />}
          color={isNegative ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400'}
          bg={isNegative ? 'bg-red-50 dark:bg-red-900/20' : 'bg-primary-50 dark:bg-primary-900/20'}
        />
      </div>

      {/* Budget progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="section-title mb-4">Budget Usage</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">Total Spending</span>
                <span className="font-medium">{spendPct.toFixed(0)}% of income</span>
              </div>
              <ProgressBar value={spendPct} color={spendPct > 90 ? 'danger' : spendPct > 70 ? 'warning' : 'success'} size="md" />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>{formatPeso(summary.totalOutflows)} spent</span>
                <span>{formatPeso(summary.totalIncome)} income</span>
              </div>
            </div>

            {[
              { label: 'Bills', value: summary.totalBills, color: 'warning' as const },
              { label: 'Expenses', value: summary.totalExpenses, color: 'danger' as const },
              { label: 'Debt', value: summary.totalDebtPayments, color: 'purple' as const },
              { label: 'Savings', value: summary.totalSavingsContributions, color: 'sky' as const },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">{label}</span>
                  <span>{formatPeso(value)}</span>
                </div>
                <ProgressBar value={calcPercent(value, summary.totalIncome)} color={color} size="xs" />
              </div>
            ))}
          </div>
        </Card>

        {/* Quick links */}
        <Card>
          <h3 className="section-title mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Income', to: '/income', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
              { label: 'Add Bill', to: '/bills', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
              { label: 'Add Expense', to: '/expenses', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
              { label: 'View Analytics', to: '/analytics', color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' },
            ].map(({ label, to, color }) => (
              <Link
                key={to}
                to={to}
                className={cn('flex items-center justify-between rounded-xl p-3 text-sm font-medium transition-opacity hover:opacity-80', color)}
              >
                {label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
