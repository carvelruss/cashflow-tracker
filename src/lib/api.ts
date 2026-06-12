import type {
  User, BudgetPeriod, Income, Bill, Expense, Debt, DebtPayment,
  SavingsGoal, SavingsContribution, DashboardSummary, CashflowData, ApiResponse,
} from '../types';

class ApiError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });

  if (res.status === 401) {
    const pub = ['/login', '/setup', '/reset-password'];
    if (!pub.some(p => window.location.pathname.startsWith(p))) {
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({ success: false, error: 'Invalid response' })) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(json.error || `Request failed (${res.status})`, res.status);
  }

  return json.data;
}

export const api = {
  auth: {
    checkSetup: () => request<{ isSetup: boolean }>('/auth/setup'),
    setup: (data: { email: string; username: string; password: string; setupKey?: string }) =>
      request<{ message: string }>('/auth/setup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string; rememberMe: boolean }) =>
      request<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    me: () => request<User>('/auth/me'),
    resetPassword: (email: string) =>
      request<{ message: string; token?: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPasswordConfirm: (data: { token: string; password: string }) =>
      request<{ message: string }>('/auth/reset-password-confirm', { method: 'POST', body: JSON.stringify(data) }),
  },

  budgetPeriods: {
    getAll: () => request<BudgetPeriod[]>('/budget-periods'),
    get: (id: string) => request<BudgetPeriod>(`/budget-periods/${id}`),
    create: (data: { name: string; start_date: string; end_date: string }) =>
      request<BudgetPeriod>('/budget-periods', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<BudgetPeriod>) =>
      request<BudgetPeriod>(`/budget-periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/budget-periods/${id}`, { method: 'DELETE' }),
    close: (id: string) => request<BudgetPeriod>(`/budget-periods/${id}/close`, { method: 'POST' }),
  },

  income: {
    getAll: (periodId: string, params?: { search?: string }) =>
      request<Income[]>(`/income?period_id=${periodId}${params?.search ? `&search=${encodeURIComponent(params.search)}` : ''}`),
    create: (data: Partial<Income>) =>
      request<Income>('/income', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Income>) =>
      request<Income>(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/income/${id}`, { method: 'DELETE' }),
  },

  bills: {
    getAll: (periodId: string, params?: { search?: string; category?: string; status?: string }) => {
      const qs = new URLSearchParams({ period_id: periodId, ...params }).toString();
      return request<Bill[]>(`/bills?${qs}`);
    },
    create: (data: Partial<Bill>) =>
      request<Bill>('/bills', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Bill>) =>
      request<Bill>(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/bills/${id}`, { method: 'DELETE' }),
    toggle: (id: string) => request<Bill>(`/bills/${id}/toggle`, { method: 'POST' }),
  },

  expenses: {
    getAll: (periodId: string, params?: { search?: string; category?: string; date_from?: string; date_to?: string }) => {
      const qs = new URLSearchParams({ period_id: periodId, ...params }).toString();
      return request<Expense[]>(`/expenses?${qs}`);
    },
    create: (data: Partial<Expense>) =>
      request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Expense>) =>
      request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
  },

  debts: {
    getAll: (periodId: string) => request<Debt[]>(`/debts?period_id=${periodId}`),
    get: (id: string) => request<Debt>(`/debts/${id}`),
    create: (data: Partial<Debt>) =>
      request<Debt>('/debts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Debt>) =>
      request<Debt>(`/debts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/debts/${id}`, { method: 'DELETE' }),
    addPayment: (id: string, data: { amount: number; payment_date: string; notes?: string }) =>
      request<DebtPayment>(`/debts/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  },

  savings: {
    getAll: (periodId: string) => request<SavingsGoal[]>(`/savings?period_id=${periodId}`),
    get: (id: string) => request<SavingsGoal>(`/savings/${id}`),
    create: (data: Partial<SavingsGoal>) =>
      request<SavingsGoal>('/savings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<SavingsGoal>) =>
      request<SavingsGoal>(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/savings/${id}`, { method: 'DELETE' }),
    addContribution: (id: string, data: { amount: number; contribution_date: string; notes?: string }) =>
      request<SavingsContribution>(`/savings/${id}/contributions`, { method: 'POST', body: JSON.stringify(data) }),
  },

  analytics: {
    getSummary: (periodId: string) => request<DashboardSummary>(`/analytics/summary?period_id=${periodId}`),
    getCashflow: () => request<CashflowData[]>('/analytics/cashflow'),
  },
};

export { ApiError };
