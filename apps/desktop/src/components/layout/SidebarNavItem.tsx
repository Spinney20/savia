import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  collapsed?: boolean;
  badge?: number;
}

export function SidebarNavItem({ href, label, icon: Icon, collapsed, badge }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-white/10 text-white border-l-2 border-primary-300 ml-0 pl-[10px]'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200',
        collapsed && 'justify-center px-2',
      )}
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-danger text-white text-xs font-semibold px-1.5">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
