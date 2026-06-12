import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Line, Area, AreaChart,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
import { useBudgetPeriod } from '../context/BudgetPeriodContext';
import { formatPeso, calcPercent } from '../utils/currency';
import Card, { CardHeader } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import ProgressBar from '../components/ui/ProgressBar';
import type { DashboardSummary, CashflowData } from '../types';

const COLORS = {
  income: '#10b981',
  bills: '#f59e0b',
  expenses: '#ef4444',
  debt: '#8b5cf6',
  savings: '#0ea5e9',
  cashflow: '#6366f1',
};

const tooltipStyle = {
  contentStyle: { backgroundColor: 'var(--tooltip-bg, #1e293b)', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' },
};

function PesoTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
      <p className="font-medium text-white mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300 capitalize">{p.name}:</span>
          <span className="font-semibold text-white">{formatPeso(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { activePeriod } = useBudgetPeriod();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cashflow, setCashflow] = useState<CashflowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePeriod) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.analytics.getSummary(activePeriod.id),
      api.analytics.getCashflow(),
    ]).then(([s, c]) => {
      setSummary(s);
      setCashflow(c);
    }).finally(() => setLoading(false));
  }, [activePeriod?.id]);

  if (!activePeriod) return <EmptyState icon={<BarChart3 className="w-6 h-6" />} title="No Budget Period Selected" />;
  if (loading) return <PageLoader />;
  if (!summary) return null;

  const spendingBreakdown = [
    { name: 'Bills', value: summary.totalBills, color: COLORS.bills },
    { name: 'Expenses', value: summary.totalExpenses, color: COLORS.expenses },
    { name: 'Debt', value: summary.totalDebtPayments, color: COLORS.debt },
    { name: 'Savings', value: summary.totalSavingsContributions, color: COLORS.savings },
  ].filter(d => d.value > 0);

  const budgetVsActual = [
    { name: 'Bills', budgeted: summary.totalBills, actual: summary.totalPaidBills },
    { name: 'Expenses', budgeted: summary.totalExpenses, actual: summary.totalExpenses },
    { name: 'Debt', budgeted: summary.totalMonthlyDebt, actual: summary.totalDebtPayments },
    { name: 'Savings', budgeted: summary.totalSavingsTarget, actual: summary.totalSavingsCurrent },
  ];

  const isPositive = summary.netCashflow >= 0;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activePeriod.name}</p>
      </div>

      {/* Left to Spend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2">
          <h3 className="section-title mb-4">Left to Spend</h3>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPeso(summary.leftToSpend)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {calcPercent(summary.leftToSpend, summary.totalIncome).toFixed(0)}% of {formatPeso(summary.totalIncome)} income
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Bills', value: summary.totalBills, color: 'warning' as const },
              { label: 'Expenses', value: summary.totalExpenses, color: 'danger' as const },
              { label: 'Debt Payments', value: summary.totalDebtPayments, color: 'purple' as const },
              { label: 'Savings', value: summary.totalSavingsContributions, color: 'sky' as const },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium">{formatPeso(value)} ({calcPercent(value, summary.totalIncome).toFixed(0)}%)</span>
                </div>
                <ProgressBar value={calcPercent(value, summary.totalIncome)} color={color} size="xs" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title mb-4">Net Cashflow</h3>
          <p className={`text-2xl font-bold mb-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{formatPeso(summary.netCashflow)}
          </p>
          <p className="text-xs text-slate-500 mb-4">Income minus all outflows</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Income</span><span className="text-emerald-600 font-medium">{formatPeso(summary.totalIncome)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Total Outflows</span><span className="text-red-600 font-medium">- {formatPeso(summary.totalOutflows)}</span></div>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
            <div className="flex justify-between font-semibold"><span>Net</span><span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>{formatPeso(summary.netCashflow)}</span></div>
          </div>
        </Card>
      </div>

      {/* Spending Breakdown */}
      {spendingBreakdown.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Spending Breakdown" />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={spendingBreakdown} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {spendingBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatPeso(v)} contentStyle={tooltipStyle.contentStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {spendingBreakdown.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 dark:text-slate-400">{d.name}: <span className="font-medium">{formatPeso(d.value)}</span></span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Budget vs Actual" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={budgetVsActual} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<PesoTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="budgeted" fill="#6366f1" radius={[4, 4, 0, 0]} name="Budgeted" />
                <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Cashflow Trend */}
      {cashflow.length > 1 && (
        <Card>
          <CardHeader title="Cashflow History" subtitle="Income vs outflows across all periods" />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.expenses} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.expenses} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<PesoTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="income" stroke={COLORS.income} fill="url(#incomeGrad)" strokeWidth={2} name="income" />
              <Area type="monotone" dataKey="outflows" stroke={COLORS.expenses} fill="url(#outflowGrad)" strokeWidth={2} name="outflows" />
              <Line type="monotone" dataKey="cashflow" stroke={COLORS.cashflow} strokeWidth={2} dot={false} name="cashflow" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Income Summary */}
      <Card>
        <CardHeader title="Income Summary" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Income', value: summary.totalIncome, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Total Outflows', value: summary.totalOutflows, color: 'text-red-600 dark:text-red-400' },
            { label: 'Left to Spend', value: summary.leftToSpend, color: summary.leftToSpend >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400' },
            { label: 'Savings Rate', value: calcPercent(summary.totalSavingsContributions, summary.totalIncome), color: 'text-sky-600 dark:text-sky-400', suffix: '%' },
          ].map(({ label, value, color, suffix }) => (
            <div key={label} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{suffix ? `${value.toFixed(1)}%` : formatPeso(value)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
