import { Component, inject } from '@angular/core';
import { Auth } from '../../../services/auth';
import { Router } from '@angular/router';
import { VaultState } from '../../../services/vault-state';

@Component({
  selector: 'app-vault-navbar',
  standalone: true,
  imports: [],
  templateUrl: './vault-navbar.html',
  styleUrl: './vault-navbar.scss',
})
export class VaultNavbar {
  private authService = inject(Auth);
  private vaultState = inject(VaultState);
  private router = inject(Router);

  onLogout() {
    // 1. Clear the sensitive keys from Angular Signals (RAM)
    this.vaultState.clearVault();

    // 2. Clear the JWT
    this.authService.logout();

    // 3. Go back to landing
    this.router.navigate(['/']);
  }
}
