import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ServerConfigComponent } from './components/server-config/server-config.component';
import { HomeComponent } from './components/home/home.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { StatusMonitorComponent } from './components/status-monitor/status-monitor.component';
import { UsecaseTableComponent } from './components/usecase-table/usecase-table.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SummaryReportComponent } from './components/summary-report/summary-report.component';
import { LoginComponent } from './components/login/login.component';
import { LoginTestComponent } from './components/login-test/login-test.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    ServerConfigComponent,
    HomeComponent,
    FileUploadComponent,
    StatusMonitorComponent,
    UsecaseTableComponent,
    SettingsComponent,
    SummaryReportComponent,
    LoginComponent,
    LoginTestComponent,
    UserManagementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
