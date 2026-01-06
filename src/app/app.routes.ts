// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: '',
//     pathMatch: 'full',
//     loadComponent: () => {
//       return import('./layouts/landing-layout/landing-layout').then((m) => m.LandingLayout);
//     },
//   },

//   {
//     path: 'dashboard',
//     pathMatch: 'full',
//     loadComponent: () => {
//       return import('./pages/dashboard/dashboard').then((m) => m.Dashboard);
//     },
//   },

// ];
import { Routes } from '@angular/router';

import { LandingLayout } from './layouts/landing-layout/landing-layout';
import { DashboardLayout } from './layouts/dashboard-layout/dashboard-layout';

import { Landing } from './pages/landing/landing';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: LandingLayout,
    children: [{ path: '', component: Landing }],
  },

  {
    path: '',
    component: DashboardLayout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  {
    path: 'sign-up',
    pathMatch: 'full',
    loadComponent: () => {
      return import('./pages/auth/sign-up/sign-up').then((m) => m.SignUp);
    },
  },

  {
    path: 'sign-in',
    pathMatch: 'full',
    loadComponent: () => {
      return import('./pages/auth/sign-in/sign-in').then((m) => m.SignIn);
    },
  },

  { path: '**', redirectTo: '' },
];
