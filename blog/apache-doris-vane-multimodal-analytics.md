---
title: 'Apache Doris and Vane: Bringing Multimodal Data into Business Analytics'
summary: 'Turn support recordings into searchable text and embeddings, then join the results with tickets, orders, and production batches in Apache Doris.'
description: 'A practical Apache Doris and Vane workflow for transcribing audio, generating embeddings, searching feedback, and tracing results to business records.'
keywords:
  - 'Apache Doris'
  - 'Vane'
  - 'multimodal analytics'
  - 'vector search'
  - 'audio transcription'
date: '2026-10-29'
author: 'Apache Doris'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-vane-multimodal-analytics/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

Orders, support tickets, and production batches already live in databases. Much of the detail in customer feedback, however, still lives in call recordings, transcripts, and attachments.

To answer “Which other customers reported a similar problem, and which production batches were involved?”, a team may need to listen to recordings, summarize the issue, and check business systems one by one. The data exists, but querying it together remains difficult.

Apache Doris and Vane connect those sources. Vane processes audio, images, and video into text, candidate classifications, and embeddings. **Doris brings those results into the existing business data model**, where they can be joined with orders, tickets, and production batches. The same records support similarity search and business analysis while retaining references to the original evidence.

## Bring multimodal data into business queries

Enterprise AI retrieval usually involves more than finding semantically similar content. Queries also carry business constraints such as product model, time range, equipment type, and the orders or batches that need investigation.

Keeping business data, text search, and vector search in Doris lets those constraints participate in the same SQL workflow:

- **Narrow the scope, then find related content.** For feedback about an X1 device that will not start, restrict the model and date range, then find descriptions such as “the switch does nothing” and “nothing happens when I turn it on.” A fault-code investigation can also include text matching.
- **Continue from retrieval into analysis.** Join retrieved feedback through tickets to orders and batches. With explicit review status, scope, and deduplication rules, analyze how candidate issues are distributed across batches and over time.
- **Reuse existing business data and SQL workflows.** Filtering, retrieval, joins, and aggregation can share the same data environment, reducing business-field replication, synchronization work, and application-side result assembly.

The result is a path from finding relevant content to tracing its business context and analyzing its distribution.

## Doris and Vane: from files to usable data

Turning a file into queryable data can require document parsing and chunking, audio transcription, video frame extraction, business-field extraction, and embedding generation. A support call, for example, can become segment records containing a ticket ID, transcript, candidate fault category, and embedding, plus the original recording URI and timestamps.

Those steps have different processing costs. One input can expand into many segments, while reading, decoding, and inference run at different speeds. After a Python prototype works, a team still has to manage batches, concurrency, model reuse, and failures.

![Business data flows directly into Doris, while Vane processes documents, images, audio, and video into text, fields, and embeddings for joined SQL analysis and retrieval](/images/blogs/apache-doris-vane-multimodal-analytics/multimodal-data-flow.png)

[Vane](https://github.com/AstroVela/vane) combines SQL, Python UDFs, and AI functions in one dataflow. Business identifiers, source references, and processing results stay associated while the engine coordinates reads, decoding, inference, and output handling. The resulting text, structured fields, and vectors are loaded into Doris alongside business records.

The following support-recording example follows the order **prepare Doris tables → process and load with Vane → query in Doris**. The code consists of excerpts, not a complete standalone pipeline. Use the [Vane + Doris Support Recording Search tutorial](https://vane.astrovela.ai/docs/data/tutorials/use-cases/audio-support-doris-search) for environment setup, recordings, UDF implementation and registration, segment expansion, and loading code.

## From support recordings to business analysis

### Prepare Doris tables and indexes

In a Doris SQL client, create the destination database and segment table. `feedback_segments` stores transcript text, a candidate category, an independent review status, a 384-dimensional embedding, and source positions. It also retains ticket, product-model, and date fields. The inverted index supports text filtering; the ANN index prepares for approximate vector retrieval.

```sql
CREATE DATABASE IF NOT EXISTS vane_support_demo;

CREATE TABLE vane_support_demo.feedback_segments (
    ticket_id VARCHAR(64) NOT NULL,
    segment_id INT NOT NULL,
    -- Business filters.
    product_model VARCHAR(64),
    event_date INT,
    -- AI labels are candidates; load new records with review_status = 'pending'.
    text STRING,
    fault_category VARCHAR(64),
    review_status VARCHAR(32),
    -- Original recording and segment boundaries, in milliseconds.
    source_uri STRING,
    start_ms BIGINT,
    end_ms BIGINT,
    embedding ARRAY<FLOAT> NOT NULL,
    -- Use the English parser for this English-language example.
    INDEX idx_text(text) USING INVERTED PROPERTIES("parser" = "english"),
    -- Match dimensions and distance settings to ingestion and query embeddings.
    INDEX idx_embedding(embedding) USING ANN PROPERTIES(
        "index_type" = "hnsw", "metric_type" = "l2_distance", "dim" = "384"
    )
) ENGINE=OLAP
DUPLICATE KEY(ticket_id, segment_id)
DISTRIBUTED BY HASH(ticket_id) BUCKETS 1
PROPERTIES("replication_num" = "1");
```

Also prepare the business relationship tables from the tutorial: `ticket_orders` maps tickets to orders, and `orders` records production batches. The example assumes one order per ticket and one batch per order. In a real deployment, use the corresponding business tables already in Doris.

### Process recordings in Vane

#### Associate recordings with ticket metadata

Vane can carry file references and ticket metadata through the same pipeline:

```sql
-- Run in Vane: combine file references with business metadata.
WITH files AS (
    SELECT
        ticket_id,
        product_model,
        event_date,
        -- FILE retains the reference; AUDIOFILE is the transcription UDF input.
        audio_file(
            file(f.url, NULL, NULL, NULL, NULL)
        ) AS audio
    -- Enumerate files; transcription reads their contents later.
    FROM list_files('./recordings/*.wav') AS f
    JOIN read_csv('tickets.csv', header = true) AS t
      -- Match T1024.wav to its unique ticket ID; unmatched files are excluded.
      ON regexp_extract(f.url, '([^/]+)\.wav$', 1) = t.ticket_id
)
SELECT ticket_id, product_model, event_date, audio
FROM files;
```

The source file enters the pipeline with business context attached. Transcription, extraction, and embedding generation continue along the same flow.

#### Transcribe and retain segment timestamps

Transcription retains segment positions so a retrieved result can be checked against the recording:

```python
# Vane batch UDF excerpt. See the tutorial for implementation and registration.
@vane.cls.batch(actor_number=1, gpus=0, return_dtype="VARCHAR")
class SpeechRecognizer:
    # Load once per actor and reuse the model across batches.
    def __init__(self, model_name):
        from faster_whisper import WhisperModel
        self.model = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8"
        )

    def __call__(self, audios):
        # Transcribe a batch of AUDIOFILE values.
        # Return one JSON string per input, including segment IDs,
        # text, and start/end timestamps in milliseconds.
        # Later SQL expands those segments into rows.
        ...
```

#### Extract candidate categories and generate embeddings

Transcribed segments can feed further SQL processing. The classification prompt constrains the JSON schema and categories and preserves uncertainty when the evidence is insufficient:

```sql
-- Run in Vane; segments comes from transcription and segment expansion.
SELECT
    ticket_id,
    segment_id,
    text,
    ai_prompt(
        'Classify the fault using only the support recording segment below. '
        || 'Return only a JSON object with the key fault_category. '
        || 'Allowed values: unable_to_start, general_inquiry, other_fault, needs_review. '
        || 'Do not treat negated, hypothetical, or resolved issues as confirmed faults. '
        || 'Use needs_review when evidence is insufficient. Segment: ' || text,
        provider := 'openai',
        model := '...', -- Replace with a text model ID available to your account.
        on_error := 'raise'
    ) AS fault_json
FROM segments;
```

Validate the JSON and normalize categories before loading. Invalid JSON or values outside the allowed set become `needs_review`. Valid classifications still remain candidate labels awaiting independent review. Raising model-call errors prevents an API failure from becoming a valid classification.

Generate an embedding from the same transcript:

```sql
-- Vane SELECT expression excerpt.
ai_embed(
    text,
    provider := 'transformers',
    model := 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    dimensions := 384,
    options := struct_pack(normalize := true)
) AS embedding
```

Ingestion and query embeddings must use the same model and processing settings. The 384-dimensional output must match the Doris ANN index and loading configuration, and normalization must be consistent.

Each recording is now represented by text, candidate categories, vectors, and source positions that Doris can query.

#### Load the processed records into Doris

Vane's `DorisStreamLoadSink` uses Doris Stream Load to write the results. Each row includes the transcript, category, review status, embedding, ticket metadata, source URI, and segment boundaries. Subsequent retrieval and analysis run in Doris.

### Search feedback and trace its business context

Run the following SQL in a Doris SQL client after loading the tutorial data.

#### Find similar feedback within business constraints

First inspect the first nonempty segment from ticket T1024. Then reuse its stored vector to search other tickets for model X1 in September 2026:

```sql
-- Inspect the segment used as the query example.
SELECT ticket_id, segment_id, text
FROM vane_support_demo.feedback_segments
WHERE ticket_id = 'T1024'
  AND length(trim(text)) > 0
ORDER BY segment_id
LIMIT 1;

-- Reuse the same segment's embedding without calling the model again.
WITH query_feedback AS (
    SELECT ticket_id, segment_id, text, embedding
    FROM vane_support_demo.feedback_segments
    WHERE ticket_id = 'T1024'
      AND length(trim(text)) > 0
    ORDER BY segment_id
    LIMIT 1
)
SELECT q.ticket_id AS query_ticket_id,
       q.segment_id AS query_segment_id,
       q.text AS query_text,
       f.ticket_id, f.segment_id, f.text, f.fault_category,
       f.source_uri, f.start_ms, f.end_ms,
       l2_distance_approximate(f.embedding, q.embedding) AS distance
FROM vane_support_demo.feedback_segments f
CROSS JOIN query_feedback q
WHERE f.product_model = 'X1'
  AND f.event_date >= 20260901 AND f.event_date < 20261001
  -- Exclude every segment from the source ticket.
  AND f.ticket_id <> q.ticket_id
ORDER BY distance ASC, f.ticket_id, f.segment_id
LIMIT 3;
```

Smaller distances indicate closer vectors. The query returns up to three segments; one ticket can appear more than once. Returning both query and candidate text helps verify what is being compared. Similarity does not confirm a fault.

To require the transcript to mention “indicator light,” add `AND f.text MATCH_ANY 'indicator light'` to the `WHERE` clause before `ORDER BY`. This combines text matching with vector ranking.

#### Join feedback to orders and production batches

Use business relationships to trace a segment through its ticket to an order and batch. `LEFT JOIN` keeps unmatched feedback visible for data-quality checks:

```sql
SELECT f.ticket_id, f.segment_id, f.text, f.fault_category,
       t.order_id, o.production_batch,
       f.source_uri, f.start_ms, f.end_ms
FROM vane_support_demo.feedback_segments f
LEFT JOIN vane_support_demo.ticket_orders t ON f.ticket_id = t.ticket_id
LEFT JOIN vane_support_demo.orders o ON t.order_id = o.order_id
WHERE f.product_model = 'X1'
  AND f.event_date >= 20260901 AND f.event_date < 20261001
ORDER BY f.ticket_id, f.segment_id;
```

In the demonstration data, T1024 maps to O9001 and T1025 to O9002, both in B202608; T1026 maps to O9003 in B202609. These relationships come from the business tables. The source URI and millisecond timestamps remain available for listening to the original evidence. Unmatched order or batch fields are `NULL`.

#### Count candidate tickets by batch

The next query searches the entire segment table for AI-labeled `unable_to_start` feedback within the model and date range, deduplicates by ticket, then counts by batch. Its scope is independent of the earlier Top-3 result.

```sql
WITH candidate_tickets AS (
    SELECT DISTINCT ticket_id
    FROM vane_support_demo.feedback_segments
    WHERE product_model = 'X1'
      AND event_date >= 20260901 AND event_date < 20261001
      -- At least one AI-labeled segment qualifies the ticket; review is separate.
      AND fault_category = 'unable_to_start'
)
SELECT COALESCE(o.production_batch, 'Unmatched batch') AS production_batch,
       COUNT(DISTINCT f.ticket_id) AS candidate_ticket_count
FROM candidate_tickets f
LEFT JOIN vane_support_demo.ticket_orders t ON f.ticket_id = t.ticket_id
LEFT JOIN vane_support_demo.orders o ON t.order_id = o.order_id
GROUP BY COALESCE(o.production_batch, 'Unmatched batch')
ORDER BY candidate_ticket_count DESC, production_batch;
```

`candidate_ticket_count` counts distinct tickets with at least one segment carrying the candidate label. It is not a segment count or a failure rate, and it does not imply human confirmation. Tickets without a matching batch remain in a separate group. If no segments have the category, the result is empty.

Vane turns recordings into structured records; Doris connects them to tickets, orders, and batches. Similarity search, business tracing, and batch-level analysis can then use the same SQL environment.

## Manufacturing applications

One manufacturer uses Doris to bring together production, inspection, equipment, and support data for line monitoring, yield analysis, batch tracing, and fault statistics. It extended that environment with document, image, and recording data, using Vane for multimodal processing and Doris for full-text and vector retrieval alongside existing analytics.

### Connect yield changes to past corrective actions

Doris combines process parameters, test results, equipment state, and batch information to track yield and drill down by production stage, equipment, and shift. When yield falls, engineers also need historical incident reports, 8D reports, and experiment records to find similar problems and effective actions.

Vane parses those documents, extracts symptoms, parameter conditions, corrective actions, and validation results, and generates embeddings. It preserves business identifiers, document versions, and page numbers. Once loaded into Doris, these records support keyword and vector retrieval constrained by product or process, followed by joins to current batch parameters, historical experiments, and before-and-after metrics.

A detected anomaly can thus connect directly to prior experience. AI can propose investigative steps based on business data and document evidence, while engineers validate causes and corrective actions through experiments.

### Connect customer descriptions to operating and manufacturing data

Support tickets, fault codes, operating logs, and batch records provide one view of product quality. Recordings, text, and photos provide another. Phrases such as “it won't charge” and “charging stops halfway” need operating context to determine whether they describe the same issue.

Vane transcribes calls and parses attachments, extracts symptoms and candidate categories, generates vectors, and retains ticket IDs and source positions. Doris combines model, date, and keyword constraints with vector retrieval, then joins related feedback to operating logs, repair results, and batches. Counts are deduplicated by ticket or product according to the analysis.

Business users can inspect original evidence and investigate whether similar complaints cluster around a batch or operating condition. That connects customer descriptions with production tracing and assessment of the affected population.

## Start with one data source

Multimodal analysis becomes useful when information in recordings, images, and video can participate in business queries. Vane prepares the content; Doris connects it to customers, orders, tickets, and batches.

Start with one concrete source and one business question. The [support recording tutorial](https://vane.astrovela.ai/docs/data/tutorials/use-cases/audio-support-doris-search) provides a complete example of content processing, semantic retrieval, and business analysis in a single workflow.
