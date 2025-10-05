import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  message?: string;
  authorities?: any[];
}

export interface User {
  username: string;
  authorities: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check for existing token on service initialization
    this.checkStoredToken();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('Attempting login with:', credentials);
    console.log('API URL:', `${this.apiUrl}/login`);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response received:', response);
          if (response.success && response.token) {
            this.setToken(response.token);
            this.currentUserSubject.next({
              username: response.username!,
              authorities: response.authorities || []
            });
            console.log('Token set and user updated');
          }
        })
      );
  }


  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/logout`, {})
      .pipe(
        tap(() => {
          this.clearToken();
          this.currentUserSubject.next(null);
        })
      );
  }

  validateToken(): Observable<AuthResponse> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.next({ success: false, message: 'No token found' });
        observer.complete();
      });
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/validate`, { token })
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next({
              username: response.username!,
              authorities: response.authorities || []
            });
          } else {
            this.clearToken();
            this.currentUserSubject.next(null);
          }
        })
      );
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.authorities.some(auth => auth.authority === `ROLE_${role}`);
  }

  private setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private clearToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Public method to clear token immediately (for logout)
  clearTokenImmediately(): void {
    this.clearToken();
    this.currentUserSubject.next(null);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private checkStoredToken(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.validateToken().subscribe();
    } else if (token) {
      this.clearToken();
    }
  }
}
