import React from 'react';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import './style.scss';

interface CardProps {
    title: string;
    description: string;
    link: string;
    icon?: string;
}

interface DocLikeMetadata {
    permalink: string;
    slug: string;
    sourceDirName: string;
}

function resolveDocRelativeLink(link: string, metadata: DocLikeMetadata): string {
    if (!link) return link;
    if (/^(https?:)?\/\//.test(link)) return link;
    if (link.startsWith('/')) return link;

    const permalink = metadata.permalink.replace(/\/+$/, '');
    const slug = metadata.slug.replace(/\/+$/, '');
    const docsRoot = slug && permalink.endsWith(slug)
        ? permalink.slice(0, -slug.length)
        : permalink;

    const sourceDir = metadata.sourceDirName && metadata.sourceDirName !== '.'
        ? metadata.sourceDirName
        : '';
    const baseDir = (sourceDir ? `${docsRoot}/${sourceDir}/` : `${docsRoot}/`).replace(/\/{2,}/g, '/');

    const url = new URL(link, `http://_${baseDir}`);
    return url.pathname + url.search + url.hash;
}

export default function GettingStartedCard({ title, description, link, icon }: CardProps) {
    const { metadata } = useDoc();
    return (
        <Link to={resolveDocRelativeLink(link, metadata)} className="getting-started-card">
            {icon && <div className="card-icon">{icon}</div>}
            <div className="card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </Link>
    );
}
