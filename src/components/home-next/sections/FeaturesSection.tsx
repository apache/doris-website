import React, { CSSProperties, JSX, useEffect, useMemo, useRef, useState } from 'react';
import './FeaturesSection.scss';

type CapabilityTone = 'green' | 'cream' | 'ink';
type CapabilityVisual = 'pipeline' | 'lakehouse' | 'search' | 'realtime';

interface CapabilityItem {
    term: string;
    desc: string;
}

interface Capability {
    num: string;
    title: string;
    subtitle: string;
    tone: CapabilityTone;
    visual: CapabilityVisual;
    illoTag: string;
    rotation: number;
    cta: {
        label: string;
        href: string;
    };
    items: CapabilityItem[];
}

const CAPABILITIES: Capability[] = [
    {
        num: '01',
        title: 'Real-Time Analytics',
        subtitle: 'The fastest end-to-end engine from ingestion to insight.',
        tone: 'green',
        visual: 'realtime',
        illoTag: 'High Concurrency / Low Latency',
        rotation: -2.2,
        cta: {
            label: 'Explore real-time analytics(Comming Soon)',
            href: '#',
        },
        items: [
            { term: 'Streaming Ingestion', desc: 'Ingest from Kafka and database CDC with second-level freshness.' },
            { term: 'Incremental Transform', desc: 'Materialized views refresh complex transforms in minutes, not hours.' },
            { term: 'Sub-Second Queries', desc: 'Stay sub-second under high concurrency, even on petabyte-scale data.' },
        ],
    },
    {
        num: '02',
        title: 'Lakehouse Analytics',
        subtitle: 'Real-time analytics, applied directly to your open lakehouse.',
        tone: 'cream',
        visual: 'lakehouse',
        illoTag: 'Iceberg / Delta Lake / Hudi',
        rotation: 1.6,
        cta: {
            label: 'Explore lakehouse analytics(Comming Soon)',
            href: '#',
        },
        items: [
            { term: 'Extensive Catalog Support', desc: 'Query Iceberg, Delta Lake, and Hudi tables in place, with no data copy.' },
            { term: 'Lightning-Fast Query Engine', desc: 'Vectorized execution and smart metadata caching make lake queries fast.' },
            { term: 'Incremental Bi-directional Sync', desc: 'Stream data both ways between open lake formats and Doris internal storage.' },
        ],
    },
    {
        num: '03',
        title: 'Hybrid Search',
        subtitle: 'First-class search across structured, text, and vector data.',
        tone: 'ink',
        visual: 'search',
        illoTag: 'JSON / Text / Vector',
        rotation: -1.4,
        cta: {
            label: 'Explore hybrid search(Comming Soon)',
            href: '#',
        },
        items: [
            { term: 'JSON Analytics', desc: 'Auto-columnar storage for agent traces and tool-call metadata, with 50x faster analysis.' },
            { term: 'Text Search', desc: 'Fast BM25 retrieval for RAG, agent memory, and observability logs.' },
            { term: 'Vector Search', desc: 'Built-in HNSW and IVF indexes for semantic retrieval over embeddings.' },
        ],
    },
];

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function easeOut(value: number): number {
    return 1 - Math.pow(1 - value, 2.5);
}

interface CardTransform {
    transform: string;
    opacity: number;
}

function computeCardTransform(capability: Capability, idx: number, total: number, progress: number): CardTransform {
    const transitions = Math.max(1, total - 1);
    const slice = 1 / transitions;
    const activeAt = idx * slice;
    const previousAt = (idx - 1) * slice;

    let translateY = 0;
    let opacity = 1;
    let scale = 1;
    let rotation = capability.rotation;

    if (idx === 0) {
        const coveredBy = clamp(progress / slice, 0, 1);
        const coveredByNext = total > 2 ? clamp((progress - slice) / slice, 0, 1) : 0;
        const coverAmount = coveredBy + coveredByNext;

        translateY = -coverAmount * 18;
        scale = 1 - coverAmount * 0.035;
        rotation = capability.rotation - coverAmount * 0.6;
    } else {
        const slideProgress = clamp((progress - previousAt) / slice, 0, 1);
        const eased = easeOut(slideProgress);

        translateY = (1 - eased) * 720;
        scale = 0.94 + eased * 0.06;
        rotation = capability.rotation + (1 - eased) * (capability.rotation > 0 ? 4 : -4);
        opacity = slideProgress < 0.02 ? 0 : 1;

        if (idx < total - 1) {
            const coveredBy = clamp((progress - activeAt) / slice, 0, 1);
            translateY -= coveredBy * 18;
            scale -= coveredBy * 0.035;
            rotation -= coveredBy * 0.6;
        }
    }

    return {
        transform: `translate3d(-50%, -50%, 0) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
    };
}

const INITIAL_CARD_TRANSFORMS = CAPABILITIES.map((cap, i) =>
    computeCardTransform(cap, i, CAPABILITIES.length, 0),
);

const INITIAL_DOT_ON = CAPABILITIES.map((_, i) => {
    const transitions = Math.max(1, CAPABILITIES.length - 1);
    return 0 >= i / transitions - 0.001;
});

function useIsNarrowViewport(): boolean {
    const [isNarrowViewport, setIsNarrowViewport] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 820px)');
        const update = () => setIsNarrowViewport(query.matches);

        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    return isNarrowViewport;
}

function ArrowIcon(): JSX.Element {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
    );
}

function PipelineVisual(): JSX.Element {
    return (
        <div className="features-next__visual-content features-next__visual-content--pipeline" aria-hidden="true">
            <div className="features-next__pipeline-lane">
                <span>Kafka</span>
                <i />
                <span>CDC</span>
            </div>
            <div className="features-next__pipeline-core">
                <span>MV</span>
                <i />
                <strong>Doris</strong>
                <i />
                <span>10 ms</span>
            </div>
            <div className="features-next__pipeline-lane">
                <span>BI</span>
                <i />
                <span>Apps</span>
            </div>
        </div>
    );
}

function LakehouseVisual(): JSX.Element {
    return (
        <div className="features-next__visual-content features-next__visual-content--realtime" aria-hidden="true">
            <iframe
                className="features-next__realtime-frame"
                src="/home-next/lake-analytics.html"
                title="Lakehouse Analytics animation"
                loading="lazy"
                tabIndex={-1}
            />
        </div>
    );
}

function SearchVisual(): JSX.Element {
    return (
        <div className="features-next__visual-content features-next__visual-content--realtime" aria-hidden="true">
            <iframe
                className="features-next__realtime-frame"
                src="/home-next/hybrid-search.html"
                title="Hybrid Search animation"
                loading="lazy"
                tabIndex={-1}
            />
        </div>
    );
}

function RealtimeAnalyticsVisual(): JSX.Element {
    return (
        <div className="features-next__visual-content features-next__visual-content--realtime" aria-hidden="true">
            <iframe
                className="features-next__realtime-frame"
                src="/home-next/realtime-analytics.html"
                title="Real-Time Analytics animation"
                loading="lazy"
                tabIndex={-1}
            />
        </div>
    );
}

function CapabilityVisual({ capability }: { capability: Capability }): JSX.Element {
    return (
        <div className={`features-next__visual features-next__visual--${capability.tone}`}>
            <div className="features-next__visual-tag">{capability.illoTag}</div>
            {capability.visual === 'realtime' && <RealtimeAnalyticsVisual />}
            {capability.visual === 'pipeline' && <PipelineVisual />}
            {capability.visual === 'lakehouse' && <LakehouseVisual />}
            {capability.visual === 'search' && <SearchVisual />}
        </div>
    );
}

interface CapabilityCardProps {
    capability: Capability;
    idx: number;
    total: number;
    cardRef: (el: HTMLElement | null) => void;
    isNarrowViewport: boolean;
}

function CapabilityCard({ capability, idx, total, cardRef, isNarrowViewport }: CapabilityCardProps): JSX.Element {
    const initialStyle: CSSProperties | undefined = isNarrowViewport
        ? undefined
        : {
              zIndex: 10 + idx,
              transform: INITIAL_CARD_TRANSFORMS[idx].transform,
              opacity: INITIAL_CARD_TRANSFORMS[idx].opacity,
          };

    return (
        <article
            ref={cardRef}
            className={`features-next__card features-next__card--${capability.tone}`}
            style={initialStyle}
        >
            <div className="features-next__copy">
                <div className="features-next__card-num">
                    {capability.num} / 0{total}
                </div>
                <h3 className="features-next__card-title">{capability.title}</h3>
                <p className="features-next__card-subtitle">{capability.subtitle}</p>
                <ul className="features-next__list">
                    {capability.items.map(item => (
                        <li className="features-next__list-item" key={item.term}>
                            <span className="features-next__list-icon" aria-hidden="true">
                                <ArrowIcon />
                            </span>
                            <span>
                                <span className="features-next__list-term">{item.term}</span>
                                <span className="features-next__list-desc">{item.desc}</span>
                            </span>
                        </li>
                    ))}
                </ul>
                <a className="features-next__card-cta" href={capability.cta.href}>
                    {capability.cta.label}
                    <ArrowIcon />
                </a>
            </div>
            <CapabilityVisual capability={capability} />
        </article>
    );
}

export function FeaturesSection(): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLElement | null)[]>([]);
    const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const isNarrowViewport = useIsNarrowViewport();

    const cardRefSetters = useMemo(
        () =>
            CAPABILITIES.map((_, idx) => (el: HTMLElement | null) => {
                cardRefs.current[idx] = el;
            }),
        [],
    );
    const dotRefSetters = useMemo(
        () =>
            CAPABILITIES.map((_, idx) => (el: HTMLSpanElement | null) => {
                dotRefs.current[idx] = el;
            }),
        [],
    );

    useEffect(() => {
        if (isNarrowViewport) {
            cardRefs.current.forEach(el => {
                if (!el) return;
                el.style.transform = '';
                el.style.opacity = '';
            });
            dotRefs.current.forEach(el => {
                el?.classList.remove('features-next__stage-dot--on');
            });
            return undefined;
        }

        const containerEl = containerRef.current;
        if (!containerEl) return undefined;

        let frame = 0;
        let lastProgress = -1;

        function update() {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const rect = containerEl.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const scrollable = rect.height - viewportHeight;

                let progress: number;
                if (scrollable <= 0) {
                    progress = rect.top <= 0 ? 1 : 0;
                } else {
                    progress = clamp(-rect.top / scrollable, 0, 1);
                }

                if (Math.abs(progress - lastProgress) < 0.0005) return;
                lastProgress = progress;

                const total = CAPABILITIES.length;
                for (let i = 0; i < cardRefs.current.length; i++) {
                    const cardEl = cardRefs.current[i];
                    if (!cardEl) continue;
                    const { transform, opacity } = computeCardTransform(CAPABILITIES[i], i, total, progress);
                    cardEl.style.transform = transform;
                    cardEl.style.opacity = String(opacity);
                }

                const transitions = Math.max(1, total - 1);
                for (let i = 0; i < dotRefs.current.length; i++) {
                    const dotEl = dotRefs.current[i];
                    if (!dotEl) continue;
                    const isOn = progress >= i / transitions - 0.001;
                    dotEl.classList.toggle('features-next__stage-dot--on', isOn);
                }
            });
        }

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [isNarrowViewport]);

    return (
        <section className="features-next">
            <div className="home-next-container">
                <div className="features-next__header">
                    <div className="features-next__eyebrow">Core Capabilities</div>
                    <h2 className="features-next__headline">
                        <span className="features-next__headline-line">Three Pillars. One Engine</span>
                    </h2>
                </div>
                <div
                    className="features-next__stack-container"
                    ref={containerRef}
                    style={isNarrowViewport ? undefined : { height: `${CAPABILITIES.length * 100}vh` }}
                >
                    <div className="features-next__stage">
                        {CAPABILITIES.map((capability, i) => (
                            <CapabilityCard
                                key={capability.num}
                                capability={capability}
                                idx={i}
                                total={CAPABILITIES.length}
                                cardRef={cardRefSetters[i]}
                                isNarrowViewport={isNarrowViewport}
                            />
                        ))}
                        <div className="features-next__stage-progress" aria-hidden="true">
                            {CAPABILITIES.map((capability, i) => (
                                <span
                                    key={capability.num}
                                    ref={dotRefSetters[i]}
                                    className={
                                        INITIAL_DOT_ON[i]
                                            ? 'features-next__stage-dot features-next__stage-dot--on'
                                            : 'features-next__stage-dot'
                                    }
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
