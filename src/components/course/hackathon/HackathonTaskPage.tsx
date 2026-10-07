import React, { JSX, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import { CodeSnippet, CopyButton, HackathonCodeBlock, isCodeSnippet } from './HackathonCodeBlock';
import {
    DORIS_PULL,
    DORIS_RUN,
    DORIS_SQL,
    HACKATHON_DORIS_DOWNLOAD,
    HACKATHON_EVENT,
    HACKATHON_SLACK_URL,
    HACKATHON_TASKS,
    HackathonTaskMeta,
    hackathonTaskPath,
} from './hackathonEvent';
import { IconArrowDown, IconArrowLeft, IconArrowRight, IconChevronUp, IconExternal, IconPanel } from './HackathonIcons';
import './HackathonTaskPage.scss';

/** Prose or a code sample; code samples also feed the sticky panel. */
export type HackathonBlock = CodeSnippet | ReactNode;

export interface HackathonChecklistItem {
    title: ReactNode;
    body?: ReactNode;
    /** One shell command shown under the item with its own Copy button. */
    command?: string;
}

export interface HackathonRow {
    problem: ReactNode;
    fix: ReactNode;
}

export interface HackathonMilestone {
    code: string;
    title: string;
    /** Label in the route map; defaults to `title`. */
    short?: string;
    time?: string;
    blocks?: HackathonBlock[];
    /** Lines of this milestone's panel code to highlight, e.g. "4-6". */
    highlight?: string;
    /** Panel view to show for a milestone without code of its own. */
    panelView?: string;
    /** Prose ↔ code mapping; hovering an entry pins its line in the panel. */
    legend?: { line: number; code: string; note: string }[];
    /** Prose after the legend. */
    after?: ReactNode;
    checkpoint?: ReactNode;
}

export interface HackathonReference {
    label: string;
    to: string;
    note?: string;
}

export interface HackathonSketchProps {
    /** Panel view in focus: "start", "table", "m0"…"m5" or "prompt". */
    view: string;
}

export interface HackathonTaskContent {
    task: HackathonTaskMeta;
    titleLead: string;
    titleTail: string;
    hook: string;
    chips: string[];
    build: { lead: string; body: ReactNode };
    why: ReactNode[];
    /** Lines of the table definition that explain "why" (shown while reading it). */
    whyHighlight?: string;
    before: HackathonChecklistItem[];
    data?: HackathonBlock[];
    ai: {
        intro: ReactNode;
        steps: ReactNode[];
        prompt: CodeSnippet;
        traps: HackathonRow[];
    };
    milestones: HackathonMilestone[];
    done: ReactNode[];
    stretch: ReactNode[];
    troubleshooting: HackathonRow[];
    references: HackathonReference[];
    Sketch: (props: HackathonSketchProps) => JSX.Element;
}

interface PanelView {
    id: string;
    tab: string;
    anchor: string;
    snippets: CodeSnippet[];
}

interface StepDef {
    id: string;
    view: string;
    highlight?: string;
    sketch?: boolean;
}

const START_SNIPPET: CodeSnippet = {
    label: 'Start Doris',
    file: 'terminal',
    language: 'bash',
    code: [
        `${DORIS_PULL}   # ${HACKATHON_DORIS_DOWNLOAD}, once`,
        DORIS_RUN,
        'docker ps        # wait for (healthy), about 30 s',
        DORIS_SQL,
    ].join('\n'),
};

const CONNECTION = [
    { label: 'Host', value: '127.0.0.1' },
    { label: 'Port', value: '9030' },
    { label: 'User', value: 'root', note: 'no password' },
    { label: 'Database', value: 'hackathon' },
];

const milestoneId = (milestone: HackathonMilestone) => milestone.code.toLowerCase();

const snippetsOf = (blocks?: HackathonBlock[]) => (blocks ?? []).filter(isCodeSnippet);

/** Dashed chip for a value that is not decided yet. */
export function HackathonTba({ name, onDark = false }: { name: string; onDark?: boolean }): JSX.Element {
    return <span className={clsx('hk-task__tba', onDark && 'hk-task__tba--code')}>{name} · TBA</span>;
}

export function HackathonStarterKit({ onDark = false }: { onDark?: boolean }): JSX.Element {
    return HACKATHON_EVENT.starterKitUrl ? (
        <a className="hk-task__kitlink" href={HACKATHON_EVENT.starterKitUrl}>
            <code>{HACKATHON_EVENT.starterKitFolder}.zip</code>
        </a>
    ) : (
        <HackathonTba name="STARTER_KIT" onDark={onDark} />
    );
}

function SubmitTarget(): JSX.Element {
    return HACKATHON_EVENT.submitUrl ? (
        <a href={HACKATHON_EVENT.submitUrl}>{HACKATHON_EVENT.submitLabel ?? HACKATHON_EVENT.submitUrl}</a>
    ) : (
        <HackathonTba name="SUBMIT" />
    );
}

/** Labelled list used for modes / features inside "What you'll build". */
export function HackathonTermList({ items }: { items: { term: string; text: ReactNode }[] }): JSX.Element {
    return (
        <ul className="hk-task__modes">
            {items.map(item => (
                <li key={item.term}>
                    <b>{item.term}</b>
                    <span>{item.text}</span>
                </li>
            ))}
        </ul>
    );
}

function Blocks({ blocks }: { blocks?: HackathonBlock[] }): JSX.Element | null {
    if (!blocks?.length) {
        return null;
    }
    return (
        <>
            {blocks.map((block, index) =>
                isCodeSnippet(block) ? (
                    block.panelOnly ? null : (
                        <div className="hk-task__inline" key={index}>
                            <HackathonCodeBlock snippet={block} />
                        </div>
                    )
                ) : (
                    <React.Fragment key={index}>{block}</React.Fragment>
                ),
            )}
        </>
    );
}

function RowsTable({ head, rows }: { head: [string, string]; rows: HackathonRow[] }): JSX.Element {
    return (
        <table className="hk-task__table">
            <thead>
                <tr>
                    <th>{head[0]}</th>
                    <th>{head[1]}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row, index) => (
                    <tr key={index}>
                        <td data-label={head[0]}>{row.problem}</td>
                        <td data-label={head[1]}>{row.fix}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function useTaskModel(content: HackathonTaskContent) {
    return useMemo(() => {
        const dataSnippets = snippetsOf(content.data);
        const views: PanelView[] = [{ id: 'start', tab: 'Start', anchor: 'before', snippets: [START_SNIPPET] }];
        if (dataSnippets.length) {
            views.push({ id: 'table', tab: 'Table', anchor: 'data', snippets: dataSnippets });
        }
        content.milestones.forEach(milestone => {
            const snippets = snippetsOf(milestone.blocks);
            if (snippets.length) {
                views.push({
                    id: milestoneId(milestone),
                    tab: milestone.code,
                    anchor: milestoneId(milestone),
                    snippets,
                });
            }
        });
        views.push({ id: 'prompt', tab: 'Prompt', anchor: 'ai', snippets: [content.ai.prompt] });

        const withCode = content.milestones.filter(milestone => snippetsOf(milestone.blocks).length > 0);
        const last = withCode[withCode.length - 1];
        const lastView = last ? milestoneId(last) : 'start';

        const steps: StepDef[] = [
            { id: 'top', view: 'start' },
            { id: 'build', view: 'start', sketch: true },
            dataSnippets.length
                ? { id: 'why', view: 'table', highlight: content.whyHighlight }
                : { id: 'why', view: 'start' },
            { id: 'before', view: 'start' },
            ...(dataSnippets.length ? [{ id: 'data', view: 'table' }] : []),
            { id: 'ai', view: 'prompt' },
            ...content.milestones.map(milestone => {
                const ownCode = snippetsOf(milestone.blocks).length > 0;
                return {
                    id: milestoneId(milestone),
                    view: ownCode ? milestoneId(milestone) : (milestone.panelView ?? lastView),
                    highlight: ownCode ? milestone.highlight : undefined,
                };
            }),
            { id: 'done', view: lastView, highlight: last?.highlight, sketch: true },
            { id: 'submit', view: lastView, highlight: last?.highlight },
            { id: 'stretch', view: lastView },
            { id: 'help', view: 'start' },
        ];
        return { views, steps, lastView, hasData: dataSnippets.length > 0 };
    }, [content]);
}

/**
 * The last step whose top has passed a reading line just under the sticky bar
 * drives the panel. The line sits 120px below the bar, so a step reached
 * through an anchor (it lands 20px under the bar) is always the active one,
 * however short it is.
 */
function useActiveStep(steps: StepDef[]): string {
    const [active, setActive] = useState(steps[0].id);
    useEffect(() => {
        let frame = 0;
        const pick = () => {
            frame = 0;
            const bar = document.querySelector('.hk-task__bar');
            const line = (bar ? Math.max(bar.getBoundingClientRect().bottom, 0) : 0) + 120;
            let best = steps[0].id;
            for (const step of steps) {
                const element = document.getElementById(step.id);
                if (!element) {
                    continue;
                }
                if (element.getBoundingClientRect().top <= line) {
                    best = step.id;
                } else {
                    break;
                }
            }
            setActive(best);
        };
        const schedule = () => {
            if (!frame) {
                frame = window.requestAnimationFrame(pick);
            }
        };
        pick();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [steps]);
    return active;
}

function TaskTiles({ current }: { current: HackathonTaskMeta }): JSX.Element {
    return (
        <ol className="hk-task__tiles">
            {HACKATHON_TASKS.map(task => {
                const isCurrent = task.code === current.code;
                return (
                    <li key={task.code}>
                        <Link
                            className="hk-task__tile"
                            to={isCurrent ? '#top' : hackathonTaskPath(task)}
                            aria-current={isCurrent ? 'page' : undefined}
                        >
                            <span className="hk-task__tile-body">
                                <span className="hk-task__tile-top">
                                    <span className="hk-task__tile-code">{task.code}</span>
                                    <span className="hk-task__tile-time">{task.duration}</span>
                                </span>
                                <strong className="hk-task__tile-name">{task.title}</strong>
                            </span>
                            <span className="hk-task__tile-go">
                                <span>{isCurrent ? 'You are here' : 'Open the brief'}</span>
                                {isCurrent ? <IconChevronUp /> : <IconArrowRight />}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}

interface PanelProps {
    content: HackathonTaskContent;
    views: PanelView[];
    activeStep: StepDef;
    pinnedLine: number | null;
}

function CodePanel({ content, views, activeStep, pinnedLine }: PanelProps): JSX.Element {
    const [sketchOpen, setSketchOpen] = useState(true);
    const bodyRef = useRef<HTMLDivElement>(null);
    const { Sketch } = content;

    useEffect(() => {
        bodyRef.current?.scrollTo({ top: 0 });
    }, [activeStep.view]);

    return (
        <aside
            className={clsx('hk-task__panel', !sketchOpen && 'is-sketch-min', activeStep.sketch && 'is-sketch-focus')}
            aria-label="Code for the step you are reading"
        >
            <div className="hk-sketch">
                <div className="hk-sketch__head">
                    <span className="hk-sketch__tag">Sketch</span>
                    <span className="hk-sketch__title">What you'll build · wireframe, not a screenshot</span>
                    <button
                        type="button"
                        className="hk-sketch__toggle"
                        aria-expanded={sketchOpen}
                        onClick={() => setSketchOpen(open => !open)}
                    >
                        <IconChevronUp />
                        <span>{sketchOpen ? 'Hide' : 'Show'}</span>
                    </button>
                </div>
                {sketchOpen && <Sketch view={activeStep.view} />}
            </div>
            <nav className="hk-task__panel-tabs" aria-label="Code views">
                {views.map((view, index) => (
                    <React.Fragment key={view.id}>
                        {(view.id.startsWith('m') && !views[index - 1]?.id.startsWith('m')) || view.id === 'prompt' ? (
                            <span className="hk-task__panel-sep" aria-hidden="true" />
                        ) : null}
                        <a
                            className={clsx('hk-task__tab', view.id === activeStep.view && 'is-active')}
                            href={`#${view.anchor}`}
                            aria-current={view.id === activeStep.view ? 'true' : undefined}
                        >
                            {view.tab}
                        </a>
                    </React.Fragment>
                ))}
            </nav>
            <div className="hk-task__panel-body" ref={bodyRef}>
                {views.map(view => {
                    const target = view.snippets.find(snippet => snippet.target) ?? view.snippets[0];
                    return (
                        <div
                            className={clsx('hk-task__view', view.id === activeStep.view && 'is-active')}
                            key={view.id}
                        >
                            {view.snippets.map((snippet, index) => (
                                <HackathonCodeBlock
                                    key={index}
                                    snippet={snippet}
                                    highlight={
                                        snippet === target && view.id === activeStep.view
                                            ? activeStep.highlight
                                            : undefined
                                    }
                                    pinnedLine={snippet === target && view.id === activeStep.view ? pinnedLine : null}
                                />
                            ))}
                            {view.id === 'start' && <StartExtras content={content} />}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

function ConnectionCard({ inline = false }: { inline?: boolean }): JSX.Element {
    return (
        <dl className={clsx('hk-task__conn', inline && 'hk-task__conn--inline')}>
            {CONNECTION.map(item => (
                <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>
                        {item.value}
                        {item.note && <small>{item.note}</small>}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function StartExtras({ content }: { content: HackathonTaskContent }): JSX.Element {
    return (
        <>
            <ConnectionCard />
            <p className="hk-task__kitline">
                <b>Starter kit</b>
                <span>download</span>
                <HackathonStarterKit onDark />
            </p>
            <div className="hk-task__route">
                <p className="hk-task__route-label">
                    <b>Route</b>
                    {content.task.duration} · {content.milestones[0].code} →{' '}
                    {content.milestones[content.milestones.length - 1].code} → done
                </p>
                <ol
                    className="hk-task__route-list"
                    style={{ gridTemplateColumns: `repeat(${content.milestones.length + 1}, minmax(0, 1fr))` }}
                >
                    {content.milestones.map(milestone => (
                        <li key={milestone.code}>
                            <a className="hk-task__route-step" href={`#${milestoneId(milestone)}`}>
                                <b>{milestone.code}</b>
                                <span>{milestone.short ?? milestone.title}</span>
                                {milestone.time && <i>{milestone.time}</i>}
                            </a>
                        </li>
                    ))}
                    <li>
                        <a className="hk-task__route-step" href="#done">
                            <b>DoD</b>
                            <span>Done</span>
                            <i>→ submit</i>
                        </a>
                    </li>
                </ol>
            </div>
        </>
    );
}

function PanelNote({ children }: { children: ReactNode }): JSX.Element {
    return (
        <p className="hk-task__panelnote">
            <IconPanel />
            <span>{children}</span>
        </p>
    );
}

export function HackathonTaskPage({ content }: { content: HackathonTaskContent }): JSX.Element {
    const badgeUrl = useBaseUrl('/images/community-badges/badge-contributor.png');
    const { task, Sketch } = content;
    const { views, steps, lastView, hasData } = useTaskModel(content);
    const activeId = useActiveStep(steps);
    const activeStep = steps.find(step => step.id === activeId) ?? steps[0];
    const [pinnedLine, setPinnedLine] = useState<number | null>(null);
    const lastMilestone = content.milestones[content.milestones.length - 1];

    const cardClass = (id: string, extra?: string) => clsx('hk-task__card', extra, id === activeId && 'is-active');

    return (
        <LayoutNext
            title={`${task.title} · Doris Hackathon`}
            description={`${content.hook} A Track A task for the ${HACKATHON_EVENT.name} at ${HACKATHON_EVENT.conference} ${HACKATHON_EVENT.city}.`}
        >
            <div className="hk-task">
                <div className="hk-task__bar">
                    <div className="hk-task__wrap hk-task__bar-in">
                        <Link className="hk-task__back" to="/course">
                            <IconArrowLeft />
                            <span>Course</span>
                        </Link>
                        <span className="hk-task__tag">{HACKATHON_EVENT.name}</span>
                        <a
                            className="hk-task__event"
                            href={HACKATHON_EVENT.eventUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span>
                                <span className="hk-task__event-long">
                                    {HACKATHON_EVENT.conference} {HACKATHON_EVENT.city} ·{' '}
                                </span>
                                {HACKATHON_EVENT.dateShort} · {HACKATHON_EVENT.time} · {HACKATHON_EVENT.room}
                            </span>
                            <IconExternal />
                        </a>
                    </div>
                </div>

                <nav className="hk-task__switch" aria-label="Track A tasks">
                    <div className="hk-task__wrap hk-task__switch-in">
                        <span className="hk-task__label hk-task__switch-label">
                            Track A
                            <br />
                            tasks
                        </span>
                        {HACKATHON_TASKS.map(item => (
                            <Link
                                key={item.code}
                                className="hk-task__switch-item"
                                to={hackathonTaskPath(item)}
                                aria-current={item.code === task.code ? 'page' : undefined}
                            >
                                <span className="hk-task__switch-code">{item.code}</span>
                                <span className="hk-task__switch-name">{item.title}</span>
                                <span className="hk-task__switch-time">{item.duration}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <div className="hk-task__wrap hk-task__grid">
                    <div className="hk-task__main">
                        <header className="hk-task__hero" id="top">
                            <p className="hk-task__eyebrow">Track A · Task {task.code}</p>
                            <h1>
                                {content.titleLead} <span>{content.titleTail}</span>
                            </h1>
                            <p className="hk-task__hook">{content.hook}</p>
                            <ul className="hk-task__chips" aria-label="At a glance">
                                {content.chips.map(chip => (
                                    <li key={chip}>{chip}</li>
                                ))}
                            </ul>
                            <div className="hk-task__actions">
                                {HACKATHON_EVENT.starterKitUrl ? (
                                    <a className="hk-task__btn" href={HACKATHON_EVENT.starterKitUrl}>
                                        Get the starter kit
                                    </a>
                                ) : (
                                    <span className="hk-task__btn hk-task__btn--tba" aria-disabled="true">
                                        Get the starter kit <HackathonTba name="STARTER_KIT" />
                                    </span>
                                )}
                                <a className="hk-task__btn hk-task__btn--primary" href="#before">
                                    Start Doris <IconArrowDown />
                                </a>
                            </div>
                            <p className="hk-task__help">
                                <b>Stuck for more than 10 minutes?</b> Come to the Doris table and ask Mingyu, or post
                                in <code>{HACKATHON_EVENT.slackChannel}</code> on the{' '}
                                <a href={HACKATHON_SLACK_URL}>Apache Doris Slack</a>.
                            </p>
                        </header>

                        <div className="hk-task__part" id="part-1">
                            <span className="hk-task__part-n">1</span>
                            <h2>Get set up</h2>
                            <p>What you are building, why Doris makes it simple, and a running cluster.</p>
                        </div>

                        <section className={cardClass('build')} id="build">
                            <h3>What you&apos;ll build</h3>
                            <p className="hk-task__lead">{content.build.lead}</p>
                            {content.build.body}
                            <div className="hk-task__inline hk-task__inline-sketch">
                                <div className="hk-sketch">
                                    <div className="hk-sketch__head">
                                        <span className="hk-sketch__tag">Sketch</span>
                                        <span className="hk-sketch__title">
                                            What you&apos;ll build · wireframe, not a screenshot
                                        </span>
                                    </div>
                                    <Sketch view={lastView} />
                                </div>
                            </div>
                            <PanelNote>The sketch sits at the top of the code panel</PanelNote>
                        </section>

                        <section className={cardClass('why')} id="why">
                            <h3>Why it&apos;s interesting on Doris</h3>
                            <ul className="hk-task__points">
                                {content.why.map((point, index) => (
                                    <li key={index}>
                                        <p>{point}</p>
                                    </li>
                                ))}
                            </ul>
                            {hasData && content.whyHighlight && (
                                <PanelNote>Panel: the index lines of the table definition</PanelNote>
                            )}
                        </section>

                        <section className={cardClass('before')} id="before">
                            <h3>Before you start</h3>
                            <ul className="hk-task__checklist">
                                {content.before.map((item, index) => (
                                    <li key={index}>
                                        <label>
                                            <input type="checkbox" />
                                            <span>
                                                <strong>{item.title}</strong> {item.body}
                                            </span>
                                        </label>
                                        {item.command && (
                                            <div className="hk-task__term">
                                                <code>{item.command}</code>
                                                <CopyButton
                                                    className="hk-task__copy"
                                                    text={item.command}
                                                    ariaLabel="Copy command"
                                                />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="hk-task__inline">
                                <ConnectionCard inline />
                            </div>
                        </section>

                        {content.data && (
                            <section className={cardClass('data')} id="data">
                                <h3>The data</h3>
                                <Blocks blocks={content.data} />
                                <PanelNote>Panel → Table: the full table definition</PanelNote>
                            </section>
                        )}

                        <section className={cardClass('ai')} id="ai">
                            <h3>Build with AI</h3>
                            {content.ai.intro}
                            {content.ai.steps.length > 0 && (
                                <ol className="hk-task__steps">
                                    {content.ai.steps.map((step, index) => (
                                        <li key={index}>
                                            <p>{step}</p>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            <p className="hk-task__actions">
                                <CopyButton
                                    className="hk-task__btn hk-task__btn--primary"
                                    text={content.ai.prompt.code}
                                    label={`Copy the ${content.ai.prompt.label.toLowerCase()}`}
                                />
                            </p>
                            <div className="hk-task__inline">
                                <HackathonCodeBlock snippet={content.ai.prompt} />
                            </div>
                            <h4 className="hk-task__subhead hk-task__label">
                                Doris traps your agent will probably fall into
                            </h4>
                            <RowsTable head={['Trap', 'What to do instead']} rows={content.ai.traps} />
                        </section>

                        <div className="hk-task__part" id="part-2">
                            <span className="hk-task__part-n">2</span>
                            <h2>Build it</h2>
                            <p>
                                {content.milestones.length} milestones, {content.milestones[0].code} →{' '}
                                {lastMilestone.code}. The panel follows the step you are reading.
                            </p>
                        </div>

                        <ol className="hk-task__path">
                            {content.milestones.map(milestone => {
                                const id = milestoneId(milestone);
                                return (
                                    <li className={cardClass(id, 'hk-task__ms')} id={id} key={id}>
                                        <span className="hk-task__ms-num" aria-hidden="true">
                                            {milestone.code}
                                        </span>
                                        <div className="hk-task__ms-body">
                                            <p className="hk-task__ms-meta">
                                                <span className="hk-task__label">
                                                    Milestone {milestone.code.slice(1)}
                                                </span>
                                                {milestone.time && <span>{milestone.time}</span>}
                                            </p>
                                            <h3>{milestone.title}</h3>
                                            <Blocks blocks={milestone.blocks} />
                                            {milestone.legend && (
                                                <ul className="hk-task__legend" aria-label="The clauses that matter">
                                                    {milestone.legend.map(entry => (
                                                        <li
                                                            key={entry.line}
                                                            tabIndex={0}
                                                            onMouseEnter={() => setPinnedLine(entry.line)}
                                                            onMouseLeave={() => setPinnedLine(null)}
                                                            onFocus={() => setPinnedLine(entry.line)}
                                                            onBlur={() => setPinnedLine(null)}
                                                        >
                                                            <b>L{entry.line}</b>
                                                            <span>
                                                                <code>{entry.code}</code>
                                                                <em>{entry.note}</em>
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {milestone.after}
                                            {milestone.checkpoint && (
                                                <div className="hk-task__check">
                                                    <b>Checkpoint</b>
                                                    <p>{milestone.checkpoint}</p>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>

                        <div className="hk-task__part" id="part-3">
                            <span className="hk-task__part-n">3</span>
                            <h2>Ship it</h2>
                            <p>Check it off, show it, collect your badge.</p>
                        </div>

                        <section className={cardClass('done', 'hk-task__dod')} id="done">
                            <div className="hk-task__dod-top">
                                <h3>Definition of Done</h3>
                                <span className="hk-task__dod-count">Your checklist</span>
                            </div>
                            <ul className="hk-task__checklist">
                                {content.done.map((item, index) => (
                                    <li key={index}>
                                        <label>
                                            <input type="checkbox" />
                                            <span>{item}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className={cardClass('submit')} id="submit">
                            <h3>Submit &amp; get your badge</h3>
                            <div className="hk-task__submit">
                                <p className="hk-task__lead">Take part → submit → get your badge.</p>
                                <ol className="hk-task__steps">
                                    <li>
                                        <p>
                                            Put your work in a folder named after <strong>your GitHub ID</strong>: the
                                            code, plus a README with what it does, how to run it, one screenshot or GIF,
                                            and the Doris features you used.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            <strong>Open a pull request</strong> that adds it to <SubmitTarget /> as{' '}
                                            <code>{HACKATHON_EVENT.starterKitFolder}/&lt;your-github-id&gt;/</code>.
                                            Fork and push, or use GitHub&apos;s <em>Add file → Upload files</em>.
                                            Nothing else to fill in.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            <strong>Show it</strong> at the Doris table (a 2-minute demo is plenty), or
                                            at the show-and-tell around 14:30.
                                        </p>
                                    </li>
                                    <li>
                                        <p>
                                            <strong>
                                                Join the <a href={HACKATHON_SLACK_URL}>Apache Doris Slack</a>
                                            </strong>{' '}
                                            and say hi in <code>{HACKATHON_EVENT.slackChannel}</code>: questions,
                                            submissions and badges are all handled there.
                                        </p>
                                    </li>
                                </ol>
                                <p className="hk-task__late">
                                    Everyone who takes part in a task on site gets the{' '}
                                    <strong>Apache Doris Contributor badge</strong>: no merged pull request to Doris
                                    needed. Didn&apos;t finish by 15:00? Keep going — submissions are open until{' '}
                                    {HACKATHON_EVENT.deadline ?? <HackathonTba name="DEADLINE" />}. Teams are fine, but
                                    not needed: list every member&apos;s GitHub ID in the README.
                                </p>
                                <div className="hk-task__submit-badge">
                                    <Link to="/community/how-to-contribute/community-badges">
                                        <img
                                            src={badgeUrl}
                                            alt="Apache Doris Contributor badge"
                                            width="150"
                                            height="150"
                                        />
                                    </Link>
                                    <Link to="/community/how-to-contribute/community-badges">
                                        About the Contributor badge
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className={cardClass('stretch')} id="stretch">
                            <h3>Stretch goals</h3>
                            <ul className="hk-task__next">
                                {content.stretch.map((item, index) => (
                                    <li key={index}>
                                        <p>{item}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className={cardClass('help')} id="help">
                            <h3>Troubleshooting &amp; references</h3>
                            <RowsTable head={['Symptom', 'Fix']} rows={content.troubleshooting} />
                            <h4 className="hk-task__subhead hk-task__label" id="references">
                                References
                            </h4>
                            <p className="hk-task__refs">
                                {content.references.map(reference => (
                                    <Link key={reference.to} to={reference.to}>
                                        {reference.label}
                                        {reference.note && <small>{reference.note}</small>}
                                        <IconExternal />
                                    </Link>
                                ))}
                            </p>
                        </section>
                    </div>

                    <CodePanel content={content} views={views} activeStep={activeStep} pinnedLine={pinnedLine} />
                </div>

                <section className="hk-task__wrap hk-task__more" id="tasks" aria-labelledby="hk-task-more-title">
                    <div className="hk-task__more-head">
                        <div>
                            <p className="hk-task__label">{HACKATHON_EVENT.name} · Track A</p>
                            <h2 id="hk-task-more-title">All four tasks</h2>
                        </div>
                        <Link className="hk-task__btn hk-task__btn--sm" to="/course">
                            <IconArrowLeft />
                            <span>Back to the course</span>
                        </Link>
                    </div>
                    <TaskTiles current={task} />
                </section>
            </div>
        </LayoutNext>
    );
}
