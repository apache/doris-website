import {translate} from '@docusaurus/Translate';
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
    HackathonHelpLine,
    HackathonRow,
    HackathonStarterKit,
    HackathonSubmit,
    HackathonTaskSwitch,
    HackathonTermList,
    HackathonTopBar,
    PanelNote,
    RowsTable,
    START_SNIPPET,
    useActiveStep,
} from './HackathonTaskPage';
import { IconArrowDown, IconExternal } from './HackathonIcons';
import { TRACK_B_TASKS as TRACK_B_SOURCE_TASKS, TrackBTask, docFiles, prTemplate, sectionTemplate } from './tasks/trackB';
import {localizeTrackBTask, trackBSourceTask} from './track-b-localization';
import './HackathonTrackBPage.scss';

const TRACK_B_TASKS: TrackBTask[] = TRACK_B_SOURCE_TASKS.map(task =>
    localizeTrackBTask(task, (id, message) => translate({id, message})));
const sourceTask = (task: TrackBTask): TrackBTask =>
    trackBSourceTask(task, TRACK_B_SOURCE_TASKS);

const DOCS_REPO = 'https://github.com/apache/doris-website';

const SPARSE_CLONE =
    'git clone --depth 1 --filter=blob:none --sparse https://github.com/<your-github-id>/doris-website.git && cd doris-website && git sparse-checkout set docs/key-features versioned_docs/version-4.x/key-features';

const BEFORE: HackathonChecklistItem[] = [
    BEFORE_IMAGE_PULLED,
    BEFORE_DORIS_RUNNING,
    BEFORE_CAN_CONNECT,
    {
        title: translate({id: "landing.HackathonTrackBPage.001", message: "A fork of apache/doris-website."}),
        body: (
            <>
                <a href={`${DOCS_REPO}/fork`}>{translate({id: "landing.HackathonTrackBPage.002", message: "Fork it"})}</a> {translate({id: "landing.HackathonTrackBPage.003", message: "on GitHub. No clone needed: press"})} <kbd>.</kbd> {translate({id: "landing.HackathonTrackBPage.004", message: "in your fork to edit files in the browser, then commit to a new branch. Prefer git? The repository is large, so clone only the two folders you need:"})}
            </>
        ),
        command: SPARSE_CLONE,
    },
    {
        title: translate({id: "landing.HackathonTrackBPage.005", message: "Optional: the starter kit."}),
        body: (
            <>
                {translate({id: "landing.HackathonTrackBPage.006", message: "Track B needs no seed data, but the kit's"})} <code>doris.sh</code> {translate({id: "landing.HackathonTrackBPage.007", message: "runs a SQL file in one go while you build the demo:"})} <code>./doris.sh load demo.sql</code>{translate({id: "landing.HackathonTrackBPage.008", message: ". Download and unzip"})} <HackathonStarterKit />.
            </>
        ),
    },
];

const TROUBLESHOOTING: HackathonRow[] = [
    ...COMMON_TROUBLESHOOTING.slice(0, -1),
    {
        problem: translate({id: "landing.HackathonTrackBPage.009", message: "Build Check fails on your pull request"}),
        fix: (
            <>
                {translate({id: "landing.HackathonTrackBPage.010", message: "Open the check's log. It is usually MDX: an unclosed tag, or a bare"})} <code>{'{'}</code> {translate({id: "landing.HackathonTrackBPage.011", message: "or"})}{' '}
                <code>&lt;</code> {translate({id: "landing.HackathonTrackBPage.012", message: "in running text. Inside fenced code blocks anything goes"})}
            </>
        ),
    },
    {
        problem: (
            <>
                {translate({id: "landing.HackathonTrackBPage.013", message: "B6:"})} <code>curl</code> {translate({id: "landing.HackathonTrackBPage.014", message: "prints nothing or a"})} <code>307</code>
            </>
        ),
        fix: (
            <>
                {translate({id: "landing.HackathonTrackBPage.015", message: "Add"})} <code>--location-trusted</code>{translate({id: "landing.HackathonTrackBPage.016", message: ": the FE redirects the load to the BE, and curl must follow it with your credentials"})}
            </>
        ),
    },
    {
        problem: (
            <>
                {translate({id: "landing.HackathonTrackBPage.017", message: "B6:"})} <code>Label Already Exists</code>
            </>
        ),
        fix: translate({id: "landing.HackathonTrackBPage.018", message: "Expected on a rerun: a label loads at most once. Use a new label to load the file again"}),
    },
    COMMON_TROUBLESHOOTING[COMMON_TROUBLESHOOTING.length - 1],
];

const REFERENCES = [
    ...TRACK_B_TASKS.map(task => task.doc),
    { label: translate({id: "landing.HackathonTrackBPage.019", message: "Reciprocal Rank Fusion"}), to: '/docs/4.x/key-features/reciprocal-rank-fusion' },
    { label: translate({id: "landing.HackathonTrackBPage.020", message: "Documentation Contribution Guide"}), to: '/community/how-to-contribute/contribute-doc' },
    { label: translate({id: "landing.HackathonTrackBPage.021", message: "Docs format specification"}), to: '/community/how-to-contribute/docs-format-specification' },
    { label: translate({id: "landing.HackathonTrackBPage.022", message: "Pull request guide"}), to: '/community/how-to-contribute/pull-request' },
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
        <div className="hk-trackb__picker" role="group" aria-label={translate({id: "landing.HackathonTrackBPage.023", message: "Show the templates for task"})}>
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
        { id: 'start', tab: translate({id: "landing.HackathonTrackBPage.024", message: "Start"}), anchor: 'before' },
        { id: 'section', tab: translate({id: "landing.HackathonTrackBPage.025", message: "Page section"}), anchor: 'deliverable' },
        { id: 'pr', tab: translate({id: "landing.HackathonTrackBPage.026", message: "Pull request"}), anchor: 'done' },
    ];
    return (
        <aside className="hk-task__panel hk-trackb__panel" aria-label={translate({id: "landing.HackathonTrackBPage.027", message: "Templates for the task you are reading"})}>
            <div className="hk-sketch hk-trackb__panelhead">
                <div className="hk-sketch__head">
                    <span className="hk-sketch__tag">{translate({id: "landing.HackathonTrackBPage.028", message: "Templates"})}</span>
                    <span className="hk-sketch__title">
                        {translate({id: "landing.HackathonTrackBPage.029", message: "Your pull request ·"})} {chosen.code} {chosen.title}
                    </span>
                </div>
            </div>
            <nav className="hk-task__panel-tabs" aria-label={translate({id: "landing.HackathonTrackBPage.030", message: "Templates"})}>
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
                    <ConnectionCard database={`${translate({id: 'landing.trackB.databaseHint', message: 'Your own, e.g.'})} ${chosen.database}`} />
                    {docFiles(chosen).map(file => (
                        <p className="hk-task__kitline" key={file}>
                            <b>{translate({id: "landing.HackathonTrackBPage.031", message: "Edit"})}</b>
                            <span>{file}</span>
                        </p>
                    ))}
                </div>
                <div className={clsx('hk-task__view', view === 'section' && 'is-active')}>
                    <HackathonCodeBlock snippet={sectionTemplate(sourceTask(chosen))} />
                </div>
                <div className={clsx('hk-task__view', view === 'pr' && 'is-active')}>
                    <HackathonCodeBlock snippet={prTemplate(sourceTask(chosen))} />
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
            title={`${translate({id: "landing.HackathonTrackBPage.032", message: "Track B · "})}${HACKATHON_TRACK_B.title}${translate({id: "landing.HackathonTrackBPage.033", message: " · Doris Hackathon"})}`}
            description={`${HACKATHON_TRACK_B.pitch}${translate({id: "landing.HackathonTrackBPage.034", message: " Track B of the "})}${HACKATHON_EVENT.name}${translate({id: "landing.HackathonTrackBPage.035", message: ": self-paced, open to everyone."})}`}
        >
            <div className="hk-task hk-trackb">
                <HackathonTopBar />
                <HackathonTaskSwitch current={HACKATHON_TRACK_B.code} />

                <div className="hk-task__wrap hk-task__grid">
                    <div className="hk-task__main">
                        <header className="hk-task__hero" id="top">
                            <p className="hk-task__eyebrow">{translate({id: "landing.HackathonTrackBPage.036", message: "Track B ·"})} {TRACK_B_TASKS.length} {translate({id: "landing.HackathonTrackBPage.037", message: "tasks, pick one"})}</p>
                            <h1>
                                {translate({id: "landing.HackathonTrackBPage.038", message: "Docs to"})} <span>{translate({id: "landing.HackathonTrackBPage.039", message: "Demo"})}</span>
                            </h1>
                            <p className="hk-task__hook">
                                {translate({id: "landing.HackathonTrackBPage.040", message: "Pick a feature page of the Apache Doris docs, run it on your local Doris, and turn it into a step-by-step demo. Your pull request adds the demo to that page on doris.apache.org."})}
                            </p>
                            <ul className="hk-task__chips" aria-label={translate({id: "landing.HackathonTrackBPage.041", message: "At a glance"})}>
                                {[
                                    translate({id: 'landing.trackB.chip.1', message: '30–60 min per task'}),
                                    translate({id: 'landing.trackB.chip.2', message: 'Beginner-friendly'}),
                                    translate({id: 'landing.trackB.chip.3', message: 'SQL and a browser'}),
                                    translate({id: 'landing.trackB.chip.4', message: 'Ends in a docs PR'}),
                                ].map(chip => (
                                    <li key={chip}>{chip}</li>
                                ))}
                            </ul>
                            <div className="hk-task__actions">
                                <a className="hk-task__btn" href="#before">
                                    {translate({id: "landing.HackathonTrackBPage.042", message: "Start Doris"})}
                                </a>
                                <a className="hk-task__btn hk-task__btn--primary" href="#tasks">
                                    {translate({id: "landing.HackathonTrackBPage.043", message: "Pick a task"})} <IconArrowDown />
                                </a>
                            </div>
                            <HackathonHelpLine />
                        </header>

                        <div className="hk-task__part" id="part-1">
                            <span className="hk-task__part-n">1</span>
                            <h2>{translate({id: "landing.HackathonTrackBPage.044", message: "Get set up"})}</h2>
                            <p>{translate({id: "landing.HackathonTrackBPage.045", message: "How Track B works, a running cluster, and a fork of the docs."})}</p>
                        </div>

                        <section className={cardClass('how')} id="how">
                            <h3>{translate({id: "landing.HackathonTrackBPage.046", message: "How Track B works"})}</h3>
                            <p className="hk-task__lead">{translate({id: "landing.HackathonTrackBPage.047", message: "One feature page, one demo, one pull request."})}</p>
                            <p>
                                {translate({id: "landing.HackathonTrackBPage.048", message: "Every new Doris user starts on these pages. Running them from scratch is the fastest way to find what is missing, and a demo that runs top to bottom from an empty cluster is the best proof that a feature works. Yours goes on the page itself."})}
                            </p>
                            <ol className="hk-task__steps">
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.049", message: "Follow the page."})}</strong> {translate({id: "landing.HackathonTrackBPage.050", message: "Open your task's doc page and run every example on your local Doris, exactly as written. Note anything that fails, prints something different, or leaves you guessing."})}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.051", message: "Build the demo."})}</strong> {translate({id: "landing.HackathonTrackBPage.052", message: "From an empty cluster, prove every point on your task's checklist. Run it top to bottom and keep the real output of every statement."})}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.053", message: "Add it to the page."})}</strong> {translate({id: "landing.HackathonTrackBPage.054", message: "A"})} <em>{translate({id: "landing.HackathonTrackBPage.055", message: "Step-by-step demo"})}</em> {translate({id: "landing.HackathonTrackBPage.056", message: "section right after Quick start, in both copies of the page. Fix what you found wrong in the same pull request."})}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.057", message: "Open the pull request"})}</strong> {translate({id: "landing.HackathonTrackBPage.058", message: "on"})} <code>apache/doris-website</code>{translate({id: "landing.HackathonTrackBPage.059", message: ". It is your submission: see"})} <a href="#submit">{translate({id: "landing.HackathonTrackBPage.060", message: "Submit & get your badge"})}</a>.
                                    </p>
                                </li>
                            </ol>
                            <PanelNote>{translate({id: "landing.HackathonTrackBPage.061", message: "The panel shows the templates for the task you are reading"})}</PanelNote>
                        </section>

                        <section className={cardClass('before')} id="before">
                            <h3>{translate({id: "landing.HackathonTrackBPage.062", message: "Before you start"})}</h3>
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
                                                    ariaLabel={translate({id: "landing.HackathonTrackBPage.063", message: "Copy command"})}
                                                />
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="hk-task__inline">
                                <ConnectionCard inline database={`${translate({id: 'landing.trackB.databaseHint', message: 'Your own, e.g.'})} ${chosen.database}`} />
                            </div>
                        </section>

                        <div className="hk-task__part" id="tasks">
                            <span className="hk-task__part-n">2</span>
                            <h2>{translate({id: "landing.HackathonTrackBPage.064", message: "Pick a task"})}</h2>
                            <p>
                                {TRACK_B_TASKS.length} {translate({id: "landing.HackathonTrackBPage.065", message: "feature pages. Pick one; finished early? Pick another: each task is its own pull request."})}
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
                                            {task.time} {translate({id: "landing.HackathonTrackBPage.066", message: "· edits"})} <code>key-features/{task.page}.mdx</code>
                                        </p>
                                    </div>
                                </div>
                                <p className="hk-trackb__doc">
                                    <span>{translate({id: "landing.HackathonTrackBPage.067", message: "Start from"})}</span>
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
                                <h4 className="hk-task__subhead hk-task__label">{translate({id: "landing.HackathonTrackBPage.068", message: "Your demo proves"})}</h4>
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
                                        <b>{translate({id: "landing.HackathonTrackBPage.069", message: "Tip"})}</b>
                                        <p>{task.tip}</p>
                                    </div>
                                )}
                            </section>
                        ))}

                        <div className="hk-task__part" id="part-3">
                            <span className="hk-task__part-n">3</span>
                            <h2>{translate({id: "landing.HackathonTrackBPage.070", message: "Ship it"})}</h2>
                            <p>{translate({id: "landing.HackathonTrackBPage.071", message: "What your pull request adds, how to submit it, and the badge."})}</p>
                        </div>

                        <section className={cardClass('deliverable')} id="deliverable">
                            <h3>{translate({id: "landing.HackathonTrackBPage.072", message: "What your pull request adds"})}</h3>
                            <p className="hk-task__lead">
                                {translate({id: "landing.HackathonTrackBPage.073", message: "One pull request on"})} <code>apache/doris-website</code>{translate({id: "landing.HackathonTrackBPage.074", message: ", and it is your submission."})}
                            </p>
                            <HackathonTermList
                                items={[
                                    {
                                        term: translate({id: "landing.HackathonTrackBPage.075", message: "Demo section"}),
                                        text: (
                                            <>
                                                <code>## Step-by-step demo</code> {translate({id: "landing.HackathonTrackBPage.076", message: "right after Quick start, one step per point on your checklist: a SQL block, then"})}{' '}
                                                <strong>{translate({id: "landing.HackathonTrackBPage.077", message: "Expected result"})}</strong> {translate({id: "landing.HackathonTrackBPage.078", message: "with the real output. It starts from an empty cluster, so it creates its own database."})}
                                            </>
                                        ),
                                    },
                                    {
                                        term: translate({id: "landing.HackathonTrackBPage.079", message: "Both copies"}),
                                        text: (
                                            <>
                                                {translate({id: "landing.HackathonTrackBPage.080", message: "The same change in"})} <code>docs/key-features/&lt;page&gt;.mdx</code> {translate({id: "landing.HackathonTrackBPage.081", message: "and"})}{' '}
                                                <code>versioned_docs/version-4.x/key-features/&lt;page&gt;.mdx</code>{translate({id: "landing.HackathonTrackBPage.082", message: ". These tasks update the English pages; translations are maintained separately."})}
                                            </>
                                        ),
                                    },
                                    {
                                        term: translate({id: "landing.HackathonTrackBPage.083", message: "Fixes"}),
                                        text: translate({id: "landing.HackathonTrackBPage.084", message: "Anything wrong you found elsewhere on the page, fixed in the same pull request. Not sure it is wrong? List it in the description instead."}),
                                    },
                                    {
                                        term: translate({id: "landing.HackathonTrackBPage.085", message: "Description"}),
                                        text: (
                                            <>
                                                {translate({id: "landing.HackathonTrackBPage.086", message: "The repository's pull request template (dev + 4.x, English) and one line that names your task, e.g."})}{' '}
                                                <code>Apache Doris Hackathon · Track B · B1</code>.
                                            </>
                                        ),
                                    },
                                ]}
                            />
                            <div className="hk-task__inline">
                                <p className="hk-trackb__picklabel">{translate({id: "landing.HackathonTrackBPage.087", message: "Templates for"})}</p>
                                <TaskPicker chosen={chosen} onChoose={setChosenId} />
                                <HackathonCodeBlock snippet={sectionTemplate(sourceTask(chosen))} />
                                <HackathonCodeBlock snippet={prTemplate(sourceTask(chosen))} />
                            </div>
                            <PanelNote>{translate({id: "landing.HackathonTrackBPage.088", message: "Panel: the templates for the task you read last"})}</PanelNote>
                        </section>

                        <section className={cardClass('done', 'hk-task__dod')} id="done">
                            <div className="hk-task__dod-top">
                                <h3>{translate({id: "landing.HackathonTrackBPage.089", message: "Definition of Done"})}</h3>
                                <span className="hk-task__dod-count">{translate({id: "landing.HackathonTrackBPage.090", message: "Your checklist"})}</span>
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
                            membersIn={translate({id: "landing.HackathonTrackBPage.091", message: "the pull request description"})}
                            steps={[
                                <>
                                    <strong>{translate({id: "landing.HackathonTrackBPage.092", message: "Open your pull request"})}</strong> {translate({id: "landing.HackathonTrackBPage.093", message: "on"})}{' '}
                                    <a href={`${DOCS_REPO}/pulls`}>apache/doris-website</a>{translate({id: "landing.HackathonTrackBPage.094", message: ", from a branch of your fork. The pull request is your submission; nothing else to fill in."})}
                                </>,
                            ]}
                        />

                        <section className={cardClass('stretch')} id="stretch">
                            <h3>{translate({id: "landing.HackathonTrackBPage.095", message: "Stretch goals"})}</h3>
                            <ul className="hk-task__next">
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.096", message: "Pick a second task."})}</strong> {translate({id: "landing.HackathonTrackBPage.097", message: "Each finished task is its own pull request."})}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.098", message: "Go past the quick start."})}</strong> {translate({id: "landing.HackathonTrackBPage.099", message: "Run the longer examples the page links to, such as the table-design and SQL-manual pages; they are checked less often."})}
                                    </p>
                                </li>
                                <li>
                                    <p>
                                        <strong>{translate({id: "landing.HackathonTrackBPage.100", message: "Review another Track B pull request."})}</strong> {translate({id: "landing.HackathonTrackBPage.101", message: "Run its demo on your Doris and leave a comment with what you got."})}
                                    </p>
                                </li>
                            </ul>
                        </section>

                        <section className={cardClass('help')} id="help">
                            <h3>{translate({id: "landing.HackathonTrackBPage.102", message: "Troubleshooting & references"})}</h3>
                            <RowsTable head={['Symptom', 'Fix']} rows={TROUBLESHOOTING} />
                            <h4 className="hk-task__subhead hk-task__label" id="references">
                                {translate({id: "landing.HackathonTrackBPage.103", message: "References"})}
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
