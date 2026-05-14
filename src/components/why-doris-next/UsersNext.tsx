import React, { JSX, useEffect, useMemo, useState } from 'react';
import { LayoutNext } from '../home-next/LayoutNext';
import { USER_STORIES_CATEGORIES } from '@site/src/constant/user.data';
import USERS from '@site/src/constant/users.data.json';
import UserItem from '../user-item/user-item';
import './UsersNext.scss';

const ALL_TEXT = 'All';
const PAGE_SIZE = 32;

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
        if (!('IntersectionObserver' in window)) {
            items.forEach((item) => item.classList.add('is-visible'));
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );

        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, []);
}

function BoltIcon({ size = 24, color = '#FFD23F' }: { size?: number | string; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"
                fill={color}
                stroke={color}
                strokeWidth="0.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function UsersHero(): JSX.Element {
    return (
        <section className="users-next__hero" id="hero">
            <div className="users-next__hero-bg" aria-hidden="true" />
            <div className="users-next__hero-grid" aria-hidden="true" />
            <div className="users-next__container">
                <div className="users-next__hero-stack">
                    <h1 className="users-next__hero-title" data-reveal data-reveal-delay="1">
                        Start real-time journey
                        <br />
                        with{' '}
                        <span className="users-next__accent">
                            innovators
                            <span className="users-next__bolt-inline">
                                <BoltIcon size="0.85em" />
                            </span>
                        </span>
                    </h1>
                    <p className="users-next__hero-sub" data-reveal data-reveal-delay="2">
                        Over 10,000+ global leaders and enterprises are powered by Apache Doris.
                    </p>
                    <div className="users-next__hero-cta" data-reveal data-reveal-delay="3">
                        <a
                            className="users-next__cta"
                            href="https://github.com/apache/doris/discussions/27683"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Share your story
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function UsersGridSection(): JSX.Element {
    const [active, setActive] = useState<string>(ALL_TEXT);
    const [currentSize, setCurrentSize] = useState<number>(PAGE_SIZE);

    const users = useMemo(() => {
        const source = active === ALL_TEXT ? USERS : USERS.filter((user) => user.category === active);
        return [...source].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }, [active]);

    function changeCategory(category: string) {
        setCurrentSize(PAGE_SIZE);
        if (USER_STORIES_CATEGORIES.includes(category)) {
            setActive(category);
        } else {
            setActive(ALL_TEXT);
        }
    }

    return (
        <section className="users-next__section" id="users">
            <div className="users-next__container">
                <ul className="users-next__cats" data-reveal>
                    {USER_STORIES_CATEGORIES.map((item) => (
                        <li key={item}>
                            <button
                                type="button"
                                onClick={() => changeCategory(item)}
                                className={`users-next__cat ${active === item ? 'is-active' : ''}`}
                            >
                                {item}
                            </button>
                        </li>
                    ))}
                </ul>

                <ul className="users-next__grid" data-reveal data-reveal-delay="1">
                    {users.slice(0, currentSize).map((user) => (
                        <UserItem key={user.name} {...user} />
                    ))}
                </ul>

                {currentSize < users.length && (
                    <div className="users-next__more-wrap">
                        <button
                            type="button"
                            onClick={() =>
                                setCurrentSize((size) => Math.min(size + PAGE_SIZE, users.length))
                            }
                            className="users-next__more"
                        >
                            <span>View more</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="17"
                                height="17"
                                viewBox="0 0 17 17"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4.5 9.82226L8.5 13.8222L12.5 9.82227"
                                    stroke="currentColor"
                                    strokeWidth="1.37143"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.49951 3.82227L8.49951 13.8223"
                                    stroke="currentColor"
                                    strokeWidth="1.37143"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

function UsersContent(): JSX.Element {
    useRevealObserver();

    return (
        <div className="users-next">
            <UsersHero />
            <UsersGridSection />
        </div>
    );
}

export default function UsersNext(): JSX.Element {
    return (
        <LayoutNext
            title="Apache Doris - User Stories | Start real-time journey with innovators"
            description="Over 4000 global leaders and enterprises are powered by Apache Doris, using OLAP DBMS to drive real-world applications, from lakehouse and ad-hoc analytics to user behavior analytics and more."
        >
            <UsersContent />
        </LayoutNext>
    );
}
