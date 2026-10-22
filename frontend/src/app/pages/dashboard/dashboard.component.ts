import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard.component';
import { EmployeeDashboardComponent } from '../employee-dashboard/employee-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AdminDashboardComponent, EmployeeDashboardComponent],
  template: `
    @if (auth.isAdmin()) {
      <app-admin-dashboard />
    } @else {
      <app-employee-dashboard />
    }
  `
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}
}
