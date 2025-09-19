import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UseCaseService } from '../../services/usecase.service';
import { UseCase } from '../../models/usecase.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // Real-time stats
  totalTests: number = 0;
  runningTests: number = 0;
  successTests: number = 0;
  
  // Data refresh
  private refreshSubscription?: Subscription;
  private refreshInterval = 3000; // Update every 3 seconds

  constructor(
    private router: Router,
    private useCaseService: UseCaseService
  ) { }

  ngOnInit(): void {
    this.loadRealTimeStats();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadRealTimeStats(): void {
    this.useCaseService.getAllUseCases().subscribe({
      next: (useCases: UseCase[]) => {
        this.calculateStats(useCases);
      },
      error: (error: any) => {
        console.error('Error loading real-time stats:', error);
        // Set default values on error
        this.totalTests = 0;
        this.runningTests = 0;
        this.successTests = 0;
      }
    });
  }

  startRealTimeUpdates(): void {
    this.refreshSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.useCaseService.getAllUseCases())
      )
      .subscribe({
        next: (useCases: UseCase[]) => {
          this.calculateStats(useCases);
        },
        error: (error: any) => {
          console.error('Error updating real-time stats:', error);
        }
      });
  }

  calculateStats(useCases: UseCase[]): void {
    this.totalTests = useCases.length;
    this.runningTests = useCases.filter(uc => uc.status === 'RUNNING').length;
    this.successTests = useCases.filter(uc => uc.status === 'SUCCESS').length;
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
}
