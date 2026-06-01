import React, { JSX, useEffect, useState } from 'react';
import './StatsSection.scss';

interface UserLogo {
    id: string;
    name: string;
    file: string;
    category: string;
    about: string;
    description: string;
    metric: string;
    metricLabel: string;
    scale?: number;
}

const USER_LOGOS: UserLogo[] = [
    {
        id: 'xiaomi',
        about: 'Xiaomi is a global top-three smartphone maker and a leading consumer-electronics and smart-home brand, with growing reach into electric vehicles.',
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
        about: "Baidu is China's largest search engine and a leading AI company, powering products from ERNIE large language models to Apollo autonomous driving.",
        name: 'Baidu',
        file: 'baidu.svg',
        category: 'Technology',
        description: 'Powers large-scale log analytics and ad-hoc SQL exploration for engineering and platform observability workflows.',
        metric: 'Billions',
        metricLabel: 'Events analyzed',
        scale: 1.6,
    },
    {
        id: 'samsung',
        about: "Samsung is the world's largest electronics manufacturer, leading in smartphones, memory chips, displays, and home appliances across more than 70 countries.",
        name: 'Samsung',
        file: 'samsung.svg',
        category: 'Technology',
        description: 'Uses Apache Doris for device telemetry and service analytics across consumer electronics product lines.',
        metric: 'Global',
        metricLabel: 'Device analytics',
        scale: 0.9,
    },
    {
        id: 'jd',
        about: "JD.com is China's largest retailer by revenue and a Fortune Global 500 top-50 company, operating one of the world's most extensive self-built logistics networks.",
        name: 'JD.com',
        file: 'jd.svg',
        category: 'E-commerce',
        description: 'Serves retail analytics for order, inventory, and marketing data with fast SQL access for business users.',
        metric: 'Unified',
        metricLabel: 'Retail analytics',
    },
    {
        id: 'meituan',
        about: "Meituan is China's largest local-services platform, connecting hundreds of millions of users with food delivery, travel, and on-demand retail every day.",
        name: 'Meituan',
        file: 'meituan.svg',
        category: 'Internet Services',
        description: 'Runs city-scale business analytics over orders, merchants, riders, and user activity for live decision support.',
        metric: 'City-scale',
        metricLabel: 'Business data',
    },
    {
        id: 'netease',
        about: "NetEase is China's second-largest gaming company and a major internet group spanning hit titles, music streaming, education, and intelligent enterprise services.",
        name: 'NetEase',
        file: 'netease.svg',
        category: 'Internet Services',
        description: 'Uses Apache Doris for game and content analytics, helping teams inspect live metrics without long batch delays.',
        metric: 'Live',
        metricLabel: 'Content metrics',
        scale: 1.4,
    },
    {
        id: 'tencent-music',
        about: "Tencent Music Entertainment is China's leading online music and audio platform, reaching over 500 million monthly users across QQ Music, Kugou, and Kuwo.",
        name: 'Tencent Music',
        file: 'tencent-music.svg',
        category: 'Media',
        description: 'Uses Doris for fast aggregation over user listening, content, and engagement data to power live music analytics.',
        metric: 'High QPS',
        metricLabel: 'Music analytics',
        scale: 0.9,
    },
    {
        id: 'kwai',
        about: "Kuaishou is one of the world's largest short-video and live-streaming platforms, with more than 700 million monthly active users across China and its international Kwai app.",
        name: 'Kwai',
        file: 'kwai.svg',
        category: 'Media',
        description: 'Powers short-video content and creator analytics with sub-second response over massive engagement event streams.',
        metric: 'Massive',
        metricLabel: 'Engagement events',
    },
    {
        id: 'mihoyo',
        about: 'miHoYo, known globally as HoYoverse, is a leading game studio behind blockbuster franchises Genshin Impact, Honkai Star Rail, and Zenless Zone Zero.',
        name: 'miHoYo',
        file: 'mihoyo.svg',
        category: 'Gaming',
        description: 'Analyzes player behavior, in-game economy, and live operations data with Doris for fast iteration.',
        metric: 'Player-level',
        metricLabel: 'Game analytics',
    },
    {
        id: 'luckin-coffee',
        about: "Luckin Coffee is the world's largest coffee chain by store count, with more than 31,000 outlets serving tens of millions of daily customers.",
        name: 'Luckin Coffee',
        file: 'luckin-coffee.svg',
        category: 'Retail',
        description: 'Uses Doris for store, order, and membership analytics to track campaign performance across thousands of outlets.',
        metric: 'Store-level',
        metricLabel: 'Retail insights',
        scale: 1.5,
    },
    {
        id: 'miniso',
        about: 'MINISO is a fast-growing global lifestyle and IP retailer, operating over 8,000 stores across more than 110 countries and regions worldwide.',
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
        about: 'SF Express is the largest integrated logistics provider in China and Asia, and ranks among the top four globally by revenue.',
        name: 'SF Express',
        file: 'sf-express.svg',
        category: 'Logistics',
        description: 'Tracks shipment, route, and operations data in near real-time to support nationwide express delivery.',
        metric: 'Nationwide',
        metricLabel: 'Shipment tracking',
        scale: 1.2,
    },
    {
        id: 'zto',
        about: "ZTO Express is China's largest express delivery company by parcel volume, handling more than 34 billion parcels annually and leading the market for nine consecutive years.",
        name: 'ZTO Express',
        file: 'zto.svg',
        category: 'Logistics',
        description: 'Uses Doris for parcel flow, sorting hub, and last-mile analytics across the express delivery network.',
        metric: 'Network-wide',
        metricLabel: 'Parcel analytics',
        scale: 0.8,
    },
    {
        id: 'cainiao',
        about: "Cainiao is Alibaba's global smart-logistics arm and a top-tier cross-border parcel network, serving e-commerce and supply-chain customers in more than 200 countries.",
        name: 'Cainiao',
        file: 'cainiao.svg',
        category: 'Logistics',
        description: 'Analyzes warehouse, route, and cross-border logistics data to optimize fulfillment operations.',
        metric: 'Cross-border',
        metricLabel: 'Logistics insight',
    },
    {
        id: 'ford',
        about: "Ford Motor Company is one of the world's largest automakers, building iconic vehicles like the F-Series pickup, Mustang, and a growing lineup of electric models.",
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
        about: "BYD is the world's largest electric-vehicle maker and a top-tier lithium-battery manufacturer, outselling Tesla globally and shipping millions of EVs and hybrids each year.",
        name: 'BYD',
        file: 'byd.svg',
        category: 'Automotive',
        description: 'Powers EV telemetry, supply chain, and after-sales analytics with fast SQL access for product teams.',
        metric: 'EV-scale',
        metricLabel: 'Telemetry data',
        scale: 0.9,
    },
    {
        id: 'suzuki',
        about: 'Suzuki Motor is a top-10 global automaker and the dominant car brand in India and Southeast Asia, also famous for its motorcycles, ATVs, and outboard engines.',
        name: 'Suzuki',
        file: 'suzuki.svg',
        category: 'Automotive',
        description: 'Uses Apache Doris for manufacturing, dealer, and service analytics across global automotive operations.',
        metric: 'Global',
        metricLabel: 'Operations view',
    },
    {
        id: 'anta',
        about: "ANTA Sports is China's largest sportswear group and a global top-three player by revenue, with a brand portfolio spanning ANTA, FILA, Descente, and Arc'teryx.",
        name: 'ANTA',
        file: 'anta.svg',
        category: 'Sportswear',
        description: 'Runs retail, channel, and consumer analytics to inform product and marketing decisions across sportswear brands.',
        metric: 'Channel-level',
        metricLabel: 'Retail analytics',
    },
    {
        id: 'li-ning',
        about: 'Li-Ning is a leading Chinese sportswear powerhouse founded by the Olympic gymnast, fusing performance gear with streetwear culture across thousands of stores nationwide.',
        name: 'Li-Ning',
        file: 'li-ning.svg',
        category: 'Sportswear',
        description: 'Powers store, e-commerce, and supply chain analytics with Doris for daily and real-time decision making.',
        metric: 'Omni-channel',
        metricLabel: 'Sales analytics',
        scale: 1.9,
    },
    {
        id: 'xtep',
        about: "Xtep is a top-five Chinese sportswear brand and the country's number-one running label, sponsoring marathons and dressing millions of runners worldwide.",
        name: 'Xtep',
        file: 'xtep.svg',
        category: 'Sportswear',
        description: 'Uses Doris for membership, sales, and campaign analytics across retail and digital channels.',
        metric: 'Member-level',
        metricLabel: 'Customer insight',
    },
    {
        id: 'zhipu-ai',
        about: "Zhipu AI is one of China's leading large-model labs and a Tsinghua spinout, building the GLM and ChatGLM foundation models that power chatbots and AI agents at scale.",
        name: 'Zhipu AI',
        file: 'zhipu-ai.svg',
        category: 'AI',
        description: 'Uses Apache Doris to analyze model training metrics, usage events, and platform telemetry at scale.',
        metric: 'AI-scale',
        metricLabel: 'Model analytics',
        scale: 1.0,
    },
    {
        id: 'minimax',
        about: 'MiniMax is a top Chinese AI unicorn building multimodal foundation models behind hit consumer apps like Talkie and Hailuo, serving tens of millions of users worldwide.',
        name: 'MiniMax',
        file: 'minimax.svg',
        category: 'AI',
        description: 'Powers product usage, training pipeline, and inference observability analytics for foundation model workloads.',
        metric: 'Foundation',
        metricLabel: 'Model telemetry',
    },
    {
        id: 'ave-ai',
        about: 'Ave AI is a fast-growing data startup turning messy enterprise signals into AI-driven analytics and intelligent decisioning for modern data teams.',
        name: 'Ave AI',
        file: 'ave-ai.svg',
        category: 'AI',
        description: 'Builds AI-driven data products on Doris with fast SQL access for ad-hoc exploration and reporting.',
        metric: 'Self-serve',
        metricLabel: 'AI analytics',
        scale: 2.0,
    },
    {
        id: 'talkie',
        about: 'Talkie is a leading AI companion and character-chat app with over 11 million monthly active users, ranking among the most-downloaded AI apps in the United States.',
        name: 'Talkie',
        file: 'talkie.svg',
        category: 'AI',
        description: 'Analyzes conversation, engagement, and growth signals for an AI character chat product at scale.',
        metric: 'Conversation',
        metricLabel: 'Engagement data',
    },
    {
        id: 'horizon-robotics',
        about: "Horizon Robotics is China's leading autonomous-driving chipmaker, commanding over 40% of the domestic ADAS market and powering more than 100 vehicle models on the road.",
        name: 'Horizon Robotics',
        file: 'horizon-robotics.svg',
        category: 'Autonomous Driving',
        description: 'Uses Doris to process driving data, sensor telemetry, and chip performance metrics for autonomous platforms.',
        metric: 'Sensor-scale',
        metricLabel: 'Driving data',
        scale: 1.2,
    },
    {
        id: 'goldwind',
        about: "Goldwind is the world's number-one wind turbine manufacturer, shipping nearly 30 GW of capacity in a single year and powering wind farms across six continents.",
        name: 'Goldwind',
        file: 'goldwind.svg',
        category: 'Energy',
        description: 'Powers wind turbine telemetry and operations analytics across renewable energy assets worldwide.',
        metric: 'Turbine-level',
        metricLabel: 'Energy telemetry',
    },
    {
        id: 'advance-intelligence',
        about: "Advance Intelligence Group is Southeast Asia's leading AI-driven fintech, serving 40 million consumers and 235,000 merchants through brands like Atome and ADVANCE.AI.",
        name: 'Advance Intelligence',
        file: 'advance-intelligence.svg',
        category: 'Fintech',
        description: 'Runs risk, credit, and transaction analytics for AI-driven fintech products across Southeast Asia.',
        metric: 'Cross-region',
        metricLabel: 'Risk analytics',
    },
    {
        id: 'true-watch',
        about: 'TrueWatch is a next-generation cloud observability platform unifying metrics, logs, and traces across multi-cloud stacks for DevOps and SRE teams worldwide.',
        name: 'TrueWatch',
        file: 'true-watch.svg',
        category: 'Observability',
        description: 'Powers a unified observability platform using Doris for metrics, logs, and traces at infrastructure scale.',
        metric: 'Unified',
        metricLabel: 'Observability data',
        scale: 1.2,
    },
];

const ROW1_IDS: readonly string[] = [
    'ave-ai', 'baidu', 'minimax', 'zhipu-ai', 'mihoyo', 'xiaomi',
    'byd', 'ford', 'jd', 'kwai', 'li-ning', 'luckin-coffee',
    'meituan', 'miniso',
];

const LOGO_BY_ID = new Map(USER_LOGOS.map(logo => [logo.id, logo]));
const ROW1_LOGOS: UserLogo[] = ROW1_IDS
    .map(id => LOGO_BY_ID.get(id))
    .filter((logo): logo is UserLogo => logo !== undefined);
const ROW2_LOGOS: UserLogo[] = USER_LOGOS.filter(logo => !ROW1_IDS.includes(logo.id));

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
                    <span className="stats-next__card-name">{logo.name}</span>
                    <span className="stats-next__card-tag">{logo.category}</span>
                </div>
                <p className="stats-next__card-about">{logo.about}</p>
                <div className="stats-next__card-usecase">
                    <span className="stats-next__card-usecase-label">Use case</span>
                    <p className="stats-next__card-usecase-text">{logo.description}</p>
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

    useEffect(() => {
        if (compact) setHoveredKey(null);
    }, [compact]);

    if (compact) {
        return <CompactStatsGrid />;
    }

    const rows: ReadonlyArray<readonly ['row1' | 'row2', UserLogo[]]> = [
        ['row1', ROW1_LOGOS],
        ['row2', ROW2_LOGOS],
    ];

    return (
        <section className="stats-next" aria-label="Companies using Apache Doris">
            <p className="stats-next__eyebrow">Trusted by 10,000+ users</p>
            {rows.map(([rowName, logos]) => {
                const loop = [...logos, ...logos];
                const rowExpanded = hoveredKey?.startsWith(`${rowName}:`) ?? false;
                const trackClassName =
                    `stats-next__track stats-next__track--${rowName}` +
                    (rowExpanded ? ' stats-next__track--expanded' : '');
                const viewportClassName =
                    `stats-next__viewport stats-next__viewport--${rowName}` +
                    (rowExpanded ? ' stats-next__viewport--active' : '');
                return (
                    <div key={rowName} className={viewportClassName}>
                        <div className={trackClassName}>
                            {loop.map((logo, index) => {
                                const cardKey = `${rowName}:${logo.id}-${index}`;
                                const duplicate = index >= logos.length;
                                return (
                                    <LogoTile
                                        key={cardKey}
                                        logo={logo}
                                        duplicate={duplicate}
                                        expanded={hoveredKey === cardKey}
                                        onEnter={() => setHoveredKey(cardKey)}
                                        onLeave={() =>
                                            setHoveredKey(current =>
                                                current === cardKey ? null : current,
                                            )
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
