import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => {
      return import('./pages/landing/landing').then((m) => m.Landing);
    },
  },

  {
    path: 'home',
    pathMatch: 'full',
    loadComponent: () => {
      return import('./pages/home/home').then((m) => m.Home);
    },
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
];
