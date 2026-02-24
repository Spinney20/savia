import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Key } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { useLogout } from '@/hooks/use-auth';
import { ROLE_LABELS_RO } from '@ssm/shared';
import { Avatar } from '@/components/ui';

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const fullName = user
    ? `${user.user.employee.firstName} ${user.user.employee.lastName}`
    : '';
  const role = user?.user.role;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate('/login') });
  };

  const items = [
    { label: 'Profil', icon: User, action: () => navigate('/profile') },
    { label: 'Schimbă parola', icon: Key, action: () => navigate('/profile/change-password') },
    { label: 'Setări', icon: Settings, action: () => navigate('/settings/app') },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        {fullName ? (
          <Avatar name={fullName} size={32} />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={16} className="text-gray-400" />
          </div>
        )}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-gray-900 leading-tight">{fullName}</p>
          {role && <p className="text-xs text-gray-500">{ROLE_LABELS_RO[role]}</p>}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-1">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            {role && <p className="text-xs text-gray-500">{ROLE_LABELS_RO[role]}</p>}
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.action(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <item.icon size={16} className="text-gray-400" />
              {item.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-50 transition-colors"
            >
              <LogOut size={16} />
              Deconectare
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
