import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UseCase, TestSession, UseCaseCreationRequest, TestSessionStatus } from '../models/usecase.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UseCaseService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Use Case endpoints
  getAllUseCases(): Observable<UseCase[]> {
    return this.http.get<UseCase[]>(`${this.apiUrl}/usecases`);
  }

  getUseCaseById(id: string): Observable<UseCase> {
    return this.http.get<UseCase>(`${this.apiUrl}/usecases/${id}`);
  }

  createUseCase(name: string, description: string, jmxFile: File, csvFile: File | null, requiresCsv: boolean = false): Observable<UseCase> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('jmxFile', jmxFile);
    if (csvFile) {
      formData.append('csvFile', csvFile);
    }
    formData.append('requiresCsv', requiresCsv.toString());

    return this.http.post<UseCase>(`${this.apiUrl}/usecases`, formData);
  }

  runUseCase(id: string, users: number = 50): Observable<any> {
    const params = new HttpParams().set('users', users.toString());
    return this.http.post(`${this.apiUrl}/usecases/${id}/run`, null, { params });
  }

  stopUseCase(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/usecases/${id}/stop`, null);
  }

  getUseCaseStatus(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/usecases/${id}/status`);
  }

  // Test Session endpoints
  getAllTestSessions(): Observable<TestSession[]> {
    return this.http.get<TestSession[]>(`${this.apiUrl}/test-sessions`);
  }

  getTestSessionById(id: string): Observable<TestSession> {
    return this.http.get<TestSession>(`${this.apiUrl}/test-sessions/${id}`);
  }

  getRunningTestSessions(): Observable<TestSession[]> {
    return this.http.get<TestSession[]>(`${this.apiUrl}/test-sessions/running`);
  }

  createTestSession(name: string, description: string, useCaseIds: string[], userCounts: { [key: string]: number }): Observable<TestSession> {
    const params = new HttpParams()
      .set('name', name)
      .set('description', description)
      .set('useCaseIds', useCaseIds.join(','));

    return this.http.post<TestSession>(`${this.apiUrl}/test-sessions`, userCounts, { params });
  }

  startTestSession(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-sessions/${id}/start`, null);
  }

  stopTestSession(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-sessions/${id}/stop`, null);
  }

  getTestSessionStatus(id: string): Observable<TestSessionStatus> {
    return this.http.get<TestSessionStatus>(`${this.apiUrl}/test-sessions/${id}/status`);
  }

  // Concurrent test creation
  createAndStartConcurrentTest(sessionName: string, sessionDescription: string, requests: UseCaseCreationRequest[]): Observable<any> {
    const params = new HttpParams()
      .set('sessionName', sessionName)
      .set('sessionDescription', sessionDescription);

    return this.http.post(`${this.apiUrl}/usecases/concurrent-test`, requests, { params });
  }

  // Update use case
  updateUseCase(id: string, name: string, description: string, threadGroupConfig?: any, serverConfig?: any): Observable<UseCase> {
    const updateData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      threadGroupConfig: threadGroupConfig,
      serverConfig: serverConfig
    };
    return this.http.put<UseCase>(`${this.apiUrl}/usecases/${id}`, updateData);
  }

  // Delete use case
  deleteUseCase(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usecases/${id}`);
  }

  // Download JMX file
  downloadJmx(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/usecases/${id}/download/jmx`, {
      responseType: 'blob'
    });
  }

  // Download CSV file
  downloadCsv(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/usecases/${id}/download/csv`, {
      responseType: 'blob'
    });
  }

  // Settings endpoints
  getSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/settings`, settings);
  }
}
