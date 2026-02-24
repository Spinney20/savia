import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface CommandItem {
  label: string;
  path: string;
  keywords: string;
}

const COMMANDS: CommandItem[] = [
  { label: 'Dashboard', path: '/dashboard', keywords: 'acasa home' },
  { label: 'Inspecții', path: '/inspections', keywords: 'inspectii lista' },
  { label: 'Inspecție nouă', path: '/inspections/create', keywords: 'creaza inspectie noua' },
  { label: 'Șabloane', path: '/templates', keywords: 'sabloane template' },
  { label: 'Instructaje', path: '/trainings', keywords: 'instruiri instructaje' },
  { label: 'Instructaj nou', path: '/trainings/create', keywords: 'creaza instructaj nou' },
  { label: 'Probleme', path: '/issues', keywords: 'probleme rapoarte' },
  { label: 'Problemă nouă', path: '/issues/create', keywords: 'raporteaza problema noua' },
  { label: 'Tablou Kanban', path: '/issues/board', keywords: 'kanban board' },
  { label: 'Angajați', path: '/employees', keywords: 'angajati personal' },
  { label: 'Angajat nou', path: '/employees/create', keywords: 'adauga angajat nou' },
  { label: 'Notificări', path: '/notifications', keywords: 'notificari' },
  { label: 'Profil', path: '/profile', keywords: 'profil cont' },
  { label: 'Schimbă parola', path: '/profile/change-password', keywords: 'schimba parola' },
  { label: 'Setări', path: '/settings/app', keywords: 'setari configurare' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = search
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.keywords.includes(search.toLowerCase()),
      )
    : COMMANDS;

  useEffect(() => {
    if (open) {
      setSearch('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(filtered[selected].path);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Caută pagini..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <kbd className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Niciun rezultat</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.path}
                onClick={() => { navigate(cmd.path); onClose(); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === selected ? 'bg-primary-50 text-primary' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cmd.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
