import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  public vaultState = inject(VaultState);
  private cryptoService = inject(Crypto);

  // This will hold the decrypted passwords for display
  decryptedItems = signal<any[]>([]);
  isLoading = signal(true);

  // Holds the single item the user clicked on
  selectedItem = signal<any | null>(null);
  showSecret = signal(false); // For the popup's password visibility

  isEditMode = signal(false); // Toggle between View and Edit mode
  isUpdating = signal(false); // Loading state for the update button

  // Sharing State
  shareEmail = signal('');
  isCheckingEmail = signal(false);
  targetUser = signal<{
    targetUserId: string;
    targetPublicKey: string;
    encryptedDataKey: string;
  } | null>(null);
  accessList = signal<any[]>([]); // People who have access
  isSharing = signal(false);

  // Filtered list based on search
  filteredItems = computed(() => {
    const query = this.vaultState.searchQuery().toLowerCase().trim();
    const items = this.decryptedItems();

    if (!query) return items;

    return items.filter((item) => item.title.toLowerCase().includes(query));
  });

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
              ownerId: item.credential.userId,
              ownerEmail: item.credential.user.email, // <--- Add this line
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
    this.showSecret.set(false);
    this.selectedItem.set({ ...item });
    this.isEditMode.set(false);
    this.targetUser.set(null); // Reset share state

    // Only fetch access list if you are the owner
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

  // SHARED FUNCTION
  // 1. Fetch the list of people who have access
  fetchAccessList(credentialId: string) {
    this.http
      .get<{ data: any[] }>(`${environment.apiUrl}/share/${credentialId}/access-list`)
      .subscribe((res) => this.accessList.set(res.data));
  }

  // 2. Handshake: Check if the email exists and get their Public Key
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
          this.targetUser.set(res.data); // Contains targetUserId and targetPublicKey
          this.isCheckingEmail.set(false);
        },
        error: (err) => {
          alert('User not found or error occurred.');
          this.isCheckingEmail.set(false);
        },
      });
  }

  // 3. The Wrap & Confirm: Perform the encryption and save
  async grantAccess() {
    const target = this.targetUser();
    const selected = this.selectedItem();
    const privKey = this.vaultState.privateKey();

    if (!target || !selected || !privKey) return;
    this.isSharing.set(true);

    try {
      // A. We need the raw Data Key. We get it by "unwrapping" the current one
      // We'll use a modified version of your decrypt logic to get the key
      const encryptedKeyBuffer = Uint8Array.from(atob(target.encryptedDataKey), (c) =>
        c.charCodeAt(0)
      );

      const decryptedRawKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privKey,
        encryptedKeyBuffer
      );

      // B. Re-encrypt (Wrap) that raw key with the TARGET's Public Key
      const binaryPub = Uint8Array.from(atob(target.targetPublicKey), (c) => c.charCodeAt(0));
      const targetRsaKey = await window.crypto.subtle.importKey(
        'spki',
        binaryPub,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
      );

      const newlyWrappedKey = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        targetRsaKey,
        decryptedRawKey
      );

      // C. Confirm with Backend
      const payload = {
        credentialId: selected.id,
        targetUserId: target.targetUserId,
        newlyEncryptedDataKey: btoa(String.fromCharCode(...new Uint8Array(newlyWrappedKey))),
        iv: selected.iv || '', // Use existing IV
      };

      this.http.post(`${environment.apiUrl}/share/confirm-share`, payload).subscribe(() => {
        this.isSharing.set(false);
        this.targetUser.set(null);
        this.shareEmail.set('');
        this.fetchAccessList(selected.id); // Refresh the list
      });
    } catch (err) {
      console.error('Sharing failed', err);
      this.isSharing.set(false);
    }
  }
}
