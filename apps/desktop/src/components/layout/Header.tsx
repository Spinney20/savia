import { NotificationPopover } from './NotificationPopover';
import { UserMenu } from './UserMenu';

export function Header() {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <kbd className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-400">
          Ctrl+K
        </kbd>
        <span className="text-xs text-gray-400">Căutare rapidă</span>
      </div>

      <div className="flex items-center gap-3">
        <NotificationPopover />
        <UserMenu />
      </div>
    </header>
  );
}
