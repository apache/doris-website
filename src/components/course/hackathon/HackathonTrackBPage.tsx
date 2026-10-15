import React, { JSX, useEffect, useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import { CopyButton, HackathonCodeBlock } from './HackathonCodeBlock';
import {
    BEFORE_CAN_CONNECT,
    BEFORE_DORIS_RUNNING,
    BEFORE_IMAGE_PULLED,
    COMMON_TROUBLESHOOTING,
} from './hackathonCommon';
import { HACKATHON_EVENT, HACKATHON_TRACK_B } from './hackathonEvent';
import {
    ConnectionCard,
    HackathonAllTasks,
    HackathonChecklistItem,
    HackathonEventBar,
    HackathonHelpLine,
    HackathonRow,
    HackathonStarterKit,
    HackathonSubmit,
    HackathonTaskSwitch,
    HackathonTermList,
    PanelNote,
    RowsTable,
    START_SNIPPET,
    useActiveStep,
} from './HackathonTaskPage';
import { IconArrowDown, IconExternal } from './HackathonIcons';
import { TRACK_B_TASKS, TrackBTask, docFiles, prTemplate, sectionTemplate } from './tasks/trackB';
import './HackathonTrackBPage.scss';

const DOCS_REPO = 'https://github.com/apache/doris-website';

const SPARSE_CLONE =
    'git clone --depth 1 --filter=blob:none --sparse https://github.com/<your-github-id>/doris-website.git && cd doris-website && git sparse-checkout set docs/key-features versioned_docs/version-4.x/key-features';

const BEFORE: HackathonChecklistItem[] = [
    BEFORE_IMAGE_PULLED,
    BEFORE_DORIS_RUNNING,
    BEFORE_CAN_CONNECT,
    {
        title: 'A fork of apache/doris-website.',
        body: (
            <>
                <a href={`${DOCS_REPO}/fork`}>Fork it</a> on GitHub. No clone needed: press <kbd>.</kbd> in your fork to
                edit files in the browser, then commit to a new branch. Prefer git? The repository is large, so clone
                only the two folders you need:
            </>
        ),
        command: SPARSE_CLONE,
    },
    {
        title: 'Optional: the starter kit.',
        body: (
            <>
                Track B needs no seed data, but the kit&apos;s <code>doris.sh</code> runs a SQL file in one go while you
                build the demo: <code>./doris.sh load demo.sql</code>. Download and unzip <HackathonStarterKit />.
            </>
        ),
    },
];

const TROUBLESHOOTING: HackathonRow[] = [
    ...COMMON_TROUBLESHOOTING.slice(0, -1),
    {
        problem: 'Build Check fails on your pull request',
        fix: (
            <>
                Open the check&apos;s log. It is usually MDX: an unclosed tag, or a bare <code>{'{'}</code> or{' '}
                <code>&lt;</code> in running text. Inside fenced code blocks anything goes
            </>
        ),
    },
    {
        problem: (
            <>
                B6: <code>curl</code> prints nothing or a <code>307</code>
            </>
        ),
        fix: (
            <>
                Add <code>--location-trusted</code>: the FE redirects the load to the BE, and curl must follow it with
                your credentials
            </>
        ),
    },
    {
        problem: (
            <>
                B6: <code>Label Already Exists</code>
            </>
        ),
        fix: 'Expected on a rerun: a label loads at most once. Use a new label to load the file again',
    },
    COMMON_TROUBLESHOOTING[COMMON_TROUBLESHOOTING.length - 1],
];

const REFERENCES = [
    ...TRACK_B_TASKS.map(task => task.doc),
    { label: 'Reciprocal Rank Fusion', to: '/docs/4.x/key-features/reciprocal-rank-fusion' },
    { label: 'Documentation Contribution Guide', to: '/community/how-to-contribute/contribute-doc' },
    { label: 'Docs format specification', to: '/community/how-to-contribute/docs-format-specification' },
    { label: 'Pull request guide', to: '/community/how-to-contribute/pull-request' },
];

type PanelView = 'start' | 'section' | 'pr';

const STEPS: { id: string; view: PanelView }[] = [
    { id: 'top', view: 'start' },
    { id: 'how', view: 'start' },
    { id: 'before', view: 'start' },
    { id: 'tasks', view: 'section' },
    ...TRACK_B_TASKS.map(task => ({ id: task.id, view: 'section' as PanelView })),
    { id: 'deliverable', view: 'section' },
    { id: 'done', view: 'pr' },
    { id: 'submit', view: 'pr' },
    { id: 'stretch', view: 'pr' },
    { id: 'help', view: 'start' },
];

function TaskPicker({ chosen, onChoose }: { chosen: TrackBTask; onChoose: (id: string) => void }): JSX.Element {
    return (
        <div className="hk-trackb__picker" role="group" aria-label="Show the templates for task">
            {TRACK_B_TASKS.map(task => (
                <button
                    key={task.id}
                    type="button"
                    className="hk-trackb__pick"
                    aria-pressed={task.id === chosen.id}
                    onClick={() => onChoose(task.id)}
                >
                    {task.code}
                </button>
            ))}
        </div>
    );
}

function TrackBPanel({ view, chosen }: { view: PanelView; chosen: TrackBTask }): JSX.Element {
    const views: { id: PanelView; tab: string; anchor: string }[] = [
        { id: 'start', tab: 'Start', anchor: 'before' },
        { id: 'section', tab: 'Page section', anchor: 'deliverable' },
        { id: 'pr', tab: 'Pull request', anchor: 'done' },
    ];
    return (
        <aside className="hk-task__panel hk-trackb__panel" aria-label="Templates for the task you are reading">
            <div className="hk-sketch hk-trackb__panelhead">
                <div className="hk-sketch__head">
                    <span className="hk-sketch__tag">Templates</span>
                    <span className="hk-sketch__title">
                        Your pull request · {chosen.code} {chosen.title}
                    </span>
                </div>
            </div>
            <nav className="hk-task__panel-tabs" aria-label="Templates">
                {views.map(item => (
                    <a
                        key={item.id}
                        className={clsx('hk-task__tab', item.id === view && 'is-active')}
                        href={`#${item.anchor}`}
                        aria-current={item.id === view ? 'true' : undefined}
                    >
                        {item.tab}
                    </a>
                ))}
            </nav>
            <div className="hk-task__panel-body">
                <div className={clsx('hk-task__view', view === 'start' && 'is-active')}>
                    <HackathonCodeBlock snippet={START_SNIPPET} />
                    <ConnectionCard database={`your own, e.g. ${chosen.database}`} />
                    {docFiles(chosen).map(file => (
                        <p className="hk-task__kitline" key={file}>
                            <b>Edit</b>
                            <span>{file}</span>
                        </p>
                    ))}
                </div>
                <div className={clsx('hk-task__view', view === 'section' && 'is-active')}>
                    <HackathonCodeBlock snippet={sectionTemplate(chosen)} />
                </div>
                <div className={clsx('hk-task__view', view === 'pr' && 'is-active')}>
                    <HackathonCodeBlock snippet={prTemplate(chosen)} />
                </div>
            </div>
        </aside>
    );
}

export function HackathonTrackBPage(): JSX.Element {
    const activeId = useActiveStep(STEPS);
    const activeStep = STEPS.find(step => step.id === activeId) ?? STEPS[0];
    const [chosenId, setChosenId] = useState(TRACK_B_TASKS[0].id);
    const chosen = TRACK_B_TASKS.find(task => task.id === chosenId) ?? TRACK_B_TASKS[0];

    // The templates follow the last task card you read; the picker can override it.
    useEffect(() => {
        if (TRACK_B_TASKS.some(task => task.id === activeId)) {
            setChosenId(activeId);
        }
    }, [activeId]);

    const cardClass = (id: string, extra?: string) => clsx('hk-task__card', extra, id === activeId && 'is-active');

    return (
        <LayoutNext
            title={`Track B · ${HACKATHON_TRACK_B.title} · Doris Hackathon`}
            description={`${HACKATHON_TRACK_B.pitch} Track B of the ${HACKATHON_EVENT.name} at ${HACKATHON_EVENT.conference} ${HACKATHON_EVENT.city}.`}
        >
            <div className="hk-task hk-trackb">
                <HackathonEventBar />
                <HackathonTaskSwitch current={HACKATHON_TRACK_B.code} />

                <div className="hk-task__wrap hk-task__grid">
                    <div className="hk-task__main">
                        <header className="hk-task__hero" id="top">
                            <p className="hk-task__eyebrow">Track B · {TRACK_B_TASKS.length} tasks, pick one</p>
                            <h1>
                                Docs to <span>Demo</span>
                            </h1>
                            <p className="hk-task__hook">
                                Pick a feature page of the Apache Doris docs, run it on your local Doris, and turn it
                                into a step-by-step demo. Your pull request adds the demo to that page on
                                doris.apache.org.
                            </p>
                            <ul className="hk-task__chips" aria-label="At a glance">
                                {[
                                    '30–60 min per task',
                                    'Beginner-friendly',
                                    'SQL and a browser',
                                    'Ends in a docs PR',
                                ].map(chip => (
                                    <li key={chip}>{chip}</li>
                                ))}
                            </ul>
                            <div className="hk-task__actions">
                                <a className="hk-task__btn" href="#before">
                                    Start Doris
                                </a>
                                <a className="hk-task__btn hk-task__btn--primary" href="#tasks">
                                    Pick a task <IconArrowDown />
                                </a>
                            </div>
                            <HackathonHelpLine />
                        </header>

                        <div className="hk-task__part" id="part-1">
                            <span className="hk-task__part-n">1</span>
                            <h2>Get set up</h2>
                            <p>How Track B works, a running cluster, and a fork of the docs.</p>
                        </div>

                        <section className={cardClass('how')} id="how">
                            <h3>How Track B works</h3>
                            <p className="hk-task__lead">One feature page, one demo, one pull request.</p>
                            <p>
                                Every new Doris user starts on these pages. Running them from scratch is the fastest way
                                to find what is missing, and a demo that runs top to bottom from an empty cluster is the
                                best proof that a feature works. Yours goes on the page itself.
                            </p>
                            <ol className="hk-task__steps">
                                <li>
                                    <p>
                                        <strong>Follow the page.</strong> Open your task&apos;s doc page and run every
                                        example on your local Doris, exactly as written. Note anything that fails,
                                        prints something different, or leaves you guessing.
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Build the demo.</strong> From an empty cluster, prove every point on
                                        your task&apos;s checklist. Run it top to bottom and keep the real output of
                                        every statement.
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Add it to the page.</strong> A <em>Step-by-step demo</em> section right
                                        after Quick start, in both copies of the page. Fix what you found wrong in the
                                        same pull request.
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Open the pull request</strong> on <code>apache/doris-website</code>. It
                                        is your submission: see <a href="#submit">Submit &amp; get your badge</a>.
                                    </p>
                                </li>
                            </ol>
                            <PanelNote>The panel shows the templates for the task you are reading</PanelNote>
                        </section>

                        <section className={cardClass('before')} id="before">
                            <h3>Before you start</h3>
                            <ul className="hk-task__checklist">
                                {BEFORE.map((item, index) => (
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
                                <ConnectionCard inline database={`your own, e.g. ${chosen.database}`} />
                            </div>
                        </section>

                        <div className="hk-task__part" id="tasks">
                            <span className="hk-task__part-n">2</span>
                            <h2>Pick a task</h2>
                            <p>
                                {TRACK_B_TASKS.length} feature pages. Pick one; finished early? Pick another: each task
                                is its own pull request.
                            </p>
                        </div>

                        {TRACK_B_TASKS.map(task => (
                            <section className={cardClass(task.id, 'hk-trackb__task')} id={task.id} key={task.id}>
                                <div className="hk-trackb__task-head">
                                    <span className="hk-trackb__task-code" aria-hidden="true">
                                        {task.code}
                                    </span>
                                    <div>
                                        <h3>{task.title}</h3>
                                        <p className="hk-trackb__task-meta">
                                            {task.time} · edits <code>key-features/{task.page}.mdx</code>
                                        </p>
                                    </div>
                                </div>
                                <p className="hk-trackb__doc">
                                    <span>Start from</span>
                                    <Link className="hk-task__btn hk-task__btn--sm" to={task.doc.to}>
                                        {task.doc.label}
                                        <IconExternal />
                                    </Link>
                                    {task.alsoSee?.map(doc => (
                                        <Link className="hk-trackb__also" key={doc.to} to={doc.to}>
                                            + {doc.label}
                                        </Link>
                                    ))}
                                </p>
                                <h4 className="hk-task__subhead hk-task__label">Your demo proves</h4>
                                <ul className="hk-task__checklist">
                                    {task.proves.map(line => (
                                        <li key={line}>
                                            <label>
                                                <input type="checkbox" />
                                                <span>{line}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                                {task.tip && (
                                    <div className="hk-task__check">
                                        <b>Tip</b>
                                        <p>{task.tip}</p>
                                    </div>
                                )}
                            </section>
                        ))}

                        <div className="hk-task__part" id="part-3">
                            <span className="hk-task__part-n">3</span>
                            <h2>Ship it</h2>
                            <p>What your pull request adds, how to submit it, and the badge.</p>
                        </div>

                        <section className={cardClass('deliverable')} id="deliverable">
                            <h3>What your pull request adds</h3>
                            <p className="hk-task__lead">
                                One pull request on <code>apache/doris-website</code>, and it is your submission.
                            </p>
                            <HackathonTermList
                                items={[
                                    {
                                        term: 'Demo section',
                                        text: (
                                            <>
                                                <code>## Step-by-step demo</code> right after Quick start, one step per
                                                point on your checklist: a SQL block, then{' '}
                                                <strong>Expected result</strong> with the real output. It starts from an
                                                empty cluster, so it creates its own database.
                                            </>
                                        ),
                                    },
                                    {
                                        term: 'Both copies',
                                        text: (
                                            <>
                                                The same change in <code>docs/key-features/&lt;page&gt;.mdx</code> and{' '}
                                                <code>versioned_docs/version-4.x/key-features/&lt;page&gt;.mdx</code>.
                                                These pages exist only in English.
                                            </>
                                        ),
                                    },
                                    {
                                        term: 'Fixes',
                                        text: 'Anything wrong you found elsewhere on the page, fixed in the same pull request. Not sure it is wrong? List it in the description instead.',
                                    },
                                    {
                                        term: 'Description',
                                        text: (
                                            <>
                                                The repository&apos;s pull request template (dev + 4.x, English) and one
                                                line that names your task, e.g.{' '}
                                                <code>CoC 2026 Glasgow hackathon · Track B · B1</code>.
                                            </>
                                        ),
                                    },
                                ]}
                            />
                            <div className="hk-task__inline">
                                <p className="hk-trackb__picklabel">Templates for</p>
                                <TaskPicker chosen={chosen} onChoose={setChosenId} />
                                <HackathonCodeBlock snippet={sectionTemplate(chosen)} />
                                <HackathonCodeBlock snippet={prTemplate(chosen)} />
                            </div>
                            <PanelNote>Panel: the templates for the task you read last</PanelNote>
                        </section>

                        <section className={cardClass('done', 'hk-task__dod')} id="done">
                            <div className="hk-task__dod-top">
                                <h3>Definition of Done</h3>
                                <span className="hk-task__dod-count">Your checklist</span>
                            </div>
                            <ul className="hk-task__checklist">
                                {[
                                    "The demo section covers every point on your task's checklist and runs top to bottom on an empty Doris; every Expected result is the real output.",
                                    'The same section is in both copies of the page.',
                                    'What you found wrong on the page is fixed in the same pull request, or listed in its description.',
                                    'The pull request is open on apache/doris-website and names your task.',
                                ].map((item, index) => (
                                    <li key={index}>
                                        <label>
                                            <input type="checkbox" />
                                            <span>{item}</span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <HackathonSubmit
                            className={cardClass('submit')}
                            membersIn="the pull request description"
                            steps={[
                                <>
                                    <strong>Open your pull request</strong> on{' '}
                                    <a href={`${DOCS_REPO}/pulls`}>apache/doris-website</a>, from a branch of your fork.
                                    The pull request is your submission; nothing else to fill in.
                                </>,
                            ]}
                        />

                        <section className={cardClass('stretch')} id="stretch">
                            <h3>Stretch goals</h3>
                            <ul className="hk-task__next">
                                <li>
                                    <p>
                                        <strong>Pick a second task.</strong> Each finished task is its own pull request.
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Go past the quick start.</strong> Run the longer examples the page links
                                        to, such as the table-design and SQL-manual pages; they are checked less often.
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>Review another Track B pull request.</strong> Run its demo on your Doris
                                        and leave a comment with what you got.
                                    </p>
                                </li>
                            </ul>
                        </section>

                        <section className={cardClass('help')} id="help">
                            <h3>Troubleshooting &amp; references</h3>
                            <RowsTable head={['Symptom', 'Fix']} rows={TROUBLESHOOTING} />
                            <h4 className="hk-task__subhead hk-task__label" id="references">
                                References
                            </h4>
                            <p className="hk-task__refs">
                                {REFERENCES.map(reference => (
                                    <Link key={reference.to} to={reference.to}>
                                        {reference.label}
                                        <IconExternal />
                                    </Link>
                                ))}
                            </p>
                        </section>
                    </div>

                    <TrackBPanel view={activeStep.view} chosen={chosen} />
                </div>

                <HackathonAllTasks current={HACKATHON_TRACK_B.code} />
            </div>
        </LayoutNext>
    );
}
