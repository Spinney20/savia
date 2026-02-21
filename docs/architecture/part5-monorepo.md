# Part 5: Monorepo — Structura și Partajare Cod

---

## 1. Recomandare: **pnpm Workspaces + Turborepo**

### Evaluare

| Tool | Pro | Contra | Verdict |
|------|-----|--------|---------|
| pnpm workspaces (simplu) | Zero overhead, simplu | Fără cache, build orchestration manuală | ⚠️ Prea simplu pentru 3 apps + shared |
| **Turborepo** | Cache intelligent, parallel builds, zero config aproape | Dependency pe Vercel (dar open source) | ✅ **Recomandat** |
| Nx | Cel mai puternic, graph vizual | Overkill, curbă de învățare mare, config verbose | ❌ Prea complex pentru 1 dev |

### Decizie: **pnpm workspaces + Turborepo**

**Justificare:**
1. **pnpm** — cel mai eficient package manager (symlinks, disk space, speed). Perfect pentru monorepo.
2. **Turborepo** — adaugă doar 2 lucruri peste pnpm workspaces: **cache** (nu rebuilduiește ce nu s-a schimbat) și **parallel task execution** (rulează lint/build/test în paralel). Config: un singur fișier `turbo.json`.
3. **Un singur dev cu Claude Code** — Turborepo e "invisible" (nu schimbă cum scrii cod, doar accelerează build-uri). Nx ar impune o structură și convenții complexe inutile.

---

## 2. Structura Directoare

```
ssm-management/                      # Root monorepo
├── apps/
│   ├── api/                         # NestJS backend
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json             # "@ssm/api"
│   │   └── tsconfig.json
│   │
│   ├── mobile/                      # React Native + Expo
│   │   ├── app/                     # Expo Router pages
│   │   ├── src/
│   │   ├── app.json
│   │   ├── package.json             # "@ssm/mobile"
│   │   └── tsconfig.json
│   │
│   └── desktop/                     # Electron + React
│       ├── electron/
│       ├── src/
│       ├── electron-builder.yml
│       ├── package.json             # "@ssm/desktop"
│       └── tsconfig.json
│
├── packages/
│   ├── shared/                      # Cod partajat între TOATE cele 3 apps
│   │   ├── src/
│   │   │   ├── types/               # TypeScript interfaces & enums
│   │   │   │   ├── index.ts
│   │   │   │   ├── user.types.ts    # AuthUser, Role, UserDto
│   │   │   │   ├── inspection.types.ts
│   │   │   │   ├── training.types.ts
│   │   │   │   ├── issue.types.ts
│   │   │   │   ├── employee.types.ts
│   │   │   │   ├── organization.types.ts
│   │   │   │   └── api.types.ts     # PaginatedResponse<T>, ApiError
│   │   │   │
│   │   │   ├── schemas/             # Zod validation schemas
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth.schema.ts   # LoginSchema, etc.
│   │   │   │   ├── inspection.schema.ts
│   │   │   │   ├── inspection-template.schema.ts  # TemplateStructureSchema (validare JSONB)
│   │   │   │   ├── training.schema.ts
│   │   │   │   ├── issue.schema.ts
│   │   │   │   └── employee.schema.ts
│   │   │   │
│   │   │   ├── constants/           # Enums, role hierarchies, status maps
│   │   │   │   ├── roles.ts         # ROLE_HIERARCHY, ROLE_LABELS_RO
│   │   │   │   ├── statuses.ts      # Issue statuses, inspection statuses
│   │   │   │   └── config.ts        # Shared config constants
│   │   │   │
│   │   │   └── utils/               # Pure utility functions
│   │   │       ├── risk-score.ts    # Calculate risk score from items
│   │   │       ├── permissions.ts   # canUserAccess(role, resource)
│   │   │       ├── format.ts        # formatDate, formatCurrency (RO)
│   │   │       └── geo.ts           # haversineDistance, isInGeofence
│   │   │
│   │   ├── package.json             # "@ssm/shared"
│   │   └── tsconfig.json
│   │
│   └── api-client/                  # API client wrapper (opțional)
│       ├── src/
│       │   ├── index.ts
│       │   ├── client.ts            # Base HTTP client factory
│       │   ├── auth.api.ts          # login(), refresh(), logout()
│       │   ├── issues.api.ts        # listIssues(), createIssue(), etc.
│       │   ├── inspections.api.ts
│       │   └── trainings.api.ts
│       ├── package.json             # "@ssm/api-client"
│       └── tsconfig.json
│
├── docker/
│   ├── docker-compose.yml           # Dev environment
│   ├── docker-compose.prod.yml      # Production
│   └── Dockerfile.api               # API Dockerfile
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Lint + test on PR
│       ├── deploy-api.yml           # Deploy API to server
│       └── build-desktop.yml        # Build Electron installers
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                     # Root (scripts, devDependencies globale)
├── tsconfig.base.json               # Base TS config (extends în fiecare app)
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. Configurare

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Root `package.json` (scripts)
```json
{
  "scripts": {
    "dev:api": "turbo run dev --filter=@ssm/api",
    "dev:mobile": "turbo run dev --filter=@ssm/mobile",
    "dev:desktop": "turbo run dev --filter=@ssm/desktop",
    "dev": "turbo run dev --filter=@ssm/api --filter=@ssm/shared",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "db:migrate": "pnpm --filter @ssm/api run db:migrate",
    "db:seed": "pnpm --filter @ssm/api run db:seed"
  }
}
```

---

## 4. Ce se Partajează, Ce Nu

| Pachet | Consumat de | Conținut |
|--------|-------------|---------|
| `@ssm/shared` | API + Mobile + Desktop | Types, Zod schemas, constants, pure utils |
| `@ssm/api-client` | Mobile + Desktop | HTTP client wrapper, API function calls |
| `@ssm/api` | - (standalone) | NestJS backend, Drizzle schema, migrări |
| `@ssm/mobile` | - (standalone) | React Native app, Expo config |
| `@ssm/desktop` | - (standalone) | Electron app, React UI |

**Regula de aur**: `@ssm/shared` conține DOAR cod pur TypeScript — nicio dependență de React, Node, React Native, sau Electron. Trebuie să ruleze în orice runtime.

---

## 5. Dependency Graph

```
@ssm/shared (pur TypeScript, zero deps pe runtime)
    ↑
    ├── @ssm/api-client (Axios + shared types)
    │       ↑
    │       ├── @ssm/mobile (React Native)
    │       └── @ssm/desktop (Electron/React)
    │
    └── @ssm/api (NestJS — folosește shared types + schemas server-side)
```

---

## 6. Workflow Zilnic de Dezvoltare

```bash
# Terminal 1: Backend + DB
pnpm dev:api                    # NestJS cu hot-reload + Docker postgres

# Terminal 2: Mobile
pnpm dev:mobile                 # Expo dev server

# Terminal 3: Desktop (când lucrezi pe el)
pnpm dev:desktop                # electron-vite dev

# Modifici shared? Se propagă automat:
# packages/shared/ → API + Mobile + Desktop (via workspace symlinks)
```

**Turborepo cache**: Dacă `@ssm/shared` nu s-a schimbat, build-urile apps nu re-compilează shared. La un proiect cu 1 dev, câștigul e modest dar crește odată cu proiectul.