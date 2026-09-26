/// <reference lib="webworker" />

import { MAX_PARSER_BYTES, parseProfileText, ProfileParserError } from './profile-analysis.parser';
import type { ProfileParseRequest, ProfileParseResponse } from './profile-analysis.parser-protocol';

export async function parseProfileFile(file: File) {
    if (file.size > MAX_PARSER_BYTES) {
        throw new ProfileParserError('DAG_TOO_LARGE', 'The prepared Profile is larger than 10 MiB.');
    }
    let text: string;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    } catch {
        throw new ProfileParserError('DAG_PARSE_FAILED', 'The Profile is not valid UTF-8.');
    }
    return parseProfileText(text);
}

const workerScope = globalThis as typeof globalThis & {
    postMessage?: (message: ProfileParseResponse) => void;
    onmessage?: ((event: MessageEvent<ProfileParseRequest>) => void) | null;
};

if (typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope) {
    workerScope.onmessage = event => {
        if (event.data?.type !== 'PARSE_PROFILE') return;
        const { requestId, file } = event.data;
        void parseProfileFile(file)
            .then(dag => workerScope.postMessage?.({ type: 'PARSE_SUCCESS', requestId, dag }))
            .catch(reason => {
                workerScope.postMessage?.({
                    type: 'PARSE_FAILURE',
                    requestId,
                    code: reason instanceof ProfileParserError ? reason.code : 'DAG_PARSE_FAILED',
                });
            });
    };
}

