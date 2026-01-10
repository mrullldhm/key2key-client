import { Component, EventEmitter, inject, Output } from '@angular/core';

@Component({
  selector: 'app-vault-navbar',
  standalone: true,
  imports: [],
  templateUrl: './vault-navbar.html',
  styleUrl: './vault-navbar.scss',
})
export class VaultNavbar {
  @Output() navigate = new EventEmitter<'dashboard' | 'generator'>();

  goDashboard() {
    this.navigate.emit('dashboard');
  }

  goGenerator() {
    this.navigate.emit('generator');
  }
}
