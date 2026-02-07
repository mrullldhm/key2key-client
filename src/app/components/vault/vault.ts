import { Component, computed, inject, signal, effect } from '@angular/core';
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
export class Vault {
  private http = inject(HttpClient);
  public vaultState = inject(VaultState);
  private cryptoService = inject(Crypto);

  // State Signals
  decryptedItems = signal<any[]>([]);
  isLoading = signal(true);
  selectedItem = signal<any | null>(null);
  showSecret = signal(false);
  isEditMode = signal(false);
  isUpdating = signal(false);

  // Sharing State
  shareEmail = signal('');
  isCheckingEmail = signal(false);
  targetUser = signal<{
    targetUserId: string;
    targetPublicKey: string;
    encryptedDataKey: string;
  } | null>(null);
  accessList = signal<any[]>([]);
  isSharing = signal(false);
  isAddModalOpen = signal(false);

  constructor() {
    /**
     * REACTIVE FIX:
     * We watch the privateKey signal. As soon as it's not null
     * (meaning the app has finished initializing the session),
     * we trigger the vault load.
     */
    effect(() => {
      const privKey = this.vaultState.privateKey();
      if (privKey) {
        this.loadVault();
      }
    });
  }

  // Filtered list based on search
  filteredItems = computed(() => {
    const query = this.vaultState.searchQuery().toLowerCase().trim();
    const items = this.decryptedItems();
    if (!query) return items;
    return items.filter((item) => item.title.toLowerCase().includes(query));
  });

  async loadVault() {
    const privKey = this.vaultState.privateKey();
    if (!privKey) return;

    this.isLoading.set(true);

    this.http.get<{ data: any[] }>(`${environment.apiUrl}/credential`).subscribe({
      next: async (res) => {
        const encryptedList = res.data;
        const decryptedList = [];

        for (const item of encryptedList) {
          try {
            // Unwrapping and Decrypting logic
            const decryptedData = await this.cryptoService.decryptCredential(
              item.credential.encryptedPassword,
              item.encryptedDataKey,
              item.credential.iv,
              privKey,
            );

            decryptedList.push({
              id: item.credential.id,
              title: item.credential.title,
              username: item.credential.encryptedUsername,
              password: decryptedData.password,
              notes: decryptedData.notes,
              url: item.credential.logInUrl,
              updatedAt: item.credential.updateAt,
              ownerId: item.credential.userId,
              // Safety check: Fallback to 'System' if user relation is missing
              ownerEmail: item.credential.user?.email || 'System',
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

  selectItem(item: any) {
    this.showSecret.set(false);
    this.selectedItem.set({ ...item });
    this.isEditMode.set(false);
    this.targetUser.set(null);

    if (item.ownerId === this.vaultState.user()?.id) {
      this.fetchAccessList(item.id);
    }
  }

  revokeAccess(targetUserId: string) {
    if (confirm('Revoke access for this user?')) {
      this.http
        .delete(`${environment.apiUrl}/share/share/${this.selectedItem().id}/${targetUserId}`)
        .subscribe(() => this.fetchAccessList(this.selectedItem().id));
    }
  }

  toggleEdit() {
    this.isEditMode.update((v) => !v);
  }

  async onUpdate() {
    const item = this.selectedItem();
    const user = this.vaultState.user();
    if (!item || !user) return;

    this.isUpdating.set(true);
    try {
      const encryptedPayload = await this.cryptoService.encryptCredential(
        { password: item.password, notes: item.notes },
        user.publicKey,
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
          this.loadVault();
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

  closePopup() {
    this.selectedItem.set(null);
  }

  toggleSecret() {
    this.showSecret.update((v) => !v);
  }

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
    this.loadVault();
  }

  fetchAccessList(credentialId: string) {
    this.http
      .get<{ data: any[] }>(`${environment.apiUrl}/share/${credentialId}/access-list`)
      .subscribe((res) => this.accessList.set(res.data));
  }

  checkUser() {
    if (!this.shareEmail()) return;
    this.isCheckingEmail.set(true);

    this.http
      .post<{ data: any }>(`${environment.apiUrl}/share/share-request`, {
        credentialId: this.selectedItem().id,
        targetEmail: this.shareEmail(),
      })
      .subscribe({
        next: (res) => {
          this.targetUser.set(res.data);
          this.isCheckingEmail.set(false);
        },
        error: (err) => {
          alert('User not found or error occurred.');
          this.isCheckingEmail.set(false);
        },
      });
  }

  async grantAccess() {
    const target = this.targetUser();
    const selected = this.selectedItem();
    const privKey = this.vaultState.privateKey();

    if (!target || !selected || !privKey) return;
    this.isSharing.set(true);

    try {
      const encryptedKeyBuffer = Uint8Array.from(atob(target.encryptedDataKey), (c) =>
        c.charCodeAt(0),
      );

      const decryptedRawKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privKey,
        encryptedKeyBuffer,
      );

      const binaryPub = Uint8Array.from(atob(target.targetPublicKey), (c) => c.charCodeAt(0));
      const targetRsaKey = await window.crypto.subtle.importKey(
        'spki',
        binaryPub,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt'],
      );

      const newlyWrappedKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        targetRsaKey,
        decryptedRawKey,
      );

      const payload = {
        credentialId: selected.id,
        targetUserId: target.targetUserId,
        newlyEncryptedDataKey: btoa(String.fromCharCode(...new Uint8Array(newlyWrappedKey))),
        iv: selected.iv || '',
      };

      this.http.post(`${environment.apiUrl}/share/confirm-share`, payload).subscribe(() => {
        this.isSharing.set(false);
        this.targetUser.set(null);
        this.shareEmail.set('');
        this.fetchAccessList(selected.id);
      });
    } catch (err) {
      console.error('Sharing failed', err);
      this.isSharing.set(false);
    }
  }
}
