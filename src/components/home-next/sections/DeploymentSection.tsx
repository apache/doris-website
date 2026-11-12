import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import './DeploymentSection.scss';
import {DeploymentDiagram} from './DeploymentDiagram';

type DeploymentTone = 'green' | 'ink';

interface DeploymentCardItem {
    tone: DeploymentTone;
    title: {
        first: string;
        second: string;
        accent: string;
    };
    subtitle: string;
    image: {
        alt: string;
    };
    cta: {
        label: string;
        href: string;
    };
}

const DEPLOYMENT_CARDS: DeploymentCardItem[] = [
    {
        tone: 'green',
        title: {
            first: translate({ id: "homepage.deployment.001", message: "Compute" }),
            second: translate({ id: "homepage.deployment.002", message: "Storage" }),
            accent: translate({ id: "homepage.deployment.003", message: "COUPLED" }),
        },
        subtitle: translate({ id: "homepage.deployment.004", message: "Classic MPP, with compute and storage co-located on each node for maximum local I/O and the lowest query latency." }),
        image: {
            alt: translate({ id: "homepage.deployment.005", message: "Apache Doris compute-storage coupled mode architecture diagram" }),
        },
        cta: {
            label: translate({ id: "homepage.deployment.006", message: "Deploy Now!" }),
            href: '/docs/dev/install/intro',
        },
    },
    {
        tone: 'ink',
        title: {
            first: translate({ id: "homepage.deployment.001", message: "Compute" }),
            second: translate({ id: "homepage.deployment.002", message: "Storage" }),
            accent: translate({ id: "homepage.deployment.007", message: "DECOUPLED" }),
        },
        subtitle: translate({ id: "homepage.deployment.008", message: "Cloud-native architecture with stateless compute groups over shared object storage. Scale compute on demand and isolate workloads from one another." }),
        image: {
            alt: translate({ id: "homepage.deployment.009", message: "Apache Doris compute-storage decoupled mode architecture diagram" }),
        },
        cta: {
            label: translate({ id: "homepage.deployment.006", message: "Deploy Now!" }),
            href: '/docs/dev/install/intro',
        },
    },
];

function DeploymentCard({ card }: { card: DeploymentCardItem }): JSX.Element {
    return (
        <article className={`deployment-next__card deployment-next__card--${card.tone}`}>
            <div className="deployment-next__copy">
                <h3 className="deployment-next__card-title">
                    <span className="deployment-next__card-title-line">{card.title.first}</span>
                    <span className="deployment-next__card-title-line">{card.title.second}</span>
                    <span className="deployment-next__card-title-line deployment-next__card-title-line--accent">
                        {card.title.accent}
                    </span>
                </h3>
                <p className="deployment-next__card-subtitle">{card.subtitle}</p>
                <a className="deployment-next__card-cta" href={card.cta.href}>
                    {card.cta.label}
                </a>
            </div>
            <div className="deployment-next__visual">
                <DeploymentDiagram decoupled={card.tone === 'ink'} title={card.image.alt} />
            </div>
        </article>
    );
}

export function DeploymentSection(): JSX.Element {
    return (
        <section id="deployment" className="deployment-next" aria-labelledby="deployment-next-title">
            <div className="home-next-container">
                <div className="deployment-next__header">
                    <div className="deployment-next__eyebrow">{translate({ id: "homepage.deployment.010", message: "Deployment" })}</div>
                    <h2 className="deployment-next__headline" id="deployment-next-title">
                        <span className="deployment-next__headline-line">{translate({ id: "homepage.deployment.011", message: "Choose Your Architecture" })}</span>
                        <span className="deployment-next__headline-line deployment-next__headline-line--accent">
                            {translate({ id: "homepage.deployment.012", message: "One Engine, Two Modes" })}</span>
                    </h2>
                </div>

                <div className="deployment-next__grid">
                    {DEPLOYMENT_CARDS.map(card => (
                        <DeploymentCard key={card.title.accent} card={card} />
                    ))}
                </div>
            </div>
        </section>
    );
}
