export interface AgentMessage {
    id: string;
    type: 'agent_message';
    text: string;
}

export interface ApiErrorBody {
    code: string;
    message: string;
}

export type AnalysisState = 'idle' | 'ready' | 'analyzing' | 'completed' | 'failed';
