import React, { JSX, ReactNode, useEffect, useState } from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '@site/src/components/home-next/LayoutNext';
import { UseCaseIcon, UseCaseIconName } from './UseCaseIcons';
import './UseCasePage.scss';

// ------------------------------------------------------------------ content model
// Every /use-cases/* page is this shape: hero, "why it matters", optional customer
// cases, "what it demands / how Doris answers" (figure + requirements + capability tags),
// and the CTA. Page files only provide content; layout and styling live here.

export interface UseCaseLink {
    label: string;
    href?: string;
}

export interface UseCaseValueCard {
    id: string;
    icon: UseCaseIconName;
    title: string;
    summary: string;
}

export interface UseCaseLogo {
    src: string;
    alt: string;
    height?: number;
    invert?: boolean;
    text?: string;
    textColor?: string;
}

export interface UseCaseStudy {
    id: string;
    num: string;
    title: string;
    /** Verbatim quote from the linked article; rendered in quotation marks. */
    quote?: string;
    /** Our own one-paragraph summary; rendered without quotation marks. */
    summary?: string;
    scenario?: string;
    outcomes: string[];
    href: string;
    logo: UseCaseLogo;
}

export interface UseCaseRequirement {
    id: string;
    title: string;
    desc: string;
}

export interface UseCaseCapability {
    id: string;
    title: ReactNode;
    poweredBy: UseCaseLink[];
    related?: { to: string; title: string };
}

export interface UseCasePageContent {
    slug: string;
    screenLabel: string;
    meta: { title: string; description: string };
    hero: { title: ReactNode; sub: string };
    value: {
        title: string[];
        lead: string;
        points: string[];
        cards: UseCaseValueCard[];
    };
    cases?: {
        title: string;
        sub: string;
        items: UseCaseStudy[];
    };
    tech: {
        title: string[];
        sub: string;
        figure: ReactNode;
        requirements: UseCaseRequirement[];
        capabilitiesTitle: string;
        capabilities: UseCaseCapability[];
    };
    cta: { title: ReactNode };
}

type Tone = 'dark' | 'darkest';

// ------------------------------------------------------------------ hooks

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.uc-page [data-reveal]');
        if (!('IntersectionObserver' in window)) {
            items.forEach(i => i.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        e.target.classList.add('is-visible');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
        items.forEach(i => io.observe(i));
        return () => io.disconnect();
    }, []);
}

// ------------------------------------------------------------------ building blocks

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

function Section({
    id,
    tone,
    grid,
    children,
    className,
}: {
    id: string;
    tone: Tone;
    grid?: boolean;
    children: ReactNode;
    className?: string;
}): JSX.Element {
    return (
        <section className={`uc-section uc-section--${tone}${className ? ` ${className}` : ''}`} id={id}>
            {grid ? <div className="uc-section__grid" aria-hidden="true" /> : null}
            <div className="uc-container uc-section__inner">{children}</div>
        </section>
    );
}

function StackedTitle({ lines }: { lines: string[] }): JSX.Element {
    return (
        <h2 className="uc-title">
            {lines.map(line => (
                <span key={line}>{line}</span>
            ))}
        </h2>
    );
}

function Hero({ content }: { content: UseCasePageContent }): JSX.Element {
    return (
        <section className="uc-hero" id="hero">
            <div className="uc-hero__bg" aria-hidden="true" />
            <div className="uc-hero__grid" aria-hidden="true" />
            <div className="uc-container">
                <div className="uc-hero__copy">
                    <h1 className="uc-hero__title" data-reveal data-reveal-delay="1">
                        {content.hero.title}
                    </h1>
                    <p className="uc-hero__sub" data-reveal data-reveal-delay="2">
                        {content.hero.sub}
                    </p>
                </div>
            </div>
        </section>
    );
}

function ValueSection({ content, tone }: { content: UseCasePageContent; tone: Tone }): JSX.Element {
    const { value } = content;
    return (
        <Section id="value" tone={tone} grid>
            <div className="uc-value">
                <div className="uc-value__copy" data-reveal>
                    <StackedTitle lines={value.title} />
                    <p className="uc-value__lead">{value.lead}</p>
                    <ul className="uc-value__points">
                        {value.points.map(p => (
                            <li key={p} className="uc-value__point" data-reveal>
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>
                <ol className="uc-value__cards">
                    {value.cards.map((c, i) => (
                        <li key={c.id} className="uc-value-card" data-reveal>
                            <div className="uc-value-card__meta">
                                <span className="uc-value-card__num">{pad(i + 1)}</span>
                                <span className="uc-value-card__icon" aria-hidden="true">
                                    <UseCaseIcon name={c.icon} />
                                </span>
                            </div>
                            <div className="uc-value-card__body">
                                <h3 className="uc-value-card__title">{c.title}</h3>
                                <p className="uc-value-card__summary">{c.summary}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </Section>
    );
}

function CaseCard({ study, index }: { study: UseCaseStudy; index: number }): JSX.Element {
    const { logo } = study;
    return (
        <a
            className="uc-case"
            href={study.href}
            target="_blank"
            rel="noreferrer"
            data-reveal
            data-reveal-delay={index > 0 ? String(index) : undefined}
        >
            <div className="uc-case__num">{study.num}</div>
            <h3 className="uc-case__title">{study.title}</h3>
            {study.quote ? (
                <p className="uc-case__lead uc-case__lead--quote">&ldquo;{study.quote}&rdquo;</p>
            ) : study.summary ? (
                <p className="uc-case__lead">{study.summary}</p>
            ) : null}
            {study.scenario ? (
                <>
                    <div className="uc-case__label">Scenario</div>
                    <p className="uc-case__scenario">{study.scenario}</p>
                </>
            ) : null}
            <div className="uc-case__label">Outcome</div>
            <ul className="uc-case__outcomes">
                {study.outcomes.map(o => (
                    <li key={o}>{o}</li>
                ))}
            </ul>
            <span className="uc-case__footer">
                <img
                    className={`uc-case__logo${logo.invert ? ' uc-case__logo--invert' : ''}`}
                    src={logo.src}
                    alt={logo.alt}
                    style={logo.height ? { height: logo.height } : undefined}
                    loading="lazy"
                />
                {logo.text ? (
                    <span
                        className="uc-case__logo-text"
                        style={logo.textColor ? { color: logo.textColor } : undefined}
                    >
                        {logo.text}
                    </span>
                ) : null}
            </span>
        </a>
    );
}

function CasesSection({
    cases,
    tone,
}: {
    cases: NonNullable<UseCasePageContent['cases']>;
    tone: Tone;
}): JSX.Element {
    return (
        <Section id="cases" tone={tone} grid>
            <div className="uc-head uc-head--wide" data-reveal>
                <h2 className="uc-title">{cases.title}</h2>
                <p className="uc-sub">{cases.sub}</p>
            </div>
            <div className="uc-cases">
                {cases.items.map((c, i) => (
                    <CaseCard key={c.id} study={c} index={i} />
                ))}
            </div>
        </Section>
    );
}

function Requirements({
    slug,
    requirements,
}: {
    slug: string;
    requirements: UseCaseRequirement[];
}): JSX.Element {
    const [open, setOpen] = useState<string | null>(null);
    return (
        <div className="uc-tech__list">
            {requirements.map((r, i) => {
                const isOpen = open === r.id;
                const bodyId = `${slug}-req-${r.id}`;
                return (
                    <article className={`uc-req${isOpen ? ' is-open' : ''}`} key={r.id}>
                        <button
                            type="button"
                            className="uc-req__trigger"
                            onClick={() => setOpen(isOpen ? null : r.id)}
                            aria-expanded={isOpen}
                            aria-controls={bodyId}
                        >
                            <span className="uc-req__index">{pad(i + 1)}</span>
                            <span className="uc-req__title">{r.title}</span>
                            <svg
                                className="uc-req__icon"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                {isOpen ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
                            </svg>
                        </button>
                        {isOpen ? (
                            <div className="uc-req__body" id={bodyId}>
                                <p>{r.desc}</p>
                            </div>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}

function TechSection({ content, tone }: { content: UseCasePageContent; tone: Tone }): JSX.Element {
    const { tech } = content;
    return (
        <Section id="tech" tone={tone}>
            <div className="uc-head uc-head--wide" data-reveal>
                <StackedTitle lines={tech.title} />
                <p className="uc-sub">{tech.sub}</p>
            </div>
            <div className="uc-tech" data-reveal>
                <div className="uc-tech__figure">{tech.figure}</div>
                <Requirements slug={content.slug} requirements={tech.requirements} />
            </div>
        </Section>
    );
}

function CapabilitiesSection({
    content,
    tone,
}: {
    content: UseCasePageContent;
    tone: Tone;
}): JSX.Element {
    const { tech } = content;
    const cols = { '--uc-tag-cols': String(tech.capabilities.length) } as React.CSSProperties;
    return (
        <Section id="capabilities" tone={tone}>
            <h3 className="uc-kicker">{tech.capabilitiesTitle}</h3>
            <p className="uc-sub">
                Each capability links to its feature doc. For the engineering detail behind them,
                read the <Link to="/blog">Apache Doris blog</Link>.
            </p>
            <div className="uc-capabilities" style={cols} data-reveal>
                {tech.capabilities.map((c, i) => (
                    <article className="uc-tag" key={c.id}>
                        <span className="uc-tag__hole" aria-hidden="true" />
                        <div className="uc-tag__num">{pad(i + 1)}</div>
                        <h4 className="uc-tag__title">{c.title}</h4>
                        {c.related ? (
                            <div className="uc-tag__related">
                                <div className="uc-tag__related-eyebrow">Related use case</div>
                                <Link to={c.related.to} className="uc-tag__related-link">
                                    {c.related.title}
                                </Link>
                            </div>
                        ) : null}
                        {c.poweredBy.length > 0 ? (
                            <div className="uc-tag__footer">
                                <div className="uc-tag__label">Powered by</div>
                                <ul>
                                    {c.poweredBy.map(item => (
                                        <li key={item.label}>
                                            {item.href !== undefined ? (
                                                <Link to={item.href}>{item.label}</Link>
                                            ) : (
                                                item.label
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </article>
                ))}
            </div>
        </Section>
    );
}

function CtaSection({ content, tone }: { content: UseCasePageContent; tone: Tone }): JSX.Element {
    return (
        <Section id="start" tone={tone} className="uc-cta">
            <h2 className="uc-cta__title" data-reveal data-reveal-delay="1">
                {content.cta.title}
            </h2>
            <div className="uc-cta__actions" data-reveal data-reveal-delay="2">
                <Link className="uc-btn uc-btn--yellow" to="/docs/dev/getting-started/quick-start">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                    >
                        <path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16" />
                    </svg>
                    Get Started
                </Link>
                <button type="button" className="uc-btn uc-btn--paper" disabled aria-disabled="true">
                    Try a Demo (coming soon)
                </button>
            </div>
        </Section>
    );
}

// ------------------------------------------------------------------ page

export function UseCasePage({ content }: { content: UseCasePageContent }): JSX.Element {
    useRevealObserver();

    // Surfaces alternate after the hero (which is always dark); a page without the cases
    // section keeps alternating cleanly because the tone is derived from the position.
    const sections: Array<(tone: Tone) => JSX.Element> = [
        tone => <ValueSection key="value" content={content} tone={tone} />,
    ];
    if (content.cases) {
        const { cases } = content;
        sections.push(tone => <CasesSection key="cases" cases={cases} tone={tone} />);
    }
    sections.push(
        tone => <TechSection key="tech" content={content} tone={tone} />,
        tone => <CapabilitiesSection key="capabilities" content={content} tone={tone} />,
        tone => <CtaSection key="cta" content={content} tone={tone} />
    );

    return (
        <LayoutNext title={content.meta.title} description={content.meta.description}>
            <div className={`uc-page uc-page--${content.slug}`} data-screen-label={content.screenLabel}>
                <Hero content={content} />
                {sections.map((render, i) => render(i % 2 === 0 ? 'darkest' : 'dark'))}
            </div>
        </LayoutNext>
    );
}
