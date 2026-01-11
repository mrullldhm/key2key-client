import { Component, inject, OnInit, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { VaultState } from '../../services/vault-state';
import { Crypto } from '../../services/crypto';
import { Credential } from '../credential/credential';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vault',
  standalone: true,
  imports: [Credential, FormsModule, CommonModule],
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

  isEditMode = signal(false); // Toggle between View and Edit mode
  isUpdating = signal(false); // Loading state for the update button

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

  // Popup credential list
  selectItem(item: any) {
    // this.selectedItem.set(item);
    this.showSecret.set(false); // Reset eye icon when opening new item
    this.selectedItem.set({ ...item }); // Spread to create a copy for editing
    this.isEditMode.set(false);
  }

  // UPDATE & DELETE
  toggleEdit() {
    this.isEditMode.update((v) => !v);
  }

  async onUpdate() {
    const item = this.selectedItem();
    const user = this.vaultState.user();
    if (!item || !user) return;

    this.isUpdating.set(true);
    try {
      // Re-encrypt the potentially modified password/notes
      const encryptedPayload = await this.cryptoService.encryptCredential(
        { password: item.password, notes: item.notes },
        user.publicKey
      );

      const payload = {
        title: item.title,
        logInUrl: item.url,
        notes: item.notes,
        encryptedUsername: item.username,
        encryptedPassword: encryptedPayload.encryptedData,
        iv: encryptedPayload.iv,
        encryptedDataKey: encryptedPayload.encryptedDataKey,
      };

      this.http.put(`${environment.apiUrl}/credential/${item.id}`, payload).subscribe({
        next: () => {
          this.isEditMode.set(false);
          this.loadVault(); // Refresh list
          this.isUpdating.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isUpdating.set(false);
        },
      });
    } catch (err) {
      console.error(err);
      this.isUpdating.set(false);
    }
  }

  onDelete() {
    const item = this.selectedItem();
    if (!item) return;

    if (confirm(`Are you sure you want to delete ${item.title}?`)) {
      this.http.delete(`${environment.apiUrl}/credential/${item.id}`).subscribe({
        next: () => {
          this.closePopup();
          this.loadVault();
        },
        error: (err) => console.error(err),
      });
    }
  }
  //

  closePopup() {
    this.selectedItem.set(null);
  }

  toggleSecret() {
    this.showSecret.update((v) => !v);
  }

  // Popup add credential
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
