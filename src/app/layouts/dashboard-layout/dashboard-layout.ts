import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardNavbar } from '../../components/navbar/dashboard-navbar/dashboard-navbar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, DashboardNavbar],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
})
export class DashboardLayout {}
