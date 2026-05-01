import React, { CSSProperties, JSX, useEffect, useRef, useState } from 'react';
import './FeaturesSection.scss';

type CapabilityTone = 'green' | 'cream' | 'ink';
type CapabilityVisual = 'pipeline' | 'lakehouse' | 'search';

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
        visual: 'pipeline',
        illoTag: 'Streaming / CDC',
        rotation: -2.2,
        cta: {
            label: 'Explore real-time analytics',
            href: '/docs/data-operate/import/streaming-job/continuous-load-overview',
        },
        items: [
            { term: 'Streaming Ingestion', desc: 'Second-level streaming ingestion from Kafka and database CDC.' },
            { term: 'Incremental Transform', desc: 'Materialized views refresh complex transforms in minutes, not hours.' },
            { term: 'Sub-Second Queries', desc: 'Consistent low-latency response at high concurrency on PB-scale data.' },
        ],
    },
    {
        num: '02',
        title: 'Lakehouse Analytics',
        subtitle: 'Bringing Real-Time Analytics to Open Lakehouse.',
        tone: 'cream',
        visual: 'lakehouse',
        illoTag: 'Iceberg / Delta Lake / Hudi',
        rotation: 1.6,
        cta: {
            label: 'Explore lakehouse analytics',
            href: '/docs/lakehouse/lakehouse-overview',
        },
        items: [
            { term: 'Extensive Catalog Support', desc: 'Broad connectivity to mainstream open formats like Iceberg, Delta Lake and Hudi.' },
            { term: 'Lightning-Fast Query Engine', desc: 'High-performance analytics on lake data via vectorized execution and smart metadata/data caching.' },
            { term: 'Incremental Bi-directional Sync', desc: 'Seamless, continuous data movement between the lake format and Doris internal storage.' },
        ],
    },
    {
        num: '03',
        title: 'Hybrid Search',
        subtitle: 'First-Class Support for Multimodal Data',
        tone: 'ink',
        visual: 'search',
        illoTag: 'Text / Vector / Filter',
        rotation: -1.4,
        cta: {
            label: 'Explore hybrid search',
            href: '/docs/ai/text-search/overview',
        },
        items: [
            { term: 'JSON Analytics', desc: 'Auto-columnar storage for Agent Traces and dynamic tool-call metadata with 50x faster analysis.' },
            { term: 'Text Search', desc: 'Fast BM25 retrieval for Knowledge RAG, Long-term Memory, and Observability Logs.' },
            { term: 'Vector Search', desc: 'Integrated HNSW & IVF support for Semantic Retrieval and deep embedding alignment.' },
        ],
    },
];

interface CapabilityCardStyle extends CSSProperties {
    zIndex: number;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function easeOut(value: number): number {
    return 1 - Math.pow(1 - value, 2.5);
}

function useContainerProgress(ref: React.RefObject<HTMLElement>): number {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        let frame = 0;

        function update() {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const scrollable = rect.height - viewportHeight;

                if (scrollable <= 0) {
                    setProgress(rect.top <= 0 ? 1 : 0);
                    return;
                }

                setProgress(clamp(-rect.top / scrollable, 0, 1));
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
    }, [ref]);

    return progress;
}

function getCardStyle(capability: Capability, idx: number, total: number, progress: number): CapabilityCardStyle {
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
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        zIndex: 10 + idx,
    };
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
    const nodes = ['S3', 'Hive', 'Iceberg', 'Hudi', 'Paimon', 'MySQL'];

    return (
        <div className="features-next__visual-content features-next__visual-content--lakehouse" aria-hidden="true">
            <div className="features-next__lake-core">Doris</div>
            {nodes.map((node, i) => (
                <span key={node} className={`features-next__lake-node features-next__lake-node--${i + 1}`}>
                    {node}
                </span>
            ))}
        </div>
    );
}

function SearchVisual(): JSX.Element {
    const rows = [
        ['BM25', '94'],
        ['Vector', '96'],
        ['Filter', '100'],
    ];

    return (
        <div className="features-next__visual-content features-next__visual-content--search" aria-hidden="true">
            <div className="features-next__search-query">MATCH + COSINE_SIMILARITY</div>
            <div className="features-next__search-stack">
                {rows.map(([label, score]) => (
                    <div className="features-next__search-row" key={label}>
                        <span>{label}</span>
                        <i style={{ width: `${Number(score)}%` }} />
                        <strong>{score}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CapabilityVisual({ capability }: { capability: Capability }): JSX.Element {
    return (
        <div className={`features-next__visual features-next__visual--${capability.tone}`}>
            <div className="features-next__visual-tag">{capability.illoTag}</div>
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
    progress: number;
}

function CapabilityCard({ capability, idx, total, progress }: CapabilityCardProps): JSX.Element {
    return (
        <article
            className={`features-next__card features-next__card--${capability.tone}`}
            style={getCardStyle(capability, idx, total, progress)}
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
    const progress = useContainerProgress(containerRef);

    return (
        <section className="features-next">
            <div className="features-next__header">
                <div className="features-next__eyebrow">Core Capabilities</div>
                <h2 className="features-next__headline">
                    <span className="features-next__headline-line">Build For</span>
                    <span className="features-next__headline-line features-next__headline-line--accent">
                        Every Kind of Modern Analytics Workload
                    </span>
                </h2>
            </div>
            <div
                className="features-next__stack-container"
                ref={containerRef}
                style={{ height: `${CAPABILITIES.length * 100}vh` }}
            >
                <div className="features-next__stage">
                    {CAPABILITIES.map((capability, i) => (
                        <CapabilityCard
                            key={capability.num}
                            capability={capability}
                            idx={i}
                            total={CAPABILITIES.length}
                            progress={progress}
                        />
                    ))}
                    <div className="features-next__stage-progress" aria-hidden="true">
                        {CAPABILITIES.map((capability, i) => {
                            const transitions = Math.max(1, CAPABILITIES.length - 1);
                            const isOn = progress >= i / transitions - 0.001;

                            return (
                                <span
                                    key={capability.num}
                                    className={isOn ? 'features-next__stage-dot features-next__stage-dot--on' : 'features-next__stage-dot'}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
