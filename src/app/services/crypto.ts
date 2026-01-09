import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Crypto {
  private encoder = new TextEncoder();

  async setupNewVault(password: string) {
    // 1. Generate Salt
    const saltBuffer = window.crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(saltBuffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 2. Derive Master Key (AES-GCM 256)
    const masterKey = await this.deriveMasterKey(password, saltBuffer);

    // 3. Create Auth Hash for Server Identity
    const authHash = await this.hashForServer(password, saltHex);

    // 4. Generate RSA-2048 Keypair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    // 5. Export Public Key (SPKI)
    const pubExport = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyString = btoa(String.fromCharCode(...new Uint8Array(pubExport)));

    // 6. Export & Encrypt Private Key (PKCS8)
    const privExport = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const encryptedPrivKey = await this.encryptData(privExport, masterKey);

    return {
      salt: saltHex,
      authHash: authHash,
      publicKey: publicKeyString,
      encryptedPrivateKey: JSON.stringify(encryptedPrivKey),
    };
  }

  private async deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      this.encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer, // Fixed the type error
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async hashForServer(password: string, salt: string): Promise<string> {
    const data = this.encoder.encode(password + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async encryptData(data: ArrayBuffer, key: CryptoKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    return {
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    };
  }
}
