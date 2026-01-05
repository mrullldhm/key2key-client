import { Component, signal } from '@angular/core';
import { Navbar } from "../../components/navbar/navbar";
import { Sidebar } from "../../components/sidebar/sidebar";
import { Vault } from "../../components/vault/vault";
import { FirstTimer } from "../../components/first-timer/first-timer";
import { PasswordGenerator } from "../../components/password-generator/password-generator";
import { Credential } from "../../components/credential/credential";
import { QrGenerator } from "../../components/qr-generator/qr-generator";

@Component({
  selector: 'app-home',
  imports: [Navbar, Sidebar, Vault, FirstTimer, PasswordGenerator, Credential, QrGenerator],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
