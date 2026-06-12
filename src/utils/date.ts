import { format, parseISO, isValid, startOfMonth, endOfMonth } from 'date-fns';

export function formatDate(dateStr: string, fmt = 'MMM d, yyyy'): string {
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, fmt) : dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr, 'MMM d');
}

export function formatDateInput(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function currentMonthStart(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}

export function currentMonthEnd(): string {
  return format(endOfMonth(new Date()), 'yyyy-MM-dd');
}

export function formatMonthYear(dateStr: string): string {
  return formatDate(dateStr, 'MMMM yyyy');
}

export function daysUntil(dateStr: string): number {
  try {
    const target = parseISO(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function isOverdue(dateStr: string): boolean {
  return daysUntil(dateStr) < 0;
}

export function isDueSoon(dateStr: string, days = 7): boolean {
  const d = daysUntil(dateStr);
  return d >= 0 && d <= days;
}
