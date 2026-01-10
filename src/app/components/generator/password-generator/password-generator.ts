import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './password-generator.html',
  styleUrl: './password-generator.scss',
})
export class PasswordGenerator {
  password = '';

  length = 16;
  includeUppercase = true;
  includeLowercase = true;
  includeNumbers = true;
  includeSymbols = true;

  generatePassword() {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';

    if (this.includeUppercase) chars += upper;
    if (this.includeLowercase) chars += lower;
    if (this.includeNumbers) chars += numbers;
    if (this.includeSymbols) chars += symbols;

    if (!chars) {
      this.password = '';
      return;
    }

    let result = '';
    for (let i = 0; i < this.length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }

    this.password = result;
  }

  copyPassword() {
    if (!this.password) return;
    navigator.clipboard.writeText(this.password);
  }
}
