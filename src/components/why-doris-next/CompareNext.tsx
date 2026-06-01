import React, { JSX, useState } from 'react';
import { LayoutNext } from '../home-next/LayoutNext';
import { WhyChooseSection } from './sections/WhyChooseSection';
import { CoverFlowSection } from './sections/CoverFlowSection';
import { ComparisonTableSection } from './sections/ComparisonTableSection';
import { CONTENT } from './content';
import './CompareNext.scss';

interface Tab {
    id: string;
    name: string;
    logoSrc: string;
    enabled: boolean;
}

const TABS: Tab[] = [
    {
        id: 'clickhouse',
        name: 'ClickHouse',
        logoSrc: '/images/ecomsystem-log/clickhouse-small.svg',
        enabled: true,
    },
    {
        id: 'elastic',
        name: 'Elasticsearch',
        logoSrc: '/images/ecomsystem-log/es-small.svg',
        enabled: true,
    },
    {
        id: 'trino',
        name: 'Trino / Presto',
        logoSrc: '/images/ecomsystem-log/trino-small.png',
        enabled: true,
    },
];

interface SectionTitleProps {
    num: string;
    label: string;
}

function SectionTitle({ num, label }: SectionTitleProps): JSX.Element {
    return (
        <div className="cmp-next__section-title">
            <span className="cmp-next__section-title-num">{num}</span>
            <span className="cmp-next__section-title-text">{label}</span>
            <span className="cmp-next__section-title-rule" aria-hidden="true" />
        </div>
    );
}

interface TabSwitcherProps {
    active: string;
    onChange: (id: string) => void;
}

function TabSwitcher({ active, onChange }: TabSwitcherProps): JSX.Element {
    return (
        <div className="cmp-next__tabs" role="tablist" aria-label="Compare against">
            {TABS.map(tab => {
                const isActive = active === tab.id;
                const classes = [
                    'cmp-next__tab',
                    isActive && 'cmp-next__tab--active',
                    !tab.enabled && 'cmp-next__tab--disabled',
                ].filter(Boolean).join(' ');
                return (
                    <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={isActive}
                        className={classes}
                        onClick={() => tab.enabled && onChange(tab.id)}
                    >
                        <span className="cmp-next__tab-mark" aria-hidden="true">
                            <img
                                className="cmp-next__tab-logo"
                                src={tab.logoSrc}
                                alt=""
                                draggable={false}
                            />
                        </span>
                        <span className="cmp-next__tab-vs">vs</span>
                        <span className="cmp-next__tab-name">{tab.name}</span>
                        {!tab.enabled && <span className="cmp-next__tab-soon">SOON</span>}
                    </button>
                );
            })}
        </div>
    );
}

export default function CompareNext(): JSX.Element {
    const [active, setActive] = useState<string>('clickhouse');
    const content = CONTENT[active];

    return (
        <LayoutNext
            title="Apache Doris vs. the Others — Selection Guide"
            description="Pick the right real-time analytical database for your workload. See how Apache Doris compares with ClickHouse, Elasticsearch, and Trino/Presto on architecture, performance, and total cost."
        >
            <div className="cmp-next">
                <div className="cmp-next__bg" aria-hidden="true">
                    <div className="cmp-next__bg-grid" />
                </div>

                <header className="cmp-next__hero">
                    <TabSwitcher active={active} onChange={setActive} />
                </header>

                <main className="cmp-next__body">
                    {content && (
                        <>
                            <SectionTitle num="01" label="When to Choose Apache Doris" />
                            <WhyChooseSection
                                key={`why-${active}`}
                                valueProps={content.whyChoose.valueProps}
                                sub={content.whyChoose.sub}
                            />
                            <SectionTitle num="02" label="Featured Cases" />
                            <CoverFlowSection
                                key={`cf-${active}`}
                                cases={content.cases.items}
                                sub={content.cases.sub}
                            />
                            <SectionTitle num="03" label="Core Differences" />
                            <ComparisonTableSection
                                key={`tbl-${active}`}
                                rows={content.table.rows}
                                sub={content.table.sub}
                                competitorName={content.competitorName}
                                competitorMark={content.competitorMark}
                            />
                        </>
                    )}
                </main>
            </div>
        </LayoutNext>
    );
}
