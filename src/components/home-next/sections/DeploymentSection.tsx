import React, { JSX } from 'react';
import './DeploymentSection.scss';

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
        src: string;
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
            first: 'Compute',
            second: 'Storage',
            accent: 'COUPLED',
        },
        subtitle: 'A classic MPP architecture where compute and storage are co-located to maximize local I/O efficiency for low-latency analytics.',
        image: {
            src: '/images/next/home-page/cs-coupled.jpg',
            alt: 'Apache Doris compute-storage coupled mode architecture diagram',
        },
        cta: {
            label: 'Deploy Now!',
            href: '/docs/install/deploy-manually/integrated-storage-compute-deploy-manually',
        },
    },
    {
        tone: 'ink',
        title: {
            first: 'Compute',
            second: 'Storage',
            accent: 'DECOUPLED',
        },
        subtitle: 'A cloud-native architecture that separates stateless compute groups from shared object storage for elastic scaling and efficient resource use.',
        image: {
            src: '/images/next/home-page/cs-decoupled.jpg',
            alt: 'Apache Doris compute-storage decoupled mode architecture diagram',
        },
        cta: {
            label: 'Deploy Now!',
            href: '/docs/compute-storage-decoupled/overview',
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
                <img className="deployment-next__visual-image" src={card.image.src} alt={card.image.alt} />
            </div>
        </article>
    );
}

export function DeploymentSection(): JSX.Element {
    return (
        <section className="deployment-next">
            <div className="home-next-container">
                <div className="deployment-next__header">
                    <div className="deployment-next__eyebrow">Deployment</div>
                    <h2 className="deployment-next__headline">
                        <span className="deployment-next__headline-line">Choose Your Architecture</span>
                        <span className="deployment-next__headline-line deployment-next__headline-line--accent">
                            One Engine, Two Modes
                        </span>
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
