import type { ProfileGraphIR } from './profile-analysis.types';
import type { ProfileParserErrorCode } from './profile-analysis.parser';

export interface ProfileParseRequest {
    type: 'PARSE_PROFILE';
    requestId: string;
    file: File;
}

export interface ProfileParseSuccess {
    type: 'PARSE_SUCCESS';
    requestId: string;
    dag: ProfileGraphIR;
}

export interface ProfileParseFailure {
    type: 'PARSE_FAILURE';
    requestId: string;
    code: ProfileParserErrorCode;
}

export type ProfileParseResponse = ProfileParseSuccess | ProfileParseFailure;

