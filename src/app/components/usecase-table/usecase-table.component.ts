import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { UseCaseService } from '../../services/usecase.service';
import { UseCase } from '../../models/usecase.model';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-usecase-table',
  templateUrl: './usecase-table.component.html',
  styleUrls: ['./usecase-table.component.css']
})
export class UsecaseTableComponent implements OnInit, OnDestroy {
  useCases: UseCase[] = [];
  loading: boolean = true;
  error: string = '';
  private refreshInterval: any;
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 0;

  constructor(
    private useCaseService: UseCaseService,
    private toastService: ToastService,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.loadUseCases();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadUseCases(): void {
    this.loading = true;
    this.error = '';
    
    // Store current testStartedAt for running tests before refreshing
    const runningTestTimestamps: { [key: string]: string } = {};
    this.useCases.forEach(useCase => {
      if (useCase.status === 'RUNNING' && useCase.testStartedAt) {
        runningTestTimestamps[useCase.id] = useCase.testStartedAt;
      }
    });
    
    this.useCaseService.getAllUseCases().subscribe({
      next: (useCases) => {
        // Restore testStartedAt for running tests that were started in this session
        useCases.forEach(useCase => {
          if (useCase.status === 'RUNNING' && runningTestTimestamps[useCase.id]) {
            useCase.testStartedAt = runningTestTimestamps[useCase.id];
          }
        });
        
        // Handle tests that were running but are now completed
        this.useCases.forEach(oldUseCase => {
          if (oldUseCase.status === 'RUNNING') {
            const newUseCase = useCases.find(uc => uc.id === oldUseCase.id);
            if (newUseCase && newUseCase.status !== 'RUNNING' && runningTestTimestamps[oldUseCase.id]) {
              // Test was completed, calculate final duration
              const startTime = new Date(runningTestTimestamps[oldUseCase.id]);
              const endTime = new Date();
              newUseCase.testDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
              newUseCase.testCompletedAt = endTime.toISOString();
            }
          }
        });
        
        // Sort use cases: newest created first, then by most recent run
        this.useCases = useCases.sort((a, b) => {
          // First priority: Sort by creation time (newest first) using MongoDB ObjectId
          // MongoDB ObjectIds are sortable and contain timestamp
          const aCreatedTime = this.extractTimestampFromObjectId(a.id);
          const bCreatedTime = this.extractTimestampFromObjectId(b.id);
          
          if (aCreatedTime !== bCreatedTime) {
            return bCreatedTime - aCreatedTime; // Newest first
          }
          
          // Second priority: If created at same time, sort by most recent run
          if (a.lastRunAt && b.lastRunAt) {
            return new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime();
          }
          
          // If only one has lastRunAt, prioritize it
          if (a.lastRunAt && !b.lastRunAt) return -1;
          if (!a.lastRunAt && b.lastRunAt) return 1;
          
          // Fallback: sort by ID (newest first)
          return b.id.localeCompare(a.id);
        });
        this.calculateTotalPages();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading use cases: ' + (error.error?.error || error.message);
        this.loading = false;
        console.error('Error loading use cases:', error);
      }
    });
  }

  startAutoRefresh(): void {
    // Refresh every 5 seconds to get updated statuses
    this.refreshInterval = setInterval(() => {
      this.refreshUseCases();
    }, 5000);
  }

  refreshUseCases(): void {
    // Store current testStartedAt for running tests before refreshing
    const runningTestTimestamps: { [key: string]: string } = {};
    this.useCases.forEach(useCase => {
      if (useCase.status === 'RUNNING' && useCase.testStartedAt) {
        runningTestTimestamps[useCase.id] = useCase.testStartedAt;
      }
    });
    
    this.useCaseService.getAllUseCases().subscribe({
      next: (useCases) => {
        // Restore testStartedAt for running tests that were started in this session
        useCases.forEach(useCase => {
          if (useCase.status === 'RUNNING' && runningTestTimestamps[useCase.id]) {
            useCase.testStartedAt = runningTestTimestamps[useCase.id];
          }
        });
        
        // Handle tests that were running but are now completed
        this.useCases.forEach(oldUseCase => {
          if (oldUseCase.status === 'RUNNING') {
            const newUseCase = useCases.find(uc => uc.id === oldUseCase.id);
            if (newUseCase && newUseCase.status !== 'RUNNING' && runningTestTimestamps[oldUseCase.id]) {
              // Test was completed, calculate final duration
              const startTime = new Date(runningTestTimestamps[oldUseCase.id]);
              const endTime = new Date();
              newUseCase.testDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
              newUseCase.testCompletedAt = endTime.toISOString();
            }
          }
        });
        
        // Sort use cases: newest created first, then by most recent run
        this.useCases = useCases.sort((a, b) => {
          // First priority: Sort by creation time (newest first) using MongoDB ObjectId
          // MongoDB ObjectIds are sortable and contain timestamp
          const aCreatedTime = this.extractTimestampFromObjectId(a.id);
          const bCreatedTime = this.extractTimestampFromObjectId(b.id);
          
          if (aCreatedTime !== bCreatedTime) {
            return bCreatedTime - aCreatedTime; // Newest first
          }
          
          // Second priority: If created at same time, sort by most recent run
          if (a.lastRunAt && b.lastRunAt) {
            return new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime();
          }
          
          // If only one has lastRunAt, prioritize it
          if (a.lastRunAt && !b.lastRunAt) return -1;
          if (!a.lastRunAt && b.lastRunAt) return 1;
          
          // Fallback: sort by ID (newest first)
          return b.id.localeCompare(a.id);
        });
        
        // Don't set loading = false here since this is a background refresh
        this.error = '';
      },
      error: (error) => {
        // Don't show error for background refresh, just log it
        console.error('Error refreshing use cases:', error);
      }
    });
  }

  runTest(useCase: UseCase): void {
    // Use default user count of 50 if not specified
    const userCount = useCase.userCount || 50;
    
    this.useCaseService.runUseCase(useCase.id, userCount).subscribe({
      next: (response) => {
        // Update the use case status immediately
        useCase.status = 'RUNNING';
        // Set the test start time to current time
        useCase.testStartedAt = new Date().toISOString();
        
        // Show success toast notification
        this.toastService.showTestStarted(useCase.name);
        
        console.log('Test started for use case:', useCase.name);
      },
      error: (error) => {
        console.error('Error running test:', error);
        
        // Show error toast notification
        this.toastService.showError(
          'Test Start Failed',
          `Failed to start "${useCase.name}". Please check the configuration and try again.`
        );
      }
    });
  }

  stopTest(useCase: UseCase): void {
    if (confirm(`Are you sure you want to stop "${useCase.name}"?`)) {
      this.useCaseService.stopUseCase(useCase.id).subscribe({
        next: (response) => {
          console.log('Test stopped:', response);
          useCase.status = 'STOPPED';
          // Set completion time
          useCase.testCompletedAt = new Date().toISOString();
          // Calculate duration if test was running
          if (useCase.testStartedAt) {
            const startTime = new Date(useCase.testStartedAt);
            const endTime = new Date(useCase.testCompletedAt);
            useCase.testDurationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
          }
          this.loadUseCases(); // Refresh the list
        },
        error: (error) => {
          console.error('Error stopping test:', error);
          alert('Error stopping test: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'RUNNING': return 'status-running';
      case 'SUCCESS': return 'status-success';
      case 'FAILED': return 'status-failed';
      case 'STOPPED': return 'status-stopped';
      default: return 'status-idle';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'RUNNING': return '🔄';
      case 'SUCCESS': return '✅';
      case 'FAILED': return '❌';
      default: return '⏸️';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'RUNNING': return 'Running';
      case 'SUCCESS': return 'Success';
      case 'FAILED': return 'Failed';
      case 'STOPPED': return 'Stopped';
      default: return 'Idle';
    }
  }

  openReport(reportUrl: string): void {
    if (reportUrl) {
      // Try different URL construction approaches
      let fullUrl: string;
      
      if (reportUrl.startsWith('http')) {
        fullUrl = reportUrl;
      } else if (reportUrl.startsWith('/api/')) {
        // If report URL already includes /api/, use it as is
        fullUrl = `${environment.apiUrl.replace('/api', '')}${reportUrl}`;
      } else if (reportUrl.startsWith('/')) {
        // If report URL starts with /, try both with and without /api
        const baseUrl = environment.apiUrl.replace('/api', '');
        fullUrl = `${baseUrl}${reportUrl}`;
      } else {
        // If report URL doesn't start with /, prepend it
        const baseUrl = environment.apiUrl.replace('/api', '');
        fullUrl = `${baseUrl}/${reportUrl}`;
      }
      
      window.open(fullUrl, '_blank');
    }
  }

  deleteUseCase(useCase: UseCase): void {
    if (confirm(`Are you sure you want to delete "${useCase.name}"?`)) {
      this.useCaseService.deleteUseCase(useCase.id).subscribe({
        next: (response) => {
          console.log('Use case deleted:', response);
          this.loadUseCases(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting use case:', error);
          alert('Error deleting use case: ' + (error.error?.error || error.message));
        }
      });
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }

  // Pagination methods
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.useCases.length / this.itemsPerPage);
    // Reset to page 1 if current page is beyond total pages
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  getPaginatedUseCases(): UseCase[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.useCases.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.useCases.length);
  }

  private extractTimestampFromObjectId(objectId: string): number {
    // MongoDB ObjectId contains timestamp in the first 4 bytes (8 hex characters)
    // Extract the timestamp part and convert to milliseconds
    try {
      const timestampHex = objectId.substring(0, 8);
      return parseInt(timestampHex, 16) * 1000; // Convert to milliseconds
    } catch (error) {
      // Fallback: use string comparison if ObjectId parsing fails
      return 0;
    }
  }

  downloadJmx(useCase: UseCase): void {
    this.useCaseService.downloadJmx(useCase.id).subscribe({
      next: async (blob) => {
        try {
          // Convert blob to text to modify the JMX content
          const jmxText = await blob.text();
          
          // Apply thread group configurations if they exist
          let modifiedJmxText = jmxText;
          if (useCase.threadGroupConfig) {
            try {
              const threadGroupConfig = JSON.parse(useCase.threadGroupConfig);
              modifiedJmxText = this.applyThreadGroupConfigToJmx(jmxText, threadGroupConfig);
            } catch (error) {
              console.warn('Could not parse threadGroupConfig, using original JMX:', error);
            }
          }
          
          // Create new blob with modified content
          const modifiedBlob = new Blob([modifiedJmxText], { type: 'application/xml' });
          const url = window.URL.createObjectURL(modifiedBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = useCase.jmxPath.split('/').pop() || 'test.jmx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error processing JMX file:', error);
          // Fallback to original download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = useCase.jmxPath.split('/').pop() || 'test.jmx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error downloading JMX file:', error);
        alert('Error downloading JMX file: ' + (error.error?.error || error.message));
      }
    });
  }

  downloadCsv(useCase: UseCase): void {
    this.useCaseService.downloadCsv(useCase.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = useCase.csvPath.split('/').pop() || 'test.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading CSV file:', error);
        alert('Error downloading CSV file: ' + (error.error?.error || error.message));
      }
    });
  }

  editUseCase(useCase: UseCase): void {
    // Navigate to upload page with use case data for editing
    this.router.navigate(['/upload'], { 
      queryParams: { 
        edit: 'true',
        id: useCase.id,
        name: useCase.name,
        description: useCase.description || '',
        jmxFile: useCase.jmxPath ? useCase.jmxPath.split('/').pop() : '',
        csvFile: useCase.csvPath ? useCase.csvPath.split('/').pop() : ''
      }
    });
  }

  goBack(): void {
    // Use Angular Location service for better browser history management
    if (this.location.isCurrentPathEqualTo('/usecases')) {
      // If we're on use cases page, try to go back in history
      this.location.back();
    } else {
      // Fallback to home if no history or direct access
      this.router.navigate(['/home']);
    }
  }

  /**
   * Formats duration in seconds to human-readable format with minutes and seconds
   */
  formatDuration(durationSeconds: number): string {
    if (durationSeconds < 60) {
      return `0m ${durationSeconds}s`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const seconds = durationSeconds % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  }

  /**
   * Calculates running duration for currently running tests
   */
  getRunningDuration(useCase: UseCase): string {
    if (useCase.status !== 'RUNNING' || !useCase.testStartedAt) {
      return '0s';
    }

    const startTime = new Date(useCase.testStartedAt);
    const now = new Date();
    
    // Check if the start time is valid (not in the future)
    if (startTime.getTime() > now.getTime()) {
      return '0s';
    }
    
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    // If duration is negative or very large (more than 24 hours), return 0s
    if (durationSeconds < 0 || durationSeconds > 86400) {
      return '0s';
    }
    
    return this.formatDuration(durationSeconds);
  }

  /**
   * Applies thread group configuration to JMX content
   */
  private applyThreadGroupConfigToJmx(jmxContent: string, threadGroupConfig: any): string {
    let modifiedContent = jmxContent;
    
    console.log('Applying thread group config to JMX:', threadGroupConfig);
    
    // Update number of threads
    modifiedContent = modifiedContent.replace(
      /<intProp name="ThreadGroup\.num_threads">\d+<\/intProp>/g,
      `<intProp name="ThreadGroup.num_threads">${threadGroupConfig.numberOfThreads || 1}</intProp>`
    );
    
    // Update ramp-up period
    modifiedContent = modifiedContent.replace(
      /<intProp name="ThreadGroup\.ramp_time">\d+<\/intProp>/g,
      `<intProp name="ThreadGroup.ramp_time">${threadGroupConfig.rampUpPeriod || 1}</intProp>`
    );
    
    // Update loop count and infinite loop setting
    if (threadGroupConfig.infiniteLoop) {
      modifiedContent = modifiedContent.replace(
        /<stringProp name="LoopController\.loops">-?\d+<\/stringProp>/g,
        `<stringProp name="LoopController.loops">-1</stringProp>`
      );
      // Also update the continue_forever property
      modifiedContent = modifiedContent.replace(
        /<boolProp name="LoopController\.continue_forever">(true|false)<\/boolProp>/g,
        `<boolProp name="LoopController.continue_forever">true</boolProp>`
      );
    } else {
      modifiedContent = modifiedContent.replace(
        /<stringProp name="LoopController\.loops">-?\d+<\/stringProp>/g,
        `<stringProp name="LoopController.loops">${threadGroupConfig.loopCount || 1}</stringProp>`
      );
      // Set continue_forever to false for finite loops
      modifiedContent = modifiedContent.replace(
        /<boolProp name="LoopController\.continue_forever">(true|false)<\/boolProp>/g,
        `<boolProp name="LoopController.continue_forever">false</boolProp>`
      );
    }
    
    // Update same user on each iteration
    modifiedContent = modifiedContent.replace(
      /<boolProp name="ThreadGroup\.same_user_on_next_iteration">(true|false)<\/boolProp>/g,
      `<boolProp name="ThreadGroup.same_user_on_next_iteration">${threadGroupConfig.sameUserOnEachIteration !== false}</boolProp>`
    );
    
    // Update specify thread lifetime (scheduler)
    modifiedContent = modifiedContent.replace(
      /<boolProp name="ThreadGroup\.scheduler">(true|false)<\/boolProp>/g,
      `<boolProp name="ThreadGroup.scheduler">${threadGroupConfig.specifyThreadLifetime || false}</boolProp>`
    );
    
    // Update duration only if scheduler is enabled
    if (threadGroupConfig.specifyThreadLifetime) {
      const durationPattern = /<longProp name="ThreadGroup\.duration">\d+<\/longProp>/g;
      if (modifiedContent.match(durationPattern)) {
        modifiedContent = modifiedContent.replace(
          durationPattern,
          `<longProp name="ThreadGroup.duration">${threadGroupConfig.duration || 60}</longProp>`
        );
      }
    }
    
    // Update action after sampler error
    modifiedContent = modifiedContent.replace(
      /<stringProp name="ThreadGroup\.on_sample_error">[^<]+<\/stringProp>/g,
      `<stringProp name="ThreadGroup.on_sample_error">${(threadGroupConfig.actionAfterSamplerError || 'Continue').toLowerCase()}</stringProp>`
    );
    
    // Update delay thread creation if it exists
    const delayStartPattern = /<boolProp name="ThreadGroup\.delayedStart">(true|false)<\/boolProp>/g;
    if (modifiedContent.match(delayStartPattern)) {
      modifiedContent = modifiedContent.replace(
        delayStartPattern,
        `<boolProp name="ThreadGroup.delayedStart">${threadGroupConfig.delayThreadCreation || false}</boolProp>`
      );
    }
    
    // Update startup delay if it exists
    const startupDelayPattern = /<stringProp name="ThreadGroup\.delay">\d+<\/stringProp>/g;
    if (modifiedContent.match(startupDelayPattern)) {
      modifiedContent = modifiedContent.replace(
        startupDelayPattern,
        `<stringProp name="ThreadGroup.delay">${threadGroupConfig.startupDelay || 0}</stringProp>`
      );
    }
    
    console.log('Thread group configuration applied to JMX');
    return modifiedContent;
  }

}