# Part 1: Schema SQL PostgreSQL — SSM Management System

## Decizii de Design

### BIGINT vs UUID
- **PK intern**: `BIGINT GENERATED ALWAYS AS IDENTITY` — 8 bytes, indexare rapidă, join-uri performante
- **Identificator public**: coloană `uuid` separată (tip `UUID`, default `gen_random_uuid()`) doar pe tabelele expuse în API
- **Justificare**: BIGINT este de ~2x mai rapid la indexare decât UUID. UUID-ul expus în API previne enumerarea resurselor (IDOR attacks)

### Soft Delete
- Toate tabelele au `deleted_at TIMESTAMPTZ` nullable
- Partial index `WHERE deleted_at IS NULL` pe coloanele frecvent interogate
- Query-urile trebuie să filtreze `WHERE deleted_at IS NULL` (implementat la nivel ORM cu global scope)

### Exclusive Arc (Attachments)
- Pattern ales pentru tabela `attachments`: FK-uri separate nullable pentru fiecare entitate părinte
- CHECK constraint garantează exact un FK non-null
- Avantaj: referential integrity completă cu FK reale, performanță bună pe PostgreSQL (null-urile costă ~1 bit)

### Criptare CNP
- **Recomandare**: criptare la nivel de aplicație (NestJS), NU la nivel DB cu pgcrypto
- **Justificare**: pgcrypto expune cheia în query-uri SQL (vizibilă în logs). Mai bine criptăm/decriptăm în application layer cu `aes-256-gcm` din Node.js `crypto`
- Coloana `cnp_encrypted` e `BYTEA`, coloana `cnp_hash` e `VARCHAR(64)` (SHA-256 hash pentru căutare fără decriptare)
- Cheia de criptare se ține în environment variable, nu în DB

### Semnături Digitale (pregătire viitor)
- Tabelele de inspecții și instructaje au coloana `signature_data JSONB` (nullable, neutilizată momentan)
- În viitor: va conține `{type: "drawn"|"certificate", image_url: "...", signer_name: "...", signed_at: "...", certificate_hash: "..."}`
- Alternativă viitoare: tabel separat `digital_signatures` cu FK polimorfic

---

## Extensii Necesare

```sql
-- Extensii PostgreSQL necesare
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- pentru gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- pentru exclusion constraints (opțional, viitor)
```

---

## Funcții Utilitare Globale

### Trigger auto-update `updated_at`

```sql
-- Funcție trigger pentru auto-update updated_at
-- Folosește WHEN clause la nivel de trigger pentru eficiență
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Macro: creează trigger pe orice tabel
-- Exemplu: SELECT create_updated_at_trigger('companies');
CREATE OR REPLACE FUNCTION create_updated_at_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW
         WHEN (OLD IS DISTINCT FROM NEW)
         EXECUTE FUNCTION fn_set_updated_at()',
        table_name, table_name
    );
END;
$$ LANGUAGE plpgsql;
```

### Funcție și Trigger Audit Log

```sql
-- Funcție generică de audit logging
-- Captează: tabel, operație, old/new values, user_id din session
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields JSONB;
    v_user_id TEXT;
    v_key TEXT;
    v_record_id TEXT;
BEGIN
    -- Preia user_id din session (setat de aplicație cu SET LOCAL)
    v_user_id := current_setting('app.current_user_id', true);

    -- Determină record ID
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id::TEXT;
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_changed_fields := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id::TEXT;
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_changed_fields := v_new_data;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id::TEXT;
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        -- Calculează doar câmpurile schimbate
        v_changed_fields := '{}'::JSONB;
        FOR v_key IN SELECT jsonb_object_keys(v_new_data)
        LOOP
            IF v_new_data -> v_key IS DISTINCT FROM v_old_data -> v_key THEN
                v_changed_fields := v_changed_fields || 
                    jsonb_build_object(v_key, jsonb_build_object(
                        'old', v_old_data -> v_key,
                        'new', v_new_data -> v_key
                    ));
            END IF;
        END LOOP;
        
        -- Nu loga dacă nu s-a schimbat nimic real
        IF v_changed_fields = '{}'::JSONB THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Exclude câmpuri sensibile din audit log
    v_old_data := v_old_data - 'cnp_encrypted' - 'cnp_hash' - 'password_hash';
    v_new_data := v_new_data - 'cnp_encrypted' - 'cnp_hash' - 'password_hash';

    INSERT INTO audit_logs (
        table_name, record_id, operation,
        old_values, new_values, changed_fields,
        performed_by, performed_at
    ) VALUES (
        TG_TABLE_NAME, v_record_id, TG_OP,
        v_old_data, v_new_data, v_changed_fields,
        v_user_id, NOW()
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Macro: creează audit trigger pe orice tabel
CREATE OR REPLACE FUNCTION create_audit_trigger(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_%s_audit
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW
         EXECUTE FUNCTION fn_audit_trigger()',
        table_name, table_name
    );
END;
$$ LANGUAGE plpgsql;
```

---

## Tabele — Nucleu Organizațional

### `companies`

```sql
-- Firma. Una singură acum, dar proiectată generic pentru viitor multi-tenant.
-- Toate entitățile principale au FK către company_id.
CREATE TABLE companies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name        VARCHAR(255) NOT NULL,
    cui         VARCHAR(20),                    -- Cod Unic de Înregistrare
    reg_com     VARCHAR(30),                    -- Nr. Registrul Comerțului
    address     TEXT,
    city        VARCHAR(100),
    county      VARCHAR(50),                    -- Județ
    phone       VARCHAR(20),
    email       VARCHAR(255),
    logo_url    VARCHAR(500),
    settings    JSONB NOT NULL DEFAULT '{}',    -- Setări specifice firmei
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE companies IS 'Firma/companiile. Momentan una singură, dar schema suportă multi-tenant.';
COMMENT ON COLUMN companies.cui IS 'Cod Unic de Înregistrare (Romanian tax ID)';
COMMENT ON COLUMN companies.settings IS 'Setări JSON: {default_language, timezone, notification_preferences, ...}';

CREATE INDEX idx_companies_deleted ON companies (id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('companies');
SELECT create_audit_trigger('companies');
```

### `agencies`

```sql
-- Agențiile/sucursalele regionale ale firmei.
-- Un nivel ierarhic sub companies, deasupra sites.
CREATE TABLE agencies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(20),                    -- Cod intern (ex: "AG-NORD")
    address     TEXT,
    city        VARCHAR(100),
    county      VARCHAR(50),
    phone       VARCHAR(20),
    email       VARCHAR(255),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE agencies IS 'Agențiile/sucursalele regionale. Ierarhie: Company → Agency → Site.';
COMMENT ON COLUMN agencies.code IS 'Cod intern scurt pentru identificare rapidă (ex: AG-NORD, AG-SUD)';

CREATE INDEX idx_agencies_company ON agencies (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_agencies_deleted ON agencies (id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_agencies_code_company ON agencies (company_id, code) WHERE deleted_at IS NULL AND code IS NOT NULL;

SELECT create_updated_at_trigger('agencies');
SELECT create_audit_trigger('agencies');
```

### `sites`

```sql
-- Șantierele de construcție. Au locație GPS, perioadă de activitate, status.
-- Un șantier aparține unei singure agenții.
CREATE TABLE sites (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    agency_id       BIGINT NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(30),                    -- Cod intern șantier
    address         TEXT,
    city            VARCHAR(100),
    county          VARCHAR(50),
    latitude        DECIMAL(10, 7),                 -- GPS lat
    longitude       DECIMAL(10, 7),                 -- GPS lng
    geofence_radius INTEGER DEFAULT 200,            -- Raza geofence în metri
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CLOSED')),
    start_date      DATE,                           -- Data deschidere șantier
    estimated_end   DATE,                           -- Data estimată finalizare
    actual_end      DATE,                           -- Data reală închidere
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE sites IS 'Șantierele de construcție. Au coordonate GPS pentru geofencing.';
COMMENT ON COLUMN sites.geofence_radius IS 'Raza în metri pentru auto-detectare șantier din GPS. Default 200m.';
COMMENT ON COLUMN sites.company_id IS 'Denormalizat de la agency pentru query-uri rapide. Trebuie să fie consistent cu agency.company_id.';

CREATE INDEX idx_sites_agency ON sites (agency_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_company ON sites (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_status ON sites (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_deleted ON sites (id) WHERE deleted_at IS NULL;
-- Index pentru căutare GPS (bounding box simplu, fără PostGIS)
CREATE INDEX idx_sites_gps ON sites (latitude, longitude) WHERE deleted_at IS NULL AND latitude IS NOT NULL;

SELECT create_updated_at_trigger('sites');
SELECT create_audit_trigger('sites');

-- Trigger: validare consistență sites.company_id = agency.company_id
-- Previne crearea unui site cu company_id diferit de agenția sa.
CREATE OR REPLACE FUNCTION fn_validate_site_company()
RETURNS TRIGGER AS $$
DECLARE
    v_agency_company_id BIGINT;
BEGIN
    SELECT company_id INTO v_agency_company_id
    FROM agencies WHERE id = NEW.agency_id;

    IF v_agency_company_id IS DISTINCT FROM NEW.company_id THEN
        RAISE EXCEPTION 'sites.company_id (%) must match agency.company_id (%)',
            NEW.company_id, v_agency_company_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sites_validate_company
    BEFORE INSERT OR UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_site_company();
```

---

## Tabele — Angajați și Utilizatori

### `employees`

```sql
-- Toți angajații/muncitorii firmei.
-- IMPORTANT: Un angajat POATE avea cont de user (dacă folosește app) sau NU.
-- Relația: employees ← users (user.employee_id FK → employees.id)
-- Un user e ÎNTOTDEAUNA un angajat; un angajat NU e neapărat user.
CREATE TABLE employees (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    -- Date personale
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    -- CNP criptat la nivel de aplicație (AES-256-GCM)
    cnp_encrypted   BYTEA,                          -- CNP criptat
    cnp_hash        VARCHAR(64),                    -- SHA-256 hash pentru căutare
    phone           VARCHAR(20),
    email           VARCHAR(255),
    
    -- Date profesionale
    job_title       VARCHAR(150),                   -- Funcție/meserie
    hire_date       DATE,
    termination_date DATE,                          -- NULL dacă e încă angajat
    
    -- NOTĂ: NU avem current_site_id/current_agency_id aici.
    -- Un angajat poate fi alocat pe MULTIPLE șantiere simultan.
    -- Alocările curente se obțin din: employee_site_assignments WHERE removed_at IS NULL
    -- Agency se deduce din site.agency_id.

    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED')),
    
    -- Pregătire semnătură digitală viitoare
    signature_data  JSONB,                          -- NULL acum. Viitor: {type, image_url, ...}
    
    metadata        JSONB NOT NULL DEFAULT '{}',    -- Câmpuri extra flexibile
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE employees IS 'Toți angajații firmei. Un angajat poate avea sau nu cont de utilizator (user).';
COMMENT ON COLUMN employees.cnp_encrypted IS 'CNP criptat cu AES-256-GCM la nivel de aplicație. Cheia din env var.';
COMMENT ON COLUMN employees.cnp_hash IS 'SHA-256 hash al CNP-ului pentru căutare fără decriptare.';
COMMENT ON COLUMN employees.signature_data IS 'Rezervat pentru semnătură digitală viitoare. Format: {type, image_url, signer_name, signed_at}';

CREATE INDEX idx_employees_company ON employees (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON employees (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_cnp_hash ON employees (cnp_hash) WHERE deleted_at IS NULL AND cnp_hash IS NOT NULL;
CREATE INDEX idx_employees_name ON employees (last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_deleted ON employees (id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('employees');
SELECT create_audit_trigger('employees');
```

### `users`

```sql
-- Conturile de utilizator. Fiecare user este legat de un angajat.
-- Roluri: ADMIN, MANAGER_SSM, SEF_AGENTIE, INSPECTOR_SSM, SEF_SANTIER, MUNCITOR
CREATE TABLE users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    employee_id     BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt hash
    
    role            VARCHAR(30) NOT NULL
                    CHECK (role IN (
                        'ADMIN', 'MANAGER_SSM', 'SEF_AGENTIE',
                        'INSPECTOR_SSM', 'SEF_SANTIER', 'MUNCITOR'
                    )),
    
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    
    -- Push notifications (Expo Push Token pentru MVP; FCM direct în viitor)
    push_token      VARCHAR(500),                   -- Expo Push Token (ex: ExponentPushToken[...])
    
    -- Preferințe utilizator
    preferences     JSONB NOT NULL DEFAULT '{}',    -- {language: "ro", theme: "light", ...}
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'Conturi utilizator. Fiecare user e legat de un employee. Un employee poate nu avea user.';
COMMENT ON COLUMN users.role IS 'Rolul determină ce vede și ce poate face. Ierarhie: ADMIN > MANAGER_SSM > SEF_AGENTIE > INSPECTOR_SSM > SEF_SANTIER > MUNCITOR';
COMMENT ON COLUMN users.push_token IS 'Expo Push Token (MVP) sau FCM Token (viitor). Setat de client la login/register.';

CREATE UNIQUE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_employee ON users (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_company ON users (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users (role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted ON users (id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('users');
SELECT create_audit_trigger('users');
```

### `user_agency_assignments`

```sql
-- Alocarea utilizatorilor pe agenții.
-- Folosit pentru: SEF_AGENTIE (o singură agenție), INSPECTOR_SSM (una sau mai multe).
-- ADMIN și MANAGER_SSM nu au nevoie de alocare (văd tot).
CREATE TABLE user_agency_assignments (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agency_id   BIGINT NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at  TIMESTAMPTZ,                    -- NULL = alocare activă
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE user_agency_assignments IS 'Alocarea user-ilor pe agenții. SEF_AGENTIE are una, INSPECTOR_SSM poate avea mai multe.';
COMMENT ON COLUMN user_agency_assignments.removed_at IS 'NULL = alocare activă. Data ne-null = alocare istorică.';

-- Un user nu poate fi alocat de 2 ori activ pe aceeași agenție
CREATE UNIQUE INDEX idx_uaa_active ON user_agency_assignments (user_id, agency_id) 
    WHERE removed_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_uaa_user ON user_agency_assignments (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_uaa_agency ON user_agency_assignments (agency_id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('user_agency_assignments');
```

### `employee_site_assignments`

```sql
-- Alocarea ANGAJAȚILOR pe șantiere. CU ISTORIC complet.
-- IMPORTANT: Entitatea principală e employee_id (NU user_id).
-- Acoperă TOȚI angajații, inclusiv cei fără cont de utilizator.
-- user_id este opțional — setat doar dacă angajatul are cont.
CREATE TABLE employee_site_assignments (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    site_id     BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- NULL dacă angajatul nu are cont
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at  TIMESTAMPTZ,                    -- NULL = alocare activă
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes       TEXT,                           -- Motiv transfer, etc.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE employee_site_assignments IS 'Alocarea angajaților pe șantiere. Istoric complet (removed_at). Acoperă toți angajații, nu doar userii.';
COMMENT ON COLUMN employee_site_assignments.user_id IS 'Opțional. Setat doar dacă angajatul are cont de utilizator. Validat prin trigger.';

-- Trigger: validare consistență employee_id ↔ user_id
-- Dacă user_id e setat, verifică user.employee_id = employee_id
CREATE OR REPLACE FUNCTION fn_validate_esa_user_employee()
RETURNS TRIGGER AS $$
DECLARE
    v_user_employee_id BIGINT;
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        SELECT employee_id INTO v_user_employee_id
        FROM users WHERE id = NEW.user_id;

        IF v_user_employee_id IS DISTINCT FROM NEW.employee_id THEN
            RAISE EXCEPTION 'employee_site_assignments: user_id (%) points to employee_id (%), but assignment has employee_id (%)',
                NEW.user_id, v_user_employee_id, NEW.employee_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_esa_validate_user_employee
    BEFORE INSERT OR UPDATE ON employee_site_assignments
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_esa_user_employee();

CREATE INDEX idx_esa_employee ON employee_site_assignments (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_esa_site ON employee_site_assignments (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_esa_user ON employee_site_assignments (user_id) WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_esa_active ON employee_site_assignments (employee_id, site_id)
    WHERE removed_at IS NULL AND deleted_at IS NULL;

SELECT create_updated_at_trigger('employee_site_assignments');
```

---

## Tabele — Documente Angajați

### `employee_documents`

```sql
-- Documente per angajat: fișe medicale, certificate, atestate, contracte.
-- Fiecare document are tip, dată expirare (pentru alerte), și fișier atașat.
CREATE TABLE employee_documents (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    employee_id     BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    document_type   VARCHAR(30) NOT NULL
                    CHECK (document_type IN (
                        'MEDICAL_RECORD',       -- Fișă medicală
                        'CERTIFICATE',          -- Certificat/atestat
                        'CONTRACT',             -- Contract muncă
                        'ID_DOCUMENT',          -- Copie act identitate
                        'TRAINING_RECORD',      -- Fișă instructaj (upload extern)
                        'OTHER'
                    )),
    
    title           VARCHAR(255) NOT NULL,          -- Numele documentului
    description     TEXT,
    
    -- Expirare
    issued_date     DATE,                           -- Data emiterii
    expiry_date     DATE,                           -- Data expirării (NULL = nu expiră)
    expiry_notified BOOLEAN NOT NULL DEFAULT false,  -- S-a trimis notificare de expirare?
    
    -- Fișierul efectiv se stochează prin tabela attachments (employee_document_id FK).
    -- Nu duplicăm file_url/file_name/etc. aici — attachments e sursa unică.

    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE employee_documents IS 'Documente per angajat cu dată de expirare pentru alerte automate. Fișierul se stochează via attachments.';
COMMENT ON COLUMN employee_documents.expiry_notified IS 'Flag: s-a trimis deja notificare de expirare? Reset la false dacă se uploadează document nou.';

CREATE INDEX idx_edocs_employee ON employee_documents (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_edocs_company ON employee_documents (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_edocs_type ON employee_documents (document_type) WHERE deleted_at IS NULL;
-- Index crucial pentru job-ul de alerte expirare
CREATE INDEX idx_edocs_expiry ON employee_documents (expiry_date) 
    WHERE deleted_at IS NULL AND expiry_date IS NOT NULL AND expiry_notified = false;
CREATE INDEX idx_edocs_deleted ON employee_documents (id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('employee_documents');
SELECT create_audit_trigger('employee_documents');
```

---

## Tabele — Inspecții

### `inspection_templates` & `inspection_template_versions`

```sql
-- Template-uri de inspecție. Masterul este aici, versiunile în tabelul separat.
-- Când se modifică un template, se creează o versiune nouă.
-- Inspecțiile se leagă de VERSIUNE, nu de template.
CREATE TABLE inspection_templates (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),                   -- Ex: "Echipamente", "Electrice", "Schele"
    is_active       BOOLEAN NOT NULL DEFAULT true,
    
    -- Ultima versiune (denormalizat, actualizat la publish)
    current_version_id BIGINT,                      -- FK adăugat după crearea tabelului versions
    version_count   INTEGER NOT NULL DEFAULT 0,
    
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE inspection_templates IS 'Template-uri master de inspecție. Versionate — modificările creează versiuni noi.';
COMMENT ON COLUMN inspection_templates.current_version_id IS 'FK la ultima versiune activă. Setat după INSERT în inspection_template_versions.';

-- Template versions — versiunile efective cu structura JSONB
CREATE TABLE inspection_template_versions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    template_id     BIGINT NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    
    -- Structura dinamică a template-ului
    -- Format JSONB:
    -- {
    --   "sections": [
    --     {
    --       "id": "sec_1",
    --       "title": "Echipamente de protecție",
    --       "order": 1,
    --       "questions": [
    --         {
    --           "id": "q_1",
    --           "text": "Muncitorii poartă cască?",
    --           "type": "YES_NO",          -- YES_NO | TEXT | NUMBER | SELECT | PHOTO
    --           "required": true,
    --           "risk_score": 5,           -- 1-10
    --           "default_severity": "HIGH",
    --           "options": ["Opțiune 1"],  -- doar pentru type=SELECT
    --           "photo_required": false,
    --           "order": 1
    --         }
    --       ]
    --     }
    --   ]
    -- }
    structure       JSONB NOT NULL,
    
    -- Metadata versiune
    change_notes    TEXT,                           -- Ce s-a schimbat în această versiune
    published_at    TIMESTAMPTZ,                    -- NULL = draft, non-null = publicată
    published_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE inspection_template_versions IS 'Versiunile template-urilor. Inspecțiile se leagă de versiune, nu de template.';
COMMENT ON COLUMN inspection_template_versions.structure IS 'Structura JSONB: sections[] → questions[] cu tipuri: YES_NO, TEXT, NUMBER, SELECT, PHOTO.';

-- Adaugă FK circular (template → current_version)
ALTER TABLE inspection_templates 
    ADD CONSTRAINT fk_templates_current_version 
    FOREIGN KEY (current_version_id) REFERENCES inspection_template_versions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_itv_template_version ON inspection_template_versions (template_id, version_number);
CREATE INDEX idx_itv_template ON inspection_template_versions (template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_company ON inspection_templates (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_active ON inspection_templates (company_id, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_templates_deleted ON inspection_templates (id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('inspection_templates');
SELECT create_updated_at_trigger('inspection_template_versions');
SELECT create_audit_trigger('inspection_templates');
```

### `inspections`

```sql
-- Inspecțiile efectuate pe teren. Legate de o versiune de template.
CREATE TABLE inspections (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    site_id         BIGINT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    template_version_id BIGINT NOT NULL REFERENCES inspection_template_versions(id) ON DELETE RESTRICT,
    
    -- Cine a făcut inspecția
    inspector_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Status workflow
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'NEEDS_REVISION', 'CLOSED')),
    
    -- Date inspecție
    started_at      TIMESTAMPTZ,                    -- Când a început completarea
    completed_at    TIMESTAMPTZ,                    -- Când a finalizat pe teren
    submitted_at    TIMESTAMPTZ,                    -- Când a trimis la server
    
    -- Locație GPS la momentul inspecției
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    
    -- Scor risc calculat
    risk_score      DECIMAL(5, 2),                  -- Calculat din răspunsuri
    total_items     INTEGER NOT NULL DEFAULT 0,
    compliant_items INTEGER NOT NULL DEFAULT 0,
    non_compliant_items INTEGER NOT NULL DEFAULT 0,
    
    -- Observații generale
    notes           TEXT,
    
    -- PDF generat
    pdf_url         VARCHAR(500),
    pdf_generated_at TIMESTAMPTZ,
    
    -- Semnătură (viitor)
    signature_data  JSONB,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE inspections IS 'Inspecțiile efectuate pe șantiere. Status: DRAFT→SUBMITTED→APPROVED/REJECTED/NEEDS_REVISION→CLOSED.';
COMMENT ON COLUMN inspections.risk_score IS 'Scor de risc calculat automat din punctele de verificare (medie ponderată).';

CREATE INDEX idx_inspections_company ON inspections (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_site ON inspections (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_inspector ON inspections (inspector_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_template_ver ON inspections (template_version_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_status ON inspections (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_date ON inspections (completed_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_inspections_deleted ON inspections (id) WHERE deleted_at IS NULL;
-- Index compus pentru dashboard: inspecții per site + status
CREATE INDEX idx_inspections_site_status ON inspections (site_id, status) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('inspections');
SELECT create_audit_trigger('inspections');
```

### `inspection_items`

```sql
-- Răspunsurile per punct de verificare dintr-o inspecție.
-- Fiecare item corespunde unei întrebări din template.
CREATE TABLE inspection_items (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inspection_id   BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    
    -- Referință la întrebarea din template JSONB
    section_id      VARCHAR(50) NOT NULL,           -- ID-ul secțiunii din JSONB
    question_id     VARCHAR(50) NOT NULL,           -- ID-ul întrebării din JSONB
    
    -- Răspuns polimorfic
    answer_type     VARCHAR(20) NOT NULL
                    CHECK (answer_type IN ('YES_NO', 'TEXT', 'NUMBER', 'SELECT', 'PHOTO')),
    answer_bool     BOOLEAN,                        -- pentru YES_NO
    answer_text     TEXT,                           -- pentru TEXT și SELECT
    answer_number   DECIMAL(10, 2),                 -- pentru NUMBER
    
    -- Evaluare
    is_compliant    BOOLEAN,                        -- TRUE = conform, FALSE = neconform, NULL = N/A
    severity        VARCHAR(10)
                    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') OR severity IS NULL),
    risk_score      DECIMAL(5, 2),                  -- Scor risc individual
    
    -- Observații pe acest item specific
    notes           TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE inspection_items IS 'Răspunsurile per punct de verificare. Answer type polimorfic: bool/text/number.';
COMMENT ON COLUMN inspection_items.section_id IS 'Corespunde id-ului secțiunii din template JSONB structure.';
COMMENT ON COLUMN inspection_items.question_id IS 'Corespunde id-ului întrebării din template JSONB structure.';

CREATE INDEX idx_iitems_inspection ON inspection_items (inspection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_iitems_compliant ON inspection_items (inspection_id, is_compliant) WHERE deleted_at IS NULL;
-- Index pentru rapoarte: câte neconformități per severitate
CREATE INDEX idx_iitems_severity ON inspection_items (severity) WHERE is_compliant = false;

SELECT create_updated_at_trigger('inspection_items');
```

### `inspection_reviews`

```sql
-- Istoricul de aprobări/respingeri pentru inspecții.
-- O inspecție poate avea mai multe review-uri (respinsă, revizuită, aprobată).
CREATE TABLE inspection_reviews (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    inspection_id   BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    reviewer_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    decision        VARCHAR(20) NOT NULL
                    CHECK (decision IN ('APPROVED', 'REJECTED', 'NEEDS_REVISION')),
    reason          TEXT,                           -- Obligatoriu la REJECTED/NEEDS_REVISION
    
    reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE inspection_reviews IS 'Istoricul de review-uri (aprobări/respingeri) pe inspecții. Audit trail complet.';

CREATE INDEX idx_ireviews_inspection ON inspection_reviews (inspection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_ireviews_reviewer ON inspection_reviews (reviewer_id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('inspection_reviews');
```

---

## Tabele — Instructaje (Trainings)

### `trainings`

```sql
-- Instructajele de SSM conform Legii 319/2006 și HG 1425/2006.
-- Tipuri conform legislației:
--   ANGAJARE: o singură dată, la angajare
--   PERIODIC: max 6 luni muncitori, max 12 luni personal administrativ (Art. 96)
--   SCHIMBARE_LOC_MUNCA: la fiecare schimbare
--   REVENIRE_MEDICAL: la fiecare revenire din concediu medical
--   SPECIAL: situații speciale (accidente, incendii, etc.)
--   ZILNIC: OBLIGATORIU pe șantiere de construcții, la începutul fiecărei zile, 5-10 min
-- Intervalele sunt configurabile per tip în app_settings.
CREATE TABLE trainings (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    site_id         BIGINT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    
    -- Cine a condus instructajul
    conductor_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    training_type   VARCHAR(30) NOT NULL
                    CHECK (training_type IN (
                        'ANGAJARE',                 -- La angajare
                        'PERIODIC',                 -- Periodic (lunar/trimestrial)
                        'SCHIMBARE_LOC_MUNCA',      -- La schimbarea locului de muncă
                        'REVENIRE_MEDICAL',          -- La revenirea din concediu medical
                        'SPECIAL',                  -- Special (situații speciale)
                        'ZILNIC'                    -- Instructaj zilnic (de șef șantier)
                    )),
    
    title           VARCHAR(255) NOT NULL,           -- Subiectul instructajului
    description     TEXT,                            -- Observații detaliate
    
    -- Timing
    conducted_at    TIMESTAMPTZ NOT NULL,             -- Când a avut loc
    duration_minutes INTEGER,                        -- Durata în minute
    
    -- Locație
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    
    -- PDF generat automat (fișa de instructaj)
    pdf_url         VARCHAR(500),
    pdf_generated_at TIMESTAMPTZ,
    
    -- Semnătură instructor (viitor)
    signature_data  JSONB,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE trainings IS 'Instructajele SSM conform Legii 319/2006 și HG 1425/2006. ZILNIC=obligatoriu pe șantiere. Intervalele per tip în app_settings.';
COMMENT ON COLUMN trainings.conductor_id IS 'Cine a condus: INSPECTOR_SSM pentru periodice, SEF_SANTIER pentru zilnice.';

CREATE INDEX idx_trainings_company ON trainings (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trainings_site ON trainings (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trainings_conductor ON trainings (conductor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trainings_type ON trainings (training_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_trainings_date ON trainings (conducted_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_trainings_deleted ON trainings (id) WHERE deleted_at IS NULL;
-- Index compus pentru dashboard: instructaje per site + tip
CREATE INDEX idx_trainings_site_type ON trainings (site_id, training_type) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('trainings');
SELECT create_audit_trigger('trainings');
```

### `training_participants`

```sql
-- Participanții la instructaje. Cu metoda de confirmare a prezenței.
CREATE TABLE training_participants (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    training_id     BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
    employee_id     BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    
    -- Confirmare prezență
    confirmation_method VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (confirmation_method IN (
                        'PENDING',                  -- Încă neconfirmat
                        'MANUAL',                   -- Bifat manual de instructor
                        'SELF_CONFIRMED',           -- Confirmat de pe telefonul propriu
                        'ABSENT'                    -- Absent (marcat explicit)
                    )),
    
    confirmed_at    TIMESTAMPTZ,                    -- Când a confirmat
    
    -- Semnătură participant (viitor)
    signature_data  JSONB,
    
    notes           TEXT,                           -- Observații per participant
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE training_participants IS 'Participanții la instructaje cu metoda de confirmare prezență.';
COMMENT ON COLUMN training_participants.confirmation_method IS 'MANUAL=bifat de instructor, SELF_CONFIRMED=confirmat din app pe telefon.';

CREATE UNIQUE INDEX idx_tp_training_employee ON training_participants (training_id, employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tp_training ON training_participants (training_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tp_employee ON training_participants (employee_id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('training_participants');
```

### `training_materials`

```sql
-- Materiale atașate instructajelor (documente, prezentări).
-- Fișierul efectiv se stochează prin tabela attachments (training_material_id FK).
CREATE TABLE training_materials (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    training_id     BIGINT NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,

    title           VARCHAR(255) NOT NULL,
    description     TEXT,

    -- Fișierul se stochează via attachments (training_material_id FK).
    -- Nu duplicăm file_url/file_name/etc. aici.

    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE training_materials IS 'Materiale atașate unui instructaj. Fișierul se stochează via attachments (training_material_id FK).';

SELECT create_updated_at_trigger('training_materials');

CREATE INDEX idx_tmaterials_training ON training_materials (training_id);
```

---

## Tabele — Raportare Probleme (Issues)

### `issue_categories`

```sql
-- Categoriile de probleme. Configurabile de ADMIN, cu set default.
CREATE TABLE issue_categories (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid        UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    icon        VARCHAR(50),                    -- Nume icon (ex: "shield-alert")
    color       VARCHAR(7),                     -- Hex color (ex: "#FF0000")
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE issue_categories IS 'Categorii de probleme raportate. Set default + configurabile de ADMIN.';

CREATE INDEX idx_icat_company ON issue_categories (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_icat_active ON issue_categories (company_id, is_active, sort_order) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('issue_categories');
```

### `issue_reports`

```sql
-- Problemele raportate de pe teren. Workflow complet cu status tracking.
CREATE TABLE issue_reports (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    site_id         BIGINT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    category_id     BIGINT REFERENCES issue_categories(id) ON DELETE SET NULL,
    
    -- Cine a raportat
    reported_by     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Conținut raport
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    
    severity        VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
                    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    
    -- Workflow status
    status          VARCHAR(20) NOT NULL DEFAULT 'REPORTED'
                    CHECK (status IN (
                        'REPORTED', 'ASSIGNED', 'IN_PROGRESS',
                        'RESOLVED', 'VERIFIED', 'REOPENED', 'CLOSED'
                    )),
    
    -- Locație GPS
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    
    -- Timing
    reported_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    verified_at     TIMESTAMPTZ,
    closed_at       TIMESTAMPTZ,
    
    -- Deadline (setat la assignment)
    deadline        TIMESTAMPTZ,
    deadline_notified BOOLEAN NOT NULL DEFAULT false,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE issue_reports IS 'Probleme raportate de pe teren. Workflow: REPORTED→ASSIGNED→IN_PROGRESS→RESOLVED→VERIFIED/REOPENED→CLOSED.';
COMMENT ON COLUMN issue_reports.deadline IS 'Setat la ASSIGNED. Folosit pentru reminder notifications.';

CREATE INDEX idx_issues_company ON issue_reports (company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_site ON issue_reports (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_category ON issue_reports (category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_reporter ON issue_reports (reported_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_status ON issue_reports (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_severity ON issue_reports (severity) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_date ON issue_reports (reported_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_issues_deleted ON issue_reports (id) WHERE deleted_at IS NULL;
-- Index compus pentru dashboard: probleme deschise per site
CREATE INDEX idx_issues_site_status ON issue_reports (site_id, status) WHERE deleted_at IS NULL;
-- Index pentru job deadline notifications
CREATE INDEX idx_issues_deadline ON issue_reports (deadline) 
    WHERE deleted_at IS NULL AND deadline IS NOT NULL 
    AND status NOT IN ('RESOLVED', 'VERIFIED', 'CLOSED') AND deadline_notified = false;
-- Index pentru dashboard: probleme CRITICAL deschise
CREATE INDEX idx_issues_critical_open ON issue_reports (company_id, severity)
    WHERE deleted_at IS NULL AND severity = 'CRITICAL' 
    AND status NOT IN ('RESOLVED', 'VERIFIED', 'CLOSED');

SELECT create_updated_at_trigger('issue_reports');
SELECT create_audit_trigger('issue_reports');
```

### `issue_assignments`

```sql
-- Atribuirea rezolvării problemelor. O problemă poate fi re-atribuită.
CREATE TABLE issue_assignments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issue_id        BIGINT NOT NULL REFERENCES issue_reports(id) ON DELETE CASCADE,
    
    assigned_to     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by     BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    deadline        TIMESTAMPTZ,
    notes           TEXT,
    
    is_active       BOOLEAN NOT NULL DEFAULT true,  -- FALSE = re-atribuit altcuiva
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE issue_assignments IS 'Atribuirea problemelor pentru rezolvare. is_active=true e atribuirea curentă.';

CREATE INDEX idx_iassign_issue ON issue_assignments (issue_id);
CREATE INDEX idx_iassign_to ON issue_assignments (assigned_to) WHERE is_active = true;
CREATE INDEX idx_iassign_active ON issue_assignments (issue_id) WHERE is_active = true;

SELECT create_updated_at_trigger('issue_assignments');
```

### `issue_comments`

```sql
-- Comentarii/discuții pe o problemă raportată. Timeline.
CREATE TABLE issue_comments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issue_id        BIGINT NOT NULL REFERENCES issue_reports(id) ON DELETE CASCADE,
    author_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    content         TEXT NOT NULL,
    is_system       BOOLEAN NOT NULL DEFAULT false,  -- TRUE = mesaj automat de sistem
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE issue_comments IS 'Comentarii pe probleme raportate. is_system=true pentru mesaje automate (ex: "Status schimbat la IN_PROGRESS").';

CREATE INDEX idx_icomments_issue ON issue_comments (issue_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_icomments_author ON issue_comments (author_id) WHERE deleted_at IS NULL;

SELECT create_updated_at_trigger('issue_comments');
```

### `issue_status_history`

```sql
-- Istoricul complet al schimbărilor de status. Audit trail pe workflow.
CREATE TABLE issue_status_history (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issue_id        BIGINT NOT NULL REFERENCES issue_reports(id) ON DELETE CASCADE,
    
    from_status     VARCHAR(20)
                    CHECK (from_status IN ('REPORTED','ASSIGNED','IN_PROGRESS','RESOLVED','VERIFIED','REOPENED','CLOSED') OR from_status IS NULL),
    to_status       VARCHAR(20) NOT NULL
                    CHECK (to_status IN ('REPORTED','ASSIGNED','IN_PROGRESS','RESOLVED','VERIFIED','REOPENED','CLOSED')),
    
    changed_by      BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason          TEXT,
    
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE issue_status_history IS 'Audit trail complet al schimbărilor de status pe probleme raportate.';

CREATE INDEX idx_ish_issue ON issue_status_history (issue_id);
CREATE INDEX idx_ish_date ON issue_status_history (changed_at DESC);
```

---

## Tabele — Fișiere (Attachments)

### `attachments`

```sql
-- Metadate fișiere (poze, PDF-uri). Pattern EXCLUSIVE ARC cu FK-uri separate.
-- Fiecare attachment aparține EXACT unei entități părinte.
CREATE TABLE attachments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    
    -- === EXCLUSIVE ARC: FK-uri separate nullable ===
    inspection_id       BIGINT REFERENCES inspections(id) ON DELETE CASCADE,
    inspection_item_id  BIGINT REFERENCES inspection_items(id) ON DELETE CASCADE,
    training_id         BIGINT REFERENCES trainings(id) ON DELETE CASCADE,
    training_material_id BIGINT REFERENCES training_materials(id) ON DELETE CASCADE,
    issue_report_id     BIGINT REFERENCES issue_reports(id) ON DELETE CASCADE,
    issue_comment_id    BIGINT REFERENCES issue_comments(id) ON DELETE CASCADE,
    employee_document_id BIGINT REFERENCES employee_documents(id) ON DELETE CASCADE,
    
    -- Metadata fișier
    file_url        VARCHAR(500) NOT NULL,          -- URL în blob storage
    file_name       VARCHAR(255) NOT NULL,
    file_size       INTEGER NOT NULL,               -- bytes
    mime_type       VARCHAR(100) NOT NULL,
    
    -- Metadata extra
    width           INTEGER,                        -- pixels (pentru imagini)
    height          INTEGER,                        -- pixels (pentru imagini)
    thumbnail_url   VARCHAR(500),                   -- URL thumbnail generat
    
    uploaded_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    -- GPS din EXIF (pentru poze de pe teren)
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    captured_at     TIMESTAMPTZ,                    -- EXIF timestamp
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    
    -- CHECK: exact UN FK trebuie să fie non-null
    CONSTRAINT chk_attachment_exclusive_arc CHECK (
        (
            (CASE WHEN inspection_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN inspection_item_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN training_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN training_material_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN issue_report_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN issue_comment_id IS NOT NULL THEN 1 ELSE 0 END) +
            (CASE WHEN employee_document_id IS NOT NULL THEN 1 ELSE 0 END)
        ) = 1
    )
);

COMMENT ON TABLE attachments IS 'Fișiere (poze, PDF-uri). Exclusive arc: exact un FK părinte non-null.';
COMMENT ON COLUMN attachments.file_url IS 'URL relativ în blob storage. Prefixat cu base URL la runtime.';

-- Index pe fiecare FK (PostgreSQL nu le creează automat)
CREATE INDEX idx_attach_inspection ON attachments (inspection_id) WHERE inspection_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_insp_item ON attachments (inspection_item_id) WHERE inspection_item_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_training ON attachments (training_id) WHERE training_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_tmaterial ON attachments (training_material_id) WHERE training_material_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_issue ON attachments (issue_report_id) WHERE issue_report_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_icomment ON attachments (issue_comment_id) WHERE issue_comment_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_edoc ON attachments (employee_document_id) WHERE employee_document_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_attach_company ON attachments (company_id) WHERE deleted_at IS NULL;
```

---

## Tabele — Sistem

### `audit_logs`

```sql
-- Jurnal de modificări automat, populat prin trigger-uri.
-- PARTITIONAT pe lună pentru performanță (tabelul crește rapid).
CREATE TABLE audit_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY,
    
    table_name      VARCHAR(100) NOT NULL,
    record_id       VARCHAR(50),
    operation       VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    
    old_values      JSONB,
    new_values      JSONB,
    changed_fields  JSONB,                          -- Doar câmpurile schimbate (optimizare)
    
    performed_by    VARCHAR(50),                    -- user ID sau 'system'
    performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Session info
    ip_address      INET,
    user_agent      VARCHAR(500),
    
    PRIMARY KEY (id, performed_at)                  -- PK compus necesar pentru partitioning
) PARTITION BY RANGE (performed_at);

COMMENT ON TABLE audit_logs IS 'Audit trail automat. Partitionat lunar. Populat prin trigger fn_audit_trigger().';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Doar câmpurile care s-au schimbat, cu old/new per câmp. NULL la INSERT/DELETE.';

-- Creează partiții pentru următoarele 12 luni
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE);
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..11 LOOP
        end_date := start_date + INTERVAL '1 month';
        partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');
        
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
             FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );
        
        start_date := end_date;
    END LOOP;
END $$;

-- Default partition pentru date în afara range-ului
CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;

-- Indexuri pe partiții (se aplică automat pe fiecare partiție)
CREATE INDEX idx_audit_table_date ON audit_logs (table_name, performed_at DESC);
CREATE INDEX idx_audit_record ON audit_logs (table_name, record_id);
CREATE INDEX idx_audit_user ON audit_logs (performed_by, performed_at DESC);
```

### `notifications`

```sql
-- Notificări trimise utilizatorilor (push + email).
CREATE TABLE notifications (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    uuid            UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    company_id      BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    recipient_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Conținut
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    
    -- Tip și canal
    notification_type VARCHAR(30) NOT NULL
                    CHECK (notification_type IN (
                        'ISSUE_REPORTED', 'ISSUE_ASSIGNED', 'ISSUE_RESOLVED',
                        'ISSUE_DEADLINE', 'INSPECTION_SUBMITTED', 'INSPECTION_REVIEWED',
                        'TRAINING_INVITATION', 'DOCUMENT_EXPIRING', 'DOCUMENT_EXPIRED',
                        'SYSTEM', 'CUSTOM'
                    )),
    channel         VARCHAR(10) NOT NULL CHECK (channel IN ('PUSH', 'EMAIL', 'BOTH')),
    
    -- Status per canal
    push_status     VARCHAR(10) DEFAULT 'PENDING'
                    CHECK (push_status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED') OR push_status IS NULL),
    email_status    VARCHAR(10) DEFAULT 'PENDING'
                    CHECK (email_status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED') OR email_status IS NULL),
    
    -- Citit de user?
    read_at         TIMESTAMPTZ,
    
    -- Referință la entitate (pentru deep link în app)
    -- Polimorfic simplu (nu exclusive arc — e doar o referință, nu ownership)
    reference_type  VARCHAR(30),                    -- 'inspection', 'issue', 'training', 'document'
    reference_id    BIGINT,
    
    -- Retry info
    retry_count     INTEGER NOT NULL DEFAULT 0,
    last_error      TEXT,
    
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Notificări push + email. reference_type/id pentru deep linking în app.';

CREATE INDEX idx_notif_recipient ON notifications (recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notif_pending ON notifications (push_status) WHERE push_status = 'PENDING';
CREATE INDEX idx_notif_email_pending ON notifications (email_status) WHERE email_status = 'PENDING';
CREATE INDEX idx_notif_date ON notifications (created_at DESC);
CREATE INDEX idx_notif_company ON notifications (company_id);
CREATE INDEX idx_notif_type ON notifications (notification_type);
```

### `refresh_tokens`

```sql
-- Refresh tokens JWT pentru revocare și rotație.
CREATE TABLE refresh_tokens (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token_hash      VARCHAR(64) NOT NULL UNIQUE,    -- SHA-256 hash al token-ului
    device_info     VARCHAR(500),                   -- User agent / device identifier
    ip_address      INET,
    
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,                    -- NULL = activ
    replaced_by     BIGINT REFERENCES refresh_tokens(id), -- Token-ul care l-a înlocuit (rotație)
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Refresh tokens JWT. Hash-uit, cu suport pentru rotație și revocare.';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA-256 hash. Token-ul real NU se stochează în DB.';
COMMENT ON COLUMN refresh_tokens.replaced_by IS 'La rotație, punctează la noul token. Detectare reuse attack.';

CREATE INDEX idx_rt_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_rt_hash ON refresh_tokens (token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_rt_expires ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;
```

### `app_settings`

```sql
-- Setări aplicație tip key-value. Pentru configurări globale.
CREATE TABLE app_settings (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    company_id  BIGINT REFERENCES companies(id) ON DELETE CASCADE,   -- NULL = setare globală
    
    key         VARCHAR(100) NOT NULL,
    value       JSONB NOT NULL,
    description TEXT,
    
    updated_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE app_settings IS 'Setări key-value. company_id NULL = setare globală a sistemului.';

CREATE UNIQUE INDEX idx_settings_key ON app_settings (company_id, key);

SELECT create_updated_at_trigger('app_settings');
```

---

## Aplicare Trigger-uri updated_at și audit

```sql
-- ================================================
-- Aplicare trigger-uri pe toate tabelele rămase
-- (cele care nu au fost deja create inline mai sus)
-- ================================================

-- Trigger-uri audit pe tabele importante care nu au fost deja create:
SELECT create_audit_trigger('issue_categories');
SELECT create_audit_trigger('issue_assignments');
SELECT create_audit_trigger('issue_comments');
SELECT create_audit_trigger('trainings');
SELECT create_audit_trigger('training_participants');
```

---

## Seed Data

```sql
-- ================================================
-- SEED DATA: date inițiale necesare la prima instalare
-- Folosim INSERT...RETURNING id + variabile DO $$ pentru a nu depinde
-- de valori hard-coded ale sequence-urilor.
-- ================================================

DO $$
DECLARE
    v_company_id BIGINT;
    v_employee_id BIGINT;
BEGIN

-- 1. Compania default
INSERT INTO companies (name, cui, address, city, county, email, settings)
VALUES (
    'Firma Construcții SRL',
    'RO12345678',
    'Strada Exemplu nr. 1',
    'București',
    'București',
    'office@firma-constructii.ro',
    '{"timezone": "Europe/Bucharest", "language": "ro"}'
) RETURNING id INTO v_company_id;

-- 2. Categorii default de probleme (issue_categories)
INSERT INTO issue_categories (company_id, name, description, icon, color, sort_order) VALUES
(v_company_id, 'Echipament protecție lipsă/defect', 'Echipamente individuale de protecție lipsă, deteriorate sau neconforme', 'hard-hat', '#EF4444', 1),
(v_company_id, 'Risc de cădere de la înălțime', 'Zone neprotejate la înălțime, balustrade lipsă, schelă nesigură', 'arrow-down', '#DC2626', 2),
(v_company_id, 'Instalație electrică defectă', 'Cabluri neizolate, prize defecte, tablouri electrice deschise', 'zap', '#F59E0B', 3),
(v_company_id, 'Ordine și curățenie', 'Materiale împrăștiate, căi de acces blocate, gunoi pe șantier', 'trash-2', '#3B82F6', 4),
(v_company_id, 'Acces neautorizat', 'Zone nesecurizate, lipsa gardurilor/semnalizării', 'shield-off', '#8B5CF6', 5),
(v_company_id, 'Material depozitat necorespunzător', 'Depozitare instabilă, supraîncărcare, materiale periculoase', 'package', '#F97316', 6),
(v_company_id, 'Altele', 'Alte probleme care nu se încadrează în categoriile de mai sus', 'alert-circle', '#6B7280', 99);

-- 3. Setări inițiale aplicație
INSERT INTO app_settings (company_id, key, value, description) VALUES
(v_company_id, 'inspection.default_geofence_radius', '200', 'Raza default geofence pentru șantiere (metri)'),
(v_company_id, 'notification.email_enabled', 'true', 'Activare notificări email'),
(v_company_id, 'notification.push_enabled', 'true', 'Activare notificări push'),
(v_company_id, 'document.expiry_warning_days', '30', 'Cu câte zile înainte de expirare se trimite avertizare'),
(v_company_id, 'document.expiry_critical_days', '7', 'Zile rămase la care avertizarea devine critică'),
(v_company_id, 'training.interval.ANGAJARE', '0', 'Instructaj la angajare: o singură dată (0 = nu se repetă)'),
(v_company_id, 'training.interval.PERIODIC', '180', 'Instructaj periodic: max 6 luni pentru muncitori (HG 1425/2006 Art.96)'),
(v_company_id, 'training.interval.PERIODIC_ADMIN', '365', 'Instructaj periodic personal administrativ: max 12 luni (HG 1425/2006 Art.96)'),
(v_company_id, 'training.interval.SCHIMBARE_LOC_MUNCA', '0', 'Instructaj la schimbarea locului de muncă: la fiecare schimbare (0 = nu se repetă)'),
(v_company_id, 'training.interval.REVENIRE_MEDICAL', '0', 'Instructaj la revenire din concediu medical: la fiecare revenire (0 = nu se repetă)'),
(v_company_id, 'training.interval.ZILNIC', '1', 'Instructaj zilnic pe șantier: OBLIGATORIU la începutul fiecărei zile de lucru (HG 1425/2006, 5-10 min)'),
(v_company_id, 'issue.default_deadline_days', '7', 'Deadline default la atribuire problemă (zile)'),
(v_company_id, 'issue.critical_auto_notify', 'true', 'Notificare automată pentru probleme CRITICAL'),
(NULL, 'system.version', '"1.0.0"', 'Versiunea curentă a sistemului'),
(NULL, 'system.maintenance_mode', 'false', 'Mod mentenanță activat');

-- 4. Utilizator ADMIN default (parola: "ChangeMe123!" — bcrypt hash)
-- Creăm mai întâi angajatul, apoi userul
INSERT INTO employees (company_id, first_name, last_name, email, job_title, hire_date, status)
VALUES (v_company_id, 'Admin', 'Sistem', 'admin@firma-constructii.ro', 'Administrator IT', CURRENT_DATE, 'ACTIVE')
RETURNING id INTO v_employee_id;

INSERT INTO users (employee_id, company_id, email, password_hash, role, is_active)
VALUES (
    v_employee_id, v_company_id,
    'admin@firma-constructii.ro',
    '$2b$12$LJ3m4ys3Lz0sE4Gpmf6LfOUmzQvOGEv6B2WG/j6CxG1xfQEHJMG2', -- bcrypt("ChangeMe123!")
    'ADMIN',
    true
);

END $$;
```

---

## Diagrama Relațiilor (ER Diagram — Text)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NUCLEU ORGANIZAȚIONAL                        │
│                                                                      │
│  companies (1) ──< agencies (N) ──< sites (N)                       │
│       │                  │               │                           │
│       │                  │               │                           │
│  ┌────┴────┐     ┌──────┴──────┐   ┌──────────────────┐            │
│  │employees│     │user_agency_ │   │employee_site_    │            │
│  │  (N)    │     │assignments  │   │assignments       │            │
│  └────┬────┘     │  (N:M)     │   │(N:M, cu istoric) │            │
│       │          └──────┬──────┘   └────┬────────────┘            │
│       │                 │               │                          │
│       ├────> users (1:0..1) <───────────┤                          │
│       └─────────────────────────────────┘ (employee-centric)       │
│                │                                                     │
│           ┌────┼────────────────────┐                               │
│           │    │                    │                                │
│           ▼    ▼                    ▼                                │
│     inspections  trainings    issue_reports                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                            INSPECȚII                                 │
│                                                                      │
│  inspection_templates (1) ──< inspection_template_versions (N)       │
│                                          │                           │
│                                          │ (1)                       │
│                                          ▼                           │
│                                   inspections (N)                    │
│                                     │       │                        │
│                                     │       │                        │
│                            (1:N)    ▼       ▼    (1:N)              │
│                      inspection_items    inspection_reviews          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          INSTRUCTAJE                                 │
│                                                                      │
│                    trainings (1)                                     │
│                    │         │                                       │
│               (1:N)▼         ▼(1:N)                                 │
│  training_participants    training_materials                         │
│        │                                                             │
│        ▼                                                             │
│   employees                                                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     RAPORTARE PROBLEME                               │
│                                                                      │
│  issue_categories ──< issue_reports (N)                             │
│                        │         │        │                          │
│                   (1:N)▼    (1:N)▼   (1:N)▼                        │
│             issue_assignments  issue_comments  issue_status_history  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         ATTACHMENTS                                  │
│                    (EXCLUSIVE ARC PATTERN)                           │
│                                                                      │
│  attachments ──FK──> inspections           (nullable)               │
│              ──FK──> inspection_items       (nullable)               │
│              ──FK──> trainings              (nullable)               │
│              ──FK──> training_materials     (nullable)               │
│              ──FK──> issue_reports          (nullable)               │
│              ──FK──> issue_comments         (nullable)               │
│              ──FK──> employee_documents     (nullable)               │
│                                                                      │
│  CHECK: exact 1 FK non-null                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                           SISTEM                                     │
│                                                                      │
│  audit_logs (partitioned monthly) ← trigger pe toate tabelele       │
│  notifications ── recipient → users                                  │
│  refresh_tokens ── user → users                                      │
│  app_settings (key-value, per company sau global)                    │
└──────────────────────────────────────────────────────────────────────┘

RELAȚII CHEIE:
  employees (1) ←→ (0..1) users          : Un angajat poate avea sau nu cont
  users ──< user_agency_assignments       : User alocat pe agenții
  employees ──< employee_site_assignments : Angajat alocat pe șantiere (cu istoric, user_id opțional)
  employees ──< employee_documents        : Documente per angajat (fișier via attachments)
  inspections → inspection_template_versions : Inspecția e legată de VERSIUNEA template-ului
  inspection_templates → current_version_id  : FK circular la versiunea activă
  trainings ──< training_participants → employees : Legătură directă la angajat (nu user)
  training_materials → attachments        : Materialele au fișier via attachments (training_material_id FK)
```

---

## Sumar Tabele (24 total)

| # | Tabel | Scop | uuid? |
|---|-------|------|-------|
| 1 | `companies` | Firma | ✅ |
| 2 | `agencies` | Sucursale regionale | ✅ |
| 3 | `sites` | Șantiere construcție | ✅ |
| 4 | `employees` | Toți angajații | ✅ |
| 5 | `users` | Conturi utilizator | ✅ |
| 6 | `user_agency_assignments` | User → Agenții | ❌ |
| 7 | `employee_site_assignments` | Employee → Șantiere (cu istoric) | ❌ |
| 8 | `employee_documents` | Documente angajat (cu expirare) | ✅ |
| 9 | `inspection_templates` | Template-uri inspecție (master) | ✅ |
| 10 | `inspection_template_versions` | Versiuni template (JSONB) | ❌ |
| 11 | `inspections` | Inspecții efectuate | ✅ |
| 12 | `inspection_items` | Răspunsuri per punct verificare | ❌ |
| 13 | `inspection_reviews` | Aprobări/respingeri inspecții | ❌ |
| 14 | `trainings` | Instructaje SSM | ✅ |
| 15 | `training_participants` | Participanți instructaj | ❌ |
| 16 | `training_materials` | Materiale atașate instructaj | ❌ |
| 17 | `issue_categories` | Categorii probleme | ✅ |
| 18 | `issue_reports` | Probleme raportate | ✅ |
| 19 | `issue_assignments` | Atribuire rezolvare | ❌ |
| 20 | `issue_comments` | Comentarii pe probleme | ❌ |
| 21 | `issue_status_history` | Istoric status probleme | ❌ |
| 22 | `attachments` | Fișiere (exclusive arc) | ✅ |
| 23 | `audit_logs` | Audit trail (partitioned) | ❌ |
| 24 | `notifications` | Notificări push/email | ✅ |
| 25 | `refresh_tokens` | JWT refresh tokens | ❌ |
| 26 | `app_settings` | Setări key-value | ❌ |
