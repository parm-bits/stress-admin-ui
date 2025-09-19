import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the token directly from localStorage to avoid circular dependency
    const token = localStorage.getItem('auth_token');
    
    // If token exists and the request is to our API, add the Authorization header
    if (token && request.url.includes('/api/')) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authRequest);
    }
    
    // If no token or not an API request, proceed without modification
    return next.handle(request);
  }
}
