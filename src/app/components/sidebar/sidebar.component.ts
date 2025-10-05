import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.url;
      }
    });
  }

  navigateToUpload(): void {
    this.router.navigate(['/upload']);
  }

  navigateToUseCases(): void {
    this.router.navigate(['/usecases']);
  }

  navigateToSummary(): void {
    this.router.navigate(['/summary']);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateToUsers(): void {
    this.router.navigate(['/users']);
  }

  isActive(route: string): boolean {
    return this.currentRoute === route || 
           (route === '/home' && (this.currentRoute === '/' || this.currentRoute === '/home'));
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
    console.log('User authorities:', user?.authorities);
    const isAdmin = user?.authorities?.some((auth: any) => auth.authority === 'ROLE_ADMIN') || false;
    console.log('Is admin:', isAdmin);
    return isAdmin;
  }
}
