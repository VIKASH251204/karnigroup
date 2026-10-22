import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'register-person',
        loadComponent: () => import('./pages/register-person/register-person.component').then(m => m.RegisterPersonComponent)
      },
      {
        path: 'team',
        data: { mode: 'team' },
        loadComponent: () => import('./pages/persons/persons.component').then(m => m.PersonsComponent)
      },
      {
        path: 'clients',
        data: { mode: 'clients' },
        loadComponent: () => import('./pages/persons/persons.component').then(m => m.PersonsComponent)
      },
      {
        path: 'persons',
        canActivate: [adminGuard],
        data: { mode: 'all' },
        loadComponent: () => import('./pages/persons/persons.component').then(m => m.PersonsComponent)
      },
      {
        path: 'all-clients',
        canActivate: [adminGuard],
        data: { mode: 'clients' },
        loadComponent: () => import('./pages/persons/persons.component').then(m => m.PersonsComponent)
      },
      {
        path: 'site-visits',
        loadComponent: () => import('./pages/site-visits/site-visits.component').then(m => m.SiteVisitsComponent)
      },
      {
        path: 'site-photos',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/site-photos/site-photos.component').then(m => m.SitePhotosComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./pages/sales/sales.component').then(m => m.SalesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'commissions',
        loadComponent: () => import('./pages/commissions/commissions.component').then(m => m.CommissionsComponent)
      },
      {
        path: 'plots',
        loadComponent: () => import('./pages/plots/plots.component').then(m => m.PlotsComponent)
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'rank',
        loadComponent: () => import('./pages/rank/rank.component').then(m => m.RankComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
      },
      { path: '**', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: '' }
];
