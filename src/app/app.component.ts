import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Stress Admin Dashboard';
  showSettings: boolean = false;
  isHomePage: boolean = false;
  isAuthPage: boolean = false;
  currentUser: User | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check if current route is home page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isHomePage = event.url === '/' || event.url === '/home';
        this.isAuthPage = event.url === '/login' || event.url === '/register';
      });
    
    // Initial check
    this.isHomePage = this.router.url === '/' || this.router.url === '/home';
    this.isAuthPage = this.router.url === '/login' || this.router.url === '/register';

    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  logout(): void {
    // Clear token immediately before making the API call
    this.authService.clearTokenImmediately();
    
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Still redirect to login even if logout request fails
        this.router.navigate(['/login']);
      }
    });
  }
}