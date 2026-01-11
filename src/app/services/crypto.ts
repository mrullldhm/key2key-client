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
      rawMasterKey: masterKey,
      rawPrivateKey: keyPair.privateKey,
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

  async hashForServer(password: string, salt: string): Promise<string> {
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

  /**
   * PHASE 2: SIGN IN
   * Unlocks the encrypted private key using the Master Key
   */
  async unlockPrivateKey(encryptedDataJson: string, masterKey: CryptoKey): Promise<CryptoKey> {
    const { iv, ciphertext } = JSON.parse(encryptedDataJson);

    // 1. Decode from Base64
    const ivBuffer = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
    const dataBuffer = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

    // 2. Decrypt the PKCS8 data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      masterKey,
      dataBuffer
    );

    // 3. Import it back as a usable RSA CryptoKey
    return await window.crypto.subtle.importKey(
      'pkcs8',
      decryptedBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      true,
      ['decrypt'] // Private key is for decrypting shared data
    );
  }

  // Add this small helper for login to recreate the same Master Key
  async recreateMasterKey(password: string, saltHex: string): Promise<CryptoKey> {
    const saltBuffer = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    return await this.deriveMasterKey(password, saltBuffer);
  }

  /**
   * PHASE 3: CREDENTIAL STORAGE
   * Encrypts a credential using a unique Data Key,
   * then wraps that key with the user's RSA Public Key.
   */
  /**
   * Encrypts a credential and wraps the data key for the current user
   */
  async encryptCredential(credential: any, publicKeyStr: string) {
    // 1. Generate a random AES Data Key (for this specific credential)
    const dataKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
      'encrypt',
      'decrypt',
    ]);

    // 2. Encrypt the sensitive fields (Password/Notes)
    const sensitiveData = JSON.stringify(credential);
    const encryptedResult = await this.encryptData(
      this.encoder.encode(sensitiveData).buffer as ArrayBuffer, // Add .buffer
      dataKey
    );
    // 3. Export the Data Key so we can "wrap" it
    const exportedDataKey = await window.crypto.subtle.exportKey('raw', dataKey);

    // 4. Wrap (Encrypt) the Data Key with the User's Public RSA Key
    const binaryPub = Uint8Array.from(atob(publicKeyStr), (c) => c.charCodeAt(0));
    const rsaPublicKey = await window.crypto.subtle.importKey(
      'spki',
      binaryPub,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );

    // 5. Wrap (Encrypt) the Data Key with the RSA Public Key
    const wrappedKeyBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaPublicKey,
      exportedDataKey
    );

    return {
      encryptedData: encryptedResult.ciphertext,
      iv: encryptedResult.iv,
      encryptedDataKey: btoa(String.fromCharCode(...new Uint8Array(wrappedKeyBuffer))),
    };
  }

  /**
   * PHASE 4: CREDENTIAL DECRYPTION
   * Unwraps the AES Data Key using the RSA Private Key, then decrypts the content.
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

    // 2. Unwrap (Decrypt) the AES Data Key using your RSA Private Key
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

    // 4. Decrypt the actual sensitive data (the JSON string)
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBuffer },
      dataKey,
      encryptedDataBuffer
    );

    // 5. Convert back to a JSON object
    return JSON.parse(new TextDecoder().decode(decryptedContent));
  }
}
