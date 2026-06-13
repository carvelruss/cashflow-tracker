import { Sun, Moon, Menu } from 'lucide-react';
import { useBudgetPeriod } from '../../context/BudgetPeriodContext';
import { formatDate } from '../../utils/date';
import Badge from '../ui/Badge';

interface HeaderProps {
  onMobileMenuOpen: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export default function Header({ onMobileMenuOpen, theme, onThemeToggle }: HeaderProps) {
  const { activePeriod, periods, setActivePeriod, loading } = useBudgetPeriod();

  return (
    <header className="h-16 flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuOpen}
        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Budget period selector */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        ) : periods.length === 0 ? (
          <span className="text-sm text-slate-500 dark:text-slate-400">No budget periods yet</span>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <select
              value={activePeriod?.id ?? ''}
              onChange={e => {
                const p = periods.find(x => x.id === e.target.value);
                if (p) setActivePeriod(p);
              }}
              className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-slate-900 dark:text-white max-w-[200px] truncate"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {activePeriod && (
              <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 shrink-0">
                {formatDate(activePeriod.start_date, 'MMM d')} – {formatDate(activePeriod.end_date, 'MMM d, yyyy')}
              </span>
            )}
            {activePeriod && (
              <Badge variant={activePeriod.status === 'active' ? 'success' : 'default'} className="shrink-0">
                {activePeriod.status}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={onThemeToggle}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
