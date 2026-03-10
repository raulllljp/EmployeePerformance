import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Shell } from './components/shell/shell';
import { Dashboard } from './components/dashboard/dashboard';
import { EmployeeList } from './components/employee-list/employee-list';
import { EmployeeDetail } from './components/employee-detail/employee-detail';
import { PerformanceReview } from './components/performance-review/performance-review';
import { Analytics } from './components/analytics/analytics';
import { AddEmployee } from './components/add-employee/add-employee';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },

  // All authenticated pages live inside the Shell (sidebar layout)
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'employees',
        component: EmployeeList
      },
      {
        path: 'employees/add',
        component: AddEmployee,
        canActivate: [roleGuard],
        data: { roles: ['manager'] }
      },
      {
        path: 'employee/:id',
        component: EmployeeDetail
      },
      {
        path: 'employee-detail/:id',
        redirectTo: '/employee/:id'
      },
      {
        path: 'performance-review',
        component: PerformanceReview,
        canActivate: [roleGuard],
        data: { roles: ['manager', 'employee'] }
      },
      {
        path: 'analytics',
        component: Analytics,
        canActivate: [roleGuard],
        data: { roles: ['manager'] }
      }
    ]
  },

  { path: '**', redirectTo: '/login' }
];
