# Part 3: Arhitectura Mobilă — React Native + Expo

---

## 1. Stack Confirmat

| Componentă | Librărie | Versiune (Expo SDK 52) |
|-----------|---------|----------------------|
| Framework | Expo (managed workflow) | SDK 52+ |
| Routing | expo-router v4 | ~4.x |
| State management | Zustand | ^5.x |
| Server state | @tanstack/react-query | ^5.x |
| Local storage | react-native-mmkv | ^3.x (v4 = Nitro Module, necesită expo-dev-client — verificare compatibilitate SDK 52) |
| Forms | react-hook-form + @hookform/resolvers | ^7.x |
| Validation | Zod (shared) | ^3.x |
| HTTP client | Axios | - |
| Auth storage | expo-secure-store | ~14.x |
| Camera | expo-camera | ~16.x |
| Location | expo-location | ~18.x |
| File system | expo-file-system | ~18.x |
| Image manipulation | expo-image-manipulator | ~13.x |
| Notifications | expo-notifications | ~0.29.x |
| Network status | @react-native-community/netinfo | ^11.x |
| UI components | nativewind (Tailwind) + custom | ^4.x |
| Icons | lucide-react-native | - |
| Date handling | date-fns | ^3.x |

---

## 2. Structura de Foldere

```
apps/mobile/
├── app/                              # Expo Router v4 (file-based routing)
│   ├── _layout.tsx                   # Root layout (auth check, providers)
│   ├── (auth)/                       # Rute publice (neautentificat)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── forgot-password.tsx
│   ├── (app)/                        # Rute protejate (autentificat)
│   │   ├── _layout.tsx               # Tab navigation
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Tab bar (diferit per rol)
│   │   │   ├── home.tsx              # Dashboard simplu per rol
│   │   │   ├── issues/
│   │   │   │   ├── index.tsx         # Lista probleme
│   │   │   │   ├── [uuid].tsx        # Detaliu problemă
│   │   │   │   └── create.tsx        # Raportare problemă nouă
│   │   │   ├── inspections/
│   │   │   │   ├── index.tsx         # Lista inspecții (INSPECTOR)
│   │   │   │   ├── [uuid].tsx        # Detaliu/completare inspecție
│   │   │   │   └── create.tsx        # Inspecție nouă
│   │   │   ├── trainings/
│   │   │   │   ├── index.tsx         # Lista instructaje
│   │   │   │   ├── [uuid].tsx        # Detaliu instructaj
│   │   │   │   ├── create.tsx        # Instructaj nou (INSP/SEF_S)
│   │   │   │   └── confirm.tsx       # Confirmare participare (MUNCITOR)
│   │   │   ├── employees/
│   │   │   │   └── index.tsx         # Lista angajați pe șantierul curent (SEF_S, INSP)
│   │   │   └── profile/
│   │   │       ├── index.tsx         # Profil utilizator
│   │   │       └── settings.tsx
│   │   └── modals/
│   │       ├── camera.tsx            # Camera modal (shared)
│   │       └── photo-preview.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── api/                          # API client layer
│   │   ├── client.ts                 # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── issues.api.ts
│   │   ├── inspections.api.ts
│   │   ├── trainings.api.ts
│   │   ├── employees.api.ts
│   │   └── upload.api.ts
│   │
│   ├── hooks/                        # TanStack Query hooks
│   │   ├── useAuth.ts
│   │   ├── useIssues.ts              # useIssues, useIssue, useCreateIssue
│   │   ├── useInspections.ts
│   │   ├── useTrainings.ts
│   │   ├── useEmployees.ts
│   │   └── useUpload.ts
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── auth.store.ts             # Token, user profile, role
│   │   ├── sync.store.ts             # Pending items queue (offline)
│   │   ├── draft.store.ts            # Draft inspections/issues
│   │   └── app.store.ts              # App-level state (current site, etc.)
│   │
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # Base UI (Button, Input, Card, Badge, etc.)
│   │   ├── forms/
│   │   │   ├── DynamicForm.tsx       # Renders JSONB template → form
│   │   │   ├── PhotoCapture.tsx      # Camera + gallery picker
│   │   │   └── SeverityPicker.tsx
│   │   ├── lists/
│   │   │   ├── IssueCard.tsx
│   │   │   ├── InspectionCard.tsx
│   │   │   └── TrainingCard.tsx
│   │   └── layout/
│   │       ├── RoleTabBar.tsx        # Tab bar adaptat per rol
│   │       └── SyncBadge.tsx         # Badge "2 items pending sync"
│   │
│   ├── services/                     # Business logic services
│   │   ├── location.service.ts       # GPS capture
│   │   ├── camera.service.ts         # Photo capture + compression
│   │   ├── sync.service.ts           # Store-and-forward logic
│   │   ├── notification.service.ts   # Push notification handling
│   │   └── auth.service.ts           # Token management
│   │
│   ├── utils/
│   │   ├── permissions.ts            # Check role permissions
│   │   └── format.ts                 # Date/number formatting (RO locale)
│   │
│   └── constants/
│       ├── roles.ts
│       └── routes.ts
│
├── app.json                          # Expo config
├── eas.json                          # EAS Build config
└── tsconfig.json
```

---

## 3. Expo Router v4 — Rute per Rol

Tab bar-ul se adaptează pe baza rolului:

```typescript
// src/components/layout/RoleTabBar.tsx
const TABS_BY_ROLE: Record<Role, TabConfig[]> = {
  INSPECTOR_SSM: [
    { name: 'home', icon: 'Home', label: 'Acasă' },
    { name: 'inspections', icon: 'ClipboardCheck', label: 'Inspecții' },
    { name: 'trainings', icon: 'GraduationCap', label: 'Instructaje' },
    { name: 'issues', icon: 'AlertTriangle', label: 'Probleme' },
    { name: 'profile', icon: 'User', label: 'Profil' },
  ],
  SEF_SANTIER: [
    { name: 'home', icon: 'Home', label: 'Acasă' },
    { name: 'employees', icon: 'Users', label: 'Angajați' },   // Lista angajați pe șantier (pentru instructaj zilnic)
    { name: 'trainings', icon: 'GraduationCap', label: 'Instructaje' },
    { name: 'issues', icon: 'AlertTriangle', label: 'Probleme' },
    { name: 'profile', icon: 'User', label: 'Profil' },
  ],
  MUNCITOR: [
    { name: 'home', icon: 'Home', label: 'Acasă' },
    { name: 'issues', icon: 'AlertTriangle', label: 'Raportare' },
    { name: 'trainings', icon: 'GraduationCap', label: 'Instructaje' },
    { name: 'profile', icon: 'User', label: 'Profil' },
  ],
};
```

**Home screen per rol:**
- **INSPECTOR**: Inspecții recente, statistici, probleme critice deschise
- **SEF_SANTIER**: Instructajul zilnic (făcut/nefăcut), probleme pe șantier
- **MUNCITOR**: Probleme raportate de mine, instructajul de azi, confirmare instructaj

---

## 4. Zustand Stores

```typescript
// auth.store.ts — Persistat în SecureStore
interface AuthStore {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

// sync.store.ts — Persistat în MMKV
interface SyncStore {
  pendingItems: PendingItem[];  // Items to sync when online
  addPending: (item: PendingItem) => void;
  removePending: (id: string) => void;
  syncAll: () => Promise<SyncResult>;
  pendingCount: number;         // For badge display
}

// draft.store.ts — Persistat în MMKV
interface DraftStore {
  inspectionDrafts: Record<string, Partial<CreateInspectionDto>>;
  issueDrafts: Record<string, Partial<CreateIssueDto>>;
  saveDraft: (type: 'inspection' | 'issue', id: string, data: any) => void;
  getDraft: (type: string, id: string) => any;
  clearDraft: (type: string, id: string) => void;
}

// app.store.ts — In-memory (nu persistat)
interface AppStore {
  currentSite: Site | null;
  isOnline: boolean;
  setCurrentSite: (site: Site) => void;
  setOnline: (status: boolean) => void;
}
```

---

## 5. TanStack Query — Pattern Queries & Mutations

```typescript
// hooks/useIssues.ts
export function useIssues(params: ListIssuesParams) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => issuesApi.list(params),
    staleTime: 30_000,           // 30s stale (teren = date se schimbă des)
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();
  const { addPending, isOnline } = useSyncStore();

  return useMutation({
    mutationFn: async (data: CreateIssueDto) => {
      if (!isOnline) {
        // Offline: salvează local pentru sync ulterior
        addPending({ type: 'CREATE_ISSUE', data, id: generateLocalId() });
        return { offline: true };
      }
      return issuesApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
```

---

## 6. Store-and-Forward Offline (Simplu)

**Principiu**: NU offline-first complex. Doar un buffer local pentru cuando nu ai semnal.

```
[User acțiune] → [Are internet?]
                   ├── DA → trimite direct la API → invalidate cache
                   └── NU → salvează în SyncStore (MMKV)
                            → arată badge "1 item pending"
                            → când revine net → sync automat
                            → la succes: remove din queue + invalidate cache
                            → la eroare: retry cu backoff (max 3x) → arată eroare
```

**Ce se poate trimite offline:**
- Raport problemă (cu poze atașate local)
- Inspecție completată (draft → submitted)
- Instructaj înregistrat

**Ce NU funcționează offline:**
- Login
- Listare/căutare date (necesită API)
- Download PDF-uri

### Offline Photo Management

**IMPORTANT**: Datele text (JSON) se salvează în MMKV, dar **pozele (1-3MB fiecare) se salvează pe disk** via `expo-file-system`. În sync queue se stochează doar URI-urile locale.

**Flow complet offline → sync:**

1. **User face poză offline** → `expo-image-manipulator` comprimă → `expo-file-system` salvează pe disk → obținem `file://...` URI
2. **Salvare în sync queue (MMKV)** → payload-ul conține text + lista de URI-uri locale (NU binare ale pozelor)
3. **Internet revine** → Sync Manager procesează queue:
   - Pentru fiecare item cu poze locale:
     - Upload fiecare poză via `POST /upload` → primește `attachment_uuid`
     - Înlocuiește URI-urile locale (`file://...`) cu `attachment_uuids` în payload
   - Trimite payload-ul final via `POST /entity` cu `attachment_uuids`
4. **La succes** → Șterge din MMKV queue + șterge fișierele locale de pe disk

```typescript
// services/sync.service.ts
async function syncItem(item: PendingItem): Promise<void> {
  const attachmentUuids: string[] = [];

  // 1. Upload pozele locale mai întâi
  if (item.localPhotos?.length) {
    for (const photoUri of item.localPhotos) {
      const uuid = await uploadLocalPhoto(photoUri);
      attachmentUuids.push(uuid);
    }
  }

  // 2. Trimite entitatea cu attachment_uuids
  const payload = { ...item.data, attachmentUuids };
  await apiClient.post(item.endpoint, payload);

  // 3. Cleanup: șterge pozele locale de pe disk
  for (const photoUri of item.localPhotos ?? []) {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  }
}

async function uploadLocalPhoto(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);
  const { data } = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.uuid; // attachment_uuid temporar
}
```

**Monitorizare rețea:**
```typescript
// NetInfo listener în App root
NetInfo.addEventListener(state => {
  appStore.setOnline(state.isConnected);
  if (state.isConnected) {
    syncStore.syncAll(); // Trigger sync automat
  }
});
```

---

## 7. Camera + Poze

```typescript
// services/camera.service.ts
export async function capturePhoto(): Promise<LocalPhoto> {
  // 1. Lansează camera (expo-camera)
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.6,                    // Compresie 60%
    allowsEditing: false,
  });

  if (result.canceled) throw new Error('Cancelled');

  const asset = result.assets[0];

  // 2. Comprimă (expo-image-manipulator)
  // 1280px max lățime, 0.6 calitate — ~200-400KB per poză
  // Pe șantier cu 3G slab, 5 poze * 400KB = 2MB (acceptabil)
  // Opțional viitor: upload original pe WiFi
  const compressed = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1280 } }],   // Max 1280px lățime (nu 1920 — prea mare pentru 3G)
    { compress: 0.6, format: SaveFormat.JPEG }
  );

  // 3. Returnează cu metadata
  return {
    uri: compressed.uri,
    width: compressed.width,
    height: compressed.height,
    fileSize: await getFileSize(compressed.uri),
  };
}

// Upload: fie imediat (online), fie salvat local (offline)
export async function uploadPhoto(photo: LocalPhoto): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri: photo.uri,
    type: 'image/jpeg',
    name: `photo_${Date.now()}.jpg`,
  } as any);
  
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.url;
}
```

---

## 8. GPS — Captură Locație

```typescript
// services/location.service.ts
export async function getCurrentLocation(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Location permission denied');

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    timeout: 10000,                   // 10s timeout
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

// Auto-detect site: compară GPS cu coordonatele șantierelor
export function findNearestSite(coords: Coords, sites: Site[]): Site | null {
  for (const site of sites) {
    if (!site.latitude || !site.longitude) continue;
    const distance = haversineDistance(coords, site);
    if (distance <= site.geofenceRadius) return site;
  }
  return null;
}
```

---

## 9. Notificări Push

```typescript
// services/notification.service.ts
import * as Notifications from 'expo-notifications';

export async function registerForPush(): Promise<string | null> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;

  // Folosim Expo Push Service (nu FCM direct) — mai simplu pentru MVP
  // Expo Push Token trece prin serverele Expo (gratuit până la ~1000 notif/zi)
  // Viitor: migrare la FCM direct dacă volumul crește
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  // Trimite token-ul la backend
  // NOTĂ: coloana din DB se numește push_token (nu fcm_token — sunt lucruri diferite)
  await apiClient.patch('/auth/me', { pushToken: token.data });
  return token.data;
}

// Handler pentru notificări primite (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Deep link la tap pe notificare
Notifications.addNotificationResponseReceivedListener(response => {
  const { type, id } = response.notification.request.content.data;
  if (type === 'issue') router.push(`/issues/${id}`);
  if (type === 'inspection') router.push(`/inspections/${id}`);
  if (type === 'training') router.push(`/trainings/${id}`);
});
```

---

## 9.1. Force-Update Mechanism

Dacă API-ul se schimbă (breaking change), versiunile vechi ale app-ului trebuie forțate să se actualizeze.

```typescript
// La fiecare GET /auth/me, backend-ul returnează minAppVersion
// Mobilul compară cu versiunea sa curentă:

import Constants from 'expo-constants';
import semver from 'semver';

function checkForceUpdate(meResponse: AuthMeResponse) {
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
  const minVersion = meResponse.minAppVersion;

  if (minVersion && semver.lt(currentVersion, minVersion)) {
    // Afișează ecran full-screen de update obligatoriu
    // (link către App Store / Play Store)
    router.replace('/force-update');
  }
}
```

`minAppVersion` se configurează din `app_settings` (key: `system.min_app_version`).

---

## 10. Autentificare — Token Management

```typescript
// services/auth.service.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ssm_access_token';
const REFRESH_TOKEN_KEY = 'ssm_refresh_token';

export const authStorage = {
  async saveTokens(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  },
  async getAccessToken() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Axios interceptor: auto-refresh pe 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await authStorage.getRefreshToken();
        const { data } = await axios.post('/auth/refresh', { refreshToken });
        await authStorage.saveTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        await authStorage.clearTokens();
        // Navigate to login
        router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 11. Formulare Dinamice (Template JSONB → Form)

Componenta cheie: renderizează un template de inspecție JSONB ca formular interactiv.

```typescript
// components/forms/DynamicInspectionForm.tsx
// Primește: templateVersion.structure (JSONB)
// Returnează: inspection_items[] cu răspunsuri

function DynamicInspectionForm({ structure, onSubmit }: Props) {
  const form = useForm({ resolver: zodResolver(dynamicSchema(structure)) });

  return (
    <ScrollView>
      {structure.sections.map(section => (
        <Section key={section.id} title={section.title}>
          {section.questions.map(q => (
            <QuestionField
              key={q.id}
              question={q}
              control={form.control}
              name={`answers.${section.id}.${q.id}`}
            />
          ))}
        </Section>
      ))}
      <Button onPress={form.handleSubmit(onSubmit)} title="Finalizează" />
    </ScrollView>
  );
}

// QuestionField renders based on q.type:
// YES_NO → Switch + severity picker if non-compliant
// TEXT → TextInput
// NUMBER → NumericInput
// SELECT → Picker/dropdown
// PHOTO → PhotoCapture component (camera + gallery)
```