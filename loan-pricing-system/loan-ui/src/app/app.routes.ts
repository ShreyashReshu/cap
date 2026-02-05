import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { LoanListComponent } from './components/loan-list/loan-list.component';
import { LoanCreateComponent } from './components/loan-create/loan-create.component';
import { LoanDetailComponent } from './components/loan-detail/loan-detail.component';
import { LoanEditComponent } from './components/loan-edit/loan-edit.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'loans', component: LoanListComponent, canActivate: [authGuard] },
  { path: 'loans/new', component: LoanCreateComponent, canActivate: [authGuard] },
  { path: 'loans/:id', component: LoanDetailComponent, canActivate: [authGuard] },
  { path: 'loans/:id/edit', component: LoanEditComponent, canActivate: [authGuard] },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard] },
  { path: '', redirectTo: '/loans', pathMatch: 'full' },
  { path: '**', redirectTo: '/loans' }
];