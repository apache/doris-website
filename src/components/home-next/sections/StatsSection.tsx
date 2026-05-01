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
}

const USER_LOGOS: UserLogo[] = [
    {
        id: 'bytedance',
        name: 'ByteDance',
        file: 'Technology/ByteDance.jpg',
        category: 'Technology',
        description: 'Uses Apache Doris for high-concurrency user behavior analytics and real-time reporting across product teams.',
        metric: 'Sub-second',
        metricLabel: 'Dashboard queries',
    },
    {
        id: 'xiaomi',
        name: 'Xiaomi',
        file: 'Technology/Xiaomi.jpg',
        category: 'Technology',
        description: 'Runs interactive analytics on device, app, and service data so operations teams can monitor business health live.',
        metric: 'Real-time',
        metricLabel: 'Operations insight',
    },
    {
        id: 'baidu',
        name: 'Baidu',
        file: 'Technology/Baidu.jpg',
        category: 'Technology',
        description: 'Powers large-scale log analytics and ad-hoc SQL exploration for engineering and platform observability workflows.',
        metric: 'Billions',
        metricLabel: 'Events analyzed',
    },
    {
        id: 'jd',
        name: 'JD.com',
        file: 'Technology/JD.com.jpg',
        category: 'Technology',
        description: 'Serves retail analytics for order, inventory, and marketing data with fast SQL access for business users.',
        metric: 'Unified',
        metricLabel: 'Retail analytics',
    },
    {
        id: 'tencent',
        name: 'Tencent',
        file: 'Technology/Tencent.jpg',
        category: 'Technology',
        description: 'Uses Doris for fast aggregation over game, media, and cloud service data in shared analytics platforms.',
        metric: 'High QPS',
        metricLabel: 'Service analytics',
    },
    {
        id: 'nio',
        name: 'NIO',
        file: 'Telecom & Manufacturing/NIO.jpg',
        category: 'Manufacturing',
        description: 'Analyzes connected vehicle telemetry and service data to support fleet monitoring and product quality workflows.',
        metric: 'Streaming',
        metricLabel: 'Telemetry data',
    },
    {
        id: 'lenovo',
        name: 'Lenovo',
        file: 'Telecom & Manufacturing/Lenovo.jpg',
        category: 'Manufacturing',
        description: 'Builds fast operational analytics over supply chain, service, and device lifecycle data with Apache Doris.',
        metric: 'Global',
        metricLabel: 'Operations view',
    },
    {
        id: 'bank-of-china',
        name: 'Bank of China',
        file: 'Finance/Bank of China.jpg',
        category: 'Finance',
        description: 'Supports financial reporting and risk analysis scenarios that need reliable SQL performance at scale.',
        metric: 'Trusted',
        metricLabel: 'Financial reports',
    },
    {
        id: 'ping-an',
        name: 'Ping An',
        file: 'Finance/Ping An Insurance Group.jpg',
        category: 'Finance',
        description: 'Uses Apache Doris for customer, policy, and risk analytics where fresh data and fast response times matter.',
        metric: 'Fresh',
        metricLabel: 'Risk analytics',
    },
    {
        id: 'meituan',
        name: 'Meituan',
        file: 'Media & Entertainment/Meituan.jpg',
        category: 'Internet Services',
        description: 'Runs city-scale business analytics over orders, merchants, riders, and user activity for live decision support.',
        metric: 'City-scale',
        metricLabel: 'Business data',
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        file: 'Media & Entertainment/TikTok.jpg',
        category: 'Media',
        description: 'Applies Doris to content and engagement analytics workloads that need fast aggregation over massive event streams.',
        metric: 'Massive',
        metricLabel: 'Engagement events',
    },
    {
        id: 'netease',
        name: 'NetEase',
        file: 'Media & Entertainment/NetEase.jpg',
        category: 'Media',
        description: 'Uses Apache Doris for game and content analytics, helping teams inspect live metrics without long batch delays.',
        metric: 'Live',
        metricLabel: 'Content metrics',
    },
];

interface UserLogoCardProps {
    logo: UserLogo;
    expanded: boolean;
    duplicate: boolean;
    onEnter: () => void;
    onLeave: () => void;
}

function UserLogoCard({ logo, expanded, duplicate, onEnter, onLeave }: UserLogoCardProps): JSX.Element {
    const src = `/images/user-logo/${encodeURI(logo.file)}`;

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
            <div className="stats-next__card-logo">
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
                        <img
                            src={src}
                            alt=""
                            loading="lazy"
                            draggable={false}
                        />
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

export function StatsSection(): JSX.Element {
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);
    const compact = useCompactStats();
    const logoLoop = [...USER_LOGOS, ...USER_LOGOS];

    useEffect(() => {
        if (compact) setHoveredKey(null);
    }, [compact]);

    return (
        <section className="stats-next" aria-label="Companies using Apache Doris">
            <div className="stats-next__viewport">
                <div className={`stats-next__track${hoveredKey && !compact ? ' stats-next__track--expanded' : ''}`}>
                    {logoLoop.map((logo, index) => {
                        const cardKey = `${logo.id}-${index}`;
                        const duplicate = index >= USER_LOGOS.length;

                        return (
                            <UserLogoCard
                                key={cardKey}
                                logo={logo}
                                duplicate={duplicate}
                                expanded={!compact && hoveredKey === cardKey}
                                onEnter={() => {
                                    if (!compact) setHoveredKey(cardKey);
                                }}
                                onLeave={() => {
                                    if (!compact) setHoveredKey(current => (current === cardKey ? null : current));
                                }}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
