import { cn } from '@/lib/utils';
import { useAppStore, useAuthStore } from '@/stores';
import { isRoleAtLeast } from '@ssm/shared';
import {
  LayoutDashboard,
  ClipboardCheck,
  GraduationCap,
  AlertTriangle,
  Users,
  FileText,
  UserCog,
  Tags,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarNavGroup } from './SidebarNavGroup';

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const role = user?.user.role;

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo area */}
      <div className={cn('flex items-center h-16 border-b border-gray-800 px-4', collapsed && 'justify-center px-2')}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Savia SSM</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        <SidebarNavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} collapsed={collapsed} />

        <SidebarNavGroup label="Management" collapsed={collapsed}>
          <SidebarNavItem href="/inspections" label="Inspecții" icon={ClipboardCheck} collapsed={collapsed} />
          <SidebarNavItem href="/trainings" label="Instruiri" icon={GraduationCap} collapsed={collapsed} />
          <SidebarNavItem href="/issues" label="Probleme" icon={AlertTriangle} collapsed={collapsed} />
          {role && isRoleAtLeast(role, 'SEF_SANTIER') && (
            <SidebarNavItem href="/employees" label="Angajați" icon={Users} collapsed={collapsed} />
          )}
        </SidebarNavGroup>

        {role && isRoleAtLeast(role, 'MANAGER_SSM') && (
          <SidebarNavGroup label="Admin" collapsed={collapsed}>
            <SidebarNavItem href="/templates" label="Șabloane" icon={FileText} collapsed={collapsed} />
            {isRoleAtLeast(role, 'SEF_AGENTIE') && (
              <SidebarNavItem href="/settings/users" label="Utilizatori" icon={UserCog} collapsed={collapsed} />
            )}
            <SidebarNavItem href="/settings/categories" label="Categorii" icon={Tags} collapsed={collapsed} />
            <SidebarNavItem href="/settings/app" label="Setări" icon={Settings} collapsed={collapsed} />
          </SidebarNavGroup>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>
    </aside>
  );
}
