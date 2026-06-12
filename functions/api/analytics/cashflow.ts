import { success } from '../../_shared/response';
import type { Env } from '../../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const userId = data.userId as string;

  // Fetch the last 12 budget periods with their financial data
  const periods = await env.DB.prepare(
    'SELECT id, name, start_date, end_date FROM budget_periods WHERE user_id = ? ORDER BY start_date DESC LIMIT 12'
  ).bind(userId).all<{ id: string; name: string; start_date: string; end_date: string }>();

  const monthly = await Promise.all(
    periods.results.map(async (period) => {
      const [income, bills, expenses, debtPayments, savingsContribs] = await Promise.all([
        env.DB.prepare('SELECT COALESCE(SUM(amount),0) as v FROM income WHERE budget_period_id = ?').bind(period.id).first<{ v: number }>(),
        env.DB.prepare('SELECT COALESCE(SUM(amount),0) as v FROM bills WHERE budget_period_id = ?').bind(period.id).first<{ v: number }>(),
        env.DB.prepare('SELECT COALESCE(SUM(amount),0) as v FROM expenses WHERE budget_period_id = ?').bind(period.id).first<{ v: number }>(),
        env.DB.prepare('SELECT COALESCE(SUM(dp.amount),0) as v FROM debt_payments dp JOIN debts d ON d.id=dp.debt_id WHERE d.budget_period_id=?').bind(period.id).first<{ v: number }>(),
        env.DB.prepare('SELECT COALESCE(SUM(sc.amount),0) as v FROM savings_contributions sc JOIN savings_goals sg ON sg.id=sc.savings_goal_id WHERE sg.budget_period_id=?').bind(period.id).first<{ v: number }>(),
      ]);

      const totalIncome = income?.v ?? 0;
      const totalBills = bills?.v ?? 0;
      const totalExpenses = expenses?.v ?? 0;
      const totalDebt = debtPayments?.v ?? 0;
      const totalSavings = savingsContribs?.v ?? 0;
      const totalOutflows = totalBills + totalExpenses + totalDebt + totalSavings;

      return {
        periodId: period.id,
        period: period.name,
        startDate: period.start_date,
        income: totalIncome,
        bills: totalBills,
        expenses: totalExpenses,
        debt: totalDebt,
        savings: totalSavings,
        outflows: totalOutflows,
        cashflow: totalIncome - totalOutflows,
      };
    })
  );

  return success(monthly.reverse()); // oldest first for charts
};
