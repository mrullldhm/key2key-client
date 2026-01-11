import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { VaultState } from '../services/vault-state';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const vault = inject(VaultState); // Inject the memory state

  const token = localStorage.getItem('k2k_token');
  const isUnlocked = vault.user() !== null; // Check if keys are in RAM

  if (token && isUnlocked) {
    return true;
  }

  // If we have a token but NO keys in RAM (e.g. after a refresh)
  // we MUST go back to Sign-In to re-derive the keys.
  localStorage.removeItem('k2k_token');
  console.warn('Vault locked or session missing. Redirecting to Sign-In.');
  router.navigate(['/sign-in']);
  return false;
};
