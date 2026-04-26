import React from 'react';
import Link from '@docusaurus/Link';
import './style.scss';

interface CardProps {
    title: string;
    description: string;
    link: string;
    icon?: string;
}

export default function GettingStartedCard({ title, description, link, icon }: CardProps) {
    return (
        <Link to={link} className="getting-started-card">
            {icon && <div className="card-icon">{icon}</div>}
            <div className="card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </Link>
    );
}
