import { Component, signal } from '@angular/core';
import { VaultNavbar } from "../vault-navbar/vault-navbar";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-navbar',
  imports: [RouterLink, VaultNavbar],
  templateUrl: './dashboard-navbar.html',
  styleUrl: './dashboard-navbar.scss',
})
export class DashboardNavbar {
  protected readonly title = signal('KEY2KEY');
}
