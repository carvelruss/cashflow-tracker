import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, TrendingUp, Receipt, CreditCard,
  TrendingDown, PiggyBank, BarChart3, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/budget-periods', label: 'Budget Periods', icon: Calendar },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/debt', label: 'Debt', icon: TrendingDown },
  { to: '/savings', label: 'Savings', icon: PiggyBank },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-base">₱</span>
        </div>
        {!collapsed && (
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">Cashflow</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tracker</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400',
            'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-3 w-full rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
