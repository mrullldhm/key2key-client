import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-credential',
  imports: [],
  templateUrl: './credential.html',
  styleUrl: './credential.scss',
})
export class Credential {
  showPassword = signal(false);

  togglePassword() {
    this.showPassword.update((v) => !v);
  }
}
