import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { UseCaseService } from '../../services/usecase.service';
import { UseCase } from '../../models/usecase.model';

@Component({
  selector: 'app-status-monitor',
  templateUrl: './status-monitor.component.html',
  styleUrls: ['./status-monitor.component.css']
})
export class StatusMonitorComponent implements OnInit, OnDestroy {
  @Input() useCase: UseCase | null = null;
  
  status: string = 'IDLE';
  isRunning: boolean = false;
  isSuccess: boolean = false;
  reportUrl: string = '';
  lastRunAt: string = '';
  private statusInterval: any;

  constructor(private useCaseService: UseCaseService) { }

  ngOnInit(): void {
    if (this.useCase) {
      this.updateStatus();
      this.startStatusPolling();
    }
  }

  ngOnDestroy(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  updateStatus(): void {
    if (!this.useCase) return;

    this.status = this.useCase.status;
    this.isRunning = this.status === 'RUNNING';
    this.isSuccess = this.status === 'SUCCESS';
    this.reportUrl = this.useCase.lastReportUrl || '';
    this.lastRunAt = this.useCase.lastRunAt || '';
  }

  startStatusPolling(): void {
    if (!this.useCase) return;

    this.statusInterval = setInterval(() => {
      this.useCaseService.getUseCaseStatus(this.useCase!.id).subscribe({
        next: (statusData) => {
          this.status = statusData.status;
          this.isRunning = this.status === 'RUNNING';
          this.isSuccess = this.status === 'SUCCESS';
          this.reportUrl = statusData.lastReportUrl || '';
          this.lastRunAt = statusData.lastRunAt || '';
          
          // Stop polling if test is finished
          if (this.status === 'SUCCESS' || this.status === 'FAILED') {
            clearInterval(this.statusInterval);
          }
        },
        error: (error) => {
          console.error('Error fetching status:', error);
        }
      });
    }, 2000); // Poll every 2 seconds
  }

  runTest(): void {
    if (!this.useCase) return;

    // Use default user count of 50
    const userCount = this.useCase.userCount || 50;

    this.useCaseService.runUseCase(this.useCase.id, userCount).subscribe({
      next: (response) => {
        this.isRunning = true;
        this.status = 'RUNNING';
        this.startStatusPolling();
      },
      error: (error) => {
        console.error('Error running test:', error);
        alert('Error starting test: ' + (error.error?.error || error.message));
      }
    });
  }

  stopTest(): void {
    if (!this.useCase) return;

    if (confirm(`Are you sure you want to stop "${this.useCase.name}"?`)) {
      this.useCaseService.stopUseCase(this.useCase.id).subscribe({
        next: (response) => {
          console.log('Test stopped:', response);
          this.isRunning = false;
          this.status = 'STOPPED';
          if (this.statusInterval) {
            clearInterval(this.statusInterval);
          }
        },
        error: (error) => {
          console.error('Error stopping test:', error);
          alert('Error stopping test: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  getStatusIcon(): string {
    if (this.isRunning) return '🔄';
    if (this.isSuccess) return '✅';
    if (this.status === 'FAILED') return '❌';
    return '⏸️';
  }

  getStatusText(): string {
    if (this.isRunning) return 'Running';
    if (this.isSuccess) return 'Finished (Success)';
    if (this.status === 'FAILED') return 'Finished (Failed)';
    return 'Idle';
  }
}