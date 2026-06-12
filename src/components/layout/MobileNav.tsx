import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Receipt, CreditCard, PiggyBank,
  BarChart3, X, Calendar, TrendingDown, LogOut,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/budget-periods', label: 'Periods', icon: Calendar },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/debt', label: 'Debt', icon: TrendingDown },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 flex flex-col animate-slide-up">
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold">₱</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Cashflow Tracker</p>
              <p className="text-xs text-slate-500">{user?.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <ul className="space-y-0.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-700 p-3">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
