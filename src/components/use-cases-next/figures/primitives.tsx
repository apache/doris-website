import React, { JSX, ReactNode } from 'react';

// Shared drawing vocabulary for the four use-case figures (direction B in
// design-demos/use-case-illustrations): flat module cards, 2px wires, a solid accent block
// for Apache Doris, numbered badges that match the requirement rows beside the figure.
// Every colour is a brand CSS variable plus an opacity, so the figures follow all site themes.

export const MONO = 'var(--font-mono)';
export const CREAM = 'var(--brand-cream-light)';
export const ACCENT = 'var(--brand-accent)';
export const INK = 'var(--brand-ink)';

export const VIEW_W = 720;
export const VIEW_H = 450;
export const PAD = 24;

type Anchor = 'start' | 'middle' | 'end';

export function Label({
    x,
    y,
    children,
    size = 11,
    weight = 700,
    fill = CREAM,
    opacity = 1,
    tracking,
    anchor,
    rotate,
}: {
    x: number;
    y: number;
    children: ReactNode;
    size?: number;
    weight?: number;
    fill?: string;
    opacity?: number;
    tracking?: string;
    anchor?: Anchor;
    /** Degrees, rotated around the text's own anchor point. */
    rotate?: number;
}): JSX.Element {
    return (
        <text
            x={x}
            y={y}
            fontFamily={MONO}
            fontSize={size}
            fontWeight={weight}
            fill={fill}
            fillOpacity={opacity}
            letterSpacing={tracking}
            textAnchor={anchor}
            transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
        >
            {children}
        </text>
    );
}

/** Small uppercase caption used for headers, hints and legends. */
export function Hint({ x, y, children, anchor, tracking = '0.16em', size = 8.5 }: { x: number; y: number; children: ReactNode; anchor?: Anchor; tracking?: string; size?: number }): JSX.Element {
    return (
        <Label x={x} y={y} size={size} weight={600} opacity={0.6} tracking={tracking} anchor={anchor}>
            {children}
        </Label>
    );
}

export function Card({
    x,
    y,
    w,
    h,
    title,
    sub,
    dashed,
    faint,
    children,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    title?: string;
    sub?: string;
    dashed?: boolean;
    /** Region variant: lighter fill, used as a container for other cards. */
    faint?: boolean;
    children?: ReactNode;
}): JSX.Element {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={8}
                fill={dashed ? 'none' : CREAM}
                fillOpacity={faint ? 0.035 : 0.07}
                stroke={CREAM}
                strokeOpacity={faint ? 0.18 : 0.26}
                strokeWidth={1.5}
                strokeDasharray={dashed ? '4 3' : undefined}
            />
            {title ? (
                <Label x={x + 14} y={y + (sub ? 23 : h / 2 + 4)} tracking="0.06em">
                    {title}
                </Label>
            ) : null}
            {sub ? (
                <Label x={x + 14} y={y + 39} size={9.2} weight={500} opacity={0.6}>
                    {sub}
                </Label>
            ) : null}
            {children}
        </g>
    );
}

/** Solid little box inside a card (layer names, search engines, tenants). */
export function Chip({ x, y, w, h = 26, children, sub, accent }: { x: number; y: number; w: number; h?: number; children: string; sub?: string; accent?: boolean }): JSX.Element {
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} rx={6} fill={accent ? ACCENT : CREAM} fillOpacity={accent ? 0.16 : 0.12} stroke={accent ? ACCENT : 'none'} strokeOpacity={0.5} />
            {sub ? (
                <>
                    <Label x={x + 8} y={y + 15} size={9.5} weight={800} tracking="0.04em">
                        {children}
                    </Label>
                    <Label x={x + 8} y={y + 28} size={7.8} weight={500} opacity={0.6}>
                        {sub}
                    </Label>
                </>
            ) : (
                <Label x={x + w / 2} y={y + h / 2 + 3.5} size={10} weight={800} tracking="0.12em" anchor="middle" fill={accent ? ACCENT : CREAM}>
                    {children}
                </Label>
            )}
        </g>
    );
}

/** The solid Apache Doris title block with the chevron mark. */
export function DorisBlock({ x, y, w, h = 40, right, note }: { x: number; y: number; w: number; h?: number; right?: string; note?: string }): JSX.Element {
    const k = (h - 16) / 32;
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} rx={8} fill={ACCENT} />
            <g transform={`translate(${x + 14} ${y + 8}) scale(${k})`} fill={INK}>
                {MARK.map(d => (
                    <path key={d.slice(0, 12)} d={d} />
                ))}
            </g>
            <Label x={x + 20 + 24 * k} y={y + h / 2 + 4.5} size={12.5} weight={800} fill={INK} tracking="0.1em">
                APACHE DORIS
            </Label>
            {note ? (
                <Label x={x + 20 + 24 * k + 118} y={y + h / 2 + 4} size={8.5} weight={600} fill={INK} opacity={0.75} tracking="0.08em">
                    {note}
                </Label>
            ) : null}
            {right ? (
                <Label x={x + w - 14} y={y + h / 2 + 4} size={8.5} fill={INK} tracking="0.14em" anchor="end">
                    {right}
                </Label>
            ) : null}
        </g>
    );
}

export function Wire({ points, head, tail, dashed, opacity = 0.42 }: { points: Array<[number, number]>; head?: boolean; tail?: boolean; dashed?: boolean; opacity?: number }): JSX.Element {
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    return (
        <g stroke={CREAM} strokeOpacity={opacity} fill="none">
            <path d={d} strokeWidth={2} strokeLinejoin="round" strokeDasharray={dashed ? '4 3' : undefined} />
            {head ? <Head at={points[points.length - 1]} from={points[points.length - 2]} opacity={opacity} /> : null}
            {tail ? <Head at={points[0]} from={points[1]} opacity={opacity} /> : null}
        </g>
    );
}

/** Filled arrowhead pointing from `from` towards `at`, on the axis they share. */
function Head({ at, from, opacity }: { at: [number, number]; from: [number, number]; opacity: number }): JSX.Element {
    const [x, y] = at;
    const dx = Math.sign(x - from[0]);
    const dy = Math.sign(y - from[1]);
    const d =
        dx !== 0
            ? `M${x - 7 * dx} ${y - 4.5}L${x} ${y}L${x - 7 * dx} ${y + 4.5}Z`
            : `M${x - 4.5} ${y - 7 * dy}L${x} ${y}L${x + 4.5} ${y - 7 * dy}Z`;
    return <path d={d} fill={CREAM} fillOpacity={opacity} stroke="none" />;
}

export function Badge({ x, y, n }: { x: number; y: number; n: number }): JSX.Element {
    return (
        <g>
            <circle cx={x} cy={y} r={8.5} fill={ACCENT} />
            <Label x={x} y={y + 3.6} size={9} weight={800} fill={INK} anchor="middle">
                {String(n).padStart(2, '0')}
            </Label>
        </g>
    );
}

/** Column / row header: small caps with a hairline underneath. */
export function Header({ x, y, anchor = 'start', width, children }: { x: number; y: number; anchor?: Anchor; width: number; children: string }): JSX.Element {
    const lx = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2;
    return (
        <g>
            <Hint x={x} y={y} anchor={anchor} tracking="0.2em" size={9.5}>
                {children}
            </Hint>
            <line x1={lx} y1={y + 8} x2={lx + width} y2={y + 8} stroke={CREAM} strokeOpacity={0.26} />
        </g>
    );
}

/** Accent-tinted pill for the one line the reader should take away. */
export function Pill({ x, y, w, h = 18, children }: { x: number; y: number; w: number; h?: number; children: string }): JSX.Element {
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={ACCENT} fillOpacity={0.16} stroke={ACCENT} strokeOpacity={0.5} />
            <Label x={x + w / 2} y={y + h / 2 + 3.2} size={8.6} weight={800} fill={ACCENT} tracking="0.12em" anchor="middle">
                {children}
            </Label>
        </g>
    );
}

export function Figure({ title, caption, legend, children }: { title: string; caption: string; legend?: string; children: ReactNode }): JSX.Element {
    return (
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title}>
            <title>{title}</title>
            {children}
            <Hint x={PAD} y={434}>
                {caption}
            </Hint>
            {legend ? (
                <Hint x={VIEW_W - PAD} y={434} anchor="end">
                    {legend}
                </Hint>
            ) : null}
        </svg>
    );
}

// Doris chevron mark from static/images/logo-doris.svg (natural box 24x32).
export const MARK = [
    'M14.5129 4.89337L11.0415 1.42201C10.1214 0.501891 8.86667 7.62939e-06 7.65379 7.62939e-06C6.52455 7.62939e-06 5.39531 0.418244 4.51702 1.25472C3.63872 2.13301 3.13684 3.26225 3.13684 4.51696C3.13684 5.77166 3.5969 6.9009 4.47519 7.7792L10.7906 14.0946C11.0415 14.3455 11.5016 14.3455 11.7943 14.0946L14.5129 11.376C14.6802 11.1669 17.566 7.90467 14.5129 4.89337Z',
    'M20.2426 10.4559C19.5734 9.82857 18.9042 9.15939 18.2769 8.40657C18.2769 8.40657 18.2769 8.40657 18.235 8.36475C18.235 8.40657 18.1932 8.49022 18.1932 8.57386C17.9423 10.0795 17.2313 11.4179 16.0602 12.5889C12.3797 16.2276 8.65743 19.9917 5.0606 23.5885L4.60054 24.0486C3.76407 24.8851 3.30401 25.7634 3.17853 26.6417C3.01124 27.98 3.4713 29.4857 4.47507 30.5731C5.35336 31.535 6.52442 32.0369 7.77913 31.9951C9.20113 32.0369 9.91214 31.8278 10.9577 30.824C15.1401 26.7253 19.3224 22.5848 22.501 19.448C24.0067 17.9423 24.3413 15.5166 23.2957 13.8436C22.4174 12.5471 21.33 11.5015 20.2426 10.4559Z',
    'M0 8.28109V23.714C0 24.1322 0.292763 24.3832 0.543705 24.5086C0.794646 24.6341 1.17106 24.6341 1.46383 24.3414L9.24301 16.5622C9.53578 16.2694 9.53578 15.7675 9.24301 15.4329L1.46383 7.65374C1.29653 7.48644 1.04559 7.40279 0.878295 7.40279C0.752824 7.40279 0.627352 7.44462 0.543705 7.48644C0.292763 7.61191 0 7.86286 0 8.28109Z',
];
