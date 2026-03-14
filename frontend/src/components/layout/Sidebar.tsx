import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Plus, ShieldCheck, BookOpen,
  Users, LogOut, Activity, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/dashboard/proponent', icon: LayoutDashboard, label: 'nav.dashboard', roles: ['PROPONENT'] },
  { to: '/dashboard/proponent/new', icon: Plus, label: 'nav.newApplication', roles: ['PROPONENT'] },
  { to: '/dashboard/scrutiny', icon: ShieldCheck, label: 'nav.dashboard', roles: ['SCRUTINY'] },
  { to: '/dashboard/mom', icon: BookOpen, label: 'nav.dashboard', roles: ['MOM_TEAM'] },
  { to: '/dashboard/admin', icon: LayoutDashboard, label: 'nav.dashboard', roles: ['ADMIN'] },
  { to: '/dashboard/admin/users', icon: Users, label: 'nav.users', roles: ['ADMIN'] },
  { to: '/dashboard/application', icon: FileText, label: 'nav.applications' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-500/20 text-purple-200',
    SCRUTINY: 'bg-amber-500/20 text-amber-200',
    MOM_TEAM: 'bg-cyan-500/20 text-cyan-200',
    PROPONENT: 'bg-green-500/20 text-green-200',
  };

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="w-64 flex flex-col shadow-xl z-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1C3A2A 0%, #14281D 100%)' }}
    >
      {/* Subtle forest texture overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'url(/mandala-pattern.png)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(1px)' }}
      />

      {/* Logo */}
      <div className="relative p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-300" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">CECB Clearance</div>
            <div className="text-xs text-green-300/60">PARIVESH 3.0</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="text-[10px] font-semibold text-green-300/40 uppercase tracking-widest px-3 py-2">
          {user?.role?.replace(/_/g, ' ')} PORTAL
        </div>

        {roleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-green-100/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{t(item.label)}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-30" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="relative p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user?.role || 'PROPONENT']}`}>
              {user?.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-red-300/70 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </motion.aside>
  );
}
