export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface BudgetPeriod {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  budget_period_id: string;
  source: string;
  description: string | null;
  amount: number;
  date_received: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  budget_period_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  status: 'paid' | 'unpaid';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  budget_period_id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  budget_period_id: string;
  name: string;
  creditor: string;
  original_amount: number;
  remaining_balance: number;
  monthly_payment: number;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  budget_period_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contributions?: SavingsContribution[];
}

export interface SavingsContribution {
  id: string;
  savings_goal_id: string;
  amount: number;
  contribution_date: string;
  notes: string | null;
  created_at: string;
}

export interface DashboardSummary {
  period: BudgetPeriod;
  totalIncome: number;
  totalBills: number;
  totalPaidBills: number;
  totalUnpaidBills: number;
  totalExpenses: number;
  totalDebtBalance: number;
  totalMonthlyDebt: number;
  totalDebtPayments: number;
  totalSavingsTarget: number;
  totalSavingsCurrent: number;
  totalSavingsContributions: number;
  totalOutflows: number;
  leftToSpend: number;
  netCashflow: number;
}

export interface CashflowData {
  periodId: string;
  period: string;
  startDate: string;
  income: number;
  bills: number;
  expenses: number;
  debt: number;
  savings: number;
  outflows: number;
  cashflow: number;
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Utilities',
  'Personal Care',
  'Miscellaneous',
] as const;

export const BILL_CATEGORIES = [
  'Utilities',
  'Rent / Mortgage',
  'Insurance',
  'Subscription',
  'Internet / Phone',
  'Healthcare',
  'Transportation',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type BillCategory = typeof BILL_CATEGORIES[number];

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
