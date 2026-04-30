import React, { JSX, useState, useEffect } from 'react';
import './HeroSection.scss';

// ─── SVG atoms ───────────────────────────────────────────────────────────────

function LightningSvg({ size = 24, color = '#FFD23F' }: { size?: number; color?: string }): JSX.Element {
    return (
        <svg
            className="hero-next-lightning"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
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

function DownloadIcon(): JSX.Element {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
        </svg>
    );
}

function SlackIcon(): JSX.Element {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
    );
}

// ─── SQL Typewriter ───────────────────────────────────────────────────────────

type TokenClass = 'kw' | 'fn' | 'str' | 'num' | 'op' | 'cmt';
type SqlToken = [TokenClass, string];
type SqlLine = SqlToken[];

const SQL_LINES: SqlLine[] = [
    [['kw', 'SELECT '], ['fn', 'title']],
    [['kw', 'FROM '], ['fn', 'docs']],
    [['kw', 'WHERE '], ['fn', 'category'], ['op', ' = '], ['str', "'AI'"]],
    [['op', '  '], ['kw', 'AND '], ['fn', 'MATCH'], ['op', '('], ['fn', 'content'], ['op', ', '], ['str', "'hybrid search'"], ['op', ')']],
    [['op', '  '], ['kw', 'AND '], ['fn', 'COSINE_SIMILARITY'], ['op', '('], ['fn', 'embedding'], ['op', ', '], ['num', '[0.12, ...]'], ['op', ') > '], ['num', '0.8']],
    [['kw', 'ORDER BY '], ['fn', 'publish_time'], ['kw', ' DESC']],
    [['kw', 'LIMIT '], ['num', '5'], ['op', ';']],
];

interface FlatSeg {
    cls: TokenClass;
    text: string;
    start: number;
    end: number;
}

interface FlatLine {
    segs: FlatSeg[];
    total: number;
}

function flattenLines(lines: SqlLine[]): FlatLine[] {
    return lines.map(line => {
        let total = 0;
        const segs: FlatSeg[] = line.map(([cls, text]) => {
            const seg: FlatSeg = { cls, text, start: total, end: total + text.length };
            total += text.length;
            return seg;
        });
        return { segs, total };
    });
}

interface TypewriterResult {
    rendered: Array<Array<{ cls: TokenClass; text: string }>>;
    isDone: boolean;
    activeLine: number;
}

function useTypewriter(lines: SqlLine[], speed = 22, finalPause = 2400): TypewriterResult {
    const flat = flattenLines(lines);
    const totalChars = flat.reduce((s, l) => s + l.total, 0);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const cycle = totalChars + Math.floor(finalPause / speed);
        const id = setInterval(() => setTick(t => (t + 1) % cycle), speed);
        return () => clearInterval(id);
    }, [totalChars, speed, finalPause]);

    const typed = Math.min(tick, totalChars);
    const isDone = tick >= totalChars;

    const lineProgress: number[] = [];
    let remaining = typed;
    let activeLine = 0;
    for (let i = 0; i < flat.length; i++) {
        const t = Math.min(remaining, flat[i].total);
        lineProgress.push(t);
        remaining -= t;
        if (t > 0 && t < flat[i].total) activeLine = i;
        else if (t === flat[i].total && i < flat.length - 1 && remaining === 0) activeLine = i + 1;
    }

    const rendered = flat.map((line, i) => {
        const limit = lineProgress[i];
        const out: Array<{ cls: TokenClass; text: string }> = [];
        for (const seg of line.segs) {
            if (seg.start >= limit) break;
            const visibleEnd = Math.min(seg.end, limit);
            out.push({ cls: seg.cls, text: seg.text.slice(0, visibleEnd - seg.start) });
        }
        return out;
    });

    return { rendered, isDone, activeLine };
}

// ─── SQL Card ────────────────────────────────────────────────────────────────

function SqlCard(): JSX.Element {
    const { rendered, isDone, activeLine } = useTypewriter(SQL_LINES);
    return (
        <div className="hn-sql-card">
            <div className="hn-sql-card__bar">
                <span className="hn-sql-card__dot hn-sql-card__dot--r" />
                <span className="hn-sql-card__dot hn-sql-card__dot--y" />
                <span className="hn-sql-card__dot hn-sql-card__dot--g" />
                <span className="hn-sql-card__title">~/queries/realtime.sql</span>
                <span className="hn-sql-card__tag">DORIS</span>
            </div>
            <div className="hn-sql-card__body">
                {SQL_LINES.map((_, i) => (
                    <div className="hn-sql-card__line" key={i}>
                        <span className="hn-sql-card__ln">{String(i + 1).padStart(2, '0')}</span>
                        <span className="hn-sql-card__content">
                            {rendered[i].map((seg, j) => (
                                <span key={j} className={seg.cls ? `hn-sql-card__tok--${seg.cls}` : ''}>
                                    {seg.text}
                                </span>
                            ))}
                            {!isDone && i === activeLine && (
                                <span className="hn-sql-card__cursor" />
                            )}
                        </span>
                    </div>
                ))}
            </div>
            <div className="hn-sql-card__result">
                <LightningSvg size={18} />
                <span className="hn-sql-card__result-text">
                    {isDone ? '5 docs · scanned 18.4M vectors' : 'Executing query…'}
                </span>
                <span className="hn-sql-card__result-time">
                    {isDone ? '0.043s' : '—'}
                </span>
            </div>
        </div>
    );
}

// ─── Search Results ───────────────────────────────────────────────────────────

interface SearchResult {
    title: string;
    date: string;
    text: number;
    vec: number;
    str: number;
}

const SEARCH_RESULTS: SearchResult[] = [
    { title: 'A Practical Guide to Hybrid Search in Production',     date: '2026-04-22', text: 0.94, vec: 0.96, str: 1.00 },
    { title: 'Vector + BM25: Lessons from Re-ranking 1B Documents',  date: '2026-04-15', text: 0.88, vec: 0.93, str: 1.00 },
    { title: 'Why Apache Doris Beats Bolt-On Vector Stores',         date: '2026-04-09', text: 0.81, vec: 0.91, str: 1.00 },
    { title: 'Hybrid Search Patterns for RAG-Heavy Workloads',       date: '2026-04-02', text: 0.79, vec: 0.86, str: 1.00 },
    { title: 'Tuning COSINE_SIMILARITY Thresholds for AI Pipelines', date: '2026-03-28', text: 0.74, vec: 0.83, str: 1.00 },
];

function SearchResults(): JSX.Element {
    const [revealed, setRevealed] = useState(0);
    const [filled, setFilled] = useState(false);

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];
        function cycle() {
            setRevealed(0);
            setFilled(false);
            for (let i = 1; i <= SEARCH_RESULTS.length; i++) {
                timers.push(setTimeout(() => setRevealed(i), 180 * i));
            }
            timers.push(setTimeout(() => setFilled(true), 180 * (SEARCH_RESULTS.length + 1)));
            timers.push(setTimeout(cycle, 6500));
        }
        cycle();
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="hn-search-results">
            <div className="hn-search-results__head">
                <span className="hn-search-results__head-label">RESULT · 5 DOCS · RANKED</span>
                <span className="hn-search-results__legend">
                    <span className="hn-search-results__legend-chip">
                        <i className="hn-search-results__dot hn-search-results__dot--text" />
                        Full-text
                    </span>
                    <span className="hn-search-results__legend-chip">
                        <i className="hn-search-results__dot hn-search-results__dot--vec" />
                        Vector
                    </span>
                    <span className="hn-search-results__legend-chip">
                        <i className="hn-search-results__dot hn-search-results__dot--str" />
                        Filter
                    </span>
                </span>
            </div>
            <div className="hn-search-results__rows">
                {SEARCH_RESULTS.map((r, i) => {
                    const visible = i < revealed;
                    const composite = (r.text + r.vec + r.str) / 3;
                    return (
                        <div
                            key={i}
                            className={`hn-search-results__row${visible ? ' hn-search-results__row--visible' : ''}`}
                            style={{ transitionDelay: `${i * 30}ms` }}
                        >
                            <span className="hn-search-results__rank">#{i + 1}</span>
                            <div className="hn-search-results__info">
                                <div className="hn-search-results__title">{r.title}</div>
                                <div className="hn-search-results__meta">
                                    <span>category=<strong>AI</strong></span>
                                    <span className="hn-search-results__meta-dot">·</span>
                                    <span>{r.date}</span>
                                </div>
                            </div>
                            <div className="hn-search-results__bars">
                                {(['text', 'vec', 'str'] as const).map(type => (
                                    <div key={type} className="hn-search-results__bar-track">
                                        <div
                                            className={`hn-search-results__bar-fill hn-search-results__bar-fill--${type}`}
                                            style={{ width: filled && visible ? `${r[type] * 100}%` : '0%' }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <span className="hn-search-results__score">{composite.toFixed(2)}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── User Logo Marquee ───────────────────────────────────────────────────────

interface UserLogo {
    name: string;
    file: string;       // path under /images/user-logo (URL-encoded by encodeURI at render time)
    href: string;       // empty string = no target yet
}

const USER_LOGOS: UserLogo[] = [
    { name: 'ByteDance',           file: 'Technology/ByteDance.jpg',                       href: '' },
    { name: 'Xiaomi',              file: 'Technology/Xiaomi.jpg',                          href: '' },
    { name: 'Baidu',               file: 'Technology/Baidu.jpg',                           href: '' },
    { name: 'JD.com',              file: 'Technology/JD.com.jpg',                          href: '' },
    { name: 'Tencent',             file: 'Technology/Tencent.jpg',                         href: '' },
    { name: 'NIO',                 file: 'Telecom & Manufacturing/NIO.jpg',                href: '' },
    { name: 'Lenovo',              file: 'Telecom & Manufacturing/Lenovo.jpg',             href: '' },
    { name: 'Bank of China',       file: 'Finance/Bank of China.jpg',                      href: '' },
    { name: 'Ping An',             file: 'Finance/Ping An Insurance Group.jpg',            href: '' },
    { name: 'Meituan',             file: 'Media & Entertainment/Meituan.jpg',              href: '' },
    { name: 'TikTok',              file: 'Media & Entertainment/TikTok.jpg',               href: '' },
    { name: 'NetEase',             file: 'Media & Entertainment/NetEase.jpg',              href: '' },
];

function UserLogoItem({ logo }: { logo: UserLogo }): JSX.Element {
    const src = `/images/user-logo/${encodeURI(logo.file)}`;
    const content = (
        <img
            src={src}
            alt={logo.name}
            title={logo.name}
            loading="lazy"
            draggable={false}
        />
    );
    if (logo.href) {
        return (
            <a className="hero-next__user-logo" href={logo.href} aria-label={logo.name}>
                {content}
            </a>
        );
    }
    // Render a button-like span when no link is wired up yet, so the slot still
    // looks clickable but has no destination.
    return (
        <span className="hero-next__user-logo hero-next__user-logo--placeholder" role="link" aria-label={logo.name}>
            {content}
        </span>
    );
}

function UserLogoMarquee(): JSX.Element {
    // Render the list twice back-to-back so the CSS translate animation can
    // loop seamlessly (the second copy slides in as the first slides out).
    return (
        <div className="hero-next__logos" aria-label="Companies using Apache Doris">
            <div className="hero-next__logos-track">
                {USER_LOGOS.map((logo, i) => (
                    <UserLogoItem key={`a-${i}`} logo={logo} />
                ))}
                {USER_LOGOS.map((logo, i) => (
                    <UserLogoItem key={`b-${i}`} logo={logo} />
                ))}
            </div>
        </div>
    );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

export function HeroSection(): JSX.Element {
    return (
        <section className="hero-next">
            {/* Layered backgrounds */}
            <div className="hero-next__bg-glow" aria-hidden="true" />
            <div className="hero-next__bg-grid" aria-hidden="true" />
            <div className="hero-next__bolt-bg" aria-hidden="true">
                <svg viewBox="0 0 600 600" width="600" height="600">
                    <path
                        d="M340 60 L160 340 L290 340 L240 540 L440 240 L310 240 L370 60 Z"
                        fill="rgba(255, 210, 63, 0.08)"
                        stroke="rgba(255, 210, 63, 0.25)"
                        strokeWidth="2"
                    />
                </svg>
            </div>

            {/* Main content grid */}
            <div className="hero-next__content">
                {/* ── Left column ── */}
                <div className="hero-next__left">

                    <h1 className="hero-next__title">
                        <span className="hero-next__title-line">Lightning</span>
                        <span className="hero-next__title-line hero-next__title-fast">
                            <span className="hero-next__title-accent">Fast</span>
                            <LightningSvg size={56} />
                        </span>
                        <span className="hero-next__title-line">
                            <span className="hero-next__title-accent">Analytics</span> and
                        </span>
                        <span className="hero-next__title-line">
                            <span className="hero-next__title-accent">Search</span> Database
                        </span>
                    </h1>

                    <p className="hero-next__sub">
                        Apache Doris is an open-source, real-time database for modern analytics
                        and AI — built for both bare-metal shared-nothing and cloud-native
                        disaggregated modes.
                    </p>

                    <div className="hero-next__ctas">
                        <a className="hero-next__btn hero-next__btn--yellow" href="/download">
                            <DownloadIcon />
                            Download
                        </a>
                        <a className="hero-next__btn hero-next__btn--primary" href="/docs/get-started/quick-start">
                            Get Started
                        </a>
                        <a
                            className="hero-next__btn hero-next__btn--ghost"
                            href="https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2gmq5o30h-455W226d79plXqPnpRPWYA"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <SlackIcon />
                            Join Slack
                        </a>
                    </div>

                    <div className="hero-next__meta">
                        <div className="hero-next__meta-item">
                            <span className="hero-next__meta-num">600+</span>
                            <span>Contributors</span>
                        </div>
                        <div className="hero-next__meta-item">
                            <span className="hero-next__meta-num">5,000+</span>
                            <span>Companies</span>
                        </div>
                        <div className="hero-next__meta-item">
                            <span className="hero-next__meta-num">Apache 2.0</span>
                            <span>License</span>
                        </div>
                    </div>

                    <div className="hero-next__logos-frame">
                        <UserLogoMarquee />
                    </div>
                </div>

                {/* ── Right column ── */}
                <div className="hero-next__right">
                    <div className="hero-next__card-wrap">
                        <div className="hero-next__sql-wrap">
                            <SqlCard />
                            <div className="hero-next__perf-pill">
                                <LightningSvg size={14} color="#0F1A14" />
                                <span>
                                    <strong>Structured + Full-text + Vector</strong> — all in one SQL.
                                </span>
                            </div>
                        </div>
                        <SearchResults />
                    </div>
                </div>
            </div>

            {/* Floating decorative shapes */}
            <div className="hero-next__shape hero-next__shape--diamond" style={{ top: '120px', right: '460px' }} />
            <div className="hero-next__shape hero-next__shape--ring"    style={{ top: '160px', left: '52%' }} />
        </section>
    );
}
