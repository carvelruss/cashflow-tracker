import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseISO(str: string): Date | null {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(str: string): string {
  const d = parseISO(str);
  if (!d) return '';
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange, label, required, error, placeholder, className }: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISO(today);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear] = useState(parseISO(value)?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parseISO(value)?.getMonth() ?? today.getMonth());

  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const CAL_HEIGHT = 330;
  const CAL_WIDTH = 288;

  const openCalendar = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= CAL_HEIGHT ? rect.bottom + 4 : rect.top - CAL_HEIGHT - 4;
      const left = Math.min(rect.left, window.innerWidth - CAL_WIDTH - 8);
      setPos({ top, left });
    }
    const d = parseISO(value);
    setViewYear(d?.getFullYear() ?? today.getFullYear());
    setViewMonth(d?.getMonth() ?? today.getMonth());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !calendarRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Build calendar grid
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { iso: string; day: number; current: boolean }[] = [];
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
    cells.push({ iso: toISO(d), day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toISO(new Date(viewYear, viewMonth, d)), day: d, current: true });
  }
  for (let d = 1; cells.length < 42; d++) {
    cells.push({ iso: toISO(new Date(viewYear, viewMonth + 1, d)), day: d, current: false });
  }

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

  const select = (iso: string) => { onChange(iso); setOpen(false); };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={openCalendar}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors bg-white dark:bg-slate-800',
          error ? 'border-red-500' : open
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500',
          'focus:outline-none'
        )}
      >
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={value ? 'flex-1 text-slate-900 dark:text-white' : 'flex-1 text-slate-400'}>
          {value ? formatDisplay(value) : (placeholder ?? 'Select date')}
        </span>
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {open && (
        <div
          ref={calendarRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: Math.min(CAL_WIDTH, window.innerWidth - 16) }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell, i) => {
              const isSelected = cell.iso === value;
              const isToday = cell.iso === todayISO;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(cell.iso)}
                  className={cn(
                    'w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors',
                    !cell.current && 'text-slate-300 dark:text-slate-600',
                    cell.current && !isSelected && !isToday && 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
                    isToday && !isSelected && 'border border-primary-400 text-primary-600 dark:text-primary-400 font-semibold',
                    isSelected && 'bg-primary-600 text-white font-semibold hover:bg-primary-700',
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              Clear
            </button>
            <button type="button" onClick={() => select(todayISO)} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
