import React, { JSX } from 'react';
import { Badge, Card, Chip, DorisBlock, Figure, Header, Hint, Label, PAD, Wire } from './primitives';

// A warehouse is a stack: raw sources at the bottom, ODS → DWD → DWS → serving layers in Doris,
// consumers on top. Data flows upward; the lake is read in place through a side door.

const COLS = [24, 196, 368, 540];
const CARD_W = 156;

const LAYERS = [
    { name: 'SERVING', desc: 'materialized views · rollups · point queries · sub-second BI', y: 150, badge: 3 },
    { name: 'DWS', desc: 'aggregated metrics · business-ready datasets', y: 188 },
    { name: 'DWD', desc: 'cleaned detail · fact & dimension tables · wide tables', y: 226, badge: 2 },
    { name: 'ODS', desc: 'raw records · Stream Load · Routine Load · CDC · fresh in seconds', y: 264, badge: 1 },
];

const CONSUMERS = [
    ['BI TOOLS', 'Tableau · Power BI'],
    ['DASHBOARDS', 'reports · operations'],
    ['AD HOC SQL', 'analysts · notebooks'],
    ['APPS & APIS', 'data services'],
];

const SOURCES = [
    ['OLTP · CDC', 'MySQL · PostgreSQL'],
    ['EVENT STREAMS', 'Kafka · Flink'],
    ['BATCH & SAAS', 'Parquet · CSV · APIs'],
    ['DATA LAKE', 'Iceberg · Paimon · S3'],
];

export function DataWarehouseFigure(): JSX.Element {
    const layerX = 34;
    const layerW = 522;
    return (
        <Figure
            title="Modern data warehouse on Apache Doris: OLTP, streams, and batch sources load into an ODS layer, are modeled into DWD and DWS layers and served through materialized views to BI tools, dashboards, ad hoc SQL, and applications; the data lake is queried in place."
            caption="FIG. 02 · SOURCES BELOW, DORIS LAYERS IN THE MIDDLE, CONSUMERS ON TOP"
            legend="DASHED = QUERIED IN PLACE"
        >
            <Header x={PAD} y={26} width={672}>
                CONSUMERS
            </Header>
            {CONSUMERS.map(([t, s], i) => (
                <Card key={t} x={COLS[i]} y={40} w={CARD_W} h={44} title={t} sub={s} />
            ))}
            {COLS.map(x => (
                <Wire key={x} points={[[x + CARD_W / 2, 100], [x + CARD_W / 2, 84]]} head />
            ))}

            {/* Doris region */}
            <Card x={PAD} y={100} w={672} h={234} faint />
            <DorisBlock x={34} y={110} w={652} h={30} right="BATCH + STREAMING · ONE SQL LAYER" />
            {LAYERS.map((l, i) => (
                <g key={l.name}>
                    <Card x={layerX} y={l.y} w={layerW} h={28} />
                    <Chip x={layerX + 8} y={l.y + 3} w={70} h={22}>
                        {l.name}
                    </Chip>
                    <Label x={layerX + 90} y={l.y + 18} size={9.2} weight={500} opacity={0.65}>
                        {l.desc}
                    </Label>
                    {l.badge ? <Badge x={layerX + layerW - 16} y={l.y + 14} n={l.badge} /> : null}
                    {i < LAYERS.length - 1 ? <Wire points={[[layerX + 43, LAYERS[i + 1].y], [layerX + 43, l.y + 28]]} head /> : null}
                </g>
            ))}
            <Card x={layerX} y={302} w={layerW} h={22} dashed>
                <Label x={layerX + 14} y={317} size={10} tracking="0.12em">
                    GOVERNANCE
                </Label>
                <Label x={layerX + layerW - 34} y={317} size={8.6} weight={500} opacity={0.6} anchor="end">
                    fine-grained auth · workload isolation · audit logs · high availability
                </Label>
                <Badge x={layerX + layerW - 16} y={313} n={5} />
            </Card>

            {/* lakehouse side door, read in place from the data lake below */}
            <Card x={568} y={186} w={118} h={80}>
                <Label x={578} y={204} tracking="0.06em">
                    LAKEHOUSE
                </Label>
                {['Iceberg · Paimon', 'Hudi · Hive · S3', 'Multi-Catalog', 'queried in place'].map((line, i) => (
                    <Label key={line} x={578} y={219 + i * 12} size={8.2} weight={500} opacity={0.65}>
                        {line}
                    </Label>
                ))}
                <Badge x={672} y={198} n={4} />
            </Card>
            <Wire points={[[627, 350], [627, 266]]} head dashed />

            {/* sources */}
            {COLS.slice(0, 3).map((x, i) => (
                <Wire key={x} points={[[x + CARD_W / 2 + (i === 0 ? 12 : 0), 350], [x + CARD_W / 2 + (i === 0 ? 12 : 0), 334]]} head />
            ))}
            <Hint x={PAD} y={346} tracking="0.2em" size={9.5}>
                SOURCES
            </Hint>
            {SOURCES.map(([t, s], i) => (
                <Card key={t} x={COLS[i]} y={350} w={CARD_W} h={44} title={t} sub={s} dashed={i === 3} />
            ))}
        </Figure>
    );
}
