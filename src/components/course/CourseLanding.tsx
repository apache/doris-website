import React, { JSX } from 'react';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import { COURSE_101_MODULES } from './courseModules';
import './CourseLanding.scss';

function CoursePath(): JSX.Element {
    return (
        <aside className="course-landing__path-card" aria-labelledby="course-path-title">
            <div className="course-landing__path-header">
                <h2 id="course-path-title">Your Doris path</h2>
                <span>01 → 06</span>
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
                                Go from first principles to a working mental model of Apache Doris—architecture,
                                deployment, tables, data operations, SQL analytics, and lakehouse connectivity.
                            </p>
                            <ul className="course-landing__meta" aria-label="Course details">
                                <li>6 guided modules</li>
                                <li>Self-paced</li>
                                <li>Basic SQL + CLI</li>
                            </ul>
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
