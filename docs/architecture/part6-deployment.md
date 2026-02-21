# Part 6: Deployment, Docker și Portabilitate

---

## Strategie Hosting pe Faze

| Fază | Unde | Cost | Ce rulezi |
|------|------|------|-----------|
| **PHASE 1: Development** | Laptop, `docker-compose up` | $0 | NestJS + PostgreSQL + fișiere locale, toate în Docker |
| **PHASE 2: Testare reală (FREE)** | Oracle Cloud Free Tier — ALWAYS FREE, NU EXPIRĂ | $0/lună, fără limită timp | Docker cu: PostgreSQL + NestJS API + Nginx (reverse proxy + SSL) |
| **PHASE 3: Producție** | Azure-ul firmei de construcții (ei plătesc) | ~$50-70/lună | Același Docker image, doar `.env` diferit |

**De ce Oracle și nu Azure pentru testare**: $0 permanent vs. $100/an credit student care expiră.

**Ce se schimbă la migrare**: Doar variabilele din `.env`:
- `DATABASE_URL` → Azure PostgreSQL Flexible Server
- `STORAGE_PROVIDER=azure` → Azure Blob Storage
- `REDIS_URL` → Azure Cache for Redis (opțional, doar dacă se adaugă BullMQ)

**Zero schimbări de cod** — deploy același Docker image.

---

## 1. Docker Compose — Local Development

```yaml
# docker/docker-compose.yml (MVP — fără Redis)
version: '3.8'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: ssm-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: ssm_db
      POSTGRES_USER: ssm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword123}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=ro_RO.UTF-8"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d  # SQL schema init
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ssm_user -d ssm_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # NestJS API
  # ============================================
  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile
    container_name: ssm-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file: ../.env
    environment:
      DATABASE_URL: postgresql://ssm_user:${DB_PASSWORD:-devpassword123}@postgres:5432/ssm_db
      STORAGE_PROVIDER: local
      UPLOAD_DIR: /app/uploads
    volumes:
      - uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy

  # ============================================
  # pgAdmin (dev only)
  # ============================================
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ssm-pgadmin
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ssm.local
      PGADMIN_DEFAULT_PASSWORD: admin
    profiles: ["dev"]

  # ============================================
  # Redis (opțional — decomentează când migrezi la BullMQ)
  # ============================================
  # redis:
  #   image: redis:7-alpine
  #   container_name: ssm-redis
  #   restart: unless-stopped
  #   ports:
  #     - "6379:6379"
  #   volumes:
  #     - redisdata:/data

volumes:
  pgdata:
  uploads:
```

### API Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @ssm/api...

# --- Build ---
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm --filter @ssm/shared build
RUN pnpm --filter @ssm/api build

# --- Production ---
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./

RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads
USER nestjs

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 2. Deployment pe Oracle Cloud Free Tier

**Ce oferă Oracle Free Tier (permanent gratuit):**
- VM ARM Ampere: 4 CPUs, 24GB RAM (~10x mai mult decât ai nevoie)
- 200GB block storage
- 10GB object storage (echivalent Azure Blob — pentru poze/PDF-uri)
- 10TB bandwidth/lună

### Setup concret:

```
Oracle Cloud VM (ARM, 4 OCPU, 24GB RAM)
├── Docker Engine
├── docker-compose.yml
│   ├── postgres:16 (container)
│   ├── ssm-api (container, port 3000)
│   └── nginx (reverse proxy, SSL, port 443)
└── Fișiere (poze, PDF-uri) pe disk cu backup-uri
```

**Pași deployment:**
1. Creează VM ARM pe Oracle Cloud (Ubuntu 22.04)
2. Instalează Docker + Docker Compose
3. Clone repo, copiază `.env.production`
4. `docker compose -f docker-compose.prod.yml up -d`
5. Configurează Nginx cu Let's Encrypt SSL (Certbot)
6. Configurează firewall (deschide doar 80, 443)
7. DNS: `api.ssm-firma.ro` → IP VM

**StorageService pe Oracle**: Implementare `OracleObjectStorageService` (S3-compatible API) sau simplu `LocalStorageService` cu volume Docker + backup periodic.

---

## 3. Migrare pe Azure — Ce se Schimbă

| Componentă | Oracle Free | Azure | Ce schimbi |
|-----------|-------------|-------|------------|
| Database | PostgreSQL container | **Azure Database for PostgreSQL Flexible** | Doar `DATABASE_URL` în `.env` |
| File storage | Fișiere pe disk (local) | **Azure Blob Storage** | `STORAGE_PROVIDER=azure` + connection string |
| API hosting | Docker pe VM | **Azure Container Apps** sau VM | Docker image identic |
| Redis | Nu (MVP fără Redis) | **Azure Cache for Redis** (opțional) | Doar `REDIS_URL` (dacă BullMQ) |
| SSL | Let's Encrypt | Azure-managed | Automatic cu Container Apps |
| Domain | Manual DNS | Azure DNS | Opțional |

**Concret, ce modifici:**
1. `.env`: `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`
2. `STORAGE_PROVIDER=azure` — activează `AzureBlobStorageService`
3. Push Docker image la Azure Container Registry
4. Deploy container (zero code change)
5. Opțional: `REDIS_URL` dacă adaugi BullMQ

---

## 4. StorageService — Implementare Detaliată

```typescript
// storage/storage.service.ts — Interfață abstractă
export abstract class StorageService {
  abstract upload(buffer: Buffer, path: string, mimeType: string): Promise<string>;
  abstract getUrl(path: string, expiresInSec?: number): Promise<string>;
  abstract delete(path: string): Promise<void>;
  abstract exists(path: string): Promise<boolean>;
}

// Structura path-urilor:
// {companyId}/{entityType}/{YYYY}/{MM}/{uuid}.{ext}
// Exemple:
//   1/issue-photos/2026/02/a1b2c3d4.jpg
//   1/inspection-pdfs/2026/02/report-uuid.pdf
//   1/employee-docs/2026/02/medical-record.pdf
//   1/training-materials/2026/02/presentation.pdf
```

```typescript
// storage/local-storage.service.ts — Dev/Oracle
export class LocalStorageService extends StorageService {
  private basePath: string;

  constructor(config: ConfigService) {
    this.basePath = config.get('UPLOAD_DIR', './uploads');
  }

  async upload(buffer: Buffer, path: string): Promise<string> {
    const fullPath = join(this.basePath, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return path; // Returnează path relativ
  }

  async getUrl(path: string): Promise<string> {
    // Servit prin NestJS static files sau Nginx
    return `/files/${path}`;
  }
}
```

```typescript
// storage/azure-blob-storage.service.ts — Azure
import { BlobServiceClient } from '@azure/storage-blob';

export class AzureBlobStorageService extends StorageService {
  private containerClient: ContainerClient;

  constructor(config: ConfigService) {
    const blobService = BlobServiceClient.fromConnectionString(
      config.get('AZURE_STORAGE_CONNECTION_STRING')
    );
    this.containerClient = blobService.getContainerClient('ssm-files');
  }

  async upload(buffer: Buffer, path: string, mimeType: string): Promise<string> {
    const blockBlob = this.containerClient.getBlockBlobClient(path);
    await blockBlob.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return path;
  }

  async getUrl(path: string, expiresInSec = 3600): Promise<string> {
    const blockBlob = this.containerClient.getBlockBlobClient(path);
    // Generează SAS URL cu expirare
    return blockBlob.generateSasUrl({
      permissions: BlobSASPermissions.parse('r'),
      expiresOn: new Date(Date.now() + expiresInSec * 1000),
    });
  }
}
```

**Selectare provider (NestJS Module):**
```typescript
// storage/storage.module.ts
@Module({
  providers: [{
    provide: StorageService,
    useFactory: (config: ConfigService) => {
      const provider = config.get('STORAGE_PROVIDER', 'local');
      switch (provider) {
        case 'azure': return new AzureBlobStorageService(config);
        case 'local':
        default:      return new LocalStorageService(config);
      }
    },
    inject: [ConfigService],
  }],
  exports: [StorageService],
})
export class StorageModule {}
```

---

## 5. CI/CD — GitHub Actions

### API Deploy

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['apps/api/**', 'packages/shared/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build -t ssm-api:latest -f apps/api/Dockerfile .
      
      - name: Push to registry
        run: |
          # Oracle: OCIR (Oracle Container Image Registry) — gratuit
          # Azure: Azure Container Registry
          docker tag ssm-api:latest ${{ secrets.REGISTRY_URL }}/ssm-api:latest
          docker push ${{ secrets.REGISTRY_URL }}/ssm-api:latest
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/ssm
            docker compose pull api
            docker compose up -d api
            docker system prune -f
```

### Desktop Build

```yaml
# .github/workflows/build-desktop.yml
name: Build Desktop
on:
  push:
    tags: ['desktop-v*']

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ssm/shared build
      - run: pnpm --filter @ssm/desktop build
      
      - name: Publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm --filter @ssm/desktop electron-builder --publish always
```

---

## 6. Estimare Costuri

### PHASE 1: Development (Laptop)
| Componentă | Cost |
|-----------|------|
| Docker pe laptop | **$0** |

### PHASE 2: Oracle Cloud Free Tier (Testare reală)
| Componentă | Cost |
|-----------|------|
| VM ARM Ampere (4 CPUs, 24GB RAM) | **Gratuit** (Always Free, nu expiră) |
| PostgreSQL (container pe VM) | **Gratuit** |
| Object Storage (10GB — pentru poze/PDF-uri) | **Gratuit** |
| 200GB block storage | **Gratuit** |
| Bandwidth (10TB/mo) | **Gratuit** |
| **TOTAL** | **$0/lună, permanent** |

### PHASE 3: Azure Producție (firma plătește)
| Componentă | Cost estimat/lună |
|-----------|-------------------|
| Azure Container Apps (1 vCPU, 2GB) | ~$15 |
| Azure PostgreSQL Flexible (Burstable B1ms) | ~$15 |
| Azure Blob Storage (10-50GB + tranzacții) | ~$1-5 |
| Azure Cache for Redis (opțional, Basic C0) | ~$15 (doar dacă BullMQ) |
| Backup DB | ~$5 |
| **TOTAL fără Redis** | **~$36-40/lună** |
| **TOTAL cu Redis** | **~$50-55/lună** |

*Cost neglijabil pentru o firmă de construcții. Estimare: ~$50-70/lună all-in.*

---

## 7. Strategie de Backup

```bash
# Backup PostgreSQL (daily CRON pe server)
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/ssm/backups

# Dump DB
docker exec ssm-postgres pg_dump -U ssm_user ssm_db | gzip > \
  $BACKUP_DIR/ssm_db_$TIMESTAMP.sql.gz

# Backup uploads
tar czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /opt/ssm/uploads

# Păstrează ultimele 30 de backup-uri
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# (Opțional) Sync la Oracle Object Storage / Azure Blob
# rclone sync $BACKUP_DIR remote:ssm-backups/
```

---

## 8. Strategie Arhivare Fișiere (Storage)

**Problemă**: Cu ~300KB/poză × ~75 poze/săptămână = ~4GB/an. Oracle Free Tier are 200GB disk, deci ~50 ani fără probleme. Dar pe Azure Blob Storage se plătește per GB, deci e bine să optimizăm.

**Strategie (CRON lunar, rulat de `ScheduledTasksService`):**

| Vârstă fișier | Acțiune | Detalii |
|---------------|---------|---------|
| 0-6 luni | **Nimic** | Fișierele rămân la calitatea originală (1280px, 0.6 quality) |
| 6-12 luni | **Recomprimare** | Recomprimă imaginile la 800px lățime, 0.3 quality (~50% reducere dimensiune). Folosește `sharp` pe server (librărie Node.js, zero deps native). Nu afectează PDF-urile sau documentele. |
| > 12 luni | **Ștergere** (MVP) | Fișierele se șterg. Entitățile rămân în DB (inspection_items, issue_reports) dar fără poze. Suficient pentru MVP — datele text și PDF-urile generate sunt mai importante decât pozele brute. |

**Viitor (post-MVP)**: În loc de ștergere, mută în cold storage (Azure Cool/Archive Tier — ~90% mai ieftin). Sau exportă pe un HDD extern ca arhivă anuală.

```typescript
// jobs/scheduled-tasks.service.ts
@Cron('0 2 1 * *') // 1st of each month at 02:00
async archiveOldPhotos() {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const oneYearAgo = subMonths(new Date(), 12);

  // Recomprimă pozele 6-12 luni
  const toCompress = await this.db.select().from(attachments)
    .where(and(
      lt(attachments.createdAt, sixMonthsAgo),
      gt(attachments.createdAt, oneYearAgo),
      like(attachments.mimeType, 'image/%'),
      isNull(attachments.deletedAt),
    ));
  for (const file of toCompress) {
    await this.storage.recompress(file.fileUrl, { width: 800, quality: 0.3 });
  }

  // Șterge pozele > 1 an
  const toDelete = await this.db.select().from(attachments)
    .where(and(
      lt(attachments.createdAt, oneYearAgo),
      like(attachments.mimeType, 'image/%'),
      isNull(attachments.deletedAt),
    ));
  for (const file of toDelete) {
    await this.storage.delete(file.fileUrl);
    await this.db.update(attachments)
      .set({ deletedAt: new Date() })
      .where(eq(attachments.id, file.id));
  }
}
```

---

## 9. Distribuție Desktop App

**Metoda**: Distribuție prin email.

1. **Build**: `electron-builder` generează instalere (`.exe` Windows, `.dmg` macOS, `.AppImage` Linux)
2. **Hosting**: Instalerele se publică pe GitHub Releases (repo privat) sau pe un server simplu (Oracle VM)
3. **Prima instalare**: ADMIN primește link prin email → descarcă → instalează
4. **Auto-update**: După prima instalare, `electron-updater` verifică periodic pentru versiuni noi. Update-ul se descarcă automat și se instalează la restart.
5. **Fallback**: Dacă firma nu are acces la GitHub, instalerele se pot hosta pe Oracle VM (`/opt/ssm/releases/`) servite prin Nginx.

---

## 10. Environment Variables (.env.example)

```bash
# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://ssm_user:devpassword123@localhost:5432/ssm_db

# ============================================
# JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ============================================
# Storage
# ============================================
STORAGE_PROVIDER=local                    # local | azure | oracle
UPLOAD_DIR=./uploads
# Azure Blob (doar dacă STORAGE_PROVIDER=azure)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=ssm-files

# ============================================
# Encryption (pentru CNP angajați)
# ============================================
ENCRYPTION_KEY=your-32-byte-hex-key-for-aes-256-gcm

# ============================================
# Redis (opțional — doar dacă folosești BullMQ; MVP nu necesită)
# ============================================
# REDIS_URL=redis://localhost:6379

# ============================================
# Email (Nodemailer)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@firma.ro
SMTP_PASS=your-app-password
SMTP_FROM="SSM Notificări <notifications@firma.ro>"

# ============================================
# Push Notifications (Expo Push Service — MVP)
# Expo Push e mai simplu: nu necesită Firebase config.
# Token-ul se obține cu getExpoPushTokenAsync() pe client.
# Server-ul trimite notificări via Expo Push API.
# Viitor: migrare la FCM direct dacă volumul crește.
# ============================================
EXPO_ACCESS_TOKEN=                    # Opțional: pentru rate limits mai mari pe Expo Push API

# ============================================
# App
# ============================================
APP_PORT=3000
APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Rezumat — Ordinea de Implementare (MVP 2-3 luni)

| Săptămâna | Livrabil |
|-----------|----------|
| 1-2 | Setup monorepo, Docker, DB schema, seed data, NestJS skeleton |
| 3-4 | Auth (JWT), CRUD angajați, CRUD organizații (agencies/sites) |
| 5-6 | **Issue Reports** — raportare probleme cu poze (mobil) + listare (desktop) |
| 7-8 | **Inspecții** — template-uri CRUD, completare inspecție (mobil), aprobare (desktop) |
| 9-10 | Generare PDF (inspecții + instructaje), notificări push de bază |
| 11-12 | Instructaje + confirmare prezență, dashboard basic, polish, deploy |

**Schema SQL se implementează TOATĂ de la început** (săptămâna 1-2). Backend-ul și frontend-ul cresc incremental pe baza schemei complete.