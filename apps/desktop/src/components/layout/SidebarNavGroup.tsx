import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SidebarNavGroupProps {
  label: string;
  collapsed?: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarNavGroup({ label, collapsed, children, defaultOpen = true }: SidebarNavGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return <div className="mt-4 space-y-1">{children}</div>;
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}
