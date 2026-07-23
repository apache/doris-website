export interface AgentMessage {
    id: string;
    type: 'agent_message';
    text: string;
}

export interface ApiErrorBody {
    code: string;
    message: string;
}

export type ResponseLanguage = 'en' | 'zh-CN';

export type AnalysisState =
    | 'restoring'
    | 'recovering'
    | 'idle'
    | 'ready'
    | 'submitting'
    | 'queued'
    | 'analyzing'
    | 'completed'
    | 'failed';

export type AnalysisJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface CreateAnalysisJobResponse {
    jobId: string;
    status: AnalysisJobStatus;
    retryAfterMs: number;
}

export interface RecoveredAnalysisJobResponse {
    jobId: string;
    status: AnalysisJobStatus;
}

export type AnalysisJobSnapshot =
    | { jobId: string; status: 'QUEUED'; jobsAhead: number }
    | { jobId: string; status: 'RUNNING' }
    | { jobId: string; status: 'COMPLETED'; result: AgentMessage }
    | { jobId: string; status: 'FAILED'; error: ApiErrorBody };
