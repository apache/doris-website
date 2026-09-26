import React, { JSX } from 'react';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import { COURSE_101_MODULES } from './courseModules';
import './CourseLanding.scss';

function CoursePath(): JSX.Element {
    return (
        <aside className="course-landing__path-card" aria-labelledby="course-path-title">
            <div className="course-landing__path-header">
                <h2 id="course-path-title">Your Doris path</h2>
                <span>6 available · more to come</span>
            </div>
            <ol className="course-landing__path-list">
                {COURSE_101_MODULES.map((module, index) => (
                    <li key={module.number}>
                        <a
                            className={`course-landing__path-step${index === 0 ? ' course-landing__path-step--current' : ''}`}
                            href={module.href}
                        >
                            <span className="course-landing__path-number">{module.number}</span>
                            <span className="course-landing__path-name">{module.shortTitle}</span>
                            <span className="course-landing__path-arrow" aria-hidden="true">→</span>
                        </a>
                    </li>
                ))}
                <li>
                    <div
                        className="course-landing__path-coming"
                        aria-label="More Doris 101 courses coming soon"
                    >
                        <span className="course-landing__path-number" aria-hidden="true">+</span>
                        <span className="course-landing__path-name">
                            More courses
                            <small>Coming soon</small>
                        </span>
                        <span className="course-landing__path-more-mark" aria-hidden="true">···</span>
                    </div>
                </li>
            </ol>
        </aside>
    );
}

export function CourseLanding(): JSX.Element {
    return (
        <LayoutNext
            title="Apache Doris 101 Course"
            description="Free Apache Doris 101 course covering architecture, deployment, table design, data operations, analytical queries, and lakehouse connectivity."
        >
            <div className="course-landing">
                <section className="course-landing__hero" aria-labelledby="course-title">
                    <div className="course-landing__hero-ring" aria-hidden="true" />
                    <div className="course-landing__container course-landing__hero-grid">
                        <div className="course-landing__hero-copy">
                            <p className="course-landing__eyebrow">Free course · Beginner friendly</p>
                            <h1 id="course-title">
                                Learn Doris.
                                <span>Build for real.</span>
                            </h1>
                            <p className="course-landing__lead">
                                Start with the fundamentals of OLAP databases, then move on to advanced topics and
                                practical use of Apache Doris. The course connects general database concepts with
                                Doris&apos;s core capabilities, so you can understand and use Doris more effectively.
                                The database knowledge you gain will also apply to other systems.
                            </p>
                            <div className="course-landing__actions">
                                <a className="course-landing__button course-landing__button--primary" href={COURSE_101_MODULES[0].href}>
                                    Start with the overview →
                                </a>
                            </div>
                        </div>
                        <CoursePath />
                    </div>
                </section>
            </div>
        </LayoutNext>
    );
}
