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
    // Not decided yet. Leave null to render a dashed "TBA" placeholder; set the
    // real value and every task page picks it up.
    starterKitUrl: null as string | null,
    submitUrl: null as string | null,
    submitLabel: null as string | null,
    deadline: null as string | null,
} as const;

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
