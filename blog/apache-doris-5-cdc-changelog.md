---
title: 'Streaming Changes out of Doris: CDC and Incremental Computing in Apache Doris 5.0'
summary: 'Explore how Doris 5.0 Changelog records row changes, how Flink Doris Connector reads them, and how IVM and Table Stream prepare changes for downstream systems.'
description: 'A technical preview of Apache Doris 5.0 CDC: Changelog read modes, atomic writes, TSO ordering, retention, Flink recovery and delivery semantics, with advertising and product-price examples.'
keywords:
  - 'Apache Doris 5.0'
  - 'change data capture'
  - 'Changelog'
  - 'Flink Doris Connector'
  - 'incremental view maintenance'
  - 'Table Stream'
date: '2026-11-12'
author: 'Apache Doris · Mingyu Chen'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-5-cdc-changelog/cover.jpg'
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

*By Mingyu Chen, Apache Doris PMC Chair. Adapted from the [original article](https://selectdb.com/blog/doris-apache-doris-5-0-cdc), published on November 12, 2026.*

> This is the second article in the Apache Doris 5.0 incremental computing preview. The [first article](/blog/apache-doris-5-incremental-computing) introduced the framework through business scenarios. This article examines how Changelog captures changes and how Flink Doris Connector delivers them downstream, then shows how IVM and Table Stream can prepare those changes inside Doris.

**These capabilities are a preview of Doris 5.0.** Changelog, Table Stream, and IVM are experimental and require explicit configuration. The examples target Doris 5.0.0+ and Flink Doris Connector 26.4.0+; preview use requires builds containing the relevant changes.

Doris has often been the last stop in a real-time warehouse pipeline. Changes from operational databases arrive through Flink CDC, Routine Load, or Stream Load, become metrics and denormalized tables, and serve reports and applications.

Increasingly, teams use Doris as an intermediate computation engine. An advertising platform aggregates campaign spend in Doris and sends the results to its serving system for budget control. An e-commerce platform merges product data from several pipelines and synchronizes prices to a search engine. Data teams share processed tables and metrics with other business systems and data lakes. **Downstream systems need timely, accurate changes to the results computed in Doris.**

Previously, teams had three common approaches:

- Periodically export the entire result and compare it, with high latency and cost.
- Export rows by an `update_time` column, which misses deletes.
- Reimplement the processing in Flink, maintaining the same logic in two systems.

Doris 5.0 introduces Changelog into its storage format to record inserts, updates, and deletes as data is written, with optional before images. Interfaces expose those changes for further processing and downstream consumption. This article explains the implementation and its tradeoffs.

## 1. Changelog: recording changes in a distributed column store

A single-node database such as MySQL can append its binlog on one machine in commit order. Doris distributes data across many tablets on many machines, with several replicas per tablet and high write throughput. Its change log must answer three questions:

- How do change records stay consistent with the data?
- How is change order represented across a distributed system?
- How can changes be recorded and read efficiently?

### 1.1 Three read modes: DETAIL, MIN_DELTA, and APPEND_ONLY

Enable Changelog with the table property `changelog.enable` when creating a table. Duplicate Key tables and Unique Key Merge-on-Write tables support it. A Unique Key table can also enable `changelog.need_historical_value` to retain the old row, or **before image**, for an update. An update can then become a pair of Flink change events: `-U` and `+U`.

Before trying the examples, set `enable_feature_changelog = true` in `fe.conf` on every FE and restart the FEs. Set the same option in `be.conf` and restart the BEs for automatic cleanup. For Table Stream and IVM, also set `enable_table_stream = true` on every FE. See the [Changelog prerequisites and limitations](https://doris.apache.org/docs/dev/data-operate/incremental/changelog/).

The order examples use a table with before images enabled:

```sql
CREATE DATABASE IF NOT EXISTS shop;
USE shop;

CREATE TABLE orders (
    order_id BIGINT,
    status   VARCHAR(16)
)
UNIQUE KEY (order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);
```

Append `@incr` to the table name and specify a time window and read mode to query changes like a table. The examples below illustrate a historical five-minute window; when experimenting, substitute recent timestamps and writes within your Changelog retention period. Windows are **start-inclusive and end-exclusive**.

Assume that between 10:00 and 10:05:

- Order 1000, shipped before 10:00, is confirmed delivered.
- Order 1001 is created and then paid.
- Order 1002 is inserted as a duplicate order and then deleted.

![The same change window produces every change in DETAIL, net changes in MIN_DELTA, or insert events in APPEND_ONLY](/images/blogs/apache-doris-5-cdc-changelog/changelog-read-modes.jpg)

*Figure 1. DETAIL suits auditing and risk analysis; MIN_DELTA suits state synchronization; APPEND_ONLY suits logs and event streams.*

#### DETAIL: keep every change

Auditing, risk analysis, and order lifecycle analysis need individual transitions. Read the window in `DETAIL` mode:

```sql
SELECT __DORIS_CHANGELOG_OP__ AS op, order_id, status
FROM orders@incr(
    'startTimestamp' = '2026-11-11 10:00:00',
    'endTimestamp'   = '2026-11-11 10:05:00',
    'incrementType'  = 'DETAIL'
)
ORDER BY __DORIS_CHANGELOG_TSO__, __DORIS_CHANGELOG_LSN__, op;
```

The window contains seven records. The following table groups them by order for readability:

| op | order_id | status |
| --- | --- | --- |
| -U | 1000 | shipped |
| +U | 1000 | delivered |
| +I | 1001 | pending |
| -U | 1001 | pending |
| +U | 1001 | paid |
| +I | 1002 | pending |
| -D | 1002 | pending |

The query returns numeric operation codes: `0` means insert (`+I`), `1` delete (`-D`), `2` update-before (`-U`), and `3` update-after (`+U`). Tables in this article use the symbolic forms. These are the codes exposed by `@incr`; the raw `changelog()` table function has a different operation-code mapping.

#### MIN_DELTA: keep only net changes

Some consumers need only final state. A support system or search index does not need order 1001's intermediate `pending` state. Order 1002 was both created and deleted, leaving no net change.

Changing `incrementType` to `MIN_DELTA` collapses multiple changes to a key within the window. The seven records become three:

| op | order_id | status |
| --- | --- | --- |
| -U | 1000 | shipped |
| +U | 1000 | delivered |
| +I | 1001 | paid |

- Order 1000 existed at the start, so its net change is an update.
- Order 1001 did not exist at the start, so its net change is an insert with status `paid`.
- Order 1002 exists at neither boundary, so it produces no output.

**Doris performs this consolidation**, reducing intermediate states and redundant updates sent downstream.

> MIN_DELTA requires before images on Unique Key tables because it needs the value at the start of the window. Section 1.5 explains why.

#### APPEND_ONLY: read insert events

For logs, tracking events, or consumers interested only in newly inserted rows, use `APPEND_ONLY`:

| op | order_id | status |
| --- | --- | --- |
| +I | 1001 | pending |
| +I | 1002 | pending |

Order 1000 has only an update, so it produces no output. Order 1002's insert is still emitted even though the order is later deleted.

The differences among these modes apply to Unique Key tables. Duplicate Key tables record appended rows, so all three modes produce the same insert events. Deletes implemented through delete predicates on Duplicate Key tables do not produce Changelog events.

See [Incremental Query](https://doris.apache.org/docs/dev/data-operate/incremental/incremental-query/) for the complete `@incr` syntax and output columns.

### 1.2 Generating Changelog atomically with data

![Each replica writes a data tablet and companion Changelog tablet on the same local disk, making both visible through the load transaction](/images/blogs/apache-doris-5-cdc-changelog/atomic-write.jpg)

*Figure 2. Data files and change records become visible together through the load transaction.*

- **Companion tablets:** Every data tablet has a Changelog tablet. Each replica writes data files and change records together. When before images are needed, the old row is looked up locally. The load transaction makes both sets of files visible together, or neither.
- **Per-load consolidation:** Unique Key tables record changes per key per load. If the same key is written several times within one load, Changelog records the final result. Duplicate Key tables record every inserted row.
- **Concurrent writes:** When several loads modify the same key, an earlier lookup may return an outdated old value. Changelog reuses the Unique Key table's write-conflict handling. If a conflict is detected at commit, affected records are corrected against the latest version so the before image matches the row's actual preceding version.

> Operations that replace or remove whole datasets, such as `TRUNCATE`, dropping or replacing partitions, and `INSERT OVERWRITE`, do not emit a delete event for every removed row. Dependent materialized views may need rebuilding, and downstream replicas of current table state need a new full synchronization. Append-only processing, such as the Table Stream example in Section 3.1, intentionally accumulates arrivals independently of later base-table removal.

### 1.3 Ordering changes with TSO and LSN

Doris's original data versions increase independently within each partition. They cannot establish order across partitions or tables. Time-window reads need a shared clock: **TSO, or Timestamp Oracle**.

![The Master FE assigns increasing commit timestamps across tables and partitions, mapping adjacent time windows to contiguous TSO ranges](/images/blogs/apache-doris-5-cdc-changelog/tso-commit-order.jpg)

*Figure 3. The Master FE allocates TSO at commit. Adjacent time windows map to contiguous ranges without overlap or gaps.*

- **One allocator, monotonically increasing values:** The Master FE allocates TSO. High bits contain physical time in milliseconds; low bits count commits within the same millisecond. Values do not move backward after a master change or clock rollback. Physical time lets a window such as 10:00–10:05 map to a TSO range.
- **One TSO per transaction, allocated at commit:** Allocating it at transaction start would misplace long-running loads. A transaction beginning at 10:00 and committing at 10:30 must not appear in a 10:00 window that consumers have already finished.
- **Wait for visibility before reading:** Receiving a TSO does not immediately make the data readable. A transaction committed at 10:04 belongs to `[10:00, 10:05)` even if publication finishes after 10:05. Reading too early would miss it, and the next window would exclude it. Doris therefore waits for the relevant transactions to become visible before reading. A timeout returns an error so the consumer can retry the same window.

![Reading before a 10:04 commit becomes visible can lose it permanently; waiting for Publish allows the original time window to be read completely](/images/blogs/apache-doris-5-cdc-changelog/wait-before-read.jpg)

*Figure 4. Commit time determines the window; visibility determines when it is safe to read that window.*

Rows changed in the same transaction share a TSO. LSN provides a sequence number to order those change records. A row carries the same LSN to every replica, so replicas record the same change order.

### 1.4 Retention and cleanup

Changelog retains records for **one day by default**, controlled by `changelog.ttl_seconds`. Expired records become unavailable to queries immediately; background cleanup reclaims their storage later.

TTL depends on time, not consumer progress. Consumers do not need registration and do not block each other's retention. The tradeoff is that slow consumers can lose required history:

- `DETAIL` and `APPEND_ONLY` skip expired portions of a requested window without reporting an expiration error.
- `MIN_DELTA` and IVM fail if the required starting history has expired, because they cannot compute a correct net change without it.

**Retention must cover the initial snapshot duration, the longest expected outage, and catch-up time after recovery**, with margin. Monitor consumer lag; a running job alone does not establish that no history has expired.

### 1.5 Reading and consolidating changes

**Prune by time.** Change files carry TSO ranges. Reads skip files outside the requested range rather than scanning the entire Changelog.

**Consolidate MIN_DELTA.** For each key, Doris considers the first and last change within the window. The before image of the first record supplies the starting value; the after image of the last record supplies the ending value.

| State at start | State at end | Output |
| --- | --- | --- |
| Absent | Present | Insert (`+I`) |
| Present | Absent | Delete (`-D`) |
| Absent | Absent | None |
| Present | Present, different row | Update-before and update-after (`-U`, `+U`) |
| Present | Present, identical row | None |

Before images avoid a separate lookup of historical table data. This is why MIN_DELTA needs them. Comparison covers the **whole row**: a change in any column counts as an update.

**Track internal and external consumption differently.** Table Stream and IVM maintain TSO positions for each base-table partition. Processing results and new positions commit in one Doris transaction and roll back together on failure. External systems cannot participate in that transaction; they read time windows and save their own progress. Flink Doris Connector is one such consumer.

### 1.6 Costs and limitations

Changelog adds writes and storage. Enabling before images also adds old-row lookups, reducing ingestion throughput by an amount that depends on table structure and update frequency. Append-only workloads can avoid those lookups with Duplicate Key tables or without before images.

Changelog can currently be enabled only at table creation. Tables with it support only the permitted light schema changes, and do not support backup and restore. Evaluate these constraints before creating source tables.

## 2. Flink Doris Connector: delivering changes downstream

![Changelog from Doris tables and materialized views becomes a Flink change stream that sinks write to Kafka, MySQL, lake tables, or another Doris cluster](/images/blogs/apache-doris-5-cdc-changelog/doris-flink-cdc.jpg)

*Figure 5. Internal consumers and Flink can consume the same Changelog for different purposes.*

Flink Doris Connector converts Doris changes into Flink insert, update-before, update-after, and delete events. Flink sinks can then send them to Kafka, MySQL, data lakes, or another Doris cluster.

### 2.1 Declare a Doris table as a change stream

To synchronize order state to a customer-support system, declare the orders table in Flink SQL:

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE order_changes (
    order_id BIGINT,
    status   STRING,
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'doris',
    'fenodes' = '<fe-host>:8030',
    'table.identifier' = 'shop.orders',
    'username' = '<doris-user>',
    'password' = '<doris-password>',
    'source.scan.mode' = 'initial',
    'source.changelog.increment-type' = 'min_delta'
);
```

The source emits `+I`, `-U`, `+U`, and `-D` records. Connect it to a sink that supports the required updates and deletes, such as a primary-key MySQL table or upsert-kafka. Two options control how a new consumer starts and reads:

| Option | Values and behavior |
| --- | --- |
| `source.scan.mode` | `snapshot` (default): one full read; `initial`: snapshot then changes; `latest`: changes from startup; `from-timestamp`: changes from `source.scan.timestamp` |
| `source.changelog.increment-type` | `detail` (default), `min_delta`, or `append_only`. With `min_delta`, each poll's read window is the consolidation window. |

In `initial` mode, the connector saves the incremental starting position before reading the snapshot. Changes committed after that position are covered by the snapshot, the incremental stream, or both. This avoids omissions but can produce duplicates because the snapshot reads current data while the later incremental read also covers changes made during snapshot collection.

The connector therefore provides **at-least-once source delivery**. Downstream processing must handle duplicates to achieve exactly-once effects. Duplicate Key tables have no primary key to absorb repeated rows; `latest` or `from-timestamp`, with a separately managed initial load, is often more suitable for them.

See [Incremental Reading with Doris Changelog](https://doris.apache.org/docs/dev/connection-integration/data-integration/flink-doris-connector/incremental-read/) for connector setup, options, and recovery rules.

### 2.2 Read successive time windows

![An Enumerator plans time windows and assigns Changelog shards to parallel Readers using Arrow Flight SQL, with checkpoint state and an optional external offset table](/images/blogs/apache-doris-5-cdc-changelog/connector-architecture.jpg)

*Figure 6. Checkpoints record read progress. The optional external offset table advances after checkpoint completion and records only fully consumed windows.*

Two roles cooperate:

- The **Enumerator** obtains the current TSO at each polling interval (`source.changelog.poll-interval`, default `10s`), creates a window such as `[10:00:00, 10:00:10)`, discovers the Changelog shards, and assigns read tasks.
- **Readers** read assigned shards in parallel through Arrow Flight SQL and convert records into Flink change events.

The next window starts only after every shard in the current window has finished. Windows have second-level precision and the minimum poll interval is one second. The design targets latency from seconds to tens of seconds; actual end-to-end delay also depends on workload, backlog, and downstream processing.

### 2.3 Recover from checkpoints

Checkpoints save the active window and unfinished shards. After failure, the job resumes from the latest completed checkpoint. Shards already marked complete there stay complete; unfinished shards restart from the beginning of that window. Some records can therefore arrive again.

Optionally, `source.changelog.offset-table` and `source.changelog.consumer-id` publish progress to a Doris table. This provides a restart position when a job is recreated without restoring Flink checkpoint state. The table updates after checkpoints complete and records only fully consumed windows, so restarting from it can replay a larger range.

Recovery still depends on retention. If the required start has expired, `detail` and `append_only` skip expired changes, while `min_delta` fails. Configure retention with enough margin and monitor consumption lag.

### 2.4 End-to-end exactly-once effects

A cross-system pipeline cannot share one Doris transaction. The design combines **at-least-once delivery from the source with duplicate-safe downstream application**.

![At-least-once source delivery and applying repeated events at most once combine to provide exactly-once effects, with per-key ordering required for upserts](/images/blogs/apache-doris-5-cdc-changelog/exactly-once.jpg)

*Figure 7. “At-most-once” here describes applying a repeated change at most once, not a delivery mode that permits data loss.*

On the source side, waiting for transaction visibility closes the requested window before reading. Checkpoints and the optional offset table make progress recoverable. Replays can occur after checkpoint recovery, during the snapshot-to-incremental transition, or when restarting from the external offset table. These guarantees assume the needed records remain within retention.

Common downstream strategies include:

- **Primary-key upserts:** A Doris Unique Key table or MySQL table can absorb repeated idempotent writes of the same row state.
- **Further Flink aggregation or joins:** Declare the source primary key and set `table.exec.source.cdc-events-duplicate` to `true` so Flink can absorb duplicate CDC events. This requires keeping the latest row for each key in state.
- **Append-only destinations:** Ordinary Kafka topics and files need event deduplication, for example by `(TSO, LSN, OP)` within the source table. Access to these metadata fields requires the DataStream API. An upsert-capable destination is another option.

Primary-key upserts also need **per-key order through the sink**. If order 1001's `paid` update is applied before an older `pending` insert, the final state is wrong. Source ordering alone does not establish an end-to-end guarantee; downstream partitioning, deduplication, state recovery, and sink behavior must preserve the intended effects.

### 2.5 Read shards in parallel

![Changelog shards distributed across Doris nodes are read by several Flink Readers in parallel](/images/blogs/apache-doris-5-cdc-changelog/parallel-readers.jpg)

*Figure 8. Sharding allows parallel consumption, with no global ordering across shards.*

- **Assignment:** The Enumerator hashes shard IDs to Readers. With unchanged parallelism, existing assignments remain stable as new shards appear. A small number of shards can produce uneven assignments.
- **Ordering:** Changes for a key stay in one shard and are read sequentially by one Reader. Windows are also processed in sequence. Different shards have no global output order.
- **Synchronization:** Every Reader must finish the current window before the next begins. The slowest shard sets the pace, especially under skew.
- **Parallelism limit:** Effective parallelism cannot exceed the number of Changelog shards, equal to the sum of bucket counts across partitions. Table bucketing therefore limits consumption parallelism.

When a job is rescaled, it restores checkpoint state, replays unfinished shards for the window, and assigns work using the new parallelism.

## 3. Process changes inside Doris before delivery

Downstream systems often need changes to derived results rather than raw source rows. Doris can prepare those results with two mechanisms:

- [Incremental view maintenance (IVM)](https://doris.apache.org/docs/dev/query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view/) updates affected parts of a SQL-defined materialized view from base-table Changelog, avoiding full recomputation on each refresh.
- [Table Stream](https://doris.apache.org/docs/dev/data-operate/incremental/table-stream/) exposes unconsumed table changes and tracks progress. Consuming it with `INSERT` commits the result write and progress advance in the same Doris transaction. Failure rolls both back.

The result table or materialized view can enable its own Changelog. Its derived changes can then be consumed using `DETAIL` or `MIN_DELTA`, creating a multi-stage processing pipeline.

### 3.1 Deliver changes to campaign spend

An advertising platform bills per click. Billing entries flow into Doris, while a serving system must track cumulative spend per campaign. It pauses a campaign when spend reaches its budget. Fraud detection can later insert negative reversal entries for invalid clicks, reducing spend and allowing the campaign to resume.

The serving system needs a result such as “campaign A's spend changed from CNY 950 to CNY 1,000.” Sending raw billing events would make it reimplement aggregation in Flink or repeatedly query Doris.

#### Use an aggregate materialized view and its Changelog

Define spend per campaign in SQL and incrementally refresh after base-table commits. Enable Changelog and before images on the view so every refresh can expose changes to cumulative spend.

![An aggregate materialized view turns click billing entries into spend changes, pausing a campaign at its budget and resuming it after a reversal](/images/blogs/apache-doris-5-cdc-changelog/campaign-spend-ivm.jpg)

*Figure 9. With a CNY 1,000 budget, reaching the limit pauses serving; a reversal reducing spend to CNY 970 permits resumption.*

Run the following in Doris. The examples use 16 buckets and the cluster's default replication; size both for your deployment.

```sql
CREATE DATABASE IF NOT EXISTS ads;
USE ads;

-- Append-only billing entries. Reversals use negative amounts.
CREATE TABLE click_billing (
    campaign_id  BIGINT,
    billing_time DATETIME,
    amount       DECIMAL(18, 2)
)
DUPLICATE KEY (campaign_id, billing_time)
DISTRIBUTED BY HASH(campaign_id) BUCKETS 16
PROPERTIES ("changelog.enable" = "true");

-- Incrementally refresh after commits and record changes to the result.
CREATE MATERIALIZED VIEW campaign_spend_mv
BUILD IMMEDIATE REFRESH INCREMENTAL ON COMMIT
KEY (campaign_id)
DISTRIBUTED BY HASH(campaign_id) BUCKETS 16
PROPERTIES (
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
)
AS
SELECT campaign_id, SUM(amount) AS spend
FROM click_billing
GROUP BY campaign_id;
```

`ON COMMIT` triggers asynchronous refresh tasks. Wait for the initial build to succeed before relying on the view; later result changes become available after their refresh completes. The following timeline illustrates the resulting spend changes rather than guaranteeing a refresh at every wall-clock timestamp.

| Time | Event | Cumulative spend (CNY) | View Changelog |
| --- | --- | ---: | --- |
| 10:00:01 | First billing batch | 800 | +I 800 |
| 10:00:04 | Further charges | 950 | -U 800, +U 950 |
| 10:00:08 | Charges reach the budget | 1,000 | -U 950, +U 1,000 |
| 10:00:15 | Reverse CNY 30 of invalid clicks | 970 | -U 1,000, +U 970 |

If the serving system needs only the latest spend, use `MIN_DELTA`. For example, the first ten-second window is:

```sql
SELECT __DORIS_CHANGELOG_OP__ AS op, campaign_id, spend
FROM campaign_spend_mv@incr(
    'startTimestamp' = '2026-11-11 10:00:00',
    'endTimestamp'   = '2026-11-11 10:00:10',
    'incrementType'  = 'MIN_DELTA'
);
```

In the illustrated window, campaign A moves from absent to 800, 950, and 1,000. Only `+I 1,000` is emitted, prompting a pause. The next window, `[10:00:10, 10:00:20)`, emits `-U 1,000` and `+U 970`, prompting resumption. Consolidation reduces messages during periods of frequent billing. Use `DETAIL` when every recorded transition is needed for reconciliation or spend curves.

#### Use Table Stream when raw and result retention differ

Large billing ledgers may retain only a few days of detail. A materialized view, however, represents a query over its retained base data: removing base data cannot also preserve an independent lifetime total without changing that meaning.

**Table Stream plus a scheduled job separates raw-data retention from cumulative results.** The stream reads newly arrived billing entries. A job groups each batch by campaign and adds its delta to a result table with Changelog enabled.

![An append-only Table Stream and a minute-by-minute job accumulate campaign spend independently of three-day raw billing retention, committing results and offsets atomically](/images/blogs/apache-doris-5-cdc-changelog/campaign-spend-table-stream.jpg)

*Figure 10. Raw entries can expire while the cumulative result remains. Retrying a failed stream-consuming write does not add the same batch twice.*

In this alternative, the billing table can use daily partitions with three-day retention. The `click_billing` DDL above leaves that production partition policy to the deployment. Create the result table, stream, and [scheduled job](https://doris.apache.org/docs/dev/admin-manual/workload-management/job-scheduler/) in the `ads` database:

```sql
USE ads;

CREATE TABLE campaign_spend (
    campaign_id BIGINT,
    spend       DECIMAL(38, 2)
)
UNIQUE KEY (campaign_id)
DISTRIBUTED BY HASH(campaign_id) BUCKETS 16
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);

-- Consume only entries arriving after this stream is created.
CREATE STREAM click_billing_stream ON TABLE click_billing
PROPERTIES ("type" = "append_only", "show_initial_rows" = "false");

CREATE JOB campaign_spend_job
ON SCHEDULE EVERY 1 MINUTE
DO
INSERT INTO ads.campaign_spend
SELECT d.campaign_id, COALESCE(s.spend, 0) + d.delta
FROM (
    SELECT campaign_id, SUM(amount) AS delta
    FROM ads.click_billing_stream
    GROUP BY campaign_id
) d
LEFT JOIN ads.campaign_spend s ON s.campaign_id = d.campaign_id;
```

Each execution commits the result and stream position together. Failure rolls both back, so retrying does not double-count the batch. The result table's Changelog contains cumulative spend changes. Because `show_initial_rows` is `false`, this example starts accumulation only from new arrivals; any pre-existing billing data needs a separately coordinated baseline.

Both approaches expose a result Changelog that Flink Doris Connector can deliver to the serving system using the pattern in Section 2.1.

### 3.2 Merge out-of-order product streams and suppress irrelevant changes

An e-commerce platform writes products to Doris through two pipelines. Real-time CDC captures operational database changes. A daily reconciliation pipeline reloads a full snapshot to repair potential gaps. Doris then synchronizes prices to a search engine, which needs price changes and product deletes.

![A sequence column resolves out-of-order product arrivals, while a price-only materialized view and MIN_DELTA remove version-only changes before search synchronization](/images/blogs/apache-doris-5-cdc-changelog/product-price-cdc.jpg)

*Figure 11. Keep version information in the base table for correctness, then exclude it from the downstream result before computing net changes.*

#### Use a sequence column to handle arrival order

Events from the two pipelines can arrive out of order. The product table maps `ver` to a [sequence column](https://doris.apache.org/docs/dev/data-operate/update/unique-update-concurrent-control/). For the same key, the higher version wins regardless of arrival order; late lower-version writes are discarded.

In this scenario, the real-time pipeline derives `ver` from the source change's event time, while reconciliation uses the snapshot time. Both pipelines must use a comparable version convention.

```sql
CREATE DATABASE IF NOT EXISTS shop;
USE shop;

CREATE TABLE product (
    product_id BIGINT,
    price      DECIMAL(10, 2),
    ver        BIGINT
)
UNIQUE KEY (product_id)
DISTRIBUTED BY HASH(product_id) BUCKETS 16
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "function_column.sequence_col" = "ver",
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
);
```

Suppose a product originally costs CNY 99 at version 100, drops to CNY 89 at version 150, and returns to CNY 99 at version 200. The version-150 event arrives last:

| Arrival | Incoming row | Stored result |
| --- | --- | --- |
| 1 | CNY 99, ver = 100 | CNY 99, ver = 100 |
| 2 | CNY 99, ver = 200 | CNY 99, ver = 200 |
| 3 | CNY 89, ver = 150 | Discarded; CNY 99, ver = 200 remains |

#### Keep version-only writes in the base table

Daily reconciliation rewrites products with a newer `ver` even when prices stay unchanged. Forwarding all those updates would cause unnecessary index writes.

They cannot simply be discarded at ingestion. Arrival 2 above changes only `ver`. If it were discarded because the price stayed at 99, the stored version would remain 100. The late version-150 event would then incorrectly replace the price with 89.

Reading the base table with `MIN_DELTA` also cannot remove version-only changes: it compares the whole row, including `ver`.

#### Project the required columns, then read MIN_DELTA

Create an incremental materialized view containing only product ID and price, with its own Changelog and before images. When only `ver` changes, the view's before and after rows are identical, so `MIN_DELTA` suppresses the update.

```sql
CREATE MATERIALIZED VIEW product_price_mv
BUILD IMMEDIATE REFRESH INCREMENTAL ON COMMIT
KEY (product_id)
DISTRIBUTED BY HASH(product_id) BUCKETS 16
PROPERTIES (
    "changelog.enable" = "true",
    "changelog.need_historical_value" = "true"
)
AS
SELECT product_id, price FROM product;

-- Illustrative ten-second window after the relevant refreshes complete.
SELECT __DORIS_CHANGELOG_OP__ AS op, product_id, price
FROM product_price_mv@incr(
    'startTimestamp' = '2026-11-11 10:00:00',
    'endTimestamp'   = '2026-11-11 10:00:10',
    'incrementType'  = 'MIN_DELTA'
);
```

Assuming the product already exists at the start, each window has the following effects:

| Changes within the window | MIN_DELTA output | Search engine action |
| --- | --- | --- |
| Reconciliation changes only `ver` | None | None |
| Price falls from CNY 99 to CNY 89 | -U 99, +U 89 | Set price to CNY 89 |
| Price falls to CNY 89 and returns to CNY 99 | None | None |
| Product is deleted at price CNY 99 | -D 99 | Remove the product |

Flink Doris Connector can read the view's Changelog and deliver these meaningful result changes downstream.

## What comes next

Changelog extends Doris's role in a real-time pipeline: Doris can ingest data, compute results, and continuously expose changes to those results. IVM and Table Stream prepare changes inside the database; Flink Doris Connector carries them to other systems.

The next article will examine IVM internals and incremental execution plan generation. Changelog is planned for Apache Doris 5.0; consult the documentation and release announcements for availability.
