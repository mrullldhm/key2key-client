import { Component, signal } from '@angular/core';
import { Vault } from '../../components/vault/vault';
import { FirstTimer } from '../../components/first-timer/first-timer';
import { PasswordGenerator } from '../../components/generator/password-generator/password-generator';
import { VaultNavbar } from '../../components/navbar/vault-navbar/vault-navbar';
import { Footer } from '../../components/footer/footer';
import { Credential } from '../../components/credential/credential';

export type DashboardView = 'dashboard' | 'generator' | 'add-credential';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [VaultNavbar, Vault, FirstTimer, PasswordGenerator, Footer, Credential],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  currentView: DashboardView = 'dashboard';

  // Later replace with API data
  vaultItems: any[] = [];

  isVaultEmpty() {
    return this.vaultItems.length === 0;
  }

  onNavigate(view: DashboardView) {
    this.currentView = view;
  }

  // FirstTimer → Vault instantly after user adds their first password
    addPassword(password: any) {
    this.vaultItems.push(password);
  }
}
