import React, { JSX, useEffect, useState } from 'react';
import './StatsSection.scss';

interface UserLogo {
    id: string;
    name: string;
    file: string;
    category: string;
    description: string;
    metric: string;
    metricLabel: string;
    scale?: number;
}

const USER_LOGOS: UserLogo[] = [
    {
        id: 'xiaomi',
        name: 'Xiaomi',
        file: 'xiaomi.svg',
        category: 'Technology',
        description: 'Runs interactive analytics on device, app, and service data so operations teams can monitor business health live.',
        metric: 'Real-time',
        metricLabel: 'Operations insight',
        scale: 1.2,
    },
    {
        id: 'baidu',
        name: 'Baidu',
        file: 'baidu.svg',
        category: 'Technology',
        description: 'Powers large-scale log analytics and ad-hoc SQL exploration for engineering and platform observability workflows.',
        metric: 'Billions',
        metricLabel: 'Events analyzed',
        scale: 1.2,
    },
    {
        id: 'samsung',
        name: 'Samsung',
        file: 'samsung.svg',
        category: 'Technology',
        description: 'Uses Apache Doris for device telemetry and service analytics across consumer electronics product lines.',
        metric: 'Global',
        metricLabel: 'Device analytics',
    },
    {
        id: 'jd',
        name: 'JD.com',
        file: 'jd.svg',
        category: 'E-commerce',
        description: 'Serves retail analytics for order, inventory, and marketing data with fast SQL access for business users.',
        metric: 'Unified',
        metricLabel: 'Retail analytics',
    },
    {
        id: 'meituan',
        name: 'Meituan',
        file: 'meituan.svg',
        category: 'Internet Services',
        description: 'Runs city-scale business analytics over orders, merchants, riders, and user activity for live decision support.',
        metric: 'City-scale',
        metricLabel: 'Business data',
    },
    {
        id: 'netease',
        name: 'NetEase',
        file: 'netease.svg',
        category: 'Internet Services',
        description: 'Uses Apache Doris for game and content analytics, helping teams inspect live metrics without long batch delays.',
        metric: 'Live',
        metricLabel: 'Content metrics',
    },
    {
        id: 'tencent-music',
        name: 'Tencent Music',
        file: 'tencent-music.svg',
        category: 'Media',
        description: 'Uses Doris for fast aggregation over user listening, content, and engagement data to power live music analytics.',
        metric: 'High QPS',
        metricLabel: 'Music analytics',
        scale: 1.5,
    },
    {
        id: 'kwai',
        name: 'Kwai',
        file: 'kwai.svg',
        category: 'Media',
        description: 'Powers short-video content and creator analytics with sub-second response over massive engagement event streams.',
        metric: 'Massive',
        metricLabel: 'Engagement events',
    },
    {
        id: 'mihoyo',
        name: 'miHoYo',
        file: 'mihoyo.svg',
        category: 'Gaming',
        description: 'Analyzes player behavior, in-game economy, and live operations data with Doris for fast iteration.',
        metric: 'Player-level',
        metricLabel: 'Game analytics',
    },
    {
        id: 'luckin-coffee',
        name: 'Luckin Coffee',
        file: 'luckin-coffee.svg',
        category: 'Retail',
        description: 'Uses Doris for store, order, and membership analytics to track campaign performance across thousands of outlets.',
        metric: 'Store-level',
        metricLabel: 'Retail insights',
    },
    {
        id: 'miniso',
        name: 'MINISO',
        file: 'miniso.svg',
        category: 'Retail',
        description: 'Powers SKU-level sales, inventory, and supply-chain reporting across global retail operations.',
        metric: 'SKU-level',
        metricLabel: 'Sales reporting',
        scale: 1.15,
    },
    {
        id: 'sf-express',
        name: 'SF Express',
        file: 'sf-express.svg',
        category: 'Logistics',
        description: 'Tracks shipment, route, and operations data in near real-time to support nationwide express delivery.',
        metric: 'Nationwide',
        metricLabel: 'Shipment tracking',
    },
    {
        id: 'zto',
        name: 'ZTO Express',
        file: 'zto.svg',
        category: 'Logistics',
        description: 'Uses Doris for parcel flow, sorting hub, and last-mile analytics across the express delivery network.',
        metric: 'Network-wide',
        metricLabel: 'Parcel analytics',
        scale: 1.25,
    },
    {
        id: 'cainiao',
        name: 'Cainiao',
        file: 'cainiao.svg',
        category: 'Logistics',
        description: 'Analyzes warehouse, route, and cross-border logistics data to optimize fulfillment operations.',
        metric: 'Cross-border',
        metricLabel: 'Logistics insight',
    },
    {
        id: 'ford',
        name: 'Ford',
        file: 'ford.svg',
        category: 'Automotive',
        description: 'Builds unified analytics over vehicle, dealer, and service data to support connected mobility programs.',
        metric: 'Connected',
        metricLabel: 'Vehicle data',
        scale: 1.15,
    },
    {
        id: 'byd',
        name: 'BYD',
        file: 'byd.svg',
        category: 'Automotive',
        description: 'Powers EV telemetry, supply chain, and after-sales analytics with fast SQL access for product teams.',
        metric: 'EV-scale',
        metricLabel: 'Telemetry data',
        scale: 1.1,
    },
    {
        id: 'suzuki',
        name: 'Suzuki',
        file: 'suzuki.svg',
        category: 'Automotive',
        description: 'Uses Apache Doris for manufacturing, dealer, and service analytics across global automotive operations.',
        metric: 'Global',
        metricLabel: 'Operations view',
    },
    {
        id: 'anta',
        name: 'ANTA',
        file: 'anta.svg',
        category: 'Sportswear',
        description: 'Runs retail, channel, and consumer analytics to inform product and marketing decisions across sportswear brands.',
        metric: 'Channel-level',
        metricLabel: 'Retail analytics',
    },
    {
        id: 'li-ning',
        name: 'Li-Ning',
        file: 'li-ning.svg',
        category: 'Sportswear',
        description: 'Powers store, e-commerce, and supply chain analytics with Doris for daily and real-time decision making.',
        metric: 'Omni-channel',
        metricLabel: 'Sales analytics',
        scale: 1.3,
    },
    {
        id: 'xtep',
        name: 'Xtep',
        file: 'xtep.svg',
        category: 'Sportswear',
        description: 'Uses Doris for membership, sales, and campaign analytics across retail and digital channels.',
        metric: 'Member-level',
        metricLabel: 'Customer insight',
    },
    {
        id: 'zhipu-ai',
        name: 'Zhipu AI',
        file: 'zhipu-ai.svg',
        category: 'AI',
        description: 'Uses Apache Doris to analyze model training metrics, usage events, and platform telemetry at scale.',
        metric: 'AI-scale',
        metricLabel: 'Model analytics',
    },
    {
        id: 'minimax',
        name: 'MiniMax',
        file: 'minimax.svg',
        category: 'AI',
        description: 'Powers product usage, training pipeline, and inference observability analytics for foundation model workloads.',
        metric: 'Foundation',
        metricLabel: 'Model telemetry',
    },
    {
        id: 'ave-ai',
        name: 'Ave AI',
        file: 'ave-ai.svg',
        category: 'AI',
        description: 'Builds AI-driven data products on Doris with fast SQL access for ad-hoc exploration and reporting.',
        metric: 'Self-serve',
        metricLabel: 'AI analytics',
    },
    {
        id: 'talkie',
        name: 'Talkie',
        file: 'talkie.svg',
        category: 'AI',
        description: 'Analyzes conversation, engagement, and growth signals for an AI character chat product at scale.',
        metric: 'Conversation',
        metricLabel: 'Engagement data',
    },
    {
        id: 'horizon-robotics',
        name: 'Horizon Robotics',
        file: 'horizon-robotics.svg',
        category: 'Autonomous Driving',
        description: 'Uses Doris to process driving data, sensor telemetry, and chip performance metrics for autonomous platforms.',
        metric: 'Sensor-scale',
        metricLabel: 'Driving data',
    },
    {
        id: 'goldwind',
        name: 'Goldwind',
        file: 'goldwind.svg',
        category: 'Energy',
        description: 'Powers wind turbine telemetry and operations analytics across renewable energy assets worldwide.',
        metric: 'Turbine-level',
        metricLabel: 'Energy telemetry',
    },
    {
        id: 'advance-intelligence',
        name: 'Advance Intelligence',
        file: 'advance-intelligence.svg',
        category: 'Fintech',
        description: 'Runs risk, credit, and transaction analytics for AI-driven fintech products across Southeast Asia.',
        metric: 'Cross-region',
        metricLabel: 'Risk analytics',
    },
    {
        id: 'true-watch',
        name: 'TrueWatch',
        file: 'true-watch.svg',
        category: 'Observability',
        description: 'Powers a unified observability platform using Doris for metrics, logs, and traces at infrastructure scale.',
        metric: 'Unified',
        metricLabel: 'Observability data',
    },
];

interface LogoTileProps {
    logo: UserLogo;
    duplicate?: boolean;
    expanded?: boolean;
    onEnter?: () => void;
    onLeave?: () => void;
}

function LogoTile({ logo, duplicate = false, expanded = false, onEnter, onLeave }: LogoTileProps): JSX.Element {
    const src = `/images/next/user-logos/${logo.file}`;
    const logoStyle = logo.scale !== undefined
        ? ({ '--logo-scale': logo.scale } as React.CSSProperties)
        : undefined;

    return (
        <article
            className={`stats-next__card${expanded ? ' stats-next__card--expanded' : ''}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onFocus={onEnter}
            onBlur={onLeave}
            tabIndex={duplicate ? -1 : 0}
            aria-hidden={duplicate}
            aria-label={`${logo.name}, ${logo.description}`}
            role="group"
        >
            <div className="stats-next__card-logo" style={logoStyle}>
                <img
                    src={src}
                    alt={duplicate ? '' : logo.name}
                    title={logo.name}
                    loading="lazy"
                    draggable={false}
                />
            </div>

            <div className="stats-next__card-content">
                <div className="stats-next__card-head">
                    <span className="stats-next__card-mark">
                        <img src={src} alt="" loading="lazy" draggable={false} />
                    </span>
                    <span className="stats-next__card-name">{logo.name}</span>
                    <span className="stats-next__card-tag">{logo.category}</span>
                </div>
                <p className="stats-next__card-description">{logo.description}</p>
                <div className="stats-next__card-meta">
                    <div>
                        <span className="stats-next__card-meta-label">Use case</span>
                        <span className="stats-next__card-meta-value">{logo.metricLabel}</span>
                    </div>
                    <div>
                        <span className="stats-next__card-meta-label">Result</span>
                        <span className="stats-next__card-meta-value">{logo.metric}</span>
                    </div>
                </div>
            </div>
        </article>
    );
}

function useCompactStats(): boolean {
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        const query = window.matchMedia('(max-width: 768px), (hover: none)');
        const update = () => setCompact(query.matches);

        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    return compact;
}

function CompactStatsGrid(): JSX.Element {
    return (
        <section className="stats-next stats-next--compact" aria-label="Companies using Apache Doris">
            <div className="stats-next__grid-viewport">
                <div className="stats-next__grid">
                    {USER_LOGOS.map(logo => (
                        <LogoTile key={logo.id} logo={logo} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export function StatsSection(): JSX.Element {
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const compact = useCompactStats();
    const logoLoop = [...USER_LOGOS, ...USER_LOGOS];

    useEffect(() => {
        if (compact) setHoveredKey(null);
    }, [compact]);

    if (compact) {
        return <CompactStatsGrid />;
    }

    return (
        <section className="stats-next" aria-label="Companies using Apache Doris">
            <div className="stats-next__viewport">
                <div className={`stats-next__track${hoveredKey ? ' stats-next__track--expanded' : ''}`}>
                    {logoLoop.map((logo, index) => {
                        const cardKey = `${logo.id}-${index}`;
                        const duplicate = index >= USER_LOGOS.length;

                        return (
                            <LogoTile
                                key={cardKey}
                                logo={logo}
                                duplicate={duplicate}
                                expanded={hoveredKey === cardKey}
                                onEnter={() => setHoveredKey(cardKey)}
                                onLeave={() =>
                                    setHoveredKey(current => (current === cardKey ? null : current))
                                }
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
