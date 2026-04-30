import React, { JSX } from 'react';
import './StatsSection.scss';

const STATS = [
    { value: '14K+',    label: 'GitHub Stars' },
    { value: '10,000+', label: 'Companies in Production' },
    { value: '710+',    label: 'Total Contributors' },
    { value: '120+',    label: 'Monthly Active Devs' },
];

export function StatsSection(): JSX.Element {
    return (
        <section className="stats-next">
            <div className="stats-next__inner">
                {STATS.map((stat, i) => (
                    <div className="stats-next__item" key={i}>
                        <span className="stats-next__num">{stat.value}</span>
                        <span className="stats-next__label">{stat.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
