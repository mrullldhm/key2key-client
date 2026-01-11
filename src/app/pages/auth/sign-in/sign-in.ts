import { Component, inject, signal } from '@angular/core';
import { LandingNavbar } from '../../../components/navbar/landing-navbar/landing-navbar';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';
import { Crypto } from '../../../services/crypto';
import { VaultState } from '../../../services/vault-state';

@Component({
  selector: 'app-sign-in',
  imports: [LandingNavbar, FormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class SignIn {
  private authService = inject(Auth);
  private cryptoService = inject(Crypto);
  private vaultState = inject(VaultState);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  async onUnlock(form: NgForm) {
    if (form.invalid) return;
    this.isLoading.set(true);

    const { email, password } = form.value;

    try {
      // 1. Fetch Salt from Backend
      this.authService.getVaultSalt(email).subscribe(async (res: any) => {
        const salt = res.vaultKeySalt;

        // 2. Re-derive Master Key & Identity Hash
        const masterKey = await this.cryptoService.recreateMasterKey(password, salt);
        const authHash = await this.cryptoService.hashForServer(password, salt);

        // 3. Authenticate with Server
        this.authService.signin({ email, password: authHash }).subscribe({
          next: async (loginRes: any) => {
            // 4. Decrypt the Private Key from the database
            const unlockedPrivKey = await this.cryptoService.unlockPrivateKey(
              loginRes.data.privateKey,
              masterKey
            );

            // 5. Save everything to Memory (VaultState)
            this.vaultState.user.set({
              id: loginRes.data.user.id,
              email: loginRes.data.user.email,
              publicKey: loginRes.data.user.publicKey, // <--- Added this line
            });
            this.vaultState.masterKey.set(masterKey);
            this.vaultState.privateKey.set(unlockedPrivKey);

            //
            // console.log('SIGN-IN SUCCESS: Saving user to VaultState:', loginRes.data.user);

            // Provide the actual mapping from loginRes.data.user
            // this.vaultState.user.set({
            //   id: loginRes.data.user.id,
            //   email: loginRes.data.user.email,
            //   publicKey: loginRes.data.user.publicKey,
            // });

            // console.log('VAULTSTATE NOW CONTAINS:', this.vaultState.user());
            //

            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Login failed', err);
            this.isLoading.set(false);
          },
        });
      });
    } catch (err) {
      console.error('Unlock error', err);
      this.isLoading.set(false);
    }
  }
}
