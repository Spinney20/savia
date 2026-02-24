import { createBrowserRouter, Navigate } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: () => import('@/pages/auth/LoginPage').then((m) => ({ Component: m.default })),
  },
  {
    path: '/forgot-password',
    lazy: () => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ Component: m.default })),
  },
  {
    path: '/activate',
    lazy: () => import('@/pages/auth/ActivateAccountPage').then((m) => ({ Component: m.default })),
  },
  {
    path: '/reset-password',
    lazy: () => import('@/pages/auth/ResetPasswordPage').then((m) => ({ Component: m.default })),
  },
  {
    path: '/',
    lazy: () => import('@/components/layout/MainLayout').then((m) => ({ Component: m.default })),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        lazy: () => import('@/pages/dashboard/DashboardPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'inspections',
        lazy: () => import('@/pages/inspections/InspectionsListPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'inspections/create',
        lazy: () => import('@/pages/inspections/InspectionCreatePage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'inspections/:uuid',
        lazy: () => import('@/pages/inspections/InspectionDetailPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'inspections/:uuid/review',
        lazy: () => import('@/pages/inspections/InspectionReviewPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'templates',
        lazy: () => import('@/pages/inspections/TemplatesListPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'templates/:uuid',
        lazy: () => import('@/pages/inspections/TemplateEditorPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'trainings',
        lazy: () => import('@/pages/trainings/TrainingsListPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'trainings/create',
        lazy: () => import('@/pages/trainings/TrainingCreatePage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'trainings/:uuid',
        lazy: () => import('@/pages/trainings/TrainingDetailPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'issues',
        lazy: () => import('@/pages/issues/IssuesListPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'issues/create',
        lazy: () => import('@/pages/issues/IssueCreatePage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'issues/board',
        lazy: () => import('@/pages/issues/IssueBoardPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'issues/:uuid',
        lazy: () => import('@/pages/issues/IssueDetailPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'employees',
        lazy: () => import('@/pages/employees/EmployeesListPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'employees/create',
        lazy: () => import('@/pages/employees/EmployeeCreatePage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'employees/:uuid',
        lazy: () => import('@/pages/employees/EmployeeDetailPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'employees/:uuid/edit',
        lazy: () => import('@/pages/employees/EmployeeEditPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'notifications',
        lazy: () => import('@/pages/notifications/NotificationsPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'profile',
        lazy: () => import('@/pages/profile/ProfilePage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'profile/change-password',
        lazy: () => import('@/pages/profile/ChangePasswordPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'settings/users',
        lazy: () => import('@/pages/settings/UsersPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'settings/categories',
        lazy: () => import('@/pages/settings/CategoriesPage').then((m) => ({ Component: m.default })),
      },
      {
        path: 'settings/app',
        lazy: () => import('@/pages/settings/AppSettingsPage').then((m) => ({ Component: m.default })),
      },
      {
        path: '*',
        lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.default })),
      },
    ],
  },
]);
