/// <reference lib="es2022.intl" />
import React, {
    Children,
    cloneElement,
    isValidElement,
    JSX,
    ReactElement,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import {useHistory} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { COURSE_101_MODULES } from './courseModules';
import './CourseLesson.scss';

interface CourseCheck {
    question: string;
    options: string[];
    correctIndex: number;
    correctFeedback: string;
    incorrectFeedback: string;
}

function containsChinese(node: ReactNode): boolean {
    return Children.toArray(node).some(child => typeof child === 'string'
        ? /[\u3400-\u9fff]/.test(child)
        : isValidElement<{children?: ReactNode}>(child) && containsChinese(child.props.children));
}

function chineseTitleWords(title: ReactNode): ReactNode {
    const segmenter = new Intl.Segmenter('zh-CN', {granularity: 'word'});
    const format = (children: ReactNode): ReactNode => Children.map(children, child => {
        if (isValidElement<{children?: ReactNode}>(child))
            return cloneElement(child, {}, format(child.props.children));
        if (typeof child !== 'string') return child;
        const text = child.trim();
        if (!/[\u3400-\u9fff]/.test(text)) return text;
        const words: string[] = [];
        for (const {segment, isWordLike} of segmenter.segment(text)) {
            if (!isWordLike && /[，。！？、；：）”’]/.test(segment) && words.length)
                words[words.length - 1] += segment;
            else words.push(segment);
        }
        return words.map((word, index) => /^\s+$/.test(word) ? word
            : <span className="course-player__title-word" key={index}>{word}</span>);
    });
    return format(title);
}

interface CourseLessonUnitProps {
    id: string;
    label: string;
    title: ReactNode;
    summary: string;
    coachTitle: string;
    coach: ReactNode;
    calloutTitle?: string;
    callout?: ReactNode;
    check: CourseCheck;
    children: ReactNode;
}

interface CourseLessonPlayerProps {
    moduleNumber: number;
    title: string;
    readingTime: string;
    baseline: string;
    referenceHref: string;
    children: ReactNode;
}

interface CourseConceptItem {
    title: string;
    description: string;
}

interface CourseConceptFlowProps {
    ariaLabel: string;
    items: CourseConceptItem[];
    focusIndex?: number;
}

interface CourseConceptGridItem extends CourseConceptItem {
    tag: string;
}

interface CourseConceptGridProps {
    ariaLabel: string;
    items: CourseConceptGridItem[];
    columns?: 2 | 3 | 4;
}

interface CourseComparisonProps {
    ariaLabel: string;
    leftTitle: string;
    leftLead: string;
    leftItems: string[];
    rightTitle: string;
    rightLead: string;
    rightItems: string[];
}

interface CourseLayerStackProps {
    ariaLabel: string;
    items: CourseConceptItem[];
}

const RAIL_COLLAPSED_STORAGE_KEY = 'doris-101-rail-collapsed';

// The rail is styled off `<html data-course-rail>` rather than off React state so the
// COURSE_RAIL_BOOTSTRAP script in docusaurus.config.js can apply the stored choice
// before first paint. React state only mirrors it for the toggle's accessible state.
function applyRailCollapsed(collapsed: boolean): void {
    if (collapsed) {
        document.documentElement.setAttribute('data-course-rail', 'collapsed');
    } else {
        document.documentElement.removeAttribute('data-course-rail');
    }
}

export function CourseLessonUnit({ children }: CourseLessonUnitProps): JSX.Element {
    return <>{children}</>;
}

export function CourseConceptFlow({
    ariaLabel,
    items,
    focusIndex,
}: CourseConceptFlowProps): JSX.Element {
    return (
        <ol className="course-player-flow" aria-label={ariaLabel}>
            {items.map((item, index) => (
                <li
                    key={item.title}
                    className={focusIndex === index ? 'course-player-flow__item--focus' : undefined}
                >
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                </li>
            ))}
        </ol>
    );
}

export function CourseConceptGrid({
    ariaLabel,
    items,
    columns = 3,
}: CourseConceptGridProps): JSX.Element {
    return (
        <div
            className={`course-player-grid course-player-grid--${columns}`}
            role="list"
            aria-label={ariaLabel}
        >
            {items.map(item => (
                <article className="course-player-grid__item" role="listitem" key={item.title}>
                    <span>{item.tag}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                </article>
            ))}
        </div>
    );
}

export function CourseComparison({
    ariaLabel,
    leftTitle,
    leftLead,
    leftItems,
    rightTitle,
    rightLead,
    rightItems,
}: CourseComparisonProps): JSX.Element {
    const sides = [
        { title: leftTitle, lead: leftLead, items: leftItems },
        { title: rightTitle, lead: rightLead, items: rightItems },
    ];

    return (
        <div className="course-player-comparison" role="group" aria-label={ariaLabel}>
            {sides.map((side, index) => (
                <article
                    className={`course-player-comparison__side course-player-comparison__side--${index + 1}`}
                    key={side.title}
                >
                    <strong>{side.title}</strong>
                    <p>{side.lead}</p>
                    <ul>
                        {side.items.map(item => <li key={item}>{item}</li>)}
                    </ul>
                </article>
            ))}
        </div>
    );
}

export function CourseLayerStack({ ariaLabel, items }: CourseLayerStackProps): JSX.Element {
    return (
        <ol className="course-player-layers" aria-label={ariaLabel}>
            {items.map((item, index) => (
                <li key={item.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}

function unitIndexFromLocation(unitIds: string[]): number {
    if (typeof window === 'undefined') return 0;
    const requestedId = window.location.hash.replace(/^#/, '');
    const index = unitIds.indexOf(requestedId);
    return index >= 0 ? index : 0;
}

export function CourseLessonPlayer({
    moduleNumber,
    title,
    readingTime,
    baseline,
    referenceHref,
    children,
}: CourseLessonPlayerProps): JSX.Element {
    const units = Children.toArray(children).filter(isValidElement) as ReactElement<CourseLessonUnitProps>[];
    const history = useHistory();
    const isBrowser = useIsBrowser();
    const {i18n: {currentLocale}} = useDocusaurusContext();
    // Browser and server ICU versions can disagree on word boundaries.
    const formatChineseTitle = isBrowser && currentLocale === 'zh-CN' && typeof Intl.Segmenter === 'function';
    const unitIds = useMemo(() => units.map(unit => unit.props.id), [children]);
    const [activeUnit, setActiveUnit] = useState(0);
    const [railCollapsed, setRailCollapsed] = useState(false);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const didMount = useRef(false);
    const activeHeadingRef = useRef<HTMLHeadingElement>(null);
    const currentModule = COURSE_101_MODULES[moduleNumber - 1];
    const nextModule = COURSE_101_MODULES[moduleNumber];
    const activeUnitProps = units[activeUnit]?.props;
    const lastUnit = activeUnit === units.length - 1;
    const railToggleLabel = railCollapsed
        ? translate({id: 'course.lesson.expandModules', message: 'Expand course modules'})
        : translate({id: 'course.lesson.collapseModules', message: 'Collapse course modules'});

    useEffect(() => {
        const syncFromLocation = () => setActiveUnit(unitIndexFromLocation(unitIds));
        syncFromLocation();
        window.addEventListener('popstate', syncFromLocation);
        window.addEventListener('hashchange', syncFromLocation);
        return () => {
            window.removeEventListener('popstate', syncFromLocation);
            window.removeEventListener('hashchange', syncFromLocation);
        };
    }, [unitIds]);

    useEffect(() => {
        if (didMount.current) {
            activeHeadingRef.current?.focus();
        } else {
            didMount.current = true;
        }
    }, [activeUnit]);

    useEffect(() => {
        setRailCollapsed(document.documentElement.dataset.courseRail === 'collapsed');
    }, []);

    const toggleRail = () => {
        setRailCollapsed(current => {
            const next = !current;
            applyRailCollapsed(next);
            try {
                window.localStorage.setItem(RAIL_COLLAPSED_STORAGE_KEY, String(next));
            } catch {
                // Storage can be unavailable in hardened/private browsing.
            }
            return next;
        });
    };

    const selectUnit = (index: number) => {
        if (index < 0 || index >= units.length || index === activeUnit) return;
        setActiveUnit(index);
        const {pathname, search} = history.location;
        history.push({pathname, search, hash: `#${unitIds[index]}`});
    };

    return (
        <div className="course-player">
            <h1 className="course-player__seo-title">Doris 101: {title}</h1>
            <header className="course-player__topbar">
                <div className="course-player__identity">
                    <Link to="/course">Doris 101</Link>
                    <span aria-hidden="true" />
                    <strong>{currentModule?.title ?? title}</strong>
                </div>
                <div className="course-player__top-actions">
                    <span>{readingTime}</span>
                    <Link to={referenceHref}><Translate id="course.lesson.reference">Reference docs</Translate></Link>
                    <Link className="course-player__exit" to="/course"><Translate id="course.lesson.exit">Exit lesson</Translate></Link>
                </div>
            </header>

            <div className="course-player__shell">
                <aside className="course-player__rail" aria-label={translate({id: 'course.lesson.modulesAria', message: 'Doris 101 modules'})}>
                    <div className="course-player__rail-head">
                        <p className="course-player__rail-label"><Translate id="course.lesson.modules">Course modules</Translate></p>
                        <button
                            className="course-player__rail-toggle"
                            type="button"
                            aria-expanded={!railCollapsed}
                            aria-label={railToggleLabel}
                            title={railToggleLabel}
                            onClick={toggleRail}
                        >
                            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                                <path
                                    d="M10.5 3 5.5 8l5 5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                    <ol>
                        {COURSE_101_MODULES.map((module, index) => {
                            const isCurrent = index === moduleNumber - 1;
                            const content = (
                                <>
                                    <span className="course-player__module-number">{module.number}</span>
                                    <span className="course-player__module-copy">
                                        <strong>{module.shortTitle}</strong>
                                        <small>{module.description}</small>
                                        {isCurrent && activeUnitProps && (
                                            <em>{activeUnit + 1}. {activeUnitProps.label}</em>
                                        )}
                                    </span>
                                </>
                            );

                            return (
                                <li className={isCurrent ? 'course-player__module--active' : undefined} key={module.number}>
                                    {isCurrent ? (
                                        <div
                                            aria-current="step"
                                            data-title={module.shortTitle}
                                            data-description={module.description}
                                        >
                                            {content}
                                        </div>
                                    ) : (
                                        <Link
                                            to={module.href}
                                            data-title={module.shortTitle}
                                            data-description={module.description}
                                        >
                                            {content}
                                        </Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </aside>

                <main className="course-player__learning">
                    <div className="course-player__learning-head">
                        <div>
                            <span>{translate({id: 'course.lesson.moduleNumber', message: 'Module {number}'}, {number: String(moduleNumber).padStart(2, '0')})}</span>
                            <strong>{activeUnitProps?.label}</strong>
                        </div>
                        <span className="course-player__baseline">{translate({id: 'course.lesson.baseline', message: 'Baseline: {baseline}'}, {baseline})}</span>
                        <div
                            className="course-player__progress"
                            role="progressbar"
                            aria-label={translate({id: 'course.lesson.progress', message: 'Lesson progress'})}
                            aria-valuemin={1}
                            aria-valuemax={units.length}
                            aria-valuenow={activeUnit + 1}
                        >
                            <span>{activeUnit + 1} / {units.length}</span>
                            <i><b style={{ width: `${((activeUnit + 1) / units.length) * 100}%` }} /></i>
                        </div>
                    </div>

                    <section className="course-player__stage" aria-live="polite">
                        {units.map((unit, index) => {
                            const props = unit.props;
                            const selectedAnswer = answers[props.id];
                            const answered = typeof selectedAnswer === 'number';
                            const correct = selectedAnswer === props.check.correctIndex;

                            return (
                                <article
                                    className="course-player__unit"
                                    id={props.id}
                                    key={props.id}
                                    hidden={index !== activeUnit}
                                >
                                    <div className="course-player__visual">
                                        <span className="course-player__unit-label">{props.label}</span>
                                        <h2 ref={index === activeUnit ? activeHeadingRef : undefined} tabIndex={-1}>
                                            {formatChineseTitle && containsChinese(props.title) ? chineseTitleWords(props.title) : props.title}
                                        </h2>
                                        <p className="course-player__summary">{props.summary}</p>
                                        <div className="course-player__visual-content">{props.children}</div>
                                        <span className="course-player__visual-ring" aria-hidden="true" />
                                    </div>

                                    <aside className="course-player__coach">
                                        <span className="course-player__coach-label"><Translate id="course.lesson.coachNote">Coach note</Translate></span>
                                        <h3>{props.coachTitle}</h3>
                                        <div className="course-player__coach-copy">{props.coach}</div>
                                        {props.callout && (
                                            <div className="course-player__callout">
                                                {props.calloutTitle && <strong>{props.calloutTitle}</strong>}
                                                <div>{props.callout}</div>
                                            </div>
                                        )}
                                        <div className="course-player__check">
                                            <strong>{props.check.question}</strong>
                                            <div role="group" aria-label={props.check.question}>
                                                {props.check.options.map((option, optionIndex) => (
                                                    <button
                                                        type="button"
                                                        className={selectedAnswer === optionIndex ? 'course-player__answer--selected' : undefined}
                                                        aria-pressed={selectedAnswer === optionIndex}
                                                        onClick={() => setAnswers(current => ({ ...current, [props.id]: optionIndex }))}
                                                        key={option}
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                            <p
                                                className={answered ? (correct ? 'course-player__feedback--correct' : 'course-player__feedback--retry') : undefined}
                                                aria-live="polite"
                                            >
                                                {answered ? (correct ? props.check.correctFeedback : props.check.incorrectFeedback) : <Translate id="course.lesson.chooseAnswer">Choose an answer to check your understanding.</Translate>}
                                            </p>
                                        </div>
                                    </aside>
                                </article>
                            );
                        })}
                    </section>

                    <footer className="course-player__controls">
                        {activeUnit === 0 ? (
                            <Link className="course-player__previous" to="/course"><Translate id="course.lesson.overview">← Course overview</Translate></Link>
                        ) : (
                            <button className="course-player__previous" type="button" onClick={() => selectUnit(activeUnit - 1)}>
                                <Translate id="course.lesson.previous">← Previous unit</Translate>
                            </button>
                        )}
                        <div className="course-player__dots" aria-label={translate({id: 'course.lesson.units', message: 'Lesson units'})}>
                            {units.map((unit, index) => (
                                <button
                                    type="button"
                                    className={index === activeUnit ? 'course-player__dot--active' : undefined}
                                    aria-label={translate({id: 'course.lesson.openUnit', message: 'Open unit {number}: {label}'}, {number: index + 1, label: unit.props.label})}
                                    aria-current={index === activeUnit ? 'step' : undefined}
                                    onClick={() => selectUnit(index)}
                                    key={unit.props.id}
                                />
                            ))}
                        </div>
                        {lastUnit ? (
                            <Link className="course-player__next" to={nextModule?.href ?? '/course'}>
                                {nextModule ? translate({id: 'course.lesson.nextModule', message: 'Next module: {title} →'}, {title: nextModule.shortTitle}) : <Translate id="course.lesson.finish">Finish course →</Translate>}
                            </Link>
                        ) : (
                            <button className="course-player__next" type="button" onClick={() => selectUnit(activeUnit + 1)}>
                                <Translate id="course.lesson.continue">Continue →</Translate>
                            </button>
                        )}
                    </footer>
                </main>
            </div>
        </div>
    );
}
