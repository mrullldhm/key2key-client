import { Component, signal } from '@angular/core';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Vault } from '../../components/vault/vault';
import { FirstTimer } from '../../components/first-timer/first-timer';
import { PasswordGenerator } from '../../components/generator/password-generator/password-generator';
import { Credential } from '../../components/credential/credential';
import { QrGenerator } from '../../components/generator/qr-generator/qr-generator';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, Vault, FirstTimer, PasswordGenerator, Credential, QrGenerator],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
