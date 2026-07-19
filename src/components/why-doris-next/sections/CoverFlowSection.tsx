import React, { JSX, ReactNode, useEffect, useRef, useState } from 'react';
import './CoverFlowSection.scss';

// Mobile breakpoint matches `r.down('md')` in CoverFlowSection.scss.
// Kept in sync manually since CSS vars can't drive matchMedia.
const MOBILE_QUERY = '(max-width: 767.98px)';

export interface CaseStudy {
    name: string;
    mark: string;
    industry: string;
    rank: string;
    color: string;
    quote: string;
    benefits: ReactNode[];
}

export interface CoverFlowSectionProps {
    cases: CaseStudy[];
    sub: string;
}

interface CardTransform {
    tx: number;
    rotY: number;
    scale: number;
    z: number;
    opacity: number;
}

function transformFor(index: number, active: number): CardTransform {
    const offset = index - active;
    const abs = Math.abs(offset);
    if (offset === 0) {
        return { tx: 0, rotY: 0, scale: 1, z: 0, opacity: 1 };
    }
    const dir = offset > 0 ? 1 : -1;
    const tx = dir * (240 + (abs - 1) * 110);
    const rotY = -dir * 38;
    const scale = abs === 1 ? 0.82 : 0.68;
    const z = -abs * 200;
    const opacity = abs > 2 ? 0 : 1;
    return { tx, rotY, scale, z, opacity };
}

export function CoverFlowSection({ cases, sub }: CoverFlowSectionProps): JSX.Element {
    const [active, setActive] = useState(0);
    const total = cases.length;
    const stageRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
    // Suppresses the IntersectionObserver → setActive feedback loop while a
    // programmatic scroll (from a dot/arrow click) is in flight.
    const programmaticScroll = useRef(false);

    const next = () => setActive(a => (a + 1) % total);
    const prev = () => setActive(a => (a - 1 + total) % total);

    // Reset `active` when the data set changes (e.g. switching tabs) so we
    // don't end up pointing past the new array's bounds.
    useEffect(() => {
        setActive(0);
        cardRefs.current = [];
    }, [cases]);

    // Mobile only: scroll the active card into view when `active` changes
    // (dot/arrow clicks, parent updates). When `active` changed because the
    // user swiped, the card is *already* centered and we must not call
    // scrollIntoView again — that would (a) trigger a redundant smooth
    // scroll and (b) extend the `programmaticScroll` suppression window,
    // which blocks the swipe-tracking listener from updating `active` for
    // any cards the user swipes past during that window.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!window.matchMedia(MOBILE_QUERY).matches) return;
        const stage = stageRef.current;
        const card = cardRefs.current[active];
        if (!stage || !card) return;

        const stageRect = stage.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const stageCenter = stageRect.left + stageRect.width / 2;
        const cardCenter = cardRect.left + cardRect.width / 2;
        if (Math.abs(cardCenter - stageCenter) < 8) return; // already centered

        programmaticScroll.current = true;
        card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        const t = window.setTimeout(() => { programmaticScroll.current = false; }, 600);
        return () => window.clearTimeout(t);
    }, [active]);

    // Mobile only: update `active` to whichever card is closest to the
    // stage center as the user swipes. Uses a RAF-throttled scroll listener
    // — more reliable than IntersectionObserver for fast continuous swipes
    // through multiple snap points (threshold crossings can be missed).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stage = stageRef.current;
        if (!stage) return;
        if (!window.matchMedia(MOBILE_QUERY).matches) return;

        let raf = 0;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = 0;
                if (programmaticScroll.current) return;
                const stageRect = stage.getBoundingClientRect();
                const stageCenter = stageRect.left + stageRect.width / 2;
                let bestIdx = 0;
                let bestDist = Infinity;
                cardRefs.current.forEach((el, i) => {
                    if (!el) return;
                    const r = el.getBoundingClientRect();
                    const c = r.left + r.width / 2;
                    const d = Math.abs(c - stageCenter);
                    if (d < bestDist) {
                        bestDist = d;
                        bestIdx = i;
                    }
                });
                setActive(bestIdx);
            });
        };

        stage.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            stage.removeEventListener('scroll', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [total]);

    // Mobile only: toggle `at-start` / `at-end` classes on the viewport so
    // CSS can hide the gradient fade overlays at the edges where there's
    // nothing more to scroll to. Uses a ref-based listener (no re-renders).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stage = stageRef.current;
        const viewport = viewportRef.current;
        if (!stage || !viewport) return;

        const update = () => {
            const max = stage.scrollWidth - stage.clientWidth;
            const atStart = stage.scrollLeft <= 4;
            const atEnd = stage.scrollLeft >= max - 4;
            viewport.classList.toggle('cmp-cf__viewport--at-start', atStart);
            viewport.classList.toggle('cmp-cf__viewport--at-end', atEnd);
        };
        update();
        stage.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            stage.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return (
        <section className="cmp-next__card cmp-cf">
            <div className="cmp-next__card-head">
                <p className="cmp-next__card-sub">{sub}</p>
            </div>

            <div className="cmp-cf__viewport" ref={viewportRef}>
            <div className="cmp-cf__stage" ref={stageRef}>
                {cases.map((c, i) => (
                    <div
                        key={`hz-${i}`}
                        className="cmp-cf__hover-zone"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => setActive(i)}
                        style={{
                            left: `${(i / cases.length) * 100}%`,
                            width: `${100 / cases.length}%`,
                        }}
                        aria-label={`Show ${c.name} case`}
                    />
                ))}
                <div className="cmp-cf__track">
                    {cases.map((c, i) => {
                        const t = transformFor(i, active);
                        const isActive = i === active;
                        return (
                            <div
                                key={c.name}
                                ref={el => { cardRefs.current[i] = el; }}
                                data-idx={i}
                                className={`cmp-cf__item${isActive ? ' cmp-cf__item--active' : ''}`}
                                onClick={() => setActive(i)}
                                onMouseEnter={() => setActive(i)}
                                style={{
                                    transform: `translate3d(${t.tx}px, 0, ${t.z}px) rotateY(${t.rotY}deg) scale(${t.scale})`,
                                    opacity: t.opacity,
                                    zIndex: 10 - Math.abs(i - active),
                                    pointerEvents: t.opacity === 0 ? 'none' : 'auto',
                                }}
                            >
                                <span className="cmp-cf__rank">{c.rank}</span>
                                <span className="cmp-cf__corner">★ FEATURED</span>
                                <div className="cmp-cf__logo">
                                    <span
                                        className="cmp-cf__logo-mark"
                                        style={{ background: c.color, color: '#fff' }}
                                    >
                                        {c.mark}
                                    </span>
                                    <div>
                                        <div className="cmp-cf__logo-name">{c.name}</div>
                                        <div className="cmp-cf__logo-sub">{c.industry}</div>
                                    </div>
                                </div>
                                <p className="cmp-cf__quote">{c.quote}</p>
                                <div className="cmp-cf__benefits">
                                    {c.benefits.map((b, j) => (
                                        <div key={j} className="cmp-cf__benefit">
                                            <span className="cmp-cf__benefit-bullet">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </span>
                                            <span>{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            </div>

            <div className="cmp-cf__nav">
                <button className="cmp-cf__arrow" onClick={prev} aria-label="Previous case" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div className="cmp-cf__dots">
                    {cases.map((c, i) => (
                        <button
                            key={c.name}
                            type="button"
                            className={i === active ? 'cmp-cf__dot cmp-cf__dot--on' : 'cmp-cf__dot'}
                            onClick={() => setActive(i)}
                            aria-label={`Go to case ${i + 1}`}
                        />
                    ))}
                </div>
                <button className="cmp-cf__arrow" onClick={next} aria-label="Next case" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </section>
    );
}
