import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VaultState } from '../../../services/vault-state';

@Component({
  selector: 'app-vault-navbar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vault-navbar.html',
  styleUrl: './vault-navbar.scss',
})
export class VaultNavbar {
  public vaultState = inject(VaultState); // Inject the state
  @Output() navigate = new EventEmitter<'dashboard' | 'generator'>();

  goDashboard() {
    this.navigate.emit('dashboard');
  }

  goGenerator() {
    this.navigate.emit('generator');
  }
}
