import { Component, inject, OnInit, signal } from '@angular/core';
import { Vault } from '../../components/vault/vault';
import { FirstTimer } from '../../components/first-timer/first-timer';
import { PasswordGenerator } from '../../components/generator/password-generator/password-generator';
import { VaultNavbar } from '../../components/navbar/vault-navbar/vault-navbar';
import { Footer } from '../../components/footer/footer';
import { Credential } from '../../components/credential/credential';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type DashboardView = 'dashboard' | 'generator' | 'add-credential';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [VaultNavbar, Vault, FirstTimer, PasswordGenerator, Footer, Credential],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  
  currentView: DashboardView = 'dashboard';
  vaultItems = signal<any[]>([]); // Use a signal for reactivity

  ngOnInit() {
    this.refreshVaultStatus();
  }

  // Call this to check if we should show FirstTimer or the Vault list
  refreshVaultStatus() {
    this.http.get<{ data: any[] }>(`${environment.apiUrl}/credential`).subscribe({
      next: (res) => {
        this.vaultItems.set(res.data);
      },
      error: (err) => console.error('Could not fetch vault status', err)
    });
  }

  isVaultEmpty() {
    return this.vaultItems().length === 0;
  }

  onNavigate(view: DashboardView) {
    this.currentView = view;
    // If returning to dashboard, refresh the list
    if (view === 'dashboard') {
      this.refreshVaultStatus();
    }
  }
}