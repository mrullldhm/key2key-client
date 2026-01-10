import { Component, inject, signal } from '@angular/core';
import { VaultNavbar } from '../vault-navbar/vault-navbar';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';
import { VaultState } from '../../../services/vault-state';

@Component({
  selector: 'app-dashboard-navbar',
  imports: [RouterLink],
  templateUrl: './dashboard-navbar.html',
  styleUrl: './dashboard-navbar.scss',
})
export class DashboardNavbar {
  protected readonly title = signal('KEY2KEY');

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
