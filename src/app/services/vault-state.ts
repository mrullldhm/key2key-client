import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VaultState {
  // The Master Key derived from the password (AES-GCM)
  masterKey = signal<CryptoKey | null>(null);

  // The decrypted RSA Private Key used for sharing and viewing credentials
  privateKey = signal<CryptoKey | null>(null);

  // Basic user info (email, etc.)
  user = signal<{ id: string; email: string; publicKey: string } | null>(null);

  // A computed signal to check if the vault is currently "unlocked"
  isUnlocked = computed(() => this.masterKey() !== null && this.privateKey() !== null);

  /**
   * Wipes all sensitive keys from memory.
   * Call this during Logout or if a security timeout occurs.
   */

  clearVault() {
    this.masterKey.set(null);
    this.privateKey.set(null);
    this.user.set(null);
    console.log('Vault memory cleared.');
  }

  // Inside your VaultState service
  searchQuery = signal<string>('');
}
