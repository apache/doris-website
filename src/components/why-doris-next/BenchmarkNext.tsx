import React, {
    CSSProperties,
    Fragment,
    JSX,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import Link from '@docusaurus/Link';
import { LayoutNext } from '../home-next/LayoutNext';
import benchmarkData from '@site/src/constant/benchmark.data.json';
import './BenchmarkNext.scss';

/* ──────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────── */

type ProductId = 'doris' | 'clickhouse' | 'redshift' | 'snowflake' | 'trino';

interface Product {
    id: ProductId;
    name: string;
    version: string;
    machine: string;
    clusterSize: number;
    totalRuntime: number;
    queriesCompleted: number;
    queriesTotal: number;
    perQuery: Record<string, number | null>;
}

interface Benchmark {
    id: string;
    name: string;
    scale: string;
    queries: string[];
    products: Product[];
}

interface Tab {
    id: string;
    label: string;
    benchmarks: Benchmark[];
}

interface BenchmarkDataset {
    syncedAt: string;
    tabs: Tab[];
}

/* ──────────────────────────────────────────────────────────────────────────
 * Data — loaded from src/constant/benchmark.data.json
 * ────────────────────────────────────────────────────────────────────────── */

const DATA = benchmarkData as unknown as BenchmarkDataset;

const TAB_DESCRIPTIONS: Record<string, string> = {
    internal:
        'Each engine reads and writes data in its own native format, so Doris and its peers run on their own storage layers.',
    iceberg:
        'Every engine queries the same Apache Iceberg dataset, so storage is held constant and only the engine changes.',
};

const BENCH_DESC: Record<string, string> = {
    ssb:   'A star-schema benchmark with 13 queries, heavy on wide joins and aggregations.',
    tpch:  'The classic decision-support benchmark: 22 ad-hoc queries against a normalized schema.',
    tpcds: 'The most demanding decision-support benchmark: 99 queries that exercise the full surface of an analytical engine.',
};

const PRODUCT_COLORS: Record<ProductId, string> = {
    doris:      'var(--bn-green-deep)',
    clickhouse: '#3D4A55',
    redshift:   '#A4633A',
    snowflake:  '#3C6CAA',
    trino:      'var(--bn-coral)',
};

/* ──────────────────────────────────────────────────────────────────────────
 * Reveal-on-scroll
 * ────────────────────────────────────────────────────────────────────────── */

function useRevealObserver(): void {
    useEffect(() => {
        const items = document.querySelectorAll<HTMLElement>('.bench-next [data-reveal]');
        if (!('IntersectionObserver' in window)) {
            items.forEach(i => i.classList.add('is-visible'));
            return undefined;
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

/* ──────────────────────────────────────────────────────────────────────────
 * Hero
 * ────────────────────────────────────────────────────────────────────────── */

function Hero(): JSX.Element {
    return (
        <section className="b-hero">
            <div className="b-container b-hero-inner">
                <h1 className="b-hero-title" data-reveal>
                    See how fast<br />
                    <span className="b-accent">Apache Doris</span> really is.
                </h1>
                <p className="b-hero-sub" data-reveal data-reveal-delay="1">
                    Side-by-side query results: Doris versus ClickHouse, Redshift, Snowflake, and
                    Trino on{' '}
                    <a
                        className="b-hero-link"
                        href="https://www.cs.umb.edu/~poneil/StarSchemaB.PDF"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Star Schema Benchmark
                    </a>
                    ,{' '}
                    <a
                        className="b-hero-link"
                        href="https://www.tpc.org/tpch/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        TPC-H
                    </a>
                    , and{' '}
                    <a
                        className="b-hero-link"
                        href="https://www.tpc.org/tpcds/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        TPC-DS
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Summary card row — total-runtime bars per benchmark
 * ────────────────────────────────────────────────────────────────────────── */

function SummaryBar({ product, max }: { product: Product; max: number }): JSX.Element {
    const [w, setW] = useState(0);
    const ref = useRef<HTMLDivElement | null>(null);
    const partial = product.queriesCompleted < product.queriesTotal;
    const targetW = max > 0 ? (product.totalRuntime / max) * 100 : 0;

    useEffect(() => {
        if (!ref.current) return undefined;
        const el = ref.current;
        if (!('IntersectionObserver' in window)) {
            setW(targetW);
            return undefined;
        }
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        requestAnimationFrame(() => setW(targetW));
                        io.disconnect();
                    }
                });
            },
            { threshold: 0.25 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [targetW]);

    return (
        <div ref={ref} className={`b-bar ${product.id === 'doris' ? 'is-doris' : ''}`}>
            <div className="b-bar-label">
                <span title={product.name}>{product.name}</span>
                {partial ? (
                    <span
                        className="b-bar-partial"
                        title={`completed ${product.queriesCompleted} of ${product.queriesTotal} queries`}
                    >
                        [1]
                    </span>
                ) : null}
            </div>
            <div className="b-bar-track">
                <div className="b-bar-fill" style={{ width: `${w}%` }} />
            </div>
            <div className="b-bar-value tabular">
                {product.totalRuntime != null ? `${product.totalRuntime.toFixed(1)}s` : '—'}
            </div>
        </div>
    );
}

function SummaryCard({
    bench,
    active,
    onToggle,
}: {
    bench: Benchmark;
    active: boolean;
    onToggle: () => void;
}): JSX.Element {
    const cardRef = useRef<HTMLButtonElement | null>(null);
    const [revealed, setRevealed] = useState(false);
    const sortedProducts = useMemo(
        () =>
            [...bench.products].sort((a, b) => {
                const ar = a.totalRuntime ?? Infinity;
                const br = b.totalRuntime ?? Infinity;
                return ar - br;
            }),
        [bench]
    );
    const max = useMemo(
        () => Math.max(...sortedProducts.map(p => p.totalRuntime || 0)),
        [sortedProducts]
    );
    const hasPartial = sortedProducts.some(
        p => p.queriesCompleted < p.queriesTotal
    );

    useEffect(() => {
        if (!cardRef.current) return undefined;
        if (!('IntersectionObserver' in window)) {
            setRevealed(true);
            return undefined;
        }
        const node = cardRef.current;
        const io = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setRevealed(true);
                        io.unobserve(node);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );
        io.observe(node);
        return () => io.disconnect();
    }, []);

    const handleEnter = () => {
        const card = cardRef.current;
        if (!card) return;
        const fills = card.querySelectorAll<HTMLElement>('.b-bar-fill');
        const widths = Array.from(fills).map(f => f.style.width);
        fills.forEach(f => {
            f.style.transition = 'none';
            f.style.width = '0%';
        });
        void card.offsetWidth;
        fills.forEach((f, i) => {
            f.style.transition = '';
            requestAnimationFrame(() => {
                f.style.width = widths[i];
            });
        });
    };

    return (
        <button
            ref={cardRef}
            type="button"
            className={`b-card ${active ? 'is-active' : ''} ${revealed ? 'is-visible' : ''}`}
            onClick={onToggle}
            onMouseEnter={handleEnter}
            data-reveal-local
        >
            <div className="b-card-head">
                <h3 className="b-card-title">{bench.name}</h3>
                <span className="b-card-tag">{bench.scale}</span>
            </div>
            <div className="b-card-metric">Total Run Time</div>
            <div className="b-bars">
                {sortedProducts.map(p => (
                    <SummaryBar key={p.id} product={p} max={max} />
                ))}
            </div>
            {hasPartial ? (
                <div className="b-card-note">
                    [1] ClickHouse couldn&rsquo;t finish some queries without rewriting the SQL.
                    The number above counts only the queries that did finish.
                </div>
            ) : null}
            <div className="b-card-desc">{BENCH_DESC[bench.id] || ''}</div>
            <div className="b-card-tip">
                {active ? <>Hide per-query breakdown ↑</> : <>See per-query breakdown ↓</>}
            </div>
        </button>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Detail strip — per-query grouped bars
 * ────────────────────────────────────────────────────────────────────────── */

function niceAxis(maxValue: number): { niceMax: number; ticks: number[] } {
    if (maxValue <= 0) return { niceMax: 1, ticks: [1, 0] };
    const roughStep = maxValue / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    let nice: number;
    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else nice = 10;
    const step = nice * magnitude;
    const niceMax = Math.ceil(maxValue / step) * step;
    const ticks: number[] = [];
    for (let v = niceMax; v >= -1e-9; v -= step) ticks.push(Math.round(v * 1000) / 1000);
    return { niceMax, ticks };
}

function DetailStrip({ bench }: { bench: Benchmark }): JSX.Element {
    const sortedProducts = useMemo(
        () =>
            [...bench.products].sort((a, b) => {
                const ar = a.totalRuntime ?? Infinity;
                const br = b.totalRuntime ?? Infinity;
                return ar - br;
            }),
        [bench]
    );

    const dataMax = useMemo(() => {
        let m = 0;
        sortedProducts.forEach(p => {
            bench.queries.forEach(q => {
                const v = p.perQuery[q];
                if (v != null && v > m) m = v;
            });
        });
        return m;
    }, [sortedProducts, bench.queries]);

    const { niceMax, ticks: yticks } = useMemo(() => niceAxis(dataMax), [dataMax]);

    const [animated, setAnimated] = useState(false);
    useEffect(() => {
        setAnimated(false);
        const t = setTimeout(() => setAnimated(true), 30);
        return () => clearTimeout(t);
    }, [bench.id]);

    const barW = 10;
    const barGap = 2;
    const clusterPad = 8;
    const clusterW =
        sortedProducts.length * barW + (sortedProducts.length - 1) * barGap + clusterPad * 2;

    return (
        <div className="b-detail">
            <div className="b-detail-head">
                <h3 className="b-detail-title">
                    {bench.name} per-query runtime
                    <span className="b-detail-title-sub">
                        scale {bench.scale} · {bench.queries.length} queries
                    </span>
                </h3>
                <div className="b-detail-legend">
                    {sortedProducts.map(p => (
                        <span key={p.id} className="b-detail-legend-item">
                            <span
                                className="b-detail-legend-swatch"
                                style={{ background: PRODUCT_COLORS[p.id] || 'rgba(245,239,228,0.4)' }}
                            />
                            {p.name}
                        </span>
                    ))}
                    <span className="b-detail-legend-item" style={{ color: 'rgba(255,92,57,0.85)' }}>
                        <span
                            className="b-detail-legend-swatch"
                            style={{ background: 'transparent', border: '1px dashed rgba(255,92,57,0.7)' }}
                        />
                        Failed
                    </span>
                </div>
            </div>
            <div className="b-detail-scroll">
                <div
                    className="b-chart"
                    style={{ minWidth: 60 + bench.queries.length * clusterW + 24 }}
                >
                    <div className="b-chart-yaxis" aria-hidden="true">
                        {yticks.map((t, i) => (
                            <span key={i}>{t}s</span>
                        ))}
                    </div>
                    <div className="b-chart-grid" aria-hidden="true" />
                    <div className="b-chart-body">
                        {bench.queries.map((q, qi) => (
                            <div key={q} className="b-cluster" style={{ width: clusterW }}>
                                <div className="b-cluster-bars" style={{ gap: barGap }}>
                                    {sortedProducts.map((p, pi) => {
                                        const v = p.perQuery[q];
                                        const failed = v == null;
                                        const h = failed ? 18 : Math.max(2, ((v as number) / niceMax) * 230);
                                        const color = PRODUCT_COLORS[p.id] || 'rgba(245,239,228,0.4)';
                                        const style: CSSProperties = {
                                            width: barW,
                                            height: animated ? (failed ? 18 : h) : 0,
                                            background: failed ? undefined : color,
                                            transitionDelay: `${Math.min(qi * 12 + pi * 30, 1100)}ms`,
                                        };
                                        return (
                                            <span
                                                key={p.id}
                                                className={`b-cluster-bar ${p.id === 'doris' ? 'is-doris' : ''} ${
                                                    failed ? 'is-failed' : ''
                                                }`}
                                                style={style}
                                            >
                                                <span className="b-cluster-bar-tip">
                                                    {p.name} · {q} · {failed ? 'failed' : `${(v as number).toFixed(2)}s`}
                                                </span>
                                            </span>
                                        );
                                    })}
                                </div>
                                <div className="b-cluster-label">{q.replace(/^query0?/, 'q')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="b-detail-env">
                <ul className="b-detail-env-list">
                    {sortedProducts.map(p => {
                        const partial = p.queriesCompleted < p.queriesTotal;
                        return (
                            <li
                                key={p.id}
                                className={`b-detail-env-prod ${p.id === 'doris' ? 'is-doris' : ''}`}
                            >
                                <span className="b-detail-env-prod-name">
                                    {p.name} {p.version}
                                </span>
                                <span>
                                    {' · '}
                                    {p.clusterSize} × {p.machine}
                                </span>
                                {partial ? (
                                    <span className="b-detail-env-partial">
                                        {' · '}completed {p.queriesCompleted} / {p.queriesTotal}
                                    </span>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="b-detail-foot">
                Hover any bar for its exact runtime. Hatched bars are queries that didn&rsquo;t
                finish within the time limit.
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Comparison section
 * ────────────────────────────────────────────────────────────────────────── */

function Comparison(): JSX.Element {
    const [activeTab, setActiveTab] = useState<string>(DATA.tabs[0].id);
    const [expanded, setExpanded] = useState<string | null>(null);

    const tab = DATA.tabs.find(t => t.id === activeTab) ?? DATA.tabs[0];
    const expandedBench = tab.benchmarks.find(b => b.id === expanded);
    const colsClass = `is-cols-${tab.benchmarks.length}`;

    const switchTab = (id: string) => {
        setActiveTab(id);
        setExpanded(null);
    };

    return (
        <section className="b-cmp">
            <div className="b-cmp-bggrid" aria-hidden="true" />
            <div className="b-container">
                <div className="b-cmp-head" data-reveal>
                    <h2 className="b-cmp-title">Direct head-to-head, query by query.</h2>
                    <p className="b-cmp-sub">
                        Click any benchmark to expand the per-query breakdown. We show the run as
                        it happened, including queries where another engine timed out or failed.
                    </p>
                </div>

                <div className="b-tabs" role="tablist" data-reveal>
                    {DATA.tabs.map(t => (
                        <button
                            key={t.id}
                            role="tab"
                            type="button"
                            aria-selected={t.id === activeTab}
                            className={`b-tab ${t.id === activeTab ? 'is-active' : ''}`}
                            onClick={() => switchTab(t.id)}
                        >
                            {t.label}
                            {TAB_DESCRIPTIONS[t.id] ? (
                                <span className="b-tab-tip" role="tooltip">
                                    {TAB_DESCRIPTIONS[t.id]}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                <div className={`b-sum-row ${colsClass}`}>
                    {tab.benchmarks.map(b => (
                        <SummaryCard
                            key={b.id}
                            bench={b}
                            active={expanded === b.id}
                            onToggle={() => setExpanded(expanded === b.id ? null : b.id)}
                        />
                    ))}
                </div>

                {expandedBench ? (
                    <DetailStrip bench={expandedBench} />
                ) : null}
            </div>
        </section>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reproduce section
 * ────────────────────────────────────────────────────────────────────────── */

interface StepLine {
    p?: string;
    cmd?: string;
    arg?: string;
    c?: string;
}

interface ReproStep {
    id: number;
    title: string;
    body: string;
    promptLine: string;
    file: string;
    lines: StepLine[];
}

const METHODOLOGY: { label: string; body: string }[] = [
    {
        label: 'What we measure',
        body: 'Per-query runtime, summed across the selected queries for each benchmark.',
    },
    {
        label: 'Runs per query',
        body: 'Each query runs at least 3×. Cold = first run; hot = faster of runs 2 and 3.',
    },
    {
        label: 'Cache control',
        body: 'Result caches disabled on every engine. Doris BE caches cleared before cold runs.',
    },
    {
        label: 'Hardware parity',
        body: 'Same region and VPC across engines, with identical machine class for each cluster.',
    },
    {
        label: 'Data parity',
        body: 'Same source data loaded into each engine before the run, in its native format.',
    },
    {
        label: 'Transparency',
        body: 'All scripts, queries, configs, and per-run metadata are published in the repo.',
    },
];

const REPRO_STEPS: ReproStep[] = [
    {
        id: 1,
        title: 'Clone the benchmark scripts',
        body: 'Pull the benchmark repository onto the machine that will drive the run.',
        promptLine: 'user@bench ~ %',
        file: 'shell',
        lines: [
            { p: '$ ', cmd: 'git clone', arg: 'https://github.com/velodb/benchmarks' },
            { c: "Cloning into 'benchmarks'…" },
            { c: 'remote: Enumerating objects: 1,842, done.' },
            { c: 'Receiving objects: 100% (1,842/1,842), 4.21 MiB | 8.32 MiB/s, done.' },
            { p: '$ ', cmd: 'cd', arg: 'benchmarks' },
        ],
    },
    {
        id: 2,
        title: 'Configure your Doris cluster endpoint',
        body:
            'Open the config file and fill in the host, port, user, password, and database for your Doris cluster.',
        promptLine: 'user@bench ~/benchmarks %',
        file: 'benchmark.yaml',
        lines: [
            { p: '$ ', cmd: 'vim', arg: 'benchmarks/clickbench/doris/benchmark.yaml' },
            { c: '# fill in:' },
            { c: '#   host: <your-doris-fe-host>' },
            { c: '#   port: 9030' },
            { c: '#   user: root' },
            { c: '#   password: <your-password>' },
            { c: '#   database: benchmark' },
        ],
    },
    {
        id: 3,
        title: 'Install third-party tooling',
        body:
            'The runner relies on a few CLI clients (mysql, jq, hyperfine). One make target installs them all.',
        promptLine: 'user@bench ~/benchmarks %',
        file: 'shell',
        lines: [
            { p: '$ ', cmd: 'make', arg: 'thirdparty' },
            { c: '→ Installing mysql-client … ok' },
            { c: '→ Installing jq           … ok' },
            { c: '→ Installing hyperfine    … ok' },
            { c: 'Third-party tooling ready.' },
        ],
    },
    {
        id: 4,
        title: 'Run the benchmark and generate the report',
        body:
            'Kick off the run, then collect the report. The runner prints a per-query summary as it goes.',
        promptLine: 'user@bench ~/benchmarks %',
        file: 'shell',
        lines: [
            { p: '$ ', cmd: 'bash', arg: 'benchmark.sh --config benchmarks/clickbench/doris/benchmark.yaml' },
            { c: '[ssb]  q1.1 … 0.149s   q1.2 … 0.106s   q1.3 … 0.099s' },
            { c: '[ssb]  q2.1 … 1.162s   q2.2 … 1.237s   q2.3 … 1.107s' },
            { c: '[ssb]  q3.1 … 2.223s   …' },
            { c: 'Benchmark complete · 13/13 queries · 11.559 s total' },
            { p: '$ ', cmd: 'make', arg: 'result' },
            { c: '→ Wrote results to results/aws.32C.json' },
        ],
    },
];

function ReproSection(): JSX.Element {
    const [active, setActive] = useState(1);
    const step = REPRO_STEPS.find(s => s.id === active) ?? REPRO_STEPS[0];

    return (
        <section className="b-repro">
            <div className="b-container">
                <div className="b-repro-head" data-reveal>
                    <h2 className="b-repro-title">
                        Run it yourself<br />in five minutes.
                    </h2>
                    <p className="b-repro-sub">
                        Every number above is reproducible from open scripts. Four steps, four
                        shell commands. Click a step to see what runs.
                    </p>
                </div>
                <div className="b-method" data-reveal data-reveal-delay="1">
                    <div className="b-method-head">
                        <span className="b-eyebrow">
                            <span className="b-eyebrow-line" />
                            How we measure
                        </span>
                        <a
                            className="b-method-link"
                            href="https://github.com/velodb/benchmarks#readme"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Read the full methodology ↗
                        </a>
                    </div>
                    <div className="b-method-grid">
                        {METHODOLOGY.map(m => (
                            <div key={m.label} className="b-method-item">
                                <div className="b-method-label">{m.label}</div>
                                <div className="b-method-body">{m.body}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="b-repro-grid" data-reveal>
                    <div className="b-steps">
                        {REPRO_STEPS.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                className={`b-step ${s.id === active ? 'is-active' : ''}`}
                                onClick={() => setActive(s.id)}
                            >
                                <div className="b-step-num">0{s.id}</div>
                                <div>
                                    <h4 className="b-step-title">{s.title}</h4>
                                    <p className="b-step-body">{s.body}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="b-term">
                        <div className="b-term-bar">
                            <span className="b-term-dots">
                                <span /><span /><span />
                            </span>
                            <span className="b-term-title">
                                <span>{step.promptLine}</span>
                                <span className="b-term-step">— step 0{step.id}</span>
                            </span>
                            <span>{step.file}</span>
                        </div>
                        <pre key={step.id}>
                            {step.lines.map((ln, i) => (
                                <Fragment key={i}>
                                    {ln.p ? <span className="c-prompt">{ln.p}</span> : null}
                                    {ln.cmd ? <span className="c-cmd">{ln.cmd}</span> : null}
                                    {ln.arg ? (
                                        <>
                                            {' '}
                                            <span className="c-arg">{ln.arg}</span>
                                        </>
                                    ) : null}
                                    {ln.c ? <span className="c-comment">{ln.c}</span> : null}
                                    {'\n'}
                                </Fragment>
                            ))}
                            <span className="c-prompt">$ </span>
                            <span className="b-term-cursor" />
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * CTA
 * ────────────────────────────────────────────────────────────────────────── */

function CTA(): JSX.Element {
    return (
        <section className="b-cta">
            <div className="b-container b-cta-inner">
                <h2 className="b-cta-title" data-reveal data-reveal-delay="1">
                    Try Apache <span className="b-accent">Doris</span> on<br />your own data.
                </h2>
                <div className="b-cta-actions" data-reveal data-reveal-delay="2">
                    <Link
                        className="b-btn b-btn-yellow"
                        to="/docs-next/dev/getting-started/quick-start"
                    >
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
                    <button
                        type="button"
                        className="b-btn b-btn-primary"
                        disabled
                        aria-disabled="true"
                    >
                        See Report (Coming Soon)
                    </button>
                </div>
            </div>
        </section>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Top-level
 * ────────────────────────────────────────────────────────────────────────── */

export default function BenchmarkNext(): JSX.Element {
    useRevealObserver();
    return (
        <LayoutNext
            title="Apache Doris Benchmarks: SSB, TPC-H, TPC-DS"
            description="Direct query-performance comparisons of Apache Doris against ClickHouse, Redshift, Snowflake, and Trino across SSB, TPC-H, and TPC-DS at scale factor 1000."
        >
            <div className="bench-next">
                <Hero />
                <Comparison />
                {/* <ReproSection /> hidden for now; revisit later */}
                <CTA />
            </div>
        </LayoutNext>
    );
}
