export interface UseCase {
  id: string;
  name: string;
  description: string;
  jmxPath: string;
  csvPath: string;
  lastReportUrl?: string;
  lastRunAt?: string;
  testStartedAt?: string;
  testCompletedAt?: string;
  testDurationSeconds?: number;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'STOPPED';
  testSessionId?: string;
  userCount?: number;
  priority?: number;
  requiresCsv?: boolean;
}

export interface TestSession {
  id: string;
  name: string;
  description: string;
  useCaseIds: string[];
  userCounts: { [key: string]: number };
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'PARTIAL_SUCCESS';
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  totalUsers: number;
  useCaseCount: number;
  successCount: number;
  failureCount: number;
  useCaseStatuses: { [key: string]: string };
  useCaseReportUrls: { [key: string]: string };
}

export interface UseCaseCreationRequest {
  name: string;
  description?: string;
  configId: string;
  users: number;
  priority?: number;
}

export interface TestSessionStatus {
  status: string;
  useCaseCount: number;
  successCount: number;
  failureCount: number;
  totalUsers: number;
  useCaseStatuses: { [key: string]: string };
  useCaseReportUrls: { [key: string]: string };
  startedAt?: string;
  completedAt?: string;
}
