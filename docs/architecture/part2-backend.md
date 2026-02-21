# Part 2: Arhitectura Backend — NestJS + TypeScript

---

## 1. Recomandare ORM: **Drizzle ORM**

### Evaluare comparativă

| Criteriu | Prisma | Drizzle | TypeORM |
|----------|--------|---------|---------|
| Type safety | ✅ Excelent (generat) | ✅ Excelent (inferat) | ⚠️ Bun (decoratoare) |
| Control SQL | ⚠️ Limitat | ✅ Total | ⚠️ Mediu |
| Performanță | ⚠️ Bun (engine Rust eliminat în v7) | ✅ Cel mai bun | ⚠️ Mediocru la scale |
| Migrări | ✅ Automate, declarative | ✅ SQL generat, manual review | ⚠️ Fragile, `synchronize` periculos |
| NestJS integration | ✅ Bun | ✅ Bun (via @knaadh/nestjs-drizzle sau manual) | ✅ Nativ (@nestjs/typeorm) |
| Bundle size | ⚠️ Mare | ✅ ~7kb | ⚠️ Mare |
| Schema definition | PSL (fișier .prisma separat) | TypeScript direct | TypeScript + decoratoare |
| Curba învățare | Ușoară | Medie (trebuie SQL) | Medie |
| Mentenanță 2025 | ✅ Activă | ✅ Foarte activă | ⚠️ Sporadică |

### Decizie: **Drizzle ORM**

**Justificare:**

1. **Schema în TypeScript** — nu există fișier separat `.prisma`, totul e TS. Perfect pentru un dev singur cu Claude Code — un singur limbaj, fără code generation step.
2. **Control total SQL** — schema noastră are JSONB, partial indexes, exclusive arc CHECK constraints, partiții. Drizzle generează SQL-ul exact pe care-l vrei, fără "magic" ascuns.
3. **Migrări transparente** — generează fișiere SQL pe care le poți revizui. Critical pentru o schemă complexă cu trigger-uri și funcții.
4. **Performanță** — zero overhead, queries directe. Pentru o firmă cu sute (nu milioane) de utilizatori, nu e critic, dar e un bonus.
5. **Tipuri inferite direct** — `typeof users.$inferSelect` și `typeof users.$inferInsert` înlocuiesc DTO-uri manuale.
6. **NestJS integration** — via modulul `@knaadh/nestjs-drizzle` sau custom module simplu (~30 linii).

**Trade-off asumat**: Drizzle necesită cunoștințe SQL solide. Dar schema e deja scrisă în SQL pur (Part 1), deci mapping-ul e direct.

---

## 2. Structura Module NestJS

```
src/
├── main.ts
├── app.module.ts
├── common/                          # Shared utilities
│   ├── decorators/
│   │   ├── roles.decorator.ts       # @Roles('ADMIN', 'MANAGER_SSM')
│   │   ├── current-user.decorator.ts # @CurrentUser() param decorator
│   │   └── api-paginated.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts  # Response wrapping
│   │   └── audit.interceptor.ts      # SET LOCAL app.current_user_id
│   ├── filters/
│   │   └── http-exception.filter.ts  # Consistent error responses
│   ├── pipes/
│   │   └── zod-validation.pipe.ts    # Zod schema validation
│   ├── middleware/
│   │   └── logger.middleware.ts
│   ├── dto/                          # Base DTOs
│   │   ├── pagination.dto.ts         # {page, limit, sortBy, sortDir}
│   │   └── api-response.dto.ts       # {data, meta, errors}
│   └── utils/
│       ├── crypto.util.ts            # AES-256-GCM encrypt/decrypt CNP
│       ├── pagination.util.ts
│       └── file.util.ts
│
├── config/                           # Configuration module
│   ├── config.module.ts
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── storage.config.ts
│   └── push.config.ts                # Expo Push Service config (MVP) / FCM config (viitor)
│
├── database/                         # Drizzle ORM setup
│   ├── database.module.ts
│   ├── drizzle.provider.ts           # Connection + pool
│   ├── schema/                       # Drizzle schema files (mirrors SQL)
│   │   ├── index.ts
│   │   ├── companies.ts
│   │   ├── agencies.ts
│   │   ├── sites.ts
│   │   ├── employees.ts
│   │   ├── users.ts
│   │   ├── inspections.ts
│   │   ├── trainings.ts
│   │   ├── issues.ts
│   │   ├── attachments.ts
│   │   └── system.ts
│   └── migrations/                   # SQL migration files
│       └── 0001_initial_schema.sql
│
├── auth/                             # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts            # POST /auth/login, /auth/refresh, /auth/logout, /auth/forgot-password, /auth/reset-password, /auth/activate
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts           # Passport JWT strategy
│   └── dto/
│       ├── login.dto.ts
│       ├── forgot-password.dto.ts
│       ├── reset-password.dto.ts
│       └── token-response.dto.ts
│
├── users/                            # User management
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│
├── employees/                        # Employee management
│   ├── employees.module.ts
│   ├── employees.controller.ts
│   ├── employees.service.ts
│   ├── employee-documents.controller.ts
│   ├── employee-documents.service.ts
│   └── dto/
│
├── organizations/                    # Companies, Agencies, Sites
│   ├── organizations.module.ts
│   ├── agencies.controller.ts
│   ├── agencies.service.ts
│   ├── sites.controller.ts
│   ├── sites.service.ts
│   └── dto/
│
├── inspections/                      # Inspections + templates
│   ├── inspections.module.ts
│   ├── inspections.controller.ts
│   ├── inspections.service.ts
│   ├── templates.controller.ts
│   ├── templates.service.ts
│   ├── reviews.controller.ts
│   ├── reviews.service.ts
│   └── dto/
│
├── trainings/                        # Trainings/Instructaje
│   ├── trainings.module.ts
│   ├── trainings.controller.ts
│   ├── trainings.service.ts
│   ├── participants.service.ts
│   └── dto/
│
├── issues/                           # Issue reports
│   ├── issues.module.ts
│   ├── issues.controller.ts
│   ├── issues.service.ts
│   ├── assignments.service.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   └── dto/
│
├── storage/                          # File storage abstraction
│   ├── storage.module.ts
│   ├── storage.service.ts            # Interface/abstract
│   ├── local-storage.service.ts      # Local filesystem (dev)
│   └── azure-blob-storage.service.ts # Azure Blob Storage (prod)
│
├── pdf/                              # PDF generation
│   ├── pdf.module.ts
│   ├── pdf.service.ts
│   └── templates/                    # PDF templates (HTML → PDF)
│       ├── inspection-report.template.ts
│       ├── training-record.template.ts
│       └── base.template.ts
│
├── notifications/                    # Push + Email
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── push.service.ts               # Expo Push Service (MVP) / FCM direct (viitor)
│   ├── email.service.ts              # Nodemailer
│   └── templates/                    # Email templates
│
├── jobs/                             # Background jobs (@nestjs/schedule CRON)
│   ├── jobs.module.ts
│   ├── scheduled-tasks.service.ts    # Toate CRON job-urile
│   ├── pdf-generation.service.ts     # Generare PDF async
│   ├── document-expiry.service.ts    # Check documente expirate
│   ├── deadline-reminder.service.ts  # Check deadline-uri probleme
│   └── orphan-cleanup.service.ts     # Cleanup attachments temporare
│
└── dashboard/                        # Statistics & reports
    ├── dashboard.module.ts
    ├── dashboard.controller.ts
    ├── dashboard.service.ts
    └── dto/
```

---

## 3. Pattern RBAC Granular — Vizibilitate la Nivel de Query

**Strategie**: Nu doar guard pe endpoint, ci **filtrare automată la nivel de query** prin Drizzle `where` clauses.

### Implementare: `ScopeService`

```typescript
// src/common/services/scope.service.ts
@Injectable()
export class ScopeService {
  constructor(private db: DrizzleService) {}

  /**
   * Returnează condițiile WHERE bazate pe rolul userului.
   * Se aplică pe ORICE query care accesează date.
   */
  async getSiteScope(user: AuthUser): Promise<number[]> {
    switch (user.role) {
      case 'ADMIN':
      case 'MANAGER_SSM':
        return []; // empty = no filter (sees everything)

      case 'SEF_AGENTIE': {
        // Vede toate site-urile din agenția lui
        const agencies = await this.getUserAgencies(user.id);
        return this.getSitesByAgencies(agencies);
      }

      case 'INSPECTOR_SSM': {
        // Vede site-urile din agențiile la care e alocat
        const agencies = await this.getUserAgencies(user.id);
        return this.getSitesByAgencies(agencies);
      }

      case 'SEF_SANTIER':
        // Vede doar site-urile la care e alocat direct
        return this.getUserSites(user.id);

      case 'MUNCITOR':
        // Vede doar site-ul curent
        return this.getUserSites(user.id);
    }
  }

  // Utilizare în service:
  // const siteIds = await this.scope.getSiteScope(user);
  // const where = siteIds.length > 0 
  //   ? and(eq(issues.companyId, user.companyId), inArray(issues.siteId, siteIds))
  //   : eq(issues.companyId, user.companyId);
}
```

### Guard pe endpoint + scope pe query:

```typescript
// Controller: verifică rolul
@Get()
@Roles('ADMIN', 'MANAGER_SSM', 'SEF_AGENTIE', 'INSPECTOR_SSM')
async getInspections(@CurrentUser() user: AuthUser, @Query() query: ListDto) {
  return this.inspectionsService.findAll(user, query);
}

// Service: aplică scope
async findAll(user: AuthUser, query: ListDto) {
  const siteIds = await this.scope.getSiteScope(user);
  
  const where = and(
    eq(inspections.companyId, user.companyId),
    isNull(inspections.deletedAt),
    siteIds.length > 0 ? inArray(inspections.siteId, siteIds) : undefined,
    query.status ? eq(inspections.status, query.status) : undefined,
  );

  return this.db.select().from(inspections).where(where)
    .limit(query.limit).offset(query.offset)
    .orderBy(desc(inspections.createdAt));
}
```

---

## 4. Pattern Storage Service (Upload Fișiere)

```typescript
// Interfață abstractă
export abstract class StorageService {
  abstract upload(file: Buffer, path: string, mimeType: string): Promise<string>;
  abstract getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  abstract delete(path: string): Promise<void>;
}

// Structura fișierelor în storage:
// {company_id}/{entity_type}/{year}/{month}/{uuid}.{ext}
// Ex: 1/inspections/2026/02/a1b2c3d4-e5f6.jpg
// Ex: 1/documents/2026/02/medical-record-uuid.pdf
```

**Dev**: `LocalStorageService` — salvează în `./uploads/`
**Prod**: `AzureBlobStorageService` — salvează în Azure Blob container

Selectarea se face prin `ConfigModule`:
```typescript
StorageModule.register({
  provider: process.env.STORAGE_PROVIDER || 'local', // 'local' | 'azure'
})
```

### Upload Flow: Option B (Separate Upload → Temp UUID)

**Decizie**: Upload-ul fișierelor se face separat de crearea entității.

**Flow:**
1. Client trimite `POST /upload` cu fișierul → server salvează în storage, creează record în `attachments` cu stare temporară (nelegat de nicio entitate), returnează `attachment_uuid`
2. Client continuă completarea formularului (poate uploada mai multe fișiere asincron)
3. La submit, client trimite `POST /entity` cu `{ data, attachment_uuids: ["uuid1", "uuid2"] }`
4. Server creează entitatea + leagă attachment-urile de entitate în aceeași tranzacție DB

**De ce Option B**: Pe mobil (React Native), utilizatorul fotografiază probleme pe teren. Upload-ul se face imediat (asincron, în fundal), nu la final. Dacă are semnal slab, pozele se urcă treptat, iar la submit doar se leagă UUID-urile.

**Orphan cleanup**: CRON job zilnic (ex: 03:00) șterge attachment-uri nelegăte (fără FK la nicio entitate) mai vechi de 24h.

```typescript
// POST /upload — returnează attachment_uuid
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file, @CurrentUser() user) {
  const path = this.storage.generatePath(user.companyId, file);
  const url = await this.storage.upload(file.buffer, path, file.mimetype);

  const [attachment] = await this.db.insert(attachments).values({
    companyId: user.companyId,
    fileUrl: url,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: user.id,
    // Niciun FK setat → attachment temporar (orphan)
  }).returning();

  return { uuid: attachment.uuid };
}

// POST /issues — leagă attachment_uuids la entitate
@Post()
async create(@Body() dto: CreateIssueDto, @CurrentUser() user) {
  return this.db.transaction(async (tx) => {
    const [issue] = await tx.insert(issueReports).values({...}).returning();

    if (dto.attachmentUuids?.length) {
      await tx.update(attachments)
        .set({ issueReportId: issue.id })
        .where(inArray(attachments.uuid, dto.attachmentUuids));
    }

    return issue;
  });
}
```

---

## 5. Generare PDF

**Librărie aleasă**: **pdfmake**

**Justificare**:
- Pur JavaScript, **zero dependințe native** — funcționează identic în Docker pe orice arhitectură (inclusiv ARM pe Oracle Cloud Free Tier)
- Suficient pentru rapoarte SSM: text + tabele + imagini + headere/footere
- ~10MB vs ~300MB Puppeteer — Docker image mult mai mic
- API declarativ (JSON → PDF), ușor de generat dinamic din date

**Alternativă viitoare**: Dacă template-urile devin complexe (HTML/CSS custom), se poate migra la Puppeteer. Dar pentru MVP (rapoarte tip fișă inspecție, fișă instructaj), pdfmake este mai mult decât suficient.

```typescript
@Injectable()
export class PdfService {
  async generateInspectionReport(inspection: InspectionWithItems): Promise<Buffer> {
    const docDefinition = {
      content: [
        { text: 'Raport Inspecție SSM', style: 'header' },
        { text: `Șantier: ${inspection.site.name}` },
        { text: `Inspector: ${inspection.inspector.name}` },
        { text: `Data: ${inspection.completedAt}` },
        // ... table with inspection items
      ],
      styles: { header: { fontSize: 18, bold: true } },
    };
    return new Promise((resolve) => {
      const printer = new PdfPrinter(fonts);
      const doc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.end();
    });
  }
}
```

Generarea se face **async** prin CRON job (`@nestjs/schedule`) → rezultatul se salvează în storage → URL-ul se scrie în `inspections.pdf_url`.

---

## 6. Endpoint-uri API Principale

### Auth
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| POST | `/auth/login` | Public | Login cu email + parolă |
| POST | `/auth/refresh` | Public | Refresh token |
| POST | `/auth/logout` | Autentificat | Revocare refresh token |
| GET | `/auth/me` | Autentificat | Profil + permisiuni efective + agenții/șantiere alocate + minAppVersion |
| POST | `/auth/activate` | Public (cu token) | Activare cont nou — setare parolă (link primit de la ADMIN) |
| POST | `/auth/forgot-password` | Public | Solicită link de resetare parolă (trimis pe email) |
| POST | `/auth/reset-password` | Public (cu token) | Resetare parolă cu token din link |

### Organizations
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/agencies` | ADMIN, MANAGER, SEF_AG | Lista agenții (scoped) |
| POST | `/agencies` | ADMIN | Creează agenție |
| GET | `/sites` | Toți (scoped) | Lista șantiere |
| POST | `/sites` | ADMIN, SEF_AG | Creează șantier |
| PATCH | `/sites/:uuid` | ADMIN, SEF_AG | Modifică șantier |

### Employees
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/employees` | ADMIN, MGR, SEF_AG, INSP | Lista angajați (scoped) |
| POST | `/employees` | ADMIN, SEF_AG | Creează angajat |
| PATCH | `/employees/:uuid` | ADMIN, SEF_AG | Modifică angajat |
| GET | `/employees/:uuid/history` | ADMIN, MGR, SEF_AG, INSP | Istoric angajat |
| POST | `/employees/:uuid/documents` | ADMIN, MGR, INSP | Upload document |
| GET | `/employees/:uuid/documents` | ADMIN, MGR, SEF_AG, INSP | Lista documente |
| POST | `/employees/:uuid/assign-site` | ADMIN, SEF_AG | Alocă angajat pe șantier |
| DELETE | `/employees/:uuid/assign-site/:siteUuid` | ADMIN, SEF_AG | Dezalocă angajat de pe șantier |
| GET | `/sites/:uuid/employees` | ADMIN, MGR, SEF_AG, INSP, SEF_S | Lista angajați pe un șantier |

### Inspections
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/inspection-templates` | Toți (activi) | Lista template-uri |
| POST | `/inspection-templates` | ADMIN | Creează template |
| POST | `/inspection-templates/:uuid/versions` | ADMIN | Publică versiune nouă |
| GET | `/inspections` | ADMIN, MGR, SEF_AG, INSP (scoped) | Lista inspecții |
| POST | `/inspections` | INSPECTOR_SSM | Creează inspecție (din mobil) |
| PATCH | `/inspections/:uuid` | INSPECTOR_SSM (owner) | Modifică draft |
| POST | `/inspections/:uuid/submit` | INSPECTOR_SSM (owner) | Trimite la aprobare |
| POST | `/inspections/:uuid/review` | ADMIN, MGR, SEF_AG | Aprobă/Respinge |
| GET | `/inspections/:uuid/pdf` | ADMIN, MGR, SEF_AG, INSP | Descarcă PDF |

### Trainings
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/trainings` | ADMIN, MGR, SEF_AG, INSP, SEF_S (scoped) | Lista instructaje |
| POST | `/trainings` | INSP, SEF_SANTIER | Creează instructaj |
| POST | `/trainings/:uuid/confirm` | MUNCITOR | Confirmă participare |
| GET | `/trainings/:uuid/pdf` | ADMIN, MGR, SEF_AG, INSP | Descarcă fișa |

### Issues
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/issues` | Toți (scoped) | Lista probleme |
| POST | `/issues` | Toți | Raportează problemă |
| PATCH | `/issues/:uuid/assign` | INSP, SEF_S, SEF_AG | Atribuie |
| PATCH | `/issues/:uuid/status` | Asignat / INSP | Schimbă status |
| POST | `/issues/:uuid/comments` | Toți (scoped) | Adaugă comentariu |
| GET | `/issues/categories` | Toți | Lista categorii |

### Dashboard
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| GET | `/dashboard/stats` | ADMIN, MGR, SEF_AG | Statistici generale |
| GET | `/dashboard/expiring-docs` | ADMIN, MGR | Documente care expiră |
| GET | `/dashboard/overdue-trainings` | ADMIN, MGR | Instructaje restante |

### Files
| Metoda | Endpoint | Roluri | Descriere |
|--------|----------|--------|-----------|
| POST | `/upload` | Autentificat | Upload fișier → returnează URL |
| GET | `/files/:uuid` | Autentificat (scoped) | Download/preview fișier |

---

## 7. Strategia JWT

| Parametru | Valoare | Justificare |
|-----------|---------|-------------|
| Access token expiry | **15 minute** | Suficient pentru o sesiune activă, limitat la compromise |
| Refresh token expiry | **7 zile** | Mobil: re-login săptămânal. Desktop: similar |
| Refresh token rotation | **Da** | La fiecare refresh, se generează token nou, cel vechi se revocă |
| Reuse detection | **Da** | Dacă un refresh token revocat e refolosit → revocă TOATE token-urile user-ului |
| Stocare client mobil | `expo-secure-store` | Encrypted storage pe device |
| Stocare client desktop | `electron safeStorage` | Encrypted la nivel OS |

**Payload access token**:
```json
{
  "sub": "user-uuid",
  "role": "INSPECTOR_SSM",
  "companyId": 1,
  "employeeId": 42,
  "iat": 1708000000,
  "exp": 1708000900
}
```

**Răspuns GET /auth/me** (include permisiuni efective):
```json
{
  "user": { "uuid": "...", "email": "...", "role": "INSPECTOR_SSM", "name": "Ion Popescu" },
  "employee": { "uuid": "...", "jobTitle": "Inspector SSM" },
  "allocatedAgencies": [{ "uuid": "...", "name": "Agenția Nord" }],
  "allocatedSites": [{ "uuid": "...", "name": "Șantier Bloc A1" }],
  "permissions": ["inspections.create", "inspections.read", "issues.create", "issues.read", "trainings.read"],
  "minAppVersion": "1.0.0"
}
```
Mobilul folosește `allocatedSites` și `permissions` pentru a determina ce ecrane să afișeze și ce date să fetch-uiască. `minAppVersion` e folosit pentru force-update (dacă versiunea app < minAppVersion, se afișează ecran de update obligatoriu).

### Flow Creare Cont Utilizator

**Principiu**: ADMIN creează contul. Nu există self-registration. Un angajat (employee) poate exista fără cont, iar contul se adaugă ulterior.

```
1. ADMIN creează angajat (POST /employees)
   → record în employees (fără cont de user)

2. ADMIN creează cont pentru angajat (POST /users)
   → record în users (cu password_hash temporar, is_active=false)
   → server generează activation_token (JWT cu expiry 48h)
   → server returnează link: {APP_URL}/auth/activate?token=xxx

3. ADMIN trimite link-ul angajatului (WhatsApp/SMS/email/în persoană)
   → pe șantier, cel mai practic e WhatsApp sau SMS

4. Angajatul deschide link-ul (POST /auth/activate)
   → setează parola proprie
   → is_active = true
   → poate face login

Alternativă simplificată (MVP): ADMIN setează direct parola la creare cont
   → o comunică verbal angajatului pe șantier
   → angajatul poate schimba parola din Profil
```

**Password Reset**:
```
1. User solicită reset (POST /auth/forgot-password cu email)
   → server trimite email cu link: {APP_URL}/auth/reset-password?token=xxx
   → token-ul e JWT cu expiry 1h, stocat hash-uit în DB

2. User deschide link-ul (POST /auth/reset-password cu token + noua parolă)
   → server validează token, actualizează password_hash
   → revocă TOATE refresh token-urile existente (forțează re-login)

3. Fallback (MUNCITOR fără email):
   → ADMIN poate reseta parola din desktop (PATCH /users/:uuid cu forcePasswordReset)
   → la următorul login, userul e forțat să schimbe parola
```

**Notă**: Un angajat existent fără cont poate primi cont oricând — ADMIN creează user-ul cu `employee_id` existent. Schema suportă deja acest scenariu (employees ← users este 1:0..1).

---

## 8. Pattern Notificări

```
EventEmitter (NestJS) → NotificationService → PushService (Expo Push / FCM)
                                             → EmailService (Nodemailer)
(MVP: sincron in-process. Viitor cu BullMQ: async via queue)
```

**Evenimente care generează notificări:**
- `issue.reported.critical` → push la SEF_SANTIER + INSPECTOR + SEF_AGENTIE
- `issue.assigned` → push + email la persoana atribuită
- `issue.resolved` → push la reporter + inspector
- `issue.deadline.approaching` → push la persoana atribuită (CRON daily)
- `inspection.submitted` → push la MANAGER_SSM + SEF_AGENTIE
- `inspection.reviewed` → push la inspector
- `training.invitation` → push la participanți (pentru confirmare mobilă)
- `document.expiring` → email la ADMIN + MANAGER_SSM (CRON daily)

---

## 9. Job-uri Asincrone (MVP: @nestjs/schedule)

**Decizie MVP**: `@nestjs/schedule` cu CRON jobs in-process. **Fără Redis, fără BullMQ.**

**Justificare**: O singură firmă, un singur server. CRON in-process e suficient. Redis + BullMQ se adaugă doar dacă:
- Ai mai multe instanțe API (load balancing) — trebuie un singur executor
- Job-urile durează mult și trebuie retry/dead-letter
- Ai nevoie de dashboard monitorizare job-uri (Bull Dashboard)

```typescript
// jobs/scheduled-tasks.service.ts
@Injectable()
export class ScheduledTasksService {
  // Check expired documents: daily at 08:00
  @Cron('0 8 * * *')
  async checkExpiredDocuments() { /* ... */ }

  // Check approaching deadlines: daily at 09:00
  @Cron('0 9 * * *')
  async checkApproachingDeadlines() { /* ... */ }

  // Cleanup old refresh tokens: daily at 03:00
  @Cron('0 3 * * *')
  async cleanupRefreshTokens() { /* ... */ }

  // Cleanup orphan attachments (upload fără entitate): daily at 03:30
  @Cron('30 3 * * *')
  async cleanupOrphanAttachments() {
    // Șterge attachments fără niciun FK setat, mai vechi de 24h
  }

  // Create next month audit_log partition: 1st of each month
  @Cron('0 0 1 * *')
  async createNextAuditPartition() { /* ... */ }

  // Arhivare poze vechi: 1st of each month
  @Cron('0 2 1 * *')
  async archiveOldPhotos() {
    // Poze > 6 luni: recomprimă la calitate mai mică (0.3) → economie ~50% spațiu
    // Poze > 1 an: șterge (MVP). Viitor: mută în cold storage.
    // Folosește sharp (Node.js) sau expo-image-manipulator equivalent pe server
  }
}
```

**Migrare viitoare**: Când aplicația necesită mai multe instanțe → adaugă Redis + BullMQ. Job-urile se mută din `@Cron` în queue processors fără schimbări de logică.

**Offline conflict resolution (MVP)**: Last-write-wins. Nu implementăm optimistic locking pe MVP — dacă doi utilizatori modifică aceeași problemă simultan, ultima scriere câștigă. Acceptabil pentru o singură firmă cu utilizatori limitați pe același șantier.

---

## 10. Docker + Docker Compose

```yaml
# docker-compose.yml (MVP — fără Redis)
services:
  api:
    build: ./apps/api
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [postgres]
    volumes:
      - uploads:/app/uploads  # Local storage (dev)

  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: ssm_db
      POSTGRES_USER: ssm_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  # pgadmin (dev only)
  pgadmin:
    image: dpage/pgadmin4
    ports: ["5050:80"]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    profiles: ["dev"]

  # Redis (opțional — decomentează când migrezi la BullMQ)
  # redis:
  #   image: redis:7-alpine
  #   ports: ["6379:6379"]

volumes:
  pgdata:
  uploads:
```

---

## 11. Validare Input (Zod)

**Decizie**: **Zod** (nu class-validator)

**Justificare**: Zod schemas se pot partaja între backend, mobil și desktop (monorepo shared package). class-validator e legat de decoratoare TypeScript, nu funcționează în React Native.

```typescript
// packages/shared/src/schemas/issue.schema.ts
export const CreateIssueSchema = z.object({
  siteUuid: z.string().uuid(),
  categoryUuid: z.string().uuid().optional(),
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Custom pipe in NestJS:
@UsePipes(new ZodValidationPipe(CreateIssueSchema))
```

### Validare Template JSONB (IMPORTANT)

Template-ul de inspecție (`inspection_template_versions.structure`) este un JSONB cu structură specifică. Mobilul (`DynamicInspectionForm`) iterează prin `sections[].questions[]` — dacă structura e invalidă (lipsesc câmpuri, tipuri greșite), formularul se strică.

**Schema Zod în `@ssm/shared`** — validează structura ÎNAINTE de salvare:

```typescript
// packages/shared/src/schemas/inspection-template.schema.ts
const QuestionSchema = z.object({
  id: z.string().min(1),                                      // unic în template
  text: z.string().min(1),
  type: z.enum(['YES_NO', 'TEXT', 'NUMBER', 'SELECT', 'PHOTO']),
  required: z.boolean().default(true),
  risk_score: z.number().min(1).max(10).optional(),
  default_severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  options: z.array(z.string()).optional(),                     // doar pentru SELECT
  photo_required: z.boolean().default(false),
  order: z.number().int().min(0),
});

const SectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().min(0),
  questions: z.array(QuestionSchema).min(1),                  // minim o întrebare
});

export const TemplateStructureSchema = z.object({
  sections: z.array(SectionSchema).min(1),                    // minim o secțiune
});
```

Server-ul validează cu acest schema la `POST /inspection-templates/:uuid/versions`. Desktop-ul folosește același schema pentru validare client-side în `TemplateBuilder`. Mobilul nu editează template-uri — doar le consumă.

---

## 12. Error Handling Consistent

```typescript
// Format răspuns eroare standard
{
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Date invalide",
  "details": [
    { "field": "title", "message": "Minim 3 caractere" }
  ],
  "timestamp": "2026-02-21T10:00:00Z"
}

// Global exception filter prinde:
// - ZodError → 400 VALIDATION_ERROR
// - UnauthorizedException → 401 UNAUTHORIZED  
// - ForbiddenException → 403 FORBIDDEN
// - NotFoundException → 404 NOT_FOUND
// - ConflictException → 409 CONFLICT
// - Altele → 500 INTERNAL_ERROR (fără detalii în producție)
```

---

## 13. Paginare, Filtrare, Sortare

```typescript
// Pattern standard pe toate listing endpoints

// Request: GET /issues?page=1&limit=20&sortBy=reportedAt&sortDir=desc&status=REPORTED&severity=CRITICAL
// Validat prin Zod:
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

// Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 147,
    "totalPages": 8,
    "hasNextPage": true
  }
}
```
