---
{
    "title": "Apache Doris dbt Adapter",
    "language": "en",
    "description": "Install and configure dbt-for-apache-doris 1.1.0 for Apache Doris models, source freshness, async materialized views.",
    "keywords": [
        "Apache Doris dbt",
        "dbt Doris Adapter",
        "dbt-for-apache-doris",
        "dbt Doris profile",
        "Doris data transformation",
        "Doris incremental model",
        "Doris insert_overwrite",
        "Doris microbatch",
        "Doris source freshness",
        "Doris asynchronous materialized view",
        "dbt External Catalog",
        "dbt debug connection error"
    ]
}
---

<!-- Knowledge Type: Integration Guide / Capability Definition -->
<!-- Use Case: Apache Doris data transformation with dbt / ELT modeling -->

[dbt](https://docs.getdbt.com/docs/introduction) manages the transformation step in an ELT (Extract, Load, Transform) workflow. The `dbt-for-apache-doris` adapter, maintained by the VeloDB community, compiles dbt models into Doris SQL and executes table creation, transformation, testing, and documentation operations through the Doris Frontend (FE) MySQL query port.

Source data must already be loaded into Doris. The adapter performs transformations; it does not ingest or synchronize source data.

<!-- Knowledge Type: Version Requirements / Environment Requirements -->
<!-- Use Case: Pre-installation version check / Environment preparation -->

## Supported versions and environment

This document applies to the published [`v1.1.0` release](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0).

| Component | Requirement |
| --- | --- |
| dbt-for-apache-doris | 1.1.0 |
| Python | 3.10 or later |

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Adapter installation / Installation verification -->

## Installation

Install the adapter from PyPI in an isolated Python environment:

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.0"
dbt --version
```

On Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.0"
dbt --version
```

The `Plugins` section of `dbt --version` should contain `doris: 1.1.0`, and dbt Core should be 1.12.x. dbt Core and MySQL Connector/Python are installed as dependencies.

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Connect dbt to Doris / Validate an end-to-end model build -->

## Quick start

### Prepare Doris

The Doris account used by dbt must be able to:

- Read source tables.
- Create the target database.
- Create, alter, drop, and write objects in the target database.

The following SQL creates a source table for this example. A replication number of `1` is appropriate only for a single-BE development cluster:

```sql
CREATE DATABASE IF NOT EXISTS raw;

CREATE TABLE IF NOT EXISTS raw.orders (
    order_id BIGINT,
    customer_id BIGINT,
    order_time DATETIME,
    amount DECIMAL(18, 2),
    status VARCHAR(20),
    updated_at DATETIME,
    is_valid BOOLEAN
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO raw.orders VALUES
    (1, 101, '2026-08-01 10:00:00', 20.00, 'PAID', '2026-08-01 10:05:00', true),
    (2, 102, '2026-08-01 11:00:00', 35.00, 'PAID', '2026-08-01 11:05:00', true);
```

### Configure the project and connection

Create a dbt project:

```shell
dbt init doris_demo
cd doris_demo
```

Add a Doris output to `~/.dbt/profiles.yml`. Keep credentials outside version control; this example reads the password from an environment variable:

```yaml
doris_demo:
  target: dev
  outputs:
    dev:
      type: doris
      host: 127.0.0.1
      port: 9030
      username: dbt_user
      password: "{{ env_var('DORIS_PASSWORD') }}"
      schema: analytics
      threads: 4
```

| Setting | Recommended value | Behavior in 1.1.0 |
| --- | --- | --- |
| `type` | Must be `doris` | Selects the Doris adapter |
| `host` | Doris FE address | Falls back to `127.0.0.1` when omitted |
| `port` | Usually `9030` | FE MySQL query port, not the HTTP port |
| `username` | A dedicated Doris user | Falls back to `root` when omitted |
| `password` | Read from an environment variable | Defaults to an empty string |
| `schema` | Target Doris database | The `dbt init` prompt defaults to `dbt` |
| `threads` | Set according to FE and workload capacity | The `dbt init` prompt defaults to `1` |
| `database` | Omit it | If set, it must exactly equal `schema` |

For Doris profiles, dbt `schema` maps to a Doris database. The profile `database` field is a generic dbt credential field, not a Doris catalog, and does not add another namespace level.

Ensure that `dbt_project.yml` references the same profile:

```yaml
name: doris_demo
version: "1.0.0"
config-version: 2
profile: doris_demo
model-paths: ["models"]
```

Declare the source in `models/sources.yml`:

```yaml
version: 2

sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
```

Create `models/fct_daily_sales.sql`:

```sql
{{
  config(
    materialized='table',
    duplicate_key=['order_date'],
    distributed_by=['order_date'],
    buckets=1,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as order_date,
    sum(amount) as sales_amount
from {{ source('raw', 'orders') }}
group by cast(order_time as date)
```

Add data tests in `models/schema.yml`:

```yaml
version: 2

models:
  - name: fct_daily_sales
    columns:
      - name: order_date
        data_tests: [not_null, unique]
      - name: sales_amount
        data_tests: [not_null]
```

Run the model and tests:

```shell
export DORIS_PASSWORD='<your-password>'
dbt debug
dbt build --select fct_daily_sales
```

On Windows PowerShell, set the password with `$env:DORIS_PASSWORD = '<your-password>'` and run the same dbt commands.

A successful build creates `analytics.fct_daily_sales`. Set the production replication and bucket counts according to your cluster deployment.

<!-- Knowledge Type: Capability Reference / Configuration Parameters / Architecture Decision -->
<!-- Use Case: Materialization selection / Incremental processing / Materialized views -->

## Materializations

`dbt-for-apache-doris 1.1.0` supports these main materializations:

| Materialization | Doris object or behavior | Use case |
| --- | --- | --- |
| `view` | Doris view | Lightweight transformations that should always read current source data |
| `table` | A fully rebuilt Doris Duplicate Key table | Bounded results that need stable query performance |
| `incremental` | Appends, upserts, or overwrites data according to a strategy | Incremental processing for large tables |
| `materialized_view` | Doris asynchronous materialized view | Doris-managed refresh and transparent query rewrite |
| `ephemeral` | Compiles into a CTE in downstream models | Reuse SQL without creating a Doris object |

Seeds and snapshots can also create Doris tables. Version 1.1.0 does not include the old custom `partition` materialization; use incremental `insert_overwrite` for partition replacement. The examples below keep `replication_num=1` so they also run on the single-BE quick-start cluster; use a production-appropriate replica count in real deployments.

### View

```sql
{{ config(materialized='view') }}

select order_id, order_time, amount
from {{ source('raw', 'orders') }}
```

A view stores no data. Its query cost depends on the view SQL and downstream query.

### Table

The `table` materialization creates a Duplicate Key table and fully replaces the target on subsequent runs. Table models accept the following table-creation settings:

| Setting | Type and default | Description |
| --- | --- | --- |
| `duplicate_key` | String or list; optional | Duplicate Key columns |
| `partition_by` | String or list; optional | Partition columns |
| `partition_type` | `RANGE` or `LIST`; default `RANGE` | Partition type used with `partition_by` |
| `partition_by_init` | List of strings; optional | Doris partition definitions used with `partition_by` at table creation |
| `distributed_by` | String or list; optional | Hash distribution columns |
| `buckets` | Positive integer; defaults to `10` when Hash Distribution is emitted | Hash bucket count; used only with `distributed_by` |
| `replication_num` | Positive integer or numeric string; optional | Replica count; the top-level setting overrides the same key in `properties` |
| `properties` | Dictionary; optional | Key-value pairs rendered into Doris `PROPERTIES` |

Duplicate Key, partition, and distribution columns must be present in the model output. The adapter renders `partition_by_init` and `properties` into the `CREATE TABLE` statement; Doris validates the partition definitions, property names, and values. An ordinary `table` model does not expose Aggregate Key or standalone Unique Key configuration. Use incremental `merge` for Unique Key upserts.

### Incremental

The model SQL determines which source rows are returned for a run, while `incremental_strategy` determines how the batch is written.

| Strategy | Doris target and behavior | Main requirements |
| --- | --- | --- |
| `append` | Executes `INSERT INTO` against a Duplicate Key table | Do not set `unique_key` |
| `merge` | Performs full-row `INSERT INTO` upserts against a MOW or MOR Unique Key table | `unique_key` is required |
| `insert_overwrite` | Overwrites the whole table, named partitions, or partitions touched by the batch | `unique_key` is rejected |
| `microbatch` | Overwrites one exact RANGE partition for each dbt Core UTC window | Configure `event_time`, `batch_size`, and `begin` |

When no strategy is set, `unique_key` selects `merge`; otherwise the adapter uses `append`. The adapter supports all four `on_schema_change` modes: `ignore`, `fail`, `append_new_columns`, and `sync_all_columns`.

`merge` does not generate SQL `MERGE INTO`. It uses full-row `INSERT INTO` with Doris Unique Key semantics. Each batch must contain at most one row for each `unique_key`:

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key=['order_id'],
    distributed_by=['order_id'],
    buckets=16,
    properties={'replication_num': '1'},
    on_schema_change='append_new_columns'
  )
}}

select order_id, customer_id, amount, updated_at
from {{ source('raw', 'orders') }}

{% if is_incremental() %}
where updated_at >= (
    select coalesce(max(updated_at), '1970-01-01 00:00:00')
    from {{ this }}
)
{% endif %}
```

To overwrite named Doris partitions:

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202607 VALUES LESS THAN ('2026-07-01')",
      "PARTITION p202607 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    overwrite_partitions=['p202607', 'p202608'],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select event_date, event_id, event_type
from (
    select
        cast(order_time as date) as event_date,
        order_id as event_id,
        status as event_type,
        order_time
    from {{ source('raw', 'orders') }}
) events

{% if is_incremental() %}
where order_time >= '2026-07-01'
  and order_time < '2026-09-01'
{% endif %}
```

The first run creates the target through CTAS and does not execute `INSERT OVERWRITE`. The example therefore uses `partition_by_init` to create every required target partition. Once the target exists, `overwrite_partitions` controls the overwrite scope:

- Omitted: overwrite the whole table.
- List of partition names: overwrite only those partitions.
- `'*'`: let Doris dynamically overwrite partitions touched by the batch.

A dynamic overwrite cannot infer which partition to clear from an empty batch. Specify partition names when an empty source batch must clear target data.

`microbatch` uses the dbt Core 1.12 batch context. Configure an `event_time` field on each direct upstream resource and on the target model. For the `raw.orders` source created in the quick start, add this configuration to its existing table declaration:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          event_time: order_time
```

```sql
{{
  config(
    materialized='incremental',
    incremental_strategy='microbatch',
    event_time='event_time',
    batch_size='day',
    begin=modules.datetime.datetime(2026, 8, 1, 0, 0, 0),
    duplicate_key=['event_id', 'event_time'],
    partition_by=['event_time'],
    partition_type='RANGE',
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    order_id as event_id,
    order_time as event_time,
    status as event_type
from {{ source('raw', 'orders') }}
```

`batch_size` supports `hour`, `day`, `month`, and `year`. Microbatch batches execute serially. Do not set `unique_key`, `overwrite_partitions`, or `partition_by_init`.

:::caution

For `append`, `merge`, and partition-scoped `insert_overwrite`, the adapter does not discover new or changed source rows automatically. The model SQL must return the intended batch. Run `dbt run --full-refresh` after incompatible key, partition, or physical-layout changes.

:::

### Asynchronous materialized views

dbt users configure the standard `materialized='materialized_view'`. The adapter implements it with a Doris [asynchronous materialized view](../../query-acceleration/materialized-view/async-materialized-view/overview).

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='immediate',
    refresh_method='auto',
    refresh_trigger='manual',
    duplicate_key=['order_date'],
    distribution_type='hash',
    distributed_by=['order_date'],
    buckets=8,
    wait_for_refresh=true,
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

| Setting | Type, default, and supported values |
| --- | --- |
| `build_mode` | Default `immediate`; supports `immediate` and `deferred` |
| `refresh_method` | Default `auto`; supports `auto` and `complete` |
| `refresh_trigger` | Default `manual`; supports `manual`, `schedule`, and `commit` |
| `refresh_schedule` | Required for `schedule`; contains a positive `interval`, a `minute/hour/day/week` unit, and optional `start_time` |
| `wait_for_refresh` | Default `true`; wait for the initial build or an adapter-submitted manual refresh |
| `refresh_wait_timeout` | Default `300` seconds; positive integer |
| `refresh_poll_interval` | Default `1` second; positive integer no greater than the timeout |
| `duplicate_key` | String or list; optional | Duplicate Key columns for the asynchronous materialized view |
| `partition_by` | One partition column or partition-function expression; optional |
| `distribution_type` | Defaults to `hash` with `distributed_by`, otherwise `random` |
| `distributed_by` | Hash distribution columns; optional |
| `buckets` | Default `auto`; positive integer or `auto` |
| `replication_num` | Positive integer; optional | Convenience setting that overrides the same key in `properties` |
| `properties` | Doris asynchronous materialized-view properties; default `{}` |
| `on_configuration_change` | Default `apply`; supports `apply`, `continue`, and `fail` |

`BUILD IMMEDIATE` starts the initial build when a definition is created or replaced. `BUILD DEFERRED` creates the definition without an initial build. When the definition has not changed:

- `manual` submits a refresh when a later `dbt run` selects the model and waits for success by default.
- `schedule` and `commit` do not submit a refresh from a later dbt run; Doris triggers it from the schedule or base-table commit.

`wait_for_refresh=false` disables task polling; it does not suppress the refresh request. A dbt wait timeout does not cancel an already submitted Doris task. Serialize concurrent dbt runs against the same materialized-view target in your scheduler.

The FE version gate for this materialization accepts Doris 2.x at 2.1.5 or later, Doris 3.x except 3.0.0, Doris 4.x and later, and identifiable source builds reported as `doris-0.0.0-<git-sha>`. Source builds are for development testing only. These gates are not a live compatibility matrix.

<!-- Knowledge Type: Capability Reference / Configuration Parameters -->
<!-- Use Case: Seeds / Snapshots / Source freshness / Grants -->

## Other dbt capabilities

| Capability | Support in 1.1.0 |
| --- | --- |
| Seed | CSV loading, type inference, `column_types`, and `ref` |
| Snapshot | `check` and `timestamp` strategies, hard deletes, schema evolution, and atomic replacement |
| Data tests | Singular, generic, ephemeral, and `store_failures` paths |
| Unit tests | Inline-row and CSV fixtures with Doris type adaptation |
| Model contracts | Column names and types for Table, View, and Incremental; no database PK or NOT NULL constraints |
| Persisted docs | Relation and column comments for primary relation types |
| Grants | Doris `user` and `user@host` table privileges; role principals are not supported |
| Hooks | Doris SQL before and after materializations; hook side effects have no transactional rollback |
| Source freshness | `loaded_at_field`, `filter`, and `loaded_at_query` |
| dbt Docs | Catalog metadata for Doris databases, tables, views, columns, comments, and asynchronous materialized views |

### Source freshness

Use `loaded_at_field` for the common timestamp-column case:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_field: updated_at
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

Use `loaded_at_query` when the freshness timestamp requires custom SQL or aggregation:

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          loaded_at_query: |
            select max(updated_at)
            from {{ this }}
            where is_valid = 1
          freshness:
            warn_after: {count: 1, period: hour}
            error_after: {count: 2, period: hour}
```

Do not configure `loaded_at_field` and `loaded_at_query` together. The adapter does not infer load time from Doris table metadata.

### Cross-database sources

Set `schema` when a source is in another Doris database:

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

For compatibility with existing dbt projects, a source may instead set only `database: finance_raw`. If source `database` and `schema` differ, version 1.1.0 uses `database` as the Doris database. New projects should consistently use `schema` to avoid ambiguity.

:::caution

External Catalog three-part namespaces are not supported. Profiles and standard `source()` cannot represent Doris Catalog, Database, and Table at the same time.

:::

<!-- Knowledge Type: Command Reference -->
<!-- Use Case: dbt project development / Execution / Testing / Documentation generation -->

## Common commands

| Command | Purpose |
| --- | --- |
| `dbt debug` | Validate the project configuration and Doris connection |
| `dbt parse` | Parse the project without executing SQL |
| `dbt compile` | Compile models and inspect generated Doris SQL |
| `dbt run` | Build selected models |
| `dbt test` | Run data tests and unit tests |
| `dbt build` | Run seeds, models, snapshots, and tests in dependency order |
| `dbt seed` | Load seed CSV files |
| `dbt snapshot` | Update snapshots |
| `dbt source freshness` | Evaluate source freshness |
| `dbt docs generate` | Generate catalog, documentation, and lineage metadata |

<!-- Knowledge Type: Limitations / Architecture Decision -->
<!-- Use Case: Version evaluation / Production readiness review -->

## Current limitations

- Aggregate Key table modeling and secondary-index configuration are not supported.
- A complete External Catalog namespace is unsupported.
- SSL configuration, timeout/retry, multi-FE failover, server-side cancellation, and complete query telemetry are not implemented.
- Some Table/View/MV type changes have a short canonical-name availability window rather than a zero-downtime switch.

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Connection errors / Profile database and schema mismatch -->

## Troubleshooting

### `dbt debug` cannot connect

Verify that `host` and `port` point to a reachable FE MySQL query port. The default query port is `9030`; `8030` is normally the FE HTTP port.

### `database` and `schema` differ

Remove `database` from the profile or set it to exactly the same value as `schema`. Profile `database` is not a Doris catalog.
