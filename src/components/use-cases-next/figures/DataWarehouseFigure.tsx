import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { Badge, Card, Chip, DorisBlock, Figure, Header, Hint, Label, PAD, Wire } from './primitives';

// A warehouse is a stack: raw sources at the bottom, ODS → DWD → DWS → serving layers in Doris,
// consumers on top. Data flows upward; the lake is read in place through a side door.

const COLS = [24, 196, 368, 540];
const CARD_W = 156;

const LAYERS = [
    { name: translate({ id: "marketing.extra.036", message: "SERVING" }), desc: translate({ id: "marketing.figures.018", message: "materialized views · rollups · point queries · sub-second BI" }), y: 150, badge: 3 },
    { name: 'DWS', desc: translate({ id: "marketing.figures.019", message: "aggregated metrics · business-ready datasets" }), y: 188 },
    { name: 'DWD', desc: translate({ id: "marketing.figures.020", message: "cleaned detail · fact & dimension tables · wide tables" }), y: 226, badge: 2 },
    { name: 'ODS', desc: translate({ id: "marketing.figures.021", message: "raw records · Stream Load · Routine Load · CDC · fresh in seconds" }), y: 264, badge: 1 },
];

const CONSUMERS = [
    [translate({ id: "marketing.figures.022", message: "BI TOOLS" }), translate({ id: "marketing.figures.023", message: "Tableau · Power BI" })],
    [translate({ id: "marketing.figures.024", message: "DASHBOARDS" }), translate({ id: "marketing.figures.025", message: "reports · operations" })],
    [translate({ id: "marketing.figures.026", message: "AD HOC SQL" }), translate({ id: "marketing.figures.027", message: "analysts · notebooks" })],
    [translate({ id: "marketing.figures.028", message: "APPS & APIS" }), translate({ id: "marketing.figures.029", message: "data services" })],
];

const SOURCES = [
    [translate({ id: "marketing.figures.003", message: "OLTP · CDC" }), translate({ id: "marketing.figures.004", message: "MySQL · PostgreSQL" })],
    [translate({ id: "marketing.figures.030", message: "EVENT STREAMS" }), translate({ id: "marketing.figures.031", message: "Kafka · Flink" })],
    [translate({ id: "marketing.figures.032", message: "BATCH & SAAS" }), translate({ id: "marketing.figures.033", message: "Parquet · CSV · APIs" })],
    [translate({ id: "marketing.figures.007", message: "DATA LAKE" }), translate({ id: "marketing.figures.034", message: "Iceberg · Paimon · S3" })],
];

export function DataWarehouseFigure(): JSX.Element {
    const layerX = 34;
    const layerW = 522;
    return (
        <Figure
            title={translate({ id: "marketing.figures.035", message: "Modern data warehouse on Apache Doris: OLTP, streams, and batch sources load into an ODS layer, are modeled into DWD and DWS layers and served through materialized views to BI tools, dashboards, ad hoc SQL, and applications; the data lake is queried in place." })}
            caption={translate({ id: "marketing.figures.036", message: "FIG. 02 · SOURCES BELOW, DORIS LAYERS IN THE MIDDLE, CONSUMERS ON TOP" })}
            legend={translate({ id: "marketing.extra.037", message: "DASHED = QUERIED IN PLACE" })}
        >
            <Header x={PAD} y={26} width={672}>
                {translate({ id: "marketing.figures.037", message: "CONSUMERS" })}</Header>
            {CONSUMERS.map(([t, s], i) => (
                <Card key={t} x={COLS[i]} y={40} w={CARD_W} h={44} title={t} sub={s} />
            ))}
            {COLS.map(x => (
                <Wire key={x} points={[[x + CARD_W / 2, 100], [x + CARD_W / 2, 84]]} head />
            ))}

            {/* Doris region */}
            <Card x={PAD} y={100} w={672} h={234} faint />
            <DorisBlock x={34} y={110} w={652} h={30} right={translate({ id: "marketing.figures.038", message: "BATCH + STREAMING · ONE SQL LAYER" })} />
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
                    {translate({ id: "marketing.figures.039", message: "GOVERNANCE" })}</Label>
                <Label x={layerX + layerW - 34} y={317} size={8.6} weight={500} opacity={0.6} anchor="end">
                    {translate({ id: "marketing.figures.040", message: "fine-grained auth · workload isolation · audit logs · high availability" })}</Label>
                <Badge x={layerX + layerW - 16} y={313} n={5} />
            </Card>

            {/* lakehouse side door, read in place from the data lake below */}
            <Card x={568} y={186} w={118} h={80}>
                <Label x={578} y={204} tracking="0.06em">
                    {translate({ id: "marketing.figures.041", message: "LAKEHOUSE" })}</Label>
                {['Iceberg · Paimon', 'Hudi · Hive · S3', 'Multi-Catalog', translate({ id: 'marketing.figures.queriedInPlace', message: 'queried in place' })].map((line, i) => (
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
                {translate({ id: "marketing.figures.042", message: "SOURCES" })}</Hint>
            {SOURCES.map(([t, s], i) => (
                <Card key={t} x={COLS[i]} y={350} w={CARD_W} h={44} title={t} sub={s} dashed={i === 3} />
            ))}
        </Figure>
    );
}
