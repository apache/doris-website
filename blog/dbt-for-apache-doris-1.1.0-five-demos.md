---
title: 'dbt-for-apache-doris 1.1.0 Released: Five Business Demos to Get Started with Doris Data Engineering'
summary: 'dbt-for-apache-doris 1.1.0 targets dbt Core 1.12 and manages Apache Doris asynchronous materialized views through the standard dbt materialized_view. Five demos walk through the Doris + dbt workflow from source data and models to data tests and result tables.'
description: 'dbt-for-apache-doris 1.1.0 targets dbt Core 1.12, manages Apache Doris asynchronous materialized views through the standard dbt materialized_view, and covers Table, View, Incremental, Snapshot, Seed, and Data Test workflows. Five business demos show how dbt and Apache Doris handle daily order summaries, late-arriving orders, and more.'
keywords:
  - 'Apache Doris'
  - 'dbt'
  - 'dbt-for-apache-doris'
  - 'dbt adapter'
  - 'asynchronous materialized view'
  - 'incremental model'
  - 'data engineering'
date: '2026-09-01'
author: 'Junwei Chen'
tags:
  - 'Tech Sharing'
image: '/images/blogs/dbt-for-apache-doris-1.1.0-five-demos/cover.png'
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

`dbt-for-apache-doris 1.1.0` was released on August 12, 2026, and targets dbt Core 1.12. This version manages Apache Doris asynchronous materialized views through the standard dbt `materialized_view` materialization, and covers the common workflows: Table, View, Incremental, Snapshot, Seed, and Data Test.

```bash
python -m pip install "dbt-for-apache-doris==1.1.0"
```

This post first introduces the problems that dbt and Doris solve together and what the adapter supports, then uses five demos to show the complete Apache Doris + dbt process, from source data and model transformation to data tests and result tables.

## 1. dbt and Doris: Capability Overview and What's New

### 1.1 What is dbt

dbt (data build tool) is an open-source data transformation framework that focuses on the T (transform) step of the ELT process in a data warehouse. In dbt, every data model is a SQL `SELECT` statement, and models reference each other with `ref()`. dbt compiles them into the target database's table creation and write statements, executes them in dependency order, and materializes each one as a table, view, incremental table, or snapshot according to its configuration.

The problem dbt sets out to solve is that the transformation layer has long lacked engineering discipline:

- SQL scripts are scattered across schedulers, scripts, and personal machines; dependencies are maintained by hand, and nobody knows what a change will affect.
- There is no automated testing, so metric errors often surface only when business users look at a report.
- There is no version control, code review, or separation between development and production environments, so changes are hard to trace.
- Boilerplate for table creation, incremental writes, and historical snapshots is rewritten by hand in every project.

In response, dbt provides models as code, dependency graphs derived automatically from `ref()`, declarative Data Tests, built-in materializations such as Table / View / Incremental / Snapshot, auto-generated documentation and lineage, and a package ecosystem built on Jinja macros, such as `dbt_utils`.

### 1.2 What dbt and Doris solve together

dbt does not perform computation itself; every transformation is pushed down to the target database. The database's capabilities therefore set the ceiling for a dbt project. Apache Doris is an MPP real-time analytical database that is compatible with the MySQL protocol, and it runs aggregations, multi-table JOINs, and window functions inside the database. `dbt-for-apache-doris` connects the two: dbt organizes, orchestrates, and validates the transformation logic, while Doris stores the data and executes the SQL.

Once the two are combined, several common data engineering problems get direct answers:

- **Table conventions as code**: Doris Key models, partitions, buckets, and table properties are all declared in the model's `config()`, so they enter version control and code review together with the code instead of relying on verbal agreements.
- **Late-arriving data and updates**: A write to a Doris Unique Key table is an Upsert, and dbt Incremental `merge` is built directly on this semantic. Running the same batch again produces the same result, so tasks can be re-run safely.
- **Pre-aggregation layers and business models managed together**: Doris asynchronous materialized views enter the dbt dependency graph through the standard `materialized_view` materialization. Build and refresh strategies live in the configuration, and they change and get tested together with the upstream models.
- **In-database computation**: Aggregations, JOINs, and window functions are executed by Doris. dbt only sends SQL, so no extra compute engine is needed to move data around.
- **Quality checks up front**: Data Tests, Unit Tests, and Model Contracts run directly on Doris, so problems surface at build time instead of being traced back after a report breaks.

### 1.3 Adapter feature support

1. **Materializations**

   | Capability | Status | Current scope and boundaries |
   |-|-|-|
   | Table | ✅ | Duplicate Key CTAS; configurable HASH bucketing and bucket count, RANGE / LIST partitioning, table properties, Contracts, docs, Grants, and Hooks. Unique Key tables are created by Incremental `merge` |
   | View | ✅ | Standard lifecycle, Contracts, docs, Grants, and Hooks; switching relation types is not zero-downtime |
   | Incremental | ✅ | Four strategies, `append`, `merge`, `insert_overwrite`, and `microbatch`, plus every `on_schema_change` mode (strategy details in the next table) |
   | Snapshot | ✅ | `check` / `timestamp` strategies, hard-delete handling, schema evolution, atomic replacement and recovery; jobs targeting the same relation must be serialized by the scheduler |
   | Materialized view | ✅ | Standard dbt `materialized_view`, implemented as a Doris Async MV; covers the build / refresh lifecycle, task waiting, configuration changes, atomic replacement and recovery; dbt jobs targeting the same relation must be serialized |
   | Seed | ✅ | CSV loading, type inference, `column_types`, and `ref()` |
   | Ephemeral | ✅ | Compiled and inlined by dbt Core |
2. **Incremental strategies and Doris target tables**. When no strategy is specified explicitly, models configured with a `unique_key` use `merge` and all others use `append`.

   | Strategy | Doris target table | Behavior |
   |-|-|-|
   | `append` | Duplicate Key table | Appends rows with `INSERT INTO` |
   | `merge` | Unique Key table (MoW or MoR) | Full-row `INSERT INTO` Upsert based on Unique Key semantics; requires `unique_key`, does not generate `MERGE INTO` |
   | `insert_overwrite` | Any writable Doris table | `INSERT OVERWRITE` of the whole table, specified partitions, or dynamic partitions; does not accept `unique_key` |
   | `microbatch` | Duplicate Key table with exact RANGE partitions | Each dbt time window overwrites one named partition; supports hour / day / month / year windows, and batches run serially |
3. **dbt engineering capabilities**

   | Capability | Status | Current scope and boundaries |
   |-|-|-|
   | Sources and freshness | ✅ | `loaded_at_field`, filter, and `loaded_at_query`; cross-database access is implemented as database-as-schema, not through an External Catalog |
   | Data Test | ✅ | Singular, Generic, and Ephemeral tests, plus `store_failures` |
   | Unit Test | ✅ | Inline and CSV fixtures, case-insensitive column names, invalid-input validation, reserved-word quoting, and data type fixtures adapted to Doris |
   | Model Contract | ✅ | Column name and type constraints for Table, View, and Incremental; not mapped to database primary keys or NOT NULL constraints |
   | Persisted docs | ✅ | Table / column comments for Table, View, Incremental, Snapshot, Seed, and Async MV; updating a View comment, or a comment that contains both kinds of quotes, may require a rebuild or full refresh |
   | Grants | ✅ | Reconciles Doris table-level privileges for Table, View, Incremental, Seed, Snapshot, and Async MV, supporting `user` and `user@host` grantees; role grantees are not handled |
   | Hooks | ✅ | pre-hook and post-hook for every materialization; Doris does not provide transactional rollback for hook side effects |
   | Metadata and dbt docs catalog | ✅ | Relation discovery and documentation catalog for Doris databases, tables, views, columns, comments, and Async MVs |
   | Cross-database Sources | ✅ | References Sources in other Doris databases, including definitions that only declare a database; three-part External Catalog names are not supported |

### 1.4 What's new in 1.1.0

1.1.0 is the first release of `dbt-for-apache-doris` from its standalone repository and on PyPI. The highlights:

- Targets dbt Core 1.12 and supports Python 3.10 and above
- Manages Doris Async Materialized Views through the standard dbt `materialized_view` materialization
- Provides standalone PyPI installation, explicit version constraints, and a defined support boundary

Asynchronous materialized views are integrated as follows: the standard dbt `materialized_view` maps to a Doris Async MV, and the build mode, refresh strategy, and task waiting are all written in the model configuration.

```sql
{{ config(
    materialized='materialized_view',
    refresh_trigger='manual',
    wait_for_refresh=true
) }}

select order_date, sum(amount) as sales
from {{ ref('orders') }}
group by order_date
```

Next, we walk through several demos to explain the application scenarios of Doris + dbt in detail.

## 2. Doris + dbt Application Scenarios

Each of the five demos starts from a business question:

| # | Demo | Business question | Transformation and result | Key capabilities |
|-|-|-|-|-|
| 01 | Daily order summary | How many valid orders and how much revenue per day and per month? | Filter out cancelled, returned, and failed orders; produce a daily Table and a monthly Async MV | Source, Table, Data Test, partitioning and bucketing, Async MV |
| 02 | Customer geography analysis | Which states are customers, orders, and revenue concentrated in? | Read addresses and orders from two Doris databases; output state-level business metrics | Cross-database Source, View, `ref()`, Table |
| 03 | Ad data integration | How to unify Google, Meta, and TikTok data? | Load three kinds of CSV with Seeds, align fields, and deduplicate; output daily channel details | Seed, `dbt_utils`, `QUALIFY`, Data Test |
| 04 | Late-arriving orders | How to absorb late corrections and avoid duplicate orders? | Identify order versions and maintain the current state with Incremental `merge` | Incremental, Unique Key, idempotency |
| 05 | Customer history tracking | How to keep the history of attribute changes and hard deletes? | Two Snapshot rounds produce SCD Type 2 history and a current customer dimension table | Snapshot, Hard Delete, `ref()`, Data Test |

> The demos are selected and adapted from the Snowflake Labs [`data-eng-bench`](https://github.com/Snowflake-Labs/data-eng-bench) scenarios (the original project is licensed under the Apache License 2.0). We rewrote the profiles, SQL, fixtures, verifiers, and notebooks for Apache Doris and `dbt-for-apache-doris`.
>
> Demo repository: [https://github.com/velodb/dbt-for-apache-doris/tree/main/examples](https://github.com/velodb/dbt-for-apache-doris/tree/main/examples)

Two of these scenarios are covered below. For the other three demos (customer geography analysis, ad data integration, and customer history tracking), the [Doris dbt demos README](https://github.com/velodb/dbt-for-apache-doris/tree/main/examples/doris-demos) in the repository gives the detailed business descriptions, model lists, and step-by-step runs.

### 2.1 Demo 01: Order summary and asynchronous materialized views

The question this demo answers: how many valid orders and how much revenue are there per day and per month?

The demo starts from 6 orders in Doris, excludes the `CANCELLED`, `RETURNED`, and `FAILED` statuses, and produces `daily_order_summary`. Data Tests check that dates are unique and key columns are not null, and then `monthly_order_summary_mv` aggregates the daily results through `ref()`.

![Demo 01 transformation flow: on the dbt side, source(), Table, ref(), and materialized_view; the orders source is filtered into daily_order_summary, checked by Data Tests, and aggregated into monthly_order_summary_mv; on the Doris side, Duplicate Key, Range Partition, Hash Bucket, and Async MV](/images/blogs/dbt-for-apache-doris-1.1.0-five-demos/demo01-daily-order-summary-flow.jpg)

*Figure 1: The transformation chain from raw orders to the monthly asynchronous materialized view. The top row shows what dbt handles: model dependencies, materialization, and tests. The bottom row shows the table model and materialized view capabilities provided by Doris.*

The example ends with 3 valid orders and a monthly revenue of `220.20`. In this chain, dbt is responsible for the model dependencies (from `source()` to `ref()`), the materializations, and the Data Tests. On the Doris side, several capabilities determine how the two result tables are stored and how efficiently they are queried:

| Doris capability | Value in this scenario |
|-|-|
| Duplicate Key model | `daily_order_summary` is created with `order_date` as its sort key. Rows are kept as-is, without aggregation or merging. Range queries by date use the prefix index, so daily report queries hit directly. dbt `table` rebuilds the whole table with CTAS on every run, so the result is reproducible |
| RANGE partitioning (by `order_date`) | The model pre-creates the `p202608` partition and the catch-all `pmax` partition through `partition_by_init`. Monthly queries scan only the matching partition, and historical data can be archived or dropped by month |
| HASH bucketing (by `order_date`) | Data is distributed across BE nodes by the bucket key and computed in parallel. The demo's single-node environment uses 1 bucket; production can increase the bucket count with data volume |
| Asynchronous materialized view (Async MV) | `monthly_order_summary_mv` pre-aggregates on top of the daily table, so the monthly dashboard reads precomputed results instead of re-aggregating every time. `build_mode='immediate'` produces data as soon as the view is built, `refresh_method='auto'` lets Doris decide between a full refresh and a partition-level refresh, and `refresh_trigger='manual'` has each dbt run trigger a refresh and wait for it to complete; it can also be switched to a scheduled refresh (`schedule`) or a refresh on base table commit (`commit`). The materialized view itself can also be configured with Keys, bucketing, and table properties |

### 2.2 Demo 04: Incremental updates for late-arriving orders

The problem this demo handles: how to absorb late corrections and avoid duplicate orders?

The demo first writes orders 101, 102, and 103, then receives two late events: the amount of order 101 is corrected from `100.00` to `125.00`, and a new order 104 arrives.

The processing chain has two steps:

1. `order_version_history` uses window functions to identify the current version of each order.
2. `incremental_daily_sales` uses `order_id` as its business key and runs Incremental `merge` on top of the Upsert semantics of the Doris Unique Key model.

![Demo 04 transformation flow: late events for orders 101 and 104 enter the order events table, order_version_history identifies order versions, incremental_daily_sales is updated by Incremental merge with unique_key = order_id and stays unchanged on re-run, and reconciliation models are checked by Data Tests; on the Doris side, window functions, Unique Key upsert, and Hash Bucket](/images/blogs/dbt-for-apache-doris-1.1.0-five-demos/demo04-late-arriving-orders-flow.jpg)

*Figure 2: After late events reach the source table, version identification and Incremental `merge` update the current orders; a re-run with no new data leaves the result unchanged. The top row shows the dbt capabilities, and the bottom row shows the Doris capabilities.*

Running again with no new data leaves the result unchanged. The current orders table `incremental_daily_sales` contains 4 orders (order 101 now carries `125.00`), and revenue for August 1 in the downstream `daily_sales_summary` is updated to `245.00`. The same project also produces data quality, arrival latency, and revenue reconciliation models. In this chain, dbt is responsible for defining the incremental model, the `is_incremental()` filter, and the uniqueness test on `order_id`; "no duplicates, safe to re-run" comes from the following Doris capabilities:

| Doris capability | Value in this scenario |
|-|-|
| Unique Key model | `incremental_daily_sales` is created with `order_id` as its Unique Key. A new version of an order overwrites the old one on write, so the table always holds exactly one row per order, and a passing `unique` test proves there are no duplicates. The adapter enables Merge-on-Write by default, so deduplication happens at write time and queries need no further merging |
| Upsert on write (Incremental `merge`) | The adapter performs a full-row Upsert with a plain `INSERT INTO`, without relying on `MERGE INTO` or delete-then-insert; the correction to order 101 and the new order 104 take the same write path. Re-running with no new data leaves the result unchanged (idempotent), so backfills and retries are safe |
| HASH bucketing (by `order_id`) | The bucket key matches the primary key, so every version of an order lands in the same tablet. Primary key deduplication and updates complete locally, without cross-node comparison |
| Window functions | `order_version_history` uses `row_number()` and `lead()` inside Doris to identify the current version of each order and compute `valid_from` / `valid_to`, forming an auditable version history without any external program |
| Online schema change | The model is configured with `on_schema_change='append_new_columns'`. When upstream adds a column, the adapter syncs the table structure with `ALTER TABLE ... ADD COLUMN` and waits for the change to complete, so the incremental table does not need to be rebuilt |

All five demos run interactively in JupyterLab notebooks, so users can get familiar with each step.

The demos live in the repository's `examples/` directory. The unified entry point is [`examples/doris-demos`](https://github.com/velodb/dbt-for-apache-doris/tree/main/examples/doris-demos), whose README gives the complete steps to run them.

## Links

- GitHub repository: [https://github.com/velodb/dbt-for-apache-doris](https://github.com/velodb/dbt-for-apache-doris)
- 1.1.0 release: [https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0)
- PyPI: [https://pypi.org/project/dbt-for-apache-doris/1.1.0/](https://pypi.org/project/dbt-for-apache-doris/1.1.0/)
- Demo entry point: [https://github.com/velodb/dbt-for-apache-doris/tree/main/examples/doris-demos](https://github.com/velodb/dbt-for-apache-doris/tree/main/examples/doris-demos)
- Apache Doris all-in-one image: [https://doris.apache.org/community/developer-guide/all-in-one-image](https://doris.apache.org/community/developer-guide/all-in-one-image)
