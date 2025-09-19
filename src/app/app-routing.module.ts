import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { UsecaseTableComponent } from './components/usecase-table/usecase-table.component';
import { SummaryReportComponent } from './components/summary-report/summary-report.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginTestComponent } from './components/login-test/login-test.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login-test', component: LoginTestComponent },
  { path: '', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: FileUploadComponent, canActivate: [AuthGuard] },
  { path: 'usecases', component: UsecaseTableComponent, canActivate: [AuthGuard] },
  { path: 'summary', component: SummaryReportComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
