import { success, error } from '../../../_shared/response';
import type { Env } from '../../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data, request }) => {
  const userId = data.userId as string;
  const url = new URL(request.url);
  const periodId = url.searchParams.get('period_id');
  if (!periodId) return error('period_id is required');

  const period = await env.DB.prepare('SELECT * FROM budget_periods WHERE id = ? AND user_id = ?')
    .bind(periodId, userId).first();
  if (!period) return error('Budget period not found', 404);

  const [incomeResult, billsResult, expensesResult, debtsResult, debtPaymentsResult, savingsResult, savingsContribsResult] = await Promise.all([
    env.DB.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE budget_period_id = ? AND user_id = ?').bind(periodId, userId).first<{ total: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count, SUM(CASE WHEN status=\'paid\' THEN amount ELSE 0 END) as paid, SUM(CASE WHEN status=\'unpaid\' THEN amount ELSE 0 END) as unpaid FROM bills WHERE budget_period_id = ? AND user_id = ?').bind(periodId, userId).first<{ total: number; count: number; paid: number; unpaid: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE budget_period_id = ? AND user_id = ?').bind(periodId, userId).first<{ total: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(remaining_balance), 0) as total, COALESCE(SUM(monthly_payment), 0) as monthly FROM debts WHERE budget_period_id = ? AND user_id = ?').bind(periodId, userId).first<{ total: number; monthly: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(dp.amount), 0) as total FROM debt_payments dp JOIN debts d ON d.id = dp.debt_id WHERE d.budget_period_id = ? AND d.user_id = ?').bind(periodId, userId).first<{ total: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(target_amount), 0) as target, COALESCE(SUM(current_amount), 0) as current FROM savings_goals WHERE budget_period_id = ? AND user_id = ?').bind(periodId, userId).first<{ target: number; current: number }>(),
    env.DB.prepare('SELECT COALESCE(SUM(sc.amount), 0) as total FROM savings_contributions sc JOIN savings_goals sg ON sg.id = sc.savings_goal_id WHERE sg.budget_period_id = ? AND sg.user_id = ?').bind(periodId, userId).first<{ total: number }>(),
  ]);

  const totalIncome = incomeResult?.total ?? 0;
  const totalBills = billsResult?.total ?? 0;
  const totalPaidBills = billsResult?.paid ?? 0;
  const totalUnpaidBills = billsResult?.unpaid ?? 0;
  const totalExpenses = expensesResult?.total ?? 0;
  const totalDebtBalance = debtsResult?.total ?? 0;
  const totalMonthlyDebt = debtsResult?.monthly ?? 0;
  const totalDebtPayments = debtPaymentsResult?.total ?? 0;
  const totalSavingsTarget = savingsResult?.target ?? 0;
  const totalSavingsCurrent = savingsResult?.current ?? 0;
  const totalSavingsContributions = savingsContribsResult?.total ?? 0;

  const totalOutflows = totalBills + totalExpenses + totalDebtPayments + totalSavingsContributions;
  const leftToSpend = totalIncome - totalOutflows;
  const netCashflow = totalIncome - totalOutflows;

  return success({
    period,
    totalIncome,
    totalBills,
    totalPaidBills,
    totalUnpaidBills,
    totalExpenses,
    totalDebtBalance,
    totalMonthlyDebt,
    totalDebtPayments,
    totalSavingsTarget,
    totalSavingsCurrent,
    totalSavingsContributions,
    totalOutflows,
    leftToSpend,
    netCashflow,
  });
};
