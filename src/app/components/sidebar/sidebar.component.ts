import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentRoute: string = '';

  constructor(private router: Router) { }

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

  isActive(route: string): boolean {
    return this.currentRoute === route || 
           (route === '/home' && (this.currentRoute === '/' || this.currentRoute === '/home'));
  }
}
