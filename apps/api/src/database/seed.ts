/**
 * Seed script — populates the database with initial data.
 * Run: pnpm --filter @ssm/api run db:seed
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { companies } from './schema/companies';
import { issueCategories } from './schema/issue-categories';
import { appSettings } from './schema/app-settings';
import { employees } from './schema/employees';
import { users } from './schema/users';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

async function seed() {
  const client = postgres(DATABASE_URL!);
  const db = drizzle(client);

  console.log('🌱 Seeding database...');

  // 1. Default company
  const [company] = await db
    .insert(companies)
    .values({
      name: 'Firma Construcții SRL',
      cui: 'RO12345678',
      address: 'Strada Exemplu nr. 1',
      city: 'București',
      county: 'București',
      email: 'office@firma-constructii.ro',
      settings: { timezone: 'Europe/Bucharest', language: 'ro' },
    })
    .returning({ id: companies.id });

  console.log(`✅ Company created (id: ${company!.id})`);

  // 2. Issue categories
  await db.insert(issueCategories).values([
    { companyId: company!.id, name: 'Echipament protecție lipsă/defect', description: 'Echipamente individuale de protecție lipsă, deteriorate sau neconforme', icon: 'hard-hat', color: '#EF4444', sortOrder: 1 },
    { companyId: company!.id, name: 'Risc de cădere de la înălțime', description: 'Zone neprotejate la înălțime, balustrade lipsă, schelă nesigură', icon: 'arrow-down', color: '#DC2626', sortOrder: 2 },
    { companyId: company!.id, name: 'Instalație electrică defectă', description: 'Cabluri neizolate, prize defecte, tablouri electrice deschise', icon: 'zap', color: '#F59E0B', sortOrder: 3 },
    { companyId: company!.id, name: 'Ordine și curățenie', description: 'Materiale împrăștiate, căi de acces blocate, gunoi pe șantier', icon: 'trash-2', color: '#3B82F6', sortOrder: 4 },
    { companyId: company!.id, name: 'Acces neautorizat', description: 'Zone nesecurizate, lipsa gardurilor/semnalizării', icon: 'shield-off', color: '#8B5CF6', sortOrder: 5 },
    { companyId: company!.id, name: 'Material depozitat necorespunzător', description: 'Depozitare instabilă, supraîncărcare, materiale periculoase', icon: 'package', color: '#F97316', sortOrder: 6 },
    { companyId: company!.id, name: 'Altele', description: 'Alte probleme care nu se încadrează în categoriile de mai sus', icon: 'alert-circle', color: '#6B7280', sortOrder: 99 },
  ]);
  console.log('✅ Issue categories created (7)');

  // 3. App settings (training intervals per HG 1425/2006)
  await db.insert(appSettings).values([
    { companyId: company!.id, key: 'inspection.default_geofence_radius', value: 200, description: 'Raza default geofence pentru șantiere (metri)' },
    { companyId: company!.id, key: 'notification.email_enabled', value: true, description: 'Activare notificări email' },
    { companyId: company!.id, key: 'notification.push_enabled', value: true, description: 'Activare notificări push' },
    { companyId: company!.id, key: 'document.expiry_warning_days', value: 30, description: 'Cu câte zile înainte de expirare se trimite avertizare' },
    { companyId: company!.id, key: 'document.expiry_critical_days', value: 7, description: 'Zile rămase la care avertizarea devine critică' },
    { companyId: company!.id, key: 'training.interval.ANGAJARE', value: 0, description: 'Instructaj la angajare: o singură dată' },
    { companyId: company!.id, key: 'training.interval.PERIODIC', value: 180, description: 'Instructaj periodic: max 6 luni pentru muncitori (HG 1425/2006 Art.96)' },
    { companyId: company!.id, key: 'training.interval.PERIODIC_ADMIN', value: 365, description: 'Instructaj periodic personal administrativ: max 12 luni' },
    { companyId: company!.id, key: 'training.interval.SCHIMBARE_LOC_MUNCA', value: 0, description: 'Instructaj la schimbarea locului de muncă: la fiecare schimbare' },
    { companyId: company!.id, key: 'training.interval.REVENIRE_MEDICAL', value: 0, description: 'Instructaj la revenire din concediu medical: la fiecare revenire' },
    { companyId: company!.id, key: 'training.interval.ZILNIC', value: 1, description: 'Instructaj zilnic pe șantier: OBLIGATORIU (HG 1425/2006)' },
    { companyId: company!.id, key: 'issue.default_deadline_days', value: 7, description: 'Deadline default la atribuire problemă (zile)' },
    { companyId: company!.id, key: 'issue.critical_auto_notify', value: true, description: 'Notificare automată pentru probleme CRITICAL' },
    { companyId: null, key: 'system.version', value: '1.0.0', description: 'Versiunea curentă a sistemului' },
    { companyId: null, key: 'system.maintenance_mode', value: false, description: 'Mod mentenanță activat' },
  ]);
  console.log('✅ App settings created (15)');

  // 4. Default ADMIN user (password: "ChangeMe123!")
  const [employee] = await db
    .insert(employees)
    .values({
      companyId: company!.id,
      firstName: 'Admin',
      lastName: 'Sistem',
      email: 'admin@firma-constructii.ro',
      jobTitle: 'Administrator IT',
      hireDate: new Date().toISOString().split('T')[0]!,
      status: 'ACTIVE',
    })
    .returning({ id: employees.id });

  // bcrypt hash of "ChangeMe123!"
  await db.insert(users).values({
    employeeId: employee!.id,
    companyId: company!.id,
    email: 'admin@firma-constructii.ro',
    passwordHash: '$2b$12$kfodHbRs0wdQ/j6dU0U5CettdBnd4Kk50MYYvWMx9cjGVBJieMx8O',
    role: 'ADMIN',
    isActive: true,
  });
  console.log('✅ Admin user created (admin@firma-constructii.ro / ChangeMe123!)');

  console.log('\n🎉 Seed complete!');
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
