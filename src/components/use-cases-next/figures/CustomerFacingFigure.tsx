import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { Badge, Card, CREAM, DorisBlock, Figure, Label, Pill, Wire } from './primitives';

// Customer-facing analytics is a serving path drawn as swimlanes: many tenants' users inside
// your product on top, the request path through Doris with its latency budget in the middle,
// and data that is only seconds old arriving from below.

const COLS = [40, 207, 374, 541];
const CARD_W = 155;

const TENANTS: Array<[string, string, number]> = [
    [translate({ id: "marketing.extra.021", message: "TENANT A" }), translate({ id: "marketing.extra.022", message: "embedded dashboards" }), 14],
    [translate({ id: "marketing.extra.023", message: "TENANT B" }), translate({ id: "marketing.extra.024", message: "customer portal" }), 9],
    [translate({ id: "marketing.extra.025", message: "TENANT C" }), translate({ id: "marketing.extra.026", message: "mobile & web app" }), 6],
    [translate({ id: "marketing.extra.027", message: "+ MORE TENANTS" }), translate({ id: "marketing.extra.028", message: "APIs · data products" }), 4],
];
const SOURCES = [
    [translate({ id: "marketing.figures.001", message: "PRODUCT EVENTS" }), translate({ id: "marketing.figures.002", message: "Kafka · clickstream" })],
    [translate({ id: "marketing.figures.003", message: "OLTP · CDC" }), translate({ id: "marketing.figures.004", message: "MySQL · PostgreSQL" })],
    [translate({ id: "marketing.figures.005", message: "BATCH JOBS" }), translate({ id: "marketing.figures.006", message: "Spark · Flink · files" })],
    [translate({ id: "marketing.figures.007", message: "DATA LAKE" }), translate({ id: "marketing.figures.008", message: "Iceberg · S3" })],
];
const PATH: Array<[string, string]> = [
    [translate({ id: "marketing.extra.029", message: "REQUEST" }), translate({ id: "marketing.extra.030", message: "MySQL protocol · REST" })],
    [translate({ id: "marketing.extra.031", message: "ISOLATE TENANTS" }), translate({ id: "marketing.extra.032", message: "workload groups" })],
    [translate({ id: "marketing.extra.033", message: "SERVE" }), translate({ id: "marketing.extra.034", message: "cache · point query" })],
];

function LaneLabel({ y, children }: { y: number; children: string }): JSX.Element {
    return (
        <Label x={16} y={y} size={8.5} weight={700} opacity={0.55} tracking="0.18em" anchor="middle" rotate={-90}>
            {children}
        </Label>
    );
}

export function CustomerFacingFigure(): JSX.Element {
    const regionY = 160;
    const pathY = 210;
    return (
        <Figure
            title={translate({ id: "marketing.figures.009", message: "Customer-facing analytics on Apache Doris: users across many tenants query embedded dashboards, portals, and apps; every request passes through Doris, is isolated per tenant, and is served from cache or point queries in under a second, while product events, CDC, and batch data arrive within seconds and the data lake is queried in place." })}
            caption={translate({ id: "marketing.figures.010", message: "FIG. 01 · MANY TENANTS, ONE SERVING PATH, DATA THAT IS SECONDS OLD" })}
            legend={translate({ id: "marketing.extra.035", message: "DASHED = QUERIED IN PLACE" })}
        >
            <line x1={8} y1={150} x2={712} y2={150} stroke={CREAM} strokeOpacity={0.12} />
            <line x1={8} y1={292} x2={712} y2={292} stroke={CREAM} strokeOpacity={0.12} />
            <LaneLabel y={87}>{translate({ id: "marketing.figures.011", message: "YOUR PRODUCT" })}</LaneLabel>
            <LaneLabel y={221}>{translate({ id: "marketing.figures.012", message: "APACHE DORIS" })}</LaneLabel>
            <LaneLabel y={356}>{translate({ id: "marketing.figures.013", message: "FRESH DATA" })}</LaneLabel>

            {/* tenants and their users */}
            {TENANTS.map(([t, s, users], i) => (
                <g key={t}>
                    <Card x={COLS[i]} y={44} w={CARD_W} h={70} title={t} sub={s}>
                        {Array.from({ length: users }, (_, k) => (
                            <circle key={k} cx={COLS[i] + 18 + k * 9} cy={100} r={3} fill={CREAM} fillOpacity={0.55} />
                        ))}
                        {i === TENANTS.length - 1 ? (
                            <Label x={COLS[i] + 18 + users * 9 + 2} y={103} size={9} weight={700} opacity={0.55}>
                                …
                            </Label>
                        ) : null}
                    </Card>
                    <Wire points={[[COLS[i] + CARD_W / 2, 114], [COLS[i] + CARD_W / 2, 128]]} />
                </g>
            ))}
            <Wire points={[[COLS[0] + CARD_W / 2, 128], [COLS[3] + CARD_W / 2, 128]]} />
            <Wire points={[[360, 128], [360, regionY]]} head />
            <Badge x={347} y={140} n={2} />
            <Label x={372} y={143} size={7.8} weight={700} opacity={0.65} tracking="0.1em">
                {translate({ id: "marketing.figures.014", message: "10,000+ QPS · THOUSANDS OF CONCURRENT USERS" })}</Label>

            {/* serving path */}
            <Card x={40} y={regionY} w={656} h={120} faint />
            <DorisBlock x={50} y={regionY + 10} w={636} h={28} right={translate({ id: "marketing.figures.015", message: "ONE SQL LAYER" })} />
            {PATH.map(([t, s], i) => {
                const x = 50 + i * 176;
                return (
                    <g key={t}>
                        <Card x={x} y={pathY} w={150} h={50} title={t} sub={s} />
                        {i === 1 ? <Badge x={x + 150 - 14} y={pathY + 14} n={3} /> : null}
                        <Wire points={[[x + 150, pathY + 25], [x + 176, pathY + 25]]} head />
                    </g>
                );
            })}
            <Pill x={578} y={pathY + 13} w={84} h={24}>
                {translate({ id: "marketing.figures.016", message: "SUB-SECOND" })}</Pill>
            <Badge x={678} y={pathY + 25} n={1} />

            {/* fresh data */}
            {COLS.slice(0, 3).map(x => (
                <Wire key={x} points={[[x + CARD_W / 2, 346], [x + CARD_W / 2, 326]]} />
            ))}
            <Wire points={[[COLS[0] + CARD_W / 2, 326], [COLS[2] + CARD_W / 2, 326]]} />
            <Wire points={[[284, 326], [284, regionY + 120]]} head />
            <Label x={296} y={306} size={7.8} weight={700} opacity={0.65} tracking="0.1em">
                {translate({ id: "marketing.figures.017", message: "INGESTED IN SECONDS · STREAM LOAD · CDC" })}</Label>
            <Wire points={[[COLS[3] + CARD_W / 2, 346], [COLS[3] + CARD_W / 2, regionY + 120]]} head dashed />
            {SOURCES.map(([t, s], i) => (
                <g key={t}>
                    <Card x={COLS[i]} y={346} w={CARD_W} h={50} title={t} sub={s} dashed={i === 3} />
                    {i === 3 ? <Badge x={COLS[i] + CARD_W - 14} y={360} n={4} /> : null}
                </g>
            ))}
        </Figure>
    );
}
