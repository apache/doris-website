import React, {
    CSSProperties,
    JSX,
    MutableRefObject,
    RefObject,
    useEffect,
    useRef,
    useState,
} from 'react';
import './EcosystemSection.scss';

type EcosystemSide = 'left' | 'right';

interface EcosystemLogo {
    name: string;
    mark: string;
    className: string;
}

interface EcosystemGroup {
    id: string;
    title: string;
    tag: string;
    logos: EcosystemLogo[];
}

interface FlowPath {
    id: string;
    d: string;
}

interface TiltState {
    rx: number;
    ry: number;
}

interface EcosystemBlockProps {
    data: EcosystemGroup;
    side: EcosystemSide;
    refMap: MutableRefObject<Record<string, HTMLElement | null>>;
}

const SOURCES: EcosystemGroup[] = [
    {
        id: 'db',
        title: 'Database',
        tag: 'OLTP / CDC',
        logos: [
            { name: 'MySQL', mark: 'My', className: 'ecosystem-next__logo-mark--1' },
            { name: 'Postgres', mark: 'Pg', className: 'ecosystem-next__logo-mark--2' },
        ],
    },
    {
        id: 'stream',
        title: 'Datastream',
        tag: 'Pub/Sub',
        logos: [
            { name: 'Kafka', mark: 'Kk', className: 'ecosystem-next__logo-mark--3' },
        ],
    },
    {
        id: 'lake',
        title: 'Datalake',
        tag: 'Open Tables',
        logos: [
            { name: 'Iceberg', mark: 'Ib', className: 'ecosystem-next__logo-mark--4' },
            { name: 'Delta', mark: 'Dt', className: 'ecosystem-next__logo-mark--5' },
            { name: 'Paimon', mark: 'Pm', className: 'ecosystem-next__logo-mark--6' },
        ],
    },
];

const CONSUMERS: EcosystemGroup[] = [
    {
        id: 'bi',
        title: 'BI & Visualization',
        tag: 'Dashboards',
        logos: [
            { name: 'Superset', mark: 'Sp', className: 'ecosystem-next__logo-mark--7' },
            { name: 'Metabase', mark: 'Mb', className: 'ecosystem-next__logo-mark--8' },
        ],
    },
    {
        id: 'ai',
        title: 'AI & Analytics',
        tag: 'LLM / Agents',
        logos: [
            { name: 'AI Agents', mark: 'AI', className: 'ecosystem-next__logo-mark--9' },
            { name: 'MCP', mark: 'Mc', className: 'ecosystem-next__logo-mark--1' },
        ],
    },
    {
        id: 'obs',
        title: 'Observability',
        tag: 'Monitoring',
        logos: [
            { name: 'Grafana', mark: 'Gr', className: 'ecosystem-next__logo-mark--10' },
            { name: 'Langfuse', mark: 'Lf', className: 'ecosystem-next__logo-mark--2' },
        ],
    },
];

function EcosystemBlock({ data, side, refMap }: EcosystemBlockProps): JSX.Element {
    return (
        <article
            className="ecosystem-next__block"
            data-ecosystem-id={data.id}
            data-ecosystem-side={side}
            ref={(el) => {
                refMap.current[data.id] = el;
            }}
        >
            <div className="ecosystem-next__block-label">
                <span className="ecosystem-next__block-title">{data.title}</span>
                <span className="ecosystem-next__block-tag">{data.tag}</span>
            </div>
            <div className="ecosystem-next__logos">
                {data.logos.map(logo => (
                    <div className="ecosystem-next__logo" key={logo.name}>
                        <span className={`ecosystem-next__logo-mark ${logo.className}`}>{logo.mark}</span>
                        <span className="ecosystem-next__logo-name">{logo.name}</span>
                    </div>
                ))}
            </div>
        </article>
    );
}

function FlowLines({ paths }: { paths: FlowPath[] }): JSX.Element {
    return (
        <svg className="ecosystem-next__flows" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {paths.map(path => (
                <path key={`pipe-${path.id}`} d={path.d} className="ecosystem-next__flow-pipe" />
            ))}
            {paths.map((path, i) => (
                <path
                    key={`stream-${path.id}`}
                    d={path.d}
                    className="ecosystem-next__flow-stream"
                    style={{ animationDelay: `${(i % 6) * 0.18}s` }}
                />
            ))}
        </svg>
    );
}

function useGravityTilt(ref: RefObject<HTMLElement>): TiltState {
    const [tilt, setTilt] = useState<TiltState>({ rx: 0, ry: 0 });
    const current = useRef<TiltState>({ rx: 0, ry: 0 });
    const target = useRef<TiltState>({ rx: 0, ry: 0 });
    const frame = useRef<number | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        function tick() {
            const next = {
                rx: current.current.rx + (target.current.rx - current.current.rx) * 0.14,
                ry: current.current.ry + (target.current.ry - current.current.ry) * 0.14,
            };
            const closeEnough =
                Math.abs(next.rx - target.current.rx) < 0.015 &&
                Math.abs(next.ry - target.current.ry) < 0.015;

            current.current = closeEnough ? target.current : next;
            setTilt(current.current);

            if (closeEnough) {
                frame.current = null;
                return;
            }

            frame.current = window.requestAnimationFrame(tick);
        }

        function scheduleTick() {
            if (frame.current === null) {
                frame.current = window.requestAnimationFrame(tick);
            }
        }

        function onMove(e: MouseEvent) {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            const maxTilt = 6.5;

            target.current = {
                rx: ((py - 0.5) * 2) * maxTilt,
                ry: -((px - 0.5) * 2) * maxTilt,
            };
            scheduleTick();
        }

        function onLeave() {
            target.current = { rx: 0, ry: 0 };
            scheduleTick();
        }

        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            if (frame.current !== null) {
                window.cancelAnimationFrame(frame.current);
            }
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, [ref]);

    return tilt;
}

function createPipePath(fromX: number, fromY: number, toX: number, toY: number): string {
    if (Math.abs(toY - fromY) < 2) {
        return `M ${fromX} ${fromY} L ${toX} ${toY}`;
    }

    const midX = fromX + (toX - fromX) * 0.5;
    const radius = 10;
    const dxSign = Math.sign(toX - fromX) || 1;
    const dySign = Math.sign(toY - fromY) || 1;
    const startRadius = Math.min(radius, Math.abs(midX - fromX));
    const endRadius = Math.min(radius, Math.abs(toX - midX));
    const verticalRadius = Math.min(radius, Math.abs(toY - fromY) / 2);

    return [
        `M ${fromX} ${fromY}`,
        `L ${midX - startRadius * dxSign} ${fromY}`,
        `Q ${midX} ${fromY} ${midX} ${fromY + verticalRadius * dySign}`,
        `L ${midX} ${toY - verticalRadius * dySign}`,
        `Q ${midX} ${toY} ${midX + endRadius * dxSign} ${toY}`,
        `L ${toX} ${toY}`,
    ].join(' ');
}

function useFlowPaths(
    panelRef: RefObject<HTMLElement>,
    refMap: MutableRefObject<Record<string, HTMLElement | null>>,
    dorisRef: RefObject<HTMLElement>,
): FlowPath[] {
    const [paths, setPaths] = useState<FlowPath[]>([]);

    useEffect(() => {
        function recompute() {
            const panel = panelRef.current;
            const doris = dorisRef.current;
            if (!panel || !doris) return;

            const panelRect = panel.getBoundingClientRect();
            const dorisRect = doris.getBoundingClientRect();
            const dorisTop = dorisRect.top - panelRect.top;
            const dorisHeight = dorisRect.height;
            const dorisLeftX = dorisRect.left - panelRect.left;
            const dorisRightX = dorisRect.right - panelRect.left;

            interface BlockInfo {
                id: string;
                isLeft: boolean;
                blockX: number;
                blockY: number;
            }
            const leftBlocks: BlockInfo[] = [];
            const rightBlocks: BlockInfo[] = [];
            Object.entries(refMap.current).forEach(([id, el]) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const isLeft = el.dataset.ecosystemSide === 'left';
                const blockX = (isLeft ? rect.right : rect.left) - panelRect.left;
                const blockY = rect.top + rect.height / 2 - panelRect.top;
                (isLeft ? leftBlocks : rightBlocks).push({ id, isLeft, blockX, blockY });
            });
            leftBlocks.sort((a, b) => a.blockY - b.blockY);
            rightBlocks.sort((a, b) => a.blockY - b.blockY);

            const buildSidePaths = (blocks: BlockInfo[]): FlowPath[] =>
                blocks.map((block, index) => {
                    const dorisEdgeX = block.isLeft ? dorisLeftX : dorisRightX;
                    const dorisEdgeY = dorisTop + ((index + 1) / (blocks.length + 1)) * dorisHeight;
                    const fromX = block.isLeft ? block.blockX : dorisEdgeX;
                    const fromY = block.isLeft ? block.blockY : dorisEdgeY;
                    const toX = block.isLeft ? dorisEdgeX : block.blockX;
                    const toY = block.isLeft ? dorisEdgeY : block.blockY;
                    return { id: block.id, d: createPipePath(fromX, fromY, toX, toY) };
                });

            setPaths([...buildSidePaths(leftBlocks), ...buildSidePaths(rightBlocks)]);
        }

        recompute();

        const timers = [
            window.setTimeout(recompute, 80),
            window.setTimeout(recompute, 400),
        ];
        let resizeObserver: ResizeObserver | null = null;

        if (typeof window.ResizeObserver !== 'undefined') {
            resizeObserver = new window.ResizeObserver(recompute);
            if (panelRef.current) resizeObserver.observe(panelRef.current);
            if (dorisRef.current) resizeObserver.observe(dorisRef.current);
            Object.values(refMap.current).forEach((el) => {
                if (el) resizeObserver?.observe(el);
            });
        }

        window.addEventListener('resize', recompute);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', recompute);
            timers.forEach(timer => window.clearTimeout(timer));
        };
    }, [panelRef, refMap, dorisRef]);

    return paths;
}

function useIsCompactEcosystem(): boolean {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 768px)');
        const update = () => setCompact(query.matches);

        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    return compact;
}

function CompactEcosystem(): JSX.Element {
    return (
        <section
            className="ecosystem-next ecosystem-next--compact"
            aria-labelledby="ecosystem-next-title"
        >
            <div className="ecosystem-next__header">
                <div className="ecosystem-next__header-left">
                    <h2 className="ecosystem-next__headline" id="ecosystem-next-title">
                        <span>At the Heart of the</span>
                        <span className="ecosystem-next__headline-accent">Modern Data Stack.</span>
                    </h2>
                </div>
            </div>
            <div className="ecosystem-next__thumbnail">
                <img
                    src="/images/next/what-is-apache-doris/12-ecosystem-integration.jpg"
                    alt="Apache Doris ecosystem: data integration, lake formats, BI tools, AI ecosystem and SDKs"
                    loading="lazy"
                />
            </div>
        </section>
    );
}

export function EcosystemSection(): JSX.Element {
    const compact = useIsCompactEcosystem();
    const cardRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dorisRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<Record<string, HTMLElement | null>>({});
    const tilt = useGravityTilt(cardRef);
    const paths = useFlowPaths(panelRef, blockRefs, dorisRef);

    if (compact) {
        return <CompactEcosystem />;
    }

    const cardStyle: CSSProperties = {
        transform: `rotateX(${tilt.rx.toFixed(3)}deg) rotateY(${tilt.ry.toFixed(3)}deg)`,
    };

    return (
        <section className="ecosystem-next" aria-labelledby="ecosystem-next-title">
            <div className="ecosystem-next__header">
                <div className="ecosystem-next__header-left">
                    <h2 className="ecosystem-next__headline" id="ecosystem-next-title">
                        <span>At the Heart of the</span>
                        <span className="ecosystem-next__headline-accent">Modern Data Stack.</span>
                    </h2>
                </div>
            </div>

            <div className="ecosystem-next__stage">
                <div className="ecosystem-next__card" ref={cardRef} style={cardStyle}>
                    <div className="ecosystem-next__panel" ref={panelRef}>
                        <FlowLines paths={paths} />

                        <div className="ecosystem-next__grid">
                            <div className="ecosystem-next__col ecosystem-next__col--sources">
                                <div className="ecosystem-next__col-head">
                                    <span className="ecosystem-next__col-num">01</span>
                                    Upstream - Sources
                                </div>
                                {SOURCES.map(source => (
                                    <EcosystemBlock key={source.id} data={source} side="left" refMap={blockRefs} />
                                ))}
                            </div>

                            <div className="ecosystem-next__col ecosystem-next__col--center">
                                <div className="ecosystem-next__col-head ecosystem-next__col-head--center">
                                    <span className="ecosystem-next__col-num">02</span>
                                    The Engine
                                </div>
                                <div className="ecosystem-next__doris" ref={dorisRef}>
                                    <div className="ecosystem-next__doris-core">
                                        <span className="ecosystem-next__doris-mark">D</span>
                                        <span className="ecosystem-next__doris-name">Apache Doris</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ecosystem-next__col ecosystem-next__col--consumers">
                                <div className="ecosystem-next__col-head ecosystem-next__col-head--right">
                                    <span className="ecosystem-next__col-num">03</span>
                                    Downstream - Consumers
                                </div>
                                {CONSUMERS.map(consumer => (
                                    <EcosystemBlock key={consumer.id} data={consumer} side="right" refMap={blockRefs} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
