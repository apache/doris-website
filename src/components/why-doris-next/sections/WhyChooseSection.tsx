import React, { JSX } from 'react';
import './WhyChooseSection.scss';

export interface ValueProp {
    stat: string;
    unit: string;
    arrow?: string;
    label: string;
    headline: string;
    text: string;
}

export interface WhyChooseSectionProps {
    valueProps: ValueProp[];
    sub: string;
}

export function WhyChooseSection({ valueProps, sub }: WhyChooseSectionProps): JSX.Element {
    return (
        <section className="cmp-next__card cmp-why">
            <div className="cmp-next__card-head">
                <p className="cmp-next__card-sub">{sub}</p>
            </div>

            <div className="cmp-why__grid">
                {valueProps.map((vp, i) => (
                    <div key={i} className="cmp-why__vp">
                        <span className="cmp-why__vp-rail" />
                        <div className="cmp-why__vp-stat">
                            {vp.arrow && <span className="cmp-why__vp-stat-arrow">{vp.arrow}</span>}
                            <span>{vp.stat}</span>
                            <span className="cmp-why__vp-stat-unit">{vp.unit}</span>
                        </div>
                        <div className="cmp-why__vp-label">{vp.label}</div>
                        <h3 className="cmp-why__vp-headline">{vp.headline}</h3>
                        <p className="cmp-why__vp-text">{vp.text}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
