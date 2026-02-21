# Part 4: Arhitectura Desktop — Electron + React

---

## 1. Stack

| Componentă | Alegere | Justificare |
|-----------|---------|-------------|
| Build tool | **electron-vite** | Fast builds, HMR, ESM support nativ |
| UI framework | React + TypeScript | Shared cu mobilul (componente logice) |
| Styling | Tailwind CSS | Rapid, consistent, utility-first |
| State management | Zustand | Același pattern ca mobilul |
| Server state | @tanstack/react-query | Identic cu mobilul |
| Grafice | **Recharts** | API declarativ React, lightweight, TypeScript nativ |
| Tabele | @tanstack/react-table | Performant, headless, sortare/filtrare/paginare |
| Formulare | react-hook-form + Zod | Shared cu mobilul |
| Router | react-router v7 | Matur, nested routes, loaders |
| PDF viewer | react-pdf | Preview PDF-uri inline |
| Auto-update | electron-updater | GitHub Releases + electron-builder |
| Token storage | Electron safeStorage | Criptare la nivel OS |

---

## 2. Structura Aplicației

```
apps/desktop/
├── electron/                        # Main process (Electron)
│   ├── main.ts                      # Entry point, window management
│   ├── preload.ts                   # Context bridge (IPC expus)
│   ├── ipc/                         # IPC handlers
│   │   ├── auth.ipc.ts              # Token storage via safeStorage
│   │   ├── file.ipc.ts              # File dialogs, save PDF
│   │   └── update.ipc.ts            # Auto-update handlers
│   └── updater.ts                   # electron-updater config
│
├── src/                             # Renderer process (React app)
│   ├── main.tsx                     # React entry
│   ├── App.tsx                      # Root with providers
│   ├── router.tsx                   # react-router config
│   │
│   ├── pages/                       # Page components
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx    # Statistici, grafice, KPIs
│   │   ├── inspections/
│   │   │   ├── InspectionsListPage.tsx
│   │   │   ├── InspectionDetailPage.tsx
│   │   │   ├── InspectionReviewPage.tsx  # Aprobare/respingere
│   │   │   └── TemplateEditorPage.tsx    # ADMIN: editor template JSONB
│   │   ├── trainings/
│   │   │   ├── TrainingsListPage.tsx
│   │   │   └── TrainingDetailPage.tsx
│   │   ├── issues/
│   │   │   ├── IssuesListPage.tsx
│   │   │   ├── IssueDetailPage.tsx
│   │   │   └── IssueBoardPage.tsx        # Kanban board (optional)
│   │   ├── employees/
│   │   │   ├── EmployeesListPage.tsx
│   │   │   ├── EmployeeDetailPage.tsx
│   │   │   └── EmployeeDocumentsPage.tsx
│   │   ├── organizations/
│   │   │   ├── AgenciesPage.tsx
│   │   │   └── SitesPage.tsx
│   │   └── settings/
│   │       ├── UsersPage.tsx             # ADMIN: gestionare utilizatori
│   │       ├── CategoriesPage.tsx        # ADMIN: categorii probleme
│   │       └── AppSettingsPage.tsx       # ADMIN: setări generale
│   │
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # Base UI (Button, Modal, Input, Badge)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Navigare principală (diferă per rol)
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── InspectionChart.tsx
│   │   │   ├── IssuesByCategory.tsx
│   │   │   └── ExpiringDocsList.tsx
│   │   ├── tables/
│   │   │   └── DataTable.tsx        # Generic table cu sort/filter/paginate
│   │   └── templates/
│   │       └── TemplateBuilder.tsx  # JSONB template visual editor
│   │
│   ├── api/                         # Same pattern ca mobilul
│   │   └── client.ts               # Axios cu interceptors
│   │
│   ├── hooks/                       # TanStack Query hooks (shared unde posibil)
│   ├── stores/                      # Zustand stores
│   └── utils/
│
├── electron.vite.config.ts
├── electron-builder.yml             # Build config (installers)
└── tsconfig.json
```

---

## 3. IPC Security

**Principiu**: Renderer process NU face cereri HTTP direct. Totul trece prin main process via IPC.

**De ce**: Previne expunerea token-urilor în renderer (care e un browser context, potențial vulnerabil la XSS).

**Implementare practică (compromis)**: Pentru MVP, renderer face HTTP direct (mai simplu). Token-ul se stochează în safeStorage prin IPC, dar cerile API se fac din renderer cu Axios.

```typescript
// electron/preload.ts — expune API-uri sigure
contextBridge.exposeInMainWorld('electronAPI', {
  // Token storage (criptat la nivel OS)
  saveToken: (key: string, value: string) =>
    ipcRenderer.invoke('auth:save-token', key, value),
  getToken: (key: string) =>
    ipcRenderer.invoke('auth:get-token', key),
  deleteToken: (key: string) =>
    ipcRenderer.invoke('auth:delete-token', key),

  // File operations
  saveFile: (data: Buffer, defaultName: string) =>
    ipcRenderer.invoke('file:save-dialog', data, defaultName),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  onUpdateAvailable: (cb: Function) =>
    ipcRenderer.on('update:available', (_e, info) => cb(info)),
});

// electron/ipc/auth.ipc.ts
ipcMain.handle('auth:save-token', async (_event, key, value) => {
  const encrypted = safeStorage.encryptString(value);
  store.set(key, encrypted.toString('base64'));
});

ipcMain.handle('auth:get-token', async (_event, key) => {
  const encrypted = store.get(key);
  if (!encrypted) return null;
  return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
});
```

---

## 4. Componente Partajate cu Mobilul

**Ce SE partajează** (prin pachetul `@ssm/shared`):
- Tipuri TypeScript (interfaces, enums, constants)
- Zod validation schemas
- Business logic pură (calcul risk score, formatare date, utilități)
- API types (request/response DTOs)

**Ce NU se partajează**:
- Componente UI (React Native ≠ React DOM)
- Hooks cu dependențe platform-specific
- Navigare/routing
- Storage/auth services

**Ce se poate partaja parțial** (cu wrapper):
- TanStack Query hooks (query keys + queryFn sunt identice, wrapper-ul diferă)
- Zustand store logic (slice logic fără persistență)

---

## 5. Dashboard — Grafice cu Recharts

**Justificare Recharts** (nu Chart.js, nu D3):
- API React declarativ (componente JSX, nu imperative)
- TypeScript nativ, bine tipizat
- Lightweight (~150kb), performant
- Responsive out-of-the-box
- Suficient pentru grafice de business (bar, line, pie, area)
- D3 e overkill pentru dashboard-ul nostru; Chart.js necesită wrapper React

**KPIs pe Dashboard:**

```
┌─────────────────────────────────────────────────┐
│  DASHBOARD SSM                                   │
├──────────┬──────────┬──────────┬─────────────────┤
│ Inspecții │ Probleme │ Probleme │ Documente       │
│ luna asta│ deschise │ CRITICE  │ expirate        │
│   24     │   18     │    3     │    5            │
├──────────┴──────────┴──────────┴─────────────────┤
│                                                   │
│  [Grafic: Inspecții per lună — BarChart]          │
│  [Grafic: Probleme per categorie — PieChart]     │
│  [Grafic: Trend rezolvare — LineChart]           │
│                                                   │
├───────────────────────────────────────────────────┤
│  ATENȚIE: Documente care expiră curând            │
│  • Fișă medicală — Ion Popescu — expiră în 5 zile│
│  • Certificat electrician — Vasile M. — expiră   │
├───────────────────────────────────────────────────┤
│  Angajați fără instructaj periodic recent         │
│  • 12 angajați > 90 zile de la ultimul instructaj│
└───────────────────────────────────────────────────┘
```

---

## 6. Auto-Update

```typescript
// electron/updater.ts
import { autoUpdater } from 'electron-updater';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update:available', info);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update:downloaded');
  });

  // Check on startup + every 4 hours
  autoUpdater.checkForUpdates();
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}

// electron-builder.yml
publish:
  provider: github
  owner: your-org
  repo: ssm-desktop
```

**Flow**: Build cu `electron-builder` → publish pe GitHub Releases → app-ul verifică periodic → user-ul primește notificare → update la următorul restart.

---

## 7. Template Editor (ADMIN)

Pagina `TemplateEditorPage.tsx` — editor vizual pentru template-uri de inspecție JSONB:

- **Drag & drop** secțiuni și întrebări (librărie: `@dnd-kit/core`)
- **Tipuri de întrebări**: YES_NO, TEXT, NUMBER, SELECT, PHOTO — selectabile din dropdown
- **Preview**: arată cum va apărea formularul pe mobil
- **Versionare**: la save, creează versiune nouă dacă template-ul are inspecții existente
- **JSON view**: toggle pentru a vedea/edita JSONB-ul raw (power users)

Aceasta e una din funcționalitățile cele mai complexe din desktop — dar nu e MVP. Pentru MVP, template-urile se pot crea/edita din JSON raw sau dintr-un formular simplu non-drag-and-drop.