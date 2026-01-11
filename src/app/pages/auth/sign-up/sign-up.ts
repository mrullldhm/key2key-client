import { Component, inject, signal } from '@angular/core';
import { LandingNavbar } from '../../../components/navbar/landing-navbar/landing-navbar';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../services/auth';
import { Crypto } from '../../../services/crypto';
import { VaultState } from '../../../services/vault-state';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [LandingNavbar, RouterLink, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private authService = inject(Auth);
  private cryptoService = inject(Crypto);
  private router = inject(Router);
  private vaultState = inject(VaultState);

  showPassword = signal(false);
  isLoading = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onSubmit(form: any) {
    if (form.invalid) return;

    this.isLoading.set(true);
    const { email, password } = form.value;

    try {
      // 1. Transform raw password into Zero-Knowledge assets
      const vaultData = await this.cryptoService.setupNewVault(password);

      // 2. Send the safe data to backend
      this.authService
        .signup({
          email,
          password: vaultData.authHash, // The first-level hash
          vaultKeySalt: vaultData.salt, // The salt
          publicKey: vaultData.publicKey, // The public RSA key
          privateKey: vaultData.encryptedPrivateKey, // The locked private key
        })
        .subscribe({
          next: (res) => {
            console.log('Signup success!', res);
            // Merge the backend user data with the publicKey we just generated
            this.vaultState.user.set({
              ...res.data.user,
              publicKey: vaultData.publicKey, // Manually add the key we have in memory
            });

            // 2. Set the actual CryptoKey objects so the vault is "Unlocked"
            // These come from the 'vaultData' we generated before the API call
            this.vaultState.masterKey.set(vaultData.rawMasterKey);
            this.vaultState.privateKey.set(vaultData.rawPrivateKey);

            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Signup failed', err);
            this.isLoading.set(false);
          },
        });
    } catch (error) {
      console.error('Encryption error:', error);
      this.isLoading.set(false);
    }
  }
}
