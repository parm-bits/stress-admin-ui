import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-test',
  template: `
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>Login Test Component</h2>
      
      <div style="margin-bottom: 20px;">
        <h3>Test Credentials:</h3>
        <ul>
          <li>Username: <strong>admin</strong>, Password: <strong>admin123</strong></li>
          <li>Username: <strong>user</strong>, Password: <strong>user123</strong></li>
        </ul>
      </div>
      
      <form (ngSubmit)="testLogin()">
        <div style="margin-bottom: 10px;">
          <label>Username:</label>
          <input type="text" [(ngModel)]="username" name="username" style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        
        <div style="margin-bottom: 10px;">
          <label>Password:</label>
          <input type="password" [(ngModel)]="password" name="password" style="width: 100%; padding: 8px; margin-top: 5px;">
        </div>
        
        <button type="submit" [disabled]="loading" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px;">
          {{ loading ? 'Testing...' : 'Test Login' }}
        </button>
        
        <button type="button" (click)="testHealth()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; margin-left: 10px;">
          Test Health
        </button>
      </form>
      
      <div *ngIf="result" [style]="resultStyle" style="margin-top: 20px; padding: 15px; border-radius: 4px; white-space: pre-wrap;">
        {{ result }}
      </div>
    </div>
  `
})
export class LoginTestComponent {
  username = 'admin';
  password = 'admin123';
  loading = false;
  result = '';
  resultStyle = '';

  constructor(private http: HttpClient) {}

  async testLogin() {
    this.loading = true;
    this.result = '';
    
    try {
      const response = await this.http.post(`${environment.apiUrl}/auth/login`, {
        username: this.username,
        password: this.password
      }).toPromise();
      
      this.resultStyle = 'background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724;';
      this.result = `SUCCESS!\nStatus: 200\nResponse: ${JSON.stringify(response, null, 2)}`;
    } catch (error: any) {
      this.resultStyle = 'background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;';
      this.result = `ERROR!\nStatus: ${error.status || 'Unknown'}\nMessage: ${error.message || 'Unknown error'}\nResponse: ${JSON.stringify(error.error || {}, null, 2)}`;
    } finally {
      this.loading = false;
    }
  }

  async testHealth() {
    this.loading = true;
    this.result = '';
    
    try {
      const response = await this.http.get(`${environment.apiUrl}/health`).toPromise();
      
      this.resultStyle = 'background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724;';
      this.result = `HEALTH CHECK SUCCESS!\nStatus: 200\nResponse: ${JSON.stringify(response, null, 2)}`;
    } catch (error: any) {
      this.resultStyle = 'background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;';
      this.result = `HEALTH CHECK ERROR!\nStatus: ${error.status || 'Unknown'}\nMessage: ${error.message || 'Unknown error'}\nResponse: ${JSON.stringify(error.error || {}, null, 2)}`;
    } finally {
      this.loading = false;
    }
  }
}
