import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { VaultState } from '../../services/vault-state';
import { Crypto } from '../../services/crypto';
import { Credential } from '../credential/credential';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [Credential],
  templateUrl: './vault.html',
  styleUrl: './vault.scss',
})
export class Vault implements OnInit {
  private http = inject(HttpClient);
  private vaultState = inject(VaultState);
  private cryptoService = inject(Crypto);

  // This will hold the decrypted passwords for display
  decryptedItems = signal<any[]>([]);
  isLoading = signal(true);

  // Holds the single item the user clicked on
  selectedItem = signal<any | null>(null);
  showSecret = signal(false); // For the popup's password visibility

  ngOnInit() {
    this.loadVault();
  }

  async loadVault() {
    const privKey = this.vaultState.privateKey();
    if (!privKey) return;

    this.http.get<{ data: any[] }>(`${environment.apiUrl}/credential`).subscribe({
      next: async (res) => {
        const encryptedList = res.data;
        const decryptedList = [];

        for (const item of encryptedList) {
          try {
            // item.credential contains the encryptedUsername, encryptedPassword, and iv
            // item.encryptedDataKey is the key we need to unwrap

            const decryptedData = await this.cryptoService.decryptCredential(
              item.credential.encryptedPassword,
              item.encryptedDataKey,
              item.credential.iv,
              privKey
            );

            decryptedList.push({
              id: item.credential.id,
              title: item.credential.title,
              username: item.credential.encryptedUsername, // Or decrypt this if you encrypted it
              password: decryptedData.password,
              notes: decryptedData.notes,
              url: item.credential.logInUrl, 
              updatedAt: item.credential.updateAt,
            });
          } catch (err) {
            console.error('Failed to decrypt item:', item.credential.title, err);
          }
        }

        this.decryptedItems.set(decryptedList);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Fetch failed', err);
        this.isLoading.set(false);
      },
    });
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Popout credential list
  selectItem(item: any) {
    this.selectedItem.set(item);
    this.showSecret.set(false); // Reset eye icon when opening new item
  }

  closePopup() {
    this.selectedItem.set(null);
  }

  toggleSecret() {
    this.showSecret.update((v) => !v);
  }

  // Popout add credential
  // Add this to your Vault class
  isAddModalOpen = signal(false);

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
    // Optional: Refresh the list after adding
    this.loadVault();
  }
}
