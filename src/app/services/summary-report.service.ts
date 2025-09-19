import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SummaryReportData {
  label: string;
  samples: number;
  errors: number;
  failures: number;
  errorPercent: number;
  average: number;
  min: number;
  max: number;
  median: number;
  pct90: number;
  pct95: number;
  pct99: number;
  throughput: number;
  kbPerSec: number;
  avgBytes: number;
  // Additional properties for compatibility
  transactionsPerSec: string;
  receivedKBps: string;
  sentKBps: string;
  isTotal?: boolean;
}

export interface SummaryReportResponse {
  success: boolean;
  data: SummaryReportData[];
  testStatus: 'RUNNING' | 'COMPLETED' | 'STOPPED' | 'IDLE';
  testProgress?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SummaryReportService {
  private baseUrl = environment.apiUrl; // Backend API URL

  constructor(private http: HttpClient) { }

  /**
   * Get summary report data for a specific use case
   * @param useCaseId The ID of the use case
   * @returns Observable with summary report data
   */
  getSummaryReport(useCaseId: string): Observable<SummaryReportResponse> {
    console.log('Fetching summary report for use case:', useCaseId);
    return this.http.get<SummaryReportResponse>(`${this.baseUrl}/summary-report/${useCaseId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching summary report:', error);
          return of({
            success: false,
            data: [],
            testStatus: 'IDLE' as const,
            message: 'API Error: ' + error.message
          });
        })
      );
  }

  /**
   * Get live summary report data with polling
   * @param useCaseId The ID of the use case
   * @param intervalMs Polling interval in milliseconds (default: 1000ms)
   * @returns Observable with live summary report data
   */
  getLiveSummaryReport(useCaseId: string, intervalMs: number = 1000): Observable<SummaryReportResponse> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getSummaryReport(useCaseId)),
      catchError(error => {
        console.error('Error in live summary report polling:', error);
        return of({
          success: false,
          data: [],
          testStatus: 'IDLE' as const
        });
      })
    );
  }

  /**
   * Get test status for a specific use case
   * @param useCaseId The ID of the use case
   * @returns Observable with test status
   */
  getTestStatus(useCaseId: string): Observable<{status: string, progress: number}> {
    return this.http.get<{status: string, progress: number}>(`${this.baseUrl}/test-status/${useCaseId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching test status:', error);
          return of({status: 'IDLE', progress: 0});
        })
      );
  }

  /**
   * Test if the backend API is reachable
   * @returns Observable with test result
   */
  testBackendConnection(): Observable<any> {
    console.log('Testing backend connection...');
    return this.http.get(`${this.baseUrl}/debug/jtl-files`)
      .pipe(
        catchError(error => {
          console.error('Backend connection test failed:', error);
          return of({ 
            error: error.message,
            status: error.status || 0,
            connected: false
          });
        })
      );
  }

  /**
   * Test basic API connectivity
   * @returns Observable with connectivity status
   */
  testApiConnectivity(): Observable<{connected: boolean, message: string}> {
    return this.http.get(`${this.baseUrl}/debug/jtl-files`)
      .pipe(
        map(() => ({ connected: true, message: 'Backend is reachable' })),
        catchError(error => {
          const message = error.status === 0 
            ? 'Backend server is not running or not accessible'
            : `Backend error: ${error.status} - ${error.message}`;
          return of({ connected: false, message });
        })
      );
  }

  /**
   * Parse CSV content from JTL file (for debugging purposes)
   * @param csvContent The CSV content from JTL file
   * @returns Parsed summary report data
   */
  parseSummaryReportCsv(csvContent: string): SummaryReportData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return []; // Need header and at least one data row

    const headers = lines[0].split(',');
    const data: SummaryReportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= headers.length) {
        const row: SummaryReportData = {
          label: values[0] || 'Unknown',
          samples: parseInt(values[1]) || 0,
          average: parseFloat(values[2]) || 0,
          median: parseFloat(values[3]) || 0,
          min: parseFloat(values[4]) || 0,
          max: parseFloat(values[5]) || 0,
          errorPercent: parseFloat(values[6]) || 0,
          throughput: parseFloat(values[7]) || 0,
          kbPerSec: parseFloat(values[8]) || 0,
          avgBytes: parseFloat(values[9]) || 0,
          // Additional properties for compatibility
          errors: Math.floor((parseFloat(values[6]) || 0) * (parseInt(values[1]) || 0) / 100),
          failures: Math.floor((parseFloat(values[6]) || 0) * (parseInt(values[1]) || 0) / 100),
          pct90: parseFloat(values[10]) || 0,
          pct95: parseFloat(values[11]) || 0,
          pct99: parseFloat(values[12]) || 0,
          transactionsPerSec: (parseFloat(values[7]) || 0).toFixed(2),
          receivedKBps: (parseFloat(values[8]) || 0).toFixed(2),
          sentKBps: (parseFloat(values[9]) || 0).toFixed(2),
          isTotal: values[0]?.toLowerCase().includes('total') || false
        };
        data.push(row);
      }
    }
    return data;
  }
}
