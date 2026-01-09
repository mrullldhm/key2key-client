import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('k2k_token');

  if (token) {
    // User is logged in
    return true;
  }

  // Not logged in → redirect to sign-up
  router.navigate(['/sign-up']);
  return false;
};
