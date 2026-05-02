import React, { JSX, useState, useEffect, useRef } from 'react';
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

const GET_STARTED_HREF = '/docs-next/dev/getting-started/intro';

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

// ─── Node Graph + Bar Chart ─────────────────────────────────────────────────

type GraphNodeId = 'docs' | 'ai' | 'rag' | 'search' | 'vec' | 'embed';
type Vector3 = [number, number, number];

interface GraphNode {
    id: GraphNodeId;
    pos: Vector3;
    r: number;
    color: string;
}

interface ProjectedPoint {
    x: number;
    y: number;
    z: number;
    scale: number;
}

interface ProjectedNode extends ProjectedPoint {
    node: GraphNode;
}

interface DragState {
    x: number;
    y: number;
    rx: number;
    ry: number;
}

const NODES_3D: GraphNode[] = [
    { id: 'docs',   pos: [ 0.00,  0.00,  0.00], r: 22, color: '#FAF6EE' },
    { id: 'ai',     pos: [ 0.85,  0.55, -0.30], r: 18, color: '#2DDFA8' },
    { id: 'rag',    pos: [-0.80,  0.50,  0.40], r: 16, color: '#FF8FA3' },
    { id: 'search', pos: [ 0.55, -0.75,  0.55], r: 18, color: '#7DD3FF' },
    { id: 'vec',    pos: [-0.65, -0.55, -0.55], r: 14, color: '#C7B5FF' },
    { id: 'embed',  pos: [ 0.10,  0.85,  0.70], r: 14, color: '#FFD23F' },
];

const EDGES_3D: Array<[GraphNodeId, GraphNodeId]> = [
    ['docs', 'ai'], ['docs', 'search'], ['docs', 'vec'], ['docs', 'rag'],
    ['ai', 'rag'], ['ai', 'search'], ['ai', 'embed'],
    ['rag', 'embed'],
    ['search', 'vec'], ['search', 'embed'],
];

function projectPoint([x, y, z]: Vector3, rx: number, ry: number): ProjectedPoint {
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    const fov = 2.4;
    const perspective = fov / (fov - z2);
    return { x: x1 * perspective, y: y1 * perspective, z: z2, scale: perspective };
}

function toGraphSvgPoint(point: Pick<ProjectedPoint, 'x' | 'y'>): { x: number; y: number } {
    return { x: 50 + point.x * 32, y: 50 + point.y * 32 };
}

function NodeGraph(): JSX.Element {
    const [hovered, setHovered] = useState<GraphNodeId | null>(null);
    const [rotation, setRotation] = useState({ rx: -0.25, ry: 0.4 });
    const [drag, setDrag] = useState<DragState | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const autoRotateRef = useRef(true);

    useEffect(() => {
        let raf = 0;
        let last = performance.now();
        const tick = (time: number) => {
            const dt = (time - last) / 1000;
            last = time;
            if (autoRotateRef.current && !drag && hovered === null) {
                setRotation(r => ({
                    rx: r.rx + Math.sin(time * 0.0003) * 0.0008,
                    ry: r.ry + dt * 0.18,
                }));
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [drag, hovered]);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        containerRef.current?.setPointerCapture(event.pointerId);
        setDrag({ x: event.clientX, y: event.clientY, rx: rotation.rx, ry: rotation.ry });
        autoRotateRef.current = false;
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!drag) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        setRotation({
            rx: Math.max(-1.2, Math.min(1.2, drag.rx + dy * 0.01)),
            ry: drag.ry + dx * 0.012,
        });
    };

    const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (containerRef.current?.hasPointerCapture(event.pointerId)) {
            containerRef.current.releasePointerCapture(event.pointerId);
        }
        setDrag(null);
        window.setTimeout(() => {
            autoRotateRef.current = true;
        }, 1800);
    };

    const projected: ProjectedNode[] = NODES_3D.map(node => ({
        node,
        ...projectPoint(node.pos, rotation.rx, rotation.ry),
    }));
    const projectedById = new Map(projected.map(point => [point.node.id, point]));
    const sortedNodes = [...projected].sort((a, b) => a.z - b.z);

    return (
        <div className="hn-node-graph">
            <div className="hn-node-graph__head">
                <span className="hn-node-graph__head-label">KNOWLEDGE GRAPH</span>
            </div>
            <div
                className={`hn-node-graph__canvas${drag ? ' hn-node-graph__canvas--dragging' : ''}`}
                ref={containerRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
            >
                <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="hn-node-graph__svg" aria-hidden="true">
                    <defs>
                        <radialGradient id="hn-node-graph-floor" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="rgba(255,210,63,0.10)" />
                            <stop offset="70%" stopColor="rgba(255,210,63,0)" />
                        </radialGradient>
                    </defs>
                    <ellipse cx="50" cy="58" rx="36" ry="6" fill="url(#hn-node-graph-floor)" />
                    {EDGES_3D.map(([a, b], i) => {
                        const nodeA = projectedById.get(a);
                        const nodeB = projectedById.get(b);
                        if (!nodeA || !nodeB) return null;
                        const pointA = toGraphSvgPoint(nodeA);
                        const pointB = toGraphSvgPoint(nodeB);
                        const active = hovered !== null && (hovered === a || hovered === b);
                        const avgZ = (nodeA.z + nodeB.z) / 2;
                        const opacity = active ? 0.95 : Math.max(0.08, 0.18 + (avgZ + 0.6) * 0.25);
                        return (
                            <line
                                key={`${a}-${b}-${i}`}
                                x1={pointA.x}
                                y1={pointA.y}
                                x2={pointB.x}
                                y2={pointB.y}
                                stroke={active ? '#FFD23F' : 'rgba(245,239,228,1)'}
                                strokeOpacity={opacity}
                                strokeWidth={active ? 0.45 : 0.22}
                                vectorEffect="non-scaling-stroke"
                            />
                        );
                    })}
                </svg>
                {sortedNodes.map(({ node, x, y, z, scale }) => {
                    const isHovered = hovered === node.id;
                    const svgPoint = toGraphSvgPoint({ x, y });
                    const size = node.r * scale * (isHovered ? 1.35 : 1);
                    const depthAlpha = 0.55 + Math.max(0, Math.min(1, (z + 1) / 2)) * 0.45;
                    return (
                        <button
                            type="button"
                            key={node.id}
                            className={`hn-node-graph__node${isHovered ? ' hn-node-graph__node--hovered' : ''}`}
                            aria-label={`${node.id} node`}
                            style={{
                                left: `${svgPoint.x}%`,
                                top: `${svgPoint.y}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                background: node.color,
                                opacity: depthAlpha,
                                zIndex: Math.round((z + 2) * 100),
                                boxShadow: isHovered
                                    ? '0 0 0 3px rgba(255,210,63,0.55), 0 8px 22px rgba(255,210,63,0.45)'
                                    : `0 ${4 * scale}px ${10 * scale}px rgba(0,0,0,${0.35 * scale})`,
                            }}
                            onPointerEnter={() => {
                                if (!drag) setHovered(node.id);
                            }}
                            onPointerLeave={() => {
                                if (!drag) setHovered(null);
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

const BAR_DATA_SETS: number[][] = [
    [62, 78, 45, 91, 70, 84, 58],
    [80, 55, 92, 48, 76, 88, 65],
    [70, 88, 62, 80, 54, 95, 72],
    [55, 72, 88, 60, 82, 70, 92],
];
const BAR_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BarChart(): JSX.Element {
    const [dataSetIndex, setDataSetIndex] = useState(0);
    const [hoverIndex, setHoverIndex] = useState(-1);

    useEffect(() => {
        const id = window.setInterval(() => {
            setDataSetIndex(i => (i + 1) % BAR_DATA_SETS.length);
        }, 1800);
        return () => window.clearInterval(id);
    }, []);

    const data = BAR_DATA_SETS[dataSetIndex];
    const max = Math.max(...data);

    return (
        <div className="hn-bar-chart">
            <div className="hn-bar-chart__head">
                <span className="hn-bar-chart__head-label">QUERIES / DAY</span>
                <span className="hn-bar-chart__head-num">
                    <span className="hn-bar-chart__head-val">2.4M</span>
                    <span className="hn-bar-chart__head-delta">▲ 12%</span>
                </span>
            </div>
            <div className="hn-bar-chart__grid" aria-hidden="true">
                {[0, 1, 2, 3].map(i => <div key={i} className="hn-bar-chart__grid-line" />)}
            </div>
            <div className="hn-bar-chart__bars">
                {data.map((value, i) => (
                    <div
                        key={BAR_LABELS[i]}
                        className="hn-bar-chart__bar-col"
                        onMouseEnter={() => setHoverIndex(i)}
                        onMouseLeave={() => setHoverIndex(-1)}
                    >
                        <div className="hn-bar-chart__bar-track">
                            <div
                                className={`hn-bar-chart__bar-fill${i === hoverIndex ? ' hn-bar-chart__bar-fill--glow' : ''}`}
                                style={{ height: `${(value / max) * 100}%` }}
                            >
                                <span className="hn-bar-chart__bar-tip">{value}k</span>
                            </div>
                        </div>
                        <span className="hn-bar-chart__bar-label">{BAR_LABELS[i]}</span>
                    </div>
                ))}
            </div>
            <div className="hn-bar-chart__foot">
                <span className="hn-bar-chart__foot-chip"><i style={{ background: '#FFD23F' }} />P50 18ms</span>
                <span className="hn-bar-chart__foot-chip"><i style={{ background: '#2DDFA8' }} />P99 43ms</span>
                <span className="hn-bar-chart__foot-chip"><i style={{ background: '#C7B5FF' }} />error 0.00%</span>
            </div>
        </div>
    );
}

function NodeGraphAndBars(): JSX.Element {
    return (
        <div className="hn-node-bars">
            <div className="hn-node-bars__pane"><NodeGraph /></div>
            <div className="hn-node-bars__pane"><BarChart /></div>
        </div>
    );
}

const REPORT_SLIDES = [
    { label: 'Show search results' },
    { label: 'Show knowledge graph and query chart' },
];

function ReportCarousel(): JSX.Element {
    const [activeIndex, setActiveIndex] = useState(0);
    const [timerVersion, setTimerVersion] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return undefined;
        const id = window.setInterval(() => {
            setActiveIndex(index => (index + 1) % REPORT_SLIDES.length);
        }, 9000);
        return () => window.clearInterval(id);
    }, [isPaused, timerVersion]);

    const selectSlide = (index: number) => {
        setActiveIndex(index);
        setTimerVersion(version => version + 1);
    };

    return (
        <div
            className="hn-report-carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                id="hero-report-search"
                role="tabpanel"
                aria-hidden={activeIndex !== 0}
                className={`hn-report-carousel__pane${activeIndex === 0 ? ' hn-report-carousel__pane--active' : ' hn-report-carousel__pane--inactive'}`}
            >
                <SearchResults />
            </div>
            <div
                id="hero-report-graph"
                role="tabpanel"
                aria-hidden={activeIndex !== 1}
                className={`hn-report-carousel__pane${activeIndex === 1 ? ' hn-report-carousel__pane--active' : ' hn-report-carousel__pane--inactive'}`}
            >
                <NodeGraphAndBars />
            </div>
            <div className="hn-report-carousel__dots" role="tablist" aria-label="Switch report animation">
                {REPORT_SLIDES.map((slide, index) => (
                    <button
                        key={slide.label}
                        type="button"
                        role="tab"
                        aria-label={slide.label}
                        aria-selected={activeIndex === index}
                        aria-controls={index === 0 ? 'hero-report-search' : 'hero-report-graph'}
                        className={activeIndex === index ? 'hn-report-carousel__dot hn-report-carousel__dot--active' : 'hn-report-carousel__dot'}
                        onClick={() => selectSlide(index)}
                    />
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
                    <div className="hero-next__intro">
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
                            <a className="hero-next__btn hero-next__btn--yellow" href="https://doris.apache.org/download">
                                <DownloadIcon />
                                Download
                            </a>
                            <a className="hero-next__btn hero-next__btn--primary" href={GET_STARTED_HREF}>
                                Get Started
                            </a>
                            <a
                                className="hero-next__btn hero-next__btn--ghost"
                                href="https://doris.apache.org/slack"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <SlackIcon />
                                Join Slack
                            </a>
                        </div>
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
                        {/* <ReportCarousel /> */}
                    </div>
                </div>
            </div>

            {/* Floating decorative shapes */}
            <div className="hero-next__shape hero-next__shape--diamond" style={{ top: '120px', right: '460px' }} />
            <div className="hero-next__shape hero-next__shape--ring"    style={{ top: '160px', left: '52%' }} />
        </section>
    );
}
