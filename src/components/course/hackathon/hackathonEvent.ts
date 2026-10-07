import { buildSlackEntryUrl } from '@site/src/components/slack-redirect/slack-attribution.logic';

// Temporary pages for the Apache Doris session at the Community over Code 2026
// hackathon (Glasgow). The /course entry and the four Track A task pages read
// everything event-specific from here, so the whole hackathon block can be
// switched off or removed after the event without touching the course itself.

/** Shows the "Doris 101 | Hackathon" switch in the /course path card. */
export const HACKATHON_COURSE_TRACK_ENABLED = true;

export const HACKATHON_EVENT = {
    name: 'Apache Doris Hackathon',
    conference: 'Community over Code 2026',
    city: 'Glasgow',
    dateLong: 'Tuesday 13 October',
    dateShort: 'Tue 13 Oct',
    time: '11:20–15:00',
    room: 'Wee Dram Room',
    eventUrl: 'https://events.apache.org/events/2026/community-over-code/doris.html',
    basePath: '/course/hackathon/glasgow-2026',
    // Set to null to render a dashed "TBA" placeholder instead.
    starterKitUrl:
        'https://github.com/morningman/demo-env/releases/download/for-hackathon/doris-hackathon-glasgow-2026.zip' as
            string | null,
    /** Folder the ZIP unpacks to. */
    starterKitFolder: 'doris-hackathon-glasgow-2026',
    /** Participants open a pull request that adds <their GitHub ID>/ under this folder. */
    submitUrl: 'https://github.com/morningman/demo-env/tree/main/doris-hackathon-glasgow-2026' as string | null,
    submitLabel: 'morningman/demo-env' as string | null,
    deadline: '31 October' as string | null,
    /** Apache Doris Slack channel for questions, submissions and badges. */
    slackChannel: '#dev',
} as const;

/** Tracked entry to the Apache Doris Slack (see developer_docs/slack-utm-convention.md). */
export const HACKATHON_SLACK_URL = buildSlackEntryUrl({
    medium: 'event',
    campaign: 'coc2026_hackathon',
    content: 'hackathon_task_page',
});

/**
 * The Doris every task runs: one FE and one BE in a single container, with a
 * MySQL client inside (see /community/developer-guide/all-in-one-image).
 */
export const HACKATHON_DORIS_IMAGE = 'apache/doris:all-in-one-4.1.3';
/** Compressed download of the image, per architecture. */
export const HACKATHON_DORIS_DOWNLOAD = '1.9 GB';

export const DORIS_PULL = `docker pull ${HACKATHON_DORIS_IMAGE}`;
export const DORIS_RUN = `docker run -d --name doris -p 9030:9030 -p 8030:8030 -p 8040:8040 ${HACKATHON_DORIS_IMAGE}`;
export const DORIS_SQL = 'docker exec -it doris mysql -uroot -h127.0.0.1 -P9030';

/** Runs a SQL file from the starter kit with the MySQL client inside the container. */
export function dorisLoad(file: string): string {
    return `docker exec -i doris mysql -uroot -h127.0.0.1 -P9030 < ${file}`;
}

export type HackathonTaskCode = 'A1' | 'A2' | 'A3' | 'A4';

export interface HackathonTaskMeta {
    code: HackathonTaskCode;
    slug: string;
    title: string;
    duration: string;
    /** Poster pitch, used on the task tiles. */
    pitch: string;
}

export const HACKATHON_TASKS: HackathonTaskMeta[] = [
    {
        code: 'A1',
        slug: 'a1-hybrid-search',
        title: 'Hybrid Search App',
        duration: '60–120 min',
        pitch: 'Keywords, meaning and filters in one SQL query. Build a search box over the Apache Doris docs.',
    },
    {
        code: 'A2',
        slug: 'a2-mcp',
        title: 'Ask Doris with MCP',
        duration: '45–90 min',
        pitch: 'Plug Doris into your AI assistant with the Doris MCP Server, and make it answer real questions with real SQL.',
    },
    {
        code: 'A3',
        slug: 'a3-log-search',
        title: 'Log Search Explorer',
        duration: '60–120 min',
        pitch: 'A mini Kibana where everything is SQL: BM25 search, filters and live counts over 200,000 log lines.',
    },
    {
        code: 'A4',
        slug: 'a4-agent-traces',
        title: 'Agent Trace Explorer',
        duration: '60–120 min',
        pitch: 'Store messy AI-agent JSON in a VARIANT column and query it like real columns. No schema migrations.',
    },
];

export function getHackathonTask(code: HackathonTaskCode): HackathonTaskMeta {
    const task = HACKATHON_TASKS.find(item => item.code === code);
    if (!task) {
        throw new Error(`Unknown hackathon task ${code}`);
    }
    return task;
}

/** Site-relative route of a task page, e.g. /course/hackathon/glasgow-2026/a1-hybrid-search */
export function hackathonTaskPath(task: HackathonTaskMeta): string {
    return `${HACKATHON_EVENT.basePath}/${task.slug}`;
}

/** Track B: one page for all six "docs to demo" tasks. */
export const HACKATHON_TRACK_B = {
    code: 'B',
    slug: 'track-b',
    title: 'Docs to Demo',
    duration: '30–60 min',
    pitch: 'Pick a feature page of the docs, run it on your local Doris, and add a step-by-step demo to it with a pull request.',
} as const;

export function hackathonTrackBPath(): string {
    return `${HACKATHON_EVENT.basePath}/${HACKATHON_TRACK_B.slug}`;
}

/** Every hackathon page, in the order the task switcher and the "All tasks" tiles show them. */
export interface HackathonPageLink {
    code: string;
    title: string;
    duration: string;
    path: string;
}

export const HACKATHON_PAGE_LINKS: HackathonPageLink[] = [
    ...HACKATHON_TASKS.map(task => ({
        code: task.code,
        title: task.title,
        duration: task.duration,
        path: hackathonTaskPath(task),
    })),
    {
        code: HACKATHON_TRACK_B.code,
        title: `Track B · ${HACKATHON_TRACK_B.title}`,
        duration: HACKATHON_TRACK_B.duration,
        path: hackathonTrackBPath(),
    },
];
