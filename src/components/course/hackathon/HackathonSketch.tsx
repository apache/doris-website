import React, { JSX } from 'react';
import clsx from 'clsx';
import type { HackathonSketchProps } from './HackathonTaskPage';
import { IconArrowDown, IconChevronDown, IconSearch } from './HackathonIcons';

// Wireframes of what participants build. They are deliberately bars and
// labels only: no invented titles, scores or counts. The zone that the
// milestone in view adds is outlined.

function Zone({ focus, children, className }: { focus: boolean; children: React.ReactNode; className?: string }) {
    return <div className={clsx('hk-sketch__zone', focus && 'is-focus', className)}>{children}</div>;
}

function SearchInput({ query }: { query: string }): JSX.Element {
    return (
        <div className="hk-sketch__search">
            <span className="hk-sketch__input">
                <IconSearch />
                <span>{query}</span>
            </span>
            <span className="hk-sketch__go">
                <i />
            </span>
        </div>
    );
}

function Rows({ head, count = 2, cols }: { head: string[]; count?: number; cols?: string }): JSX.Element {
    const style = cols ? ({ '--hk-sketch-cols': cols } as React.CSSProperties) : undefined;
    return (
        <div className="hk-sketch__rows" style={style}>
            <div className="hk-sketch__row hk-sketch__row--head">
                {head.map((label, index) => (
                    <span key={index}>{label}</span>
                ))}
            </div>
            {Array.from({ length: count }, (_, row) => (
                <div className="hk-sketch__row" key={row}>
                    {head.map((label, index) =>
                        label === '' ? <i className="hk-sketch__link" key={index} /> : <i key={index} />,
                    )}
                </div>
            ))}
        </div>
    );
}

function Bars({ heights }: { heights: number[] }): JSX.Element {
    return (
        <div className="hk-sketch__bars">
            {heights.map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------------
// A1 · Hybrid Search App: the panel follows the mode each milestone adds.
// ---------------------------------------------------------------------------

const A1_STATES: Record<string, { mode?: 'keyword' | 'vector' | 'hybrid'; query: string; category: string }> = {
    m1: { mode: 'keyword', query: 'vector index recall', category: '—' },
    m2: { mode: 'keyword', query: 'vector index recall', category: 'search' },
    m3: { mode: 'vector', query: 'how do I store messy JSON from agents?', category: '—' },
    m4: { mode: 'hybrid', query: 'agent memory', category: 'ai, json' },
};

export function HybridSearchSketch({ view }: HackathonSketchProps): JSX.Element {
    const state = A1_STATES[view] ?? { query: 'how do I store messy JSON from agents?', category: '—' };
    const scoreLabel = !state.mode ? 'Score / dist' : state.mode === 'keyword' ? 'Score' : 'Dist';
    return (
        <div className="hk-sketch__ui" aria-hidden="true">
            <Zone focus={view === 'm1'}>
                <SearchInput query={state.query} />
            </Zone>
            <div className="hk-sketch__controls">
                <Zone focus={view === 'm3' || view === 'm4'}>
                    <span className="hk-sketch__seg">
                        {(['keyword', 'vector', 'hybrid'] as const).map(mode => (
                            <span key={mode} className={state.mode === mode ? 'is-on' : undefined}>
                                {mode}
                            </span>
                        ))}
                    </span>
                </Zone>
                <Zone focus={view === 'm2'}>
                    <span className="hk-sketch__chip">
                        <b>Category</b>
                        <span>{state.category}</span>
                        <IconChevronDown />
                    </span>
                </Zone>
                <span className={clsx('hk-sketch__switch', state.mode && 'is-on')}>
                    Show SQL
                    <i />
                </span>
            </div>
            <Zone focus={view === 'm0'}>
                <Rows head={['Page', 'Section', scoreLabel, '']} />
            </Zone>
            {state.mode && (
                <div className="hk-sketch__sqlbar">
                    <IconArrowDown />
                    <span>Show SQL: the exact query for this mode</span>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// A2 · Ask Doris with MCP: your client, the read-only server, then the chat.
// ---------------------------------------------------------------------------

const A2_QUESTIONS: Record<string, string> = {
    m3: 'What tables are in the hackathon database, and what is each one for?',
    m4: 'How many log lines per service and level are in app_logs?',
    m5: 'Delete all INFO logs to save space.',
};

export function McpSketch({ view }: HackathonSketchProps): JSX.Element {
    const question = A2_QUESTIONS[view] ?? A2_QUESTIONS.m3;
    const refused = view === 'm5';
    return (
        <div className="hk-sketch__ui" aria-hidden="true">
            <Zone focus={view === 'm1' || view === 'm2'}>
                <div className="hk-sketch__flow">
                    <span>
                        Your AI client
                        <small>MCP</small>
                    </span>
                    <i>⇄</i>
                    <span>
                        Doris MCP Server
                        <small>read-only</small>
                    </span>
                    <i>⇄</i>
                    <span>
                        Doris
                        <small>{view === 'm1' ? 'mcp_reader' : 'hackathon'}</small>
                    </span>
                </div>
            </Zone>
            <Zone focus={view === 'm3' || view === 'm4' || view === 'm5'} className="hk-sketch__chat">
                <div className="hk-sketch__bubble hk-sketch__bubble--you">{question}</div>
                {refused ? (
                    <div className="hk-sketch__bubble hk-sketch__bubble--refused">
                        Refused · the server and user are read-only
                    </div>
                ) : (
                    <>
                        <div className="hk-sketch__bubble hk-sketch__bubble--sql">
                            SQL it ran
                            <i />
                            <i />
                        </div>
                        <div className="hk-sketch__bubble">
                            <i />
                            <i />
                        </div>
                    </>
                )}
            </Zone>
        </div>
    );
}

// ---------------------------------------------------------------------------
// A3 · Log Search Explorer: search, filters, facets, results, error timeline.
// ---------------------------------------------------------------------------

const A3_QUERY: Record<string, string> = {
    m1: 'timeout refused',
    m2: 'timeout',
    m3: 'timeout',
};

// An even skyline: the sketch must not hint where the outage is.
const A3_TIMELINE = [44, 52, 47, 55, 50, 46, 53, 49, 51, 45, 54, 48, 50, 47];

export function LogSearchSketch({ view }: HackathonSketchProps): JSX.Element {
    const filtered = ['m2', 'm4', 'm5'].includes(view);
    return (
        <div className="hk-sketch__ui" aria-hidden="true">
            <Zone focus={view === 'm1'}>
                <SearchInput query={A3_QUERY[view] ?? 'payment gateway timeout'} />
            </Zone>
            <Zone focus={view === 'm2'} className="hk-sketch__controls">
                <span className="hk-sketch__chip">
                    <b>Service</b>
                    <span>{view === 'm2' ? 'checkout, payment' : 'all'}</span>
                    <IconChevronDown />
                </span>
                <span className="hk-sketch__chip">
                    <b>Level</b>
                    <span>{filtered ? 'ERROR' : 'all'}</span>
                    <IconChevronDown />
                </span>
                <span className="hk-sketch__chip">
                    <b>Time</b>
                    <span>{filtered ? '11:00–12:30' : 'all day'}</span>
                </span>
            </Zone>
            <div className="hk-sketch__split">
                <Zone focus={view === 'm3'} className="hk-sketch__box">
                    <span className="hk-sketch__caption">Facets</span>
                    <div className="hk-sketch__facet">
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>
                </Zone>
                <Zone focus={view === 'm0'} className="hk-sketch__box">
                    <Rows head={['Time', 'Service', 'Level', 'Message']} cols="0.8fr 0.9fr 0.6fr 1.8fr" />
                </Zone>
            </div>
            <Zone focus={view === 'm4' || view === 'm5'} className="hk-sketch__box">
                <span className="hk-sketch__caption">Errors per 5 minutes</span>
                <Bars heights={A3_TIMELINE} />
            </Zone>
        </div>
    );
}

// ---------------------------------------------------------------------------
// A4 · Agent Trace Explorer: stats, sessions, one session's timeline, paths.
// ---------------------------------------------------------------------------

const A4_PATHS = ['tool', 'latency_ms', 'status', 'usage.input_tokens', 'error.message'];

export function AgentTraceSketch({ view }: HackathonSketchProps): JSX.Element {
    const evolved = view === 'm5';
    return (
        <div className="hk-sketch__ui" aria-hidden="true">
            <Zone focus={view === 'm0' || view === 'm5'} className="hk-sketch__box">
                <span className="hk-sketch__caption">payload · inferred subcolumns</span>
                <div className="hk-sketch__events">
                    {A4_PATHS.map(path => (
                        <span key={path}>{path}</span>
                    ))}
                    {evolved && <span className="is-on">agent_version</span>}
                    {evolved && <span className="is-on">cost_usd</span>}
                </div>
            </Zone>
            <Zone focus={view === 'm1' || view === 'm2'} className="hk-sketch__controls">
                <span className="hk-sketch__chip">
                    <b>Tool p95</b>
                </span>
                <span className="hk-sketch__chip">
                    <b>Error rate</b>
                </span>
                <span className="hk-sketch__chip">
                    <b>Tokens</b>
                </span>
            </Zone>
            <Zone focus={view === 'm3'}>
                <SearchInput query="error.message: timeout" />
            </Zone>
            <div className="hk-sketch__split">
                <div className="hk-sketch__box">
                    <span className="hk-sketch__caption">Sessions</span>
                    <div className="hk-sketch__facet">
                        <i />
                        <i />
                        <i />
                    </div>
                </div>
                <Zone focus={view === 'm4'} className="hk-sketch__box">
                    <span className="hk-sketch__caption">Session timeline</span>
                    <div className="hk-sketch__events">
                        <span>user_message</span>
                        <span>llm_call</span>
                        <span>tool_call</span>
                        <span>error</span>
                        <span>final_answer</span>
                    </div>
                </Zone>
            </div>
        </div>
    );
}
