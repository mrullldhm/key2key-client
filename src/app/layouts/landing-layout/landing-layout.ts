import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingNavbar } from '../../components/navbar/landing-navbar/landing-navbar';

@Component({
  selector: 'app-landing-layout',
  standalone: true,

  imports: [RouterOutlet, LandingNavbar],
  templateUrl: './landing-layout.html',
  styleUrl: './landing-layout.scss',
})
export class LandingLayout {}
