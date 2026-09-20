import React, { JSX } from 'react';
import { ACCENT, Badge, Card, Chip, CREAM, DorisBlock, Figure, Header, Hint, Label, PAD, Wire } from './primitives';

// Observability is a lifecycle: every signal funnels through a collector into one store,
// ages from hot to cold storage, and stays queryable by search, aggregation, and hybrid search.

const ROWS = [90, 168, 246, 324];
const SIGNALS = [
    ['APPS & SERVICES', 'logs · traces · OTel'],
    ['HOSTS & K8S', 'metrics · pod logs'],
    ['LOG SHIPPERS', 'Vector · Fluent Bit'],
    ['AI AGENTS', 'prompts · tool calls'],
];
const CONSUMERS = [
    ['GRAFANA', 'dashboards'],
    ['ALERTS & SLOS', 'P99 · error rate'],
    ['AD HOC SQL', 'investigations'],
    ['AI QUALITY', 'evals · feedback'],
];
const STORE: Array<[string, string, number?]> = [
    ['VARIANT', 'dynamic JSON', 2],
    ['INVERTED INDEX', 'full-text · BM25'],
    ['COLUMNAR', '5:1 compression'],
];
const QUERY: Array<[string, string, number?]> = [
    ['FULL-TEXT', 'BM25 · keyword', 3],
    ['AGGREGATE', 'P99 · SLA · cost', 4],
    ['HYBRID', 'keyword + vector', 5],
];
const TIERS = [
    { label: 'HOT · SSD', from: 0, to: 0.38, fill: ACCENT, opacity: 0.28 },
    { label: 'WARM', from: 0.38, to: 0.66, fill: CREAM, opacity: 0.16 },
    { label: 'COLD · S3 / HDFS', from: 0.66, to: 1, fill: CREAM, opacity: 0.07 },
];
const TICKS: Array<[number, string]> = [
    [0, 'now'],
    [0.38, '7 d'],
    [0.66, '30 d'],
    [1, '1 y'],
];

const REGION_X = 240;
const REGION_W = 316;
const INNER_X = 250;
const INNER_W = 296;
const CHIP_W = 95;
const CHIP_GAP = 5;

function ChipRow({ y, items }: { y: number; items: Array<[string, string, number?]> }): JSX.Element {
    return (
        <g>
            {items.map(([t, s, n], i) => {
                const x = INNER_X + i * (CHIP_W + CHIP_GAP);
                return (
                    <g key={t}>
                        <Chip x={x} y={y} w={CHIP_W} h={36} sub={s}>
                            {t}
                        </Chip>
                        {n ? <Badge x={x + CHIP_W - 9} y={y + 9} n={n} /> : null}
                    </g>
                );
            })}
        </g>
    );
}

export function ObservabilityFigure(): JSX.Element {
    const barY = 224;
    const barH = 24;
    return (
        <Figure
            title="Observability on Apache Doris: logs, metrics, traces, and AI agent events pass through a collector into Doris, where VARIANT, inverted indexes, and columnar storage hold them as they age from hot SSD to cold object storage, and full-text, aggregate, and hybrid queries serve Grafana, alerts, ad hoc SQL, and AI quality reviews."
            caption="FIG. 03 · SIGNALS FLOW IN, AGE FROM HOT TO COLD, AND STAY QUERYABLE THE WHOLE TIME"
        >
            <Header x={PAD} y={60} width={140}>
                SIGNALS
            </Header>
            {SIGNALS.map(([t, s], i) => (
                <g key={t}>
                    <Card x={PAD} y={ROWS[i]} w={140} h={50} title={t} sub={s} />
                    <Wire points={[[164, ROWS[i] + 25], [184, ROWS[i] + 25]]} />
                </g>
            ))}

            {/* collector bar */}
            <Card x={184} y={90} w={34} h={284} />
            <Label x={205} y={232} size={8.5} weight={700} opacity={0.75} tracking="0.14em" anchor="middle" rotate={-90}>
                OTEL COLLECTOR · VECTOR · KAFKA
            </Label>
            <Wire points={[[218, 232], [240, 232]]} head />
            <Badge x={229} y={216} n={1} />

            {/* Doris region */}
            <Card x={REGION_X} y={76} w={REGION_W} h={296} faint />
            <DorisBlock x={INNER_X} y={86} w={INNER_W} h={28} right="ONE SQL LAYER" />

            <Hint x={INNER_X} y={138} tracking="0.2em" size={9}>
                STORE
            </Hint>
            <ChipRow y={146} items={STORE} />

            <Hint x={INNER_X} y={214} tracking="0.2em" size={9}>
                DATA LIFECYCLE · TIERED STORAGE
            </Hint>
            {TIERS.map(t => {
                const x = INNER_X + t.from * INNER_W;
                const w = (t.to - t.from) * INNER_W;
                return (
                    <g key={t.label}>
                        <rect x={x} y={barY} width={w} height={barH} fill={t.fill} fillOpacity={t.opacity} />
                        <Label x={x + 8} y={barY + 15.5} size={7.6} weight={800} tracking="0.1em" fill={t.fill === ACCENT ? ACCENT : CREAM} opacity={t.fill === ACCENT ? 1 : 0.8}>
                            {t.label}
                        </Label>
                    </g>
                );
            })}
            <rect x={INNER_X} y={barY} width={INNER_W} height={barH} rx={4} fill="none" stroke={CREAM} strokeOpacity={0.26} strokeWidth={1.5} />
            {TICKS.map(([f, s]) => {
                const x = INNER_X + f * INNER_W;
                return (
                    <g key={s}>
                        <line x1={x} y1={barY + barH} x2={x} y2={barY + barH + 5} stroke={CREAM} strokeOpacity={0.4} />
                        <Label x={x} y={barY + barH + 15} size={7.8} weight={600} opacity={0.6} anchor={f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}>
                            {s}
                        </Label>
                    </g>
                );
            })}
            <Label x={INNER_X} y={278} size={7.8} weight={500} opacity={0.55}>
                recent data fast on SSD · history cheap on object storage
            </Label>

            <Hint x={INNER_X} y={306} tracking="0.2em" size={9}>
                QUERY
            </Hint>
            <ChipRow y={314} items={QUERY} />

            {/* consumers */}
            <Header x={696} y={60} anchor="end" width={124}>
                CONSUMERS
            </Header>
            {CONSUMERS.map(([t, s], i) => (
                <g key={t}>
                    <Wire points={[[REGION_X + REGION_W, ROWS[i] + 25], [572, ROWS[i] + 25]]} head />
                    <Card x={572} y={ROWS[i]} w={124} h={50} title={t} sub={s} />
                </g>
            ))}
        </Figure>
    );
}
