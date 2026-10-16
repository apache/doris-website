import { translate } from '@docusaurus/Translate';
import React, { JSX } from 'react';
import { Badge, Card, Chip, DorisBlock, Figure, Header, Label, PAD, Pill, Wire } from './primitives';

// AI-ready analytics is a loop: the application asks, Doris retrieves context with one hybrid
// query, the LLM answers, traces and feedback are logged back into Doris, and the next round
// gets better. Inputs on the left keep the context fresh.

const INPUTS = [
    [translate({ id: "marketing.figures.083", message: "DOCUMENTS & LOGS" }), translate({ id: "marketing.figures.084", message: "text · JSON · tickets" })],
    [translate({ id: "marketing.figures.085", message: "EMBEDDINGS" }), translate({ id: "marketing.figures.086", message: "from embedding models" })],
    [translate({ id: "marketing.figures.087", message: "STREAMS & CDC" }), translate({ id: "marketing.figures.088", message: "orders · sessions" })],
];
const INPUT_Y = [90, 170, 250];

const REGION_X = 182;
const REGION_W = 288;
const INNER_X = 192;
const INNER_W = 268;
const LOOP_X = 522;
const LOOP_W = 166;

function Lane({ y, title, desc, n }: { y: number; title: string; desc: string; n: number }): JSX.Element {
    return (
        <Card x={INNER_X} y={y} w={INNER_W} h={44} title={title} sub={desc}>
            <Badge x={INNER_X + INNER_W - 16} y={y + 22} n={n} />
        </Card>
    );
}

export function AIAnalyticsFigure(): JSX.Element {
    const hybridY = 156;
    const chipW = 76;
    const chips: Array<[string, string]> = [
        [translate({ id: "marketing.figures.089", message: "SQL FILTERS" }), translate({ id: "marketing.figures.090", message: "time · ACL" })],
        [translate({ id: "marketing.figures.062", message: "FULL-TEXT" }), 'BM25'],
        [translate({ id: "marketing.figures.091", message: "VECTOR" }), translate({ id: "marketing.figures.092", message: "embeddings" })],
    ];
    return (
        <Figure
            title={translate({ id: "marketing.figures.093", message: "AI-ready analytics on Apache Doris: documents, embeddings, and streams keep Doris fresh; an AI application asks a question, Doris answers with one hybrid query that fuses SQL filters, full-text search, and vector search, the LLM generates a response, and its traces, tokens, cost, and feedback are logged back into Doris to improve the next round." })}
            caption={translate({ id: "marketing.figures.094", message: "FIG. 04 · THE AGENT LOOP: ASK → RETRIEVE → GENERATE → LOG → IMPROVE, ALL ON ONE ENGINE" })}
        >
            <Header x={PAD} y={60} width={140}>
                {translate({ id: "marketing.figures.095", message: "INPUTS" })}</Header>
            {INPUTS.map(([t, s], i) => (
                <g key={t}>
                    <Card x={PAD} y={INPUT_Y[i]} w={140} h={50} title={t} sub={s} />
                    <Wire points={[[164, INPUT_Y[i] + 25], [REGION_X, INPUT_Y[i] + 25]]} head />
                </g>
            ))}

            {/* Doris region */}
            <Card x={REGION_X} y={56} w={REGION_W} h={332} faint />
            <DorisBlock x={INNER_X} y={66} w={INNER_W} h={28} right={translate({ id: "marketing.figures.015", message: "ONE SQL LAYER" })} />
            <Lane y={104} title={translate({ id: "marketing.figures.096", message: "INGEST & SERVE" })} desc={translate({ id: "marketing.figures.097", message: "seconds in · sub-second out" })} n={1} />

            <Card x={INNER_X} y={hybridY} w={INNER_W} h={88}>
                <Label x={INNER_X + 14} y={hybridY + 20} tracking="0.06em">
                    {translate({ id: "marketing.figures.098", message: "ONE HYBRID QUERY" })}</Label>
                <Badge x={INNER_X + INNER_W - 16} y={hybridY + 16} n={2} />
                {chips.map(([t, s], i) => (
                    <Chip key={t} x={INNER_X + 14 + i * (chipW + 6)} y={hybridY + 28} w={chipW} h={36} sub={s}>
                        {t}
                    </Chip>
                ))}
                <Pill x={INNER_X + 14} y={hybridY + 68} w={3 * chipW + 12} h={16}>
                    {translate({ id: "marketing.figures.099", message: "RRF FUSION → RANKED CONTEXT" })}</Pill>
            </Card>

            <Lane y={252} title="VARIANT" desc={translate({ id: "marketing.figures.100", message: "dynamic JSON · agent events · tool calls" })} n={3} />
            <Lane y={304} title={translate({ id: "marketing.figures.101", message: "AI OBSERVABILITY" })} desc={translate({ id: "marketing.figures.102", message: "prompts · traces · tokens · cost · evals" })} n={4} />
            <Card x={INNER_X} y={356} w={INNER_W} h={22} dashed>
                <Label x={INNER_X + 14} y={371} size={10} tracking="0.12em">
                    {translate({ id: "marketing.figures.103", message: "ECOSYSTEM" })}</Label>
                <Label x={INNER_X + INNER_W - 34} y={371} size={8.4} weight={500} opacity={0.6} anchor="end">
                    {translate({ id: "marketing.figures.104", message: "LLM SQL · MCP server · APIs" })}</Label>
                <Badge x={INNER_X + INNER_W - 16} y={367} n={5} />
            </Card>

            {/* the loop */}
            <Header x={LOOP_X} y={60} width={LOOP_W}>
                {translate({ id: "marketing.figures.105", message: "AGENT LOOP" })}</Header>
            <Wire points={[[REGION_X + REGION_W, 200], [LOOP_X, 200]]} head tail />
            <Label x={496} y={192} size={7.8} weight={700} opacity={0.65} tracking="0.1em" anchor="middle">
                {translate({ id: "marketing.figures.106", message: "QUESTION" })}</Label>
            <Label x={496} y={214} size={7.8} weight={700} opacity={0.65} tracking="0.1em" anchor="middle">
                {translate({ id: "marketing.figures.107", message: "CONTEXT" })}</Label>
            <Card x={LOOP_X} y={175} w={LOOP_W} h={50} title={translate({ id: "marketing.figures.108", message: "AI APPLICATION" })} sub={translate({ id: "marketing.figures.109", message: "agent · copilot · RAG app" })} />
            <Wire points={[[540, 225], [540, 265]]} head />
            <Label x={548} y={249} size={7.8} weight={700} opacity={0.65} tracking="0.1em">
                {translate({ id: "marketing.figures.110", message: "PROMPT + CONTEXT" })}</Label>
            <Card x={LOOP_X} y={265} w={LOOP_W} h={50} title="LLM" sub={translate({ id: "marketing.figures.111", message: "answers with the context" })} />
            <Wire points={[[540, 315], [540, 355]]} head />
            <Label x={548} y={339} size={7.8} weight={700} opacity={0.65} tracking="0.1em">
                {translate({ id: "marketing.figures.112", message: "TRACES · TOKENS · COST" })}</Label>
            <Card x={LOOP_X} y={355} w={LOOP_W} h={50} title={translate({ id: "marketing.figures.113", message: "TRACES & FEEDBACK" })} sub={translate({ id: "marketing.figures.114", message: "tokens · cost · evals" })} />
            <Wire points={[[LOOP_X, 380], [500, 380], [500, 326], [REGION_X + REGION_W, 326]]} head />
            <Label x={492} y={353} size={7.8} weight={700} opacity={0.65} tracking="0.1em" anchor="middle" rotate={-90}>
                {translate({ id: "marketing.figures.115", message: "LOGGED" })}</Label>
            <Wire points={[[605, 405], [605, 418], [698, 418], [698, 200], [LOOP_X + LOOP_W, 200]]} head dashed />
            <Label x={708} y={309} size={7.8} weight={700} opacity={0.65} tracking="0.1em" anchor="middle" rotate={-90}>
                {translate({ id: "marketing.figures.116", message: "IMPROVE PROMPTS & RETRIEVAL" })}</Label>
        </Figure>
    );
}
