import React from 'react';
import {translate} from '@docusaurus/Translate';

// Text stays in the page dictionary; FE/BE and storage product identifiers
// remain technical names. SVG inherits the same semantic tokens as its card.
export function DeploymentDiagram({decoupled, title}: {decoupled: boolean; title: string}) {
    const disk = translate({id: 'homepage.diagram.disk', message: 'Disk'});
    const cache = translate({id: 'homepage.diagram.cache', message: 'Cache'});
    const data = translate({id: 'homepage.diagram.data', message: 'Data'});
    const metadata = translate({id: 'homepage.diagram.metadata', message: 'Metadata service'});
    const group = translate({id: 'homepage.diagram.group', message: 'Compute group'});
    const storage = translate({id: 'homepage.diagram.storage', message: 'Shared storage'});
    const arrow = (x: number, y: number, end: number) => <g stroke="var(--brand-accent)" fill="none" strokeWidth="2">
        <path d={`M${x} ${y} V${end} m-5 -7 l5 7 5 -7`} />
    </g>;
    const node = (x: number, y: number, label: string, detail: string) => <g transform={`translate(${x} ${y})`}>
        <rect width="154" height="112" rx="8" fill="var(--brand-primary-dark)" stroke="var(--brand-accent)" />
        <rect x="17" y="14" width="120" height="36" rx="4" fill="var(--brand-accent)" />
        <text x="77" y="39" fill="var(--brand-ink)" fontWeight="700">{label}</text>
        <text x="77" y="87" fill="var(--brand-cream-light)" textLength={detail.length > 14 ? 110 : undefined} lengthAdjust="spacingAndGlyphs">{detail}</text>
    </g>;
    return <svg className="deployment-next__visual-image" viewBox="0 0 760 430" role="img" aria-label={title}
        style={{background: 'var(--brand-primary-darker)', fontFamily: 'var(--font-family-base)', fontSize: 18, textAnchor: 'middle'}}>
        <title>{title}</title>
        {[120, 303, 486].map(x => <g key={x}>
            {node(x, 24, 'FE', disk)}
            {arrow(x + 77, 137, decoupled ? 166 : 197)}
        </g>)}
        {decoupled ? <>
            <rect x="45" y="167" width="670" height="36" rx="5" fill="none" stroke="var(--brand-accent)" />
            <text x="380" y="192" fill="var(--brand-cream-light)">{metadata}</text>
            {[38, 398].map((x, i) => <g key={x}>
                <rect x={x} y="218" width="324" height="146" rx="8" fill="none" stroke="var(--brand-accent)" />
                <text x={x + 162} y="245" fill="var(--brand-cream-light)">{group} {i === 0 ? 'A' : 'B'}</text>
                {[x + 9, x + 115, x + 221].map(n => <g key={n}>
                    <g transform={`translate(${n} 265) scale(0.62)`}>{node(0, 0, 'BE', cache)}</g>
                    {arrow(n + 48, 338, 385)}
                </g>)}
            </g>)}
            <text x="380" y="416" fill="var(--brand-cream-light)">{storage} · S3 / OSS / Azure / GCP / HDFS</text>
        </> : <>
            <path d="M100 198 H660 M380 136 V198" fill="none" stroke="var(--brand-accent)" strokeWidth="2" />
            {[28, 211, 394, 577].map(x => <g key={x}>
                {arrow(x + 77, 198, 242)}
                {node(x, 244, 'BE', data)}
                <text x={x + 77} y="395" fill="var(--brand-cream-light)">{disk}</text>
            </g>)}
        </>}
    </svg>;
}
