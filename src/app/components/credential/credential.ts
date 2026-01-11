import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { Crypto } from '../../services/crypto';
import { VaultState } from '../../services/vault-state';
import { HttpClient } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-credential',
  imports: [FormsModule, RouterLink],
  templateUrl: './credential.html',
  styleUrl: './credential.scss',
})
export class Credential {
  @Output() cancel = new EventEmitter<void>();

  onCancel() {
    this.cancel.emit();
  }

  private cryptoService = inject(Crypto);
  private vaultState = inject(VaultState);
  private http = inject(HttpClient);

  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onSave(form: NgForm) {
    if (form.invalid) return;

    const { service, username, password, url, notes } = form.value;
    const user = this.vaultState.user();
    console.log('Current User State:', user); // DEBUG LINE

    // This check tells TypeScript: "If user is null, stop here."
    // Once we pass this check, TypeScript knows user.publicKey is a string.
    if (!user || !user.publicKey) {
      console.error('ERROR: user is:', user);
      console.error('ERROR: publicKey is:', user?.publicKey);
      alert('Vault is locked. Please Sign In again.');
      return;
    }

    try {
      // 1. Encrypt locally
      const encryptedPayload = await this.cryptoService.encryptCredential(
        { password, notes }, // Sensitive info
        user.publicKey
      );

      // 2. Prepare the final object for the backend
      const finalData = {
        title: service, // Prisma expects 'title'
        logInUrl: url, // Prisma expects 'logInUrl'
        notes: notes, // Prisma expects 'notes'
        encryptedUsername: username, // Note: You might want to encrypt this too later
        encryptedPassword: encryptedPayload.encryptedData, // The encrypted blob
        encryptedDataKey: encryptedPayload.encryptedDataKey,
        iv: encryptedPayload.iv,
      };

      // 3. Send to Backend
      this.http.post(`${environment.apiUrl}/credential`, finalData).subscribe({
        next: () => {
          alert('Credential saved securely!');
          form.reset();
        },
        error: (err) => console.error('Save failed', err),
      });
    } catch (err) {
      console.error('Encryption error', err);
    }
  }

  /**
   * PHASE 4: CREDENTIAL DECRYPTION
   * Unwraps the data key using the RSA Private Key and decrypts the content.
   */
  async decryptCredential(
    encryptedData: string,
    encryptedDataKey: string,
    iv: string,
    privateKey: CryptoKey
  ) {
    // 1. Decode everything from Base64
    const encryptedDataBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const encryptedKeyBuffer = Uint8Array.from(atob(encryptedDataKey), (c) => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

    // 2. Unwrap the Data Key using your RSA Private Key
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedKeyBuffer
    );

    // 3. Import the raw Data Key as an AES-GCM key
    const dataKey = await window.crypto.subtle.importKey(
      'raw',
      decryptedKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 4. Decrypt the actual sensitive data
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      dataKey,
      encryptedDataBuffer
    );

    // 5. Convert back to JSON object
    return JSON.parse(new TextDecoder().decode(decryptedContent));
  }
}
