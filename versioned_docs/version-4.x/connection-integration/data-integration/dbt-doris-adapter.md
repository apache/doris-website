---
{
    "title": "Apache Doris dbt Adapter",
    "language": "en",
    "description": "Install and configure dbt-for-apache-doris for Apache Doris models, source freshness, and asynchronous materialized views.",
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

[dbt](https://docs.getdbt.com/docs/introduction) manages the transformation step in an ELT (Extract, Load, Transform) workflow. The `dbt-for-apache-doris` adapter compiles dbt models into Doris SQL and executes table creation, transformation, testing, and documentation operations through the Doris Frontend (FE) MySQL query port.

Source data must already be loaded into Doris. The adapter performs transformations; it does not ingest or synchronize source data.

:::caution

`dbt-for-apache-doris` is provided and maintained by VeloDB. It is not part of the Apache Doris project and is not released or endorsed by the Apache Doris community. Evaluate the adapter before using it in production, verify the integrity of the package and its release information, and follow the license of the third-party project. Report adapter issues to the [`dbt-for-apache-doris` project](https://github.com/velodb/dbt-for-apache-doris/issues).

:::

<!-- Knowledge Type: Version Requirements / Environment Requirements / Released Versions -->
<!-- Use Case: Pre-installation version check / Environment preparation / Release lookup -->

## Environment requirements

| Component | Requirement |
| --- | --- |
| Python | 3.10 or later |

## Released versions

| Version |
| --- |
| [1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) |

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Adapter installation / Installation verification -->

## Installation

The following commands use the published [`v1.1.0` release](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) as an installation example. To install another release, replace the version in the `pip` requirement.

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

For this example, the `Plugins` section of `dbt --version` should contain `doris: 1.1.0`. dbt Core and MySQL Connector/Python are installed as dependencies.

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Connect dbt to Doris / Validate an end-to-end model build -->

## Configure the connection

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

| Setting | Recommended value | Behavior |
| --- | --- | --- |
| `type` | Must be `doris` | Selects the Doris adapter |
| `host` | Set the Doris FE address explicitly | The underlying credentials fall back to `127.0.0.1` when omitted; `dbt init` has no default input |
| `port` | Usually `9030` | Defaults to `9030` when omitted; this is the FE query port, not the HTTP port |
| `username` | Set a dedicated Doris user explicitly | The underlying credentials fall back to `root` when omitted; `dbt init` has no default input |
| `password` | Read from an environment variable | Defaults to an empty string |
| `schema` | Set the target Doris database | The `dbt init` prompt defaults to `dbt`; the underlying credentials default to `None` |
| `threads` | Set according to FE and workload capacity | The `dbt init` prompt defaults to `1` |
| `database` | Omit it | If set, it must exactly equal `schema` |

The adapter maps a dbt schema to a Doris database. If the target database does not exist, the adapter attempts to create it. The Doris account used by dbt therefore needs permission to read source tables and to create, alter, drop, and write objects in the target database.

Here, `database` is not a Doris catalog. It is a field inherited from dbt's generic `database.schema.identifier` naming model. Doris Internal Catalog uses only `database.table`, so set the Doris database in profile `schema` and omit profile `database`. Source `database` has a different compatibility behavior: it can override `schema` as the Doris database for cross-database reads. Profiles and standard `source()` cannot represent both a Doris catalog and database level.

:::caution

The adapter currently does not support External Catalog three-part namespaces using Catalog, Database, and Table.

:::

Ensure that `dbt_project.yml` references the same profile:

```yaml
name: doris_demo
version: "1.0.0"
config-version: 2
profile: doris_demo

model-paths: ["models"]

models:
  doris_demo:
    +materialized: view
```

On macOS or Linux, validate the connection with:

```shell
export DORIS_PASSWORD='your_password'
dbt debug
```

On Windows PowerShell:

```powershell
$env:DORIS_PASSWORD = 'your_password'
dbt debug
```

<!-- Knowledge Type: Operational Steps / Minimal Example -->
<!-- Use Case: Validate an end-to-end model build -->

## Build the first model

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
    description: Daily sales summary
    columns:
      - name: order_date
        description: Order date
        data_tests:
          - not_null
          - unique
      - name: sales_amount
        description: Daily sales amount
        data_tests:
          - not_null
```

Run the model and tests:

```shell
dbt build --select fct_daily_sales
```

A successful build creates `analytics.fct_daily_sales`. Set the production replication and bucket counts according to your cluster deployment.

When a source is in another Doris database, prefer setting `schema` directly:

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

For compatibility with existing dbt projects, a source may instead set only `database: finance_raw`, or set `database` and `schema` to the same value. If source `database` and `schema` differ, the adapter uses `database` as the Doris database. This differs from profile validation, which requires both values to match. New projects should consistently use source `schema` to avoid ambiguity.

<!-- Knowledge Type: Capability Reference / Configuration Parameters / Architecture Decision -->
<!-- Use Case: Materialization selection / Incremental processing / Materialized views -->

## Materializations

`dbt-for-apache-doris` supports these main materializations:

| Materialization | Doris object or behavior | Use case |
| --- | --- | --- |
| `view` | Doris view | Lightweight transformations that should always read current source data |
| `table` | A fully rebuilt Doris Duplicate Key table | Bounded results that need stable query performance |
| `incremental` | Appends, upserts, or overwrites data according to a strategy | Incremental processing for large tables |
| `materialized_view` | Doris asynchronous materialized view | Doris-managed refresh and transparent query rewrite |
| `ephemeral` | Compiles into a CTE in downstream models | Reuse SQL without creating a Doris object |

Seeds and snapshots can also create Doris tables. The adapter currently does not include a custom `partition` materialization; use incremental `insert_overwrite` for partition replacement. The examples below keep `replication_num=1` so they also run on a single-BE development cluster; use a production-appropriate replica count in real deployments.

### View

```sql
{{ config(materialized='view') }}

select order_id, customer_id, amount
from {{ source('raw', 'orders') }}
where status = 'PAID'
```

Each run updates the view definition. A view stores no data; its query cost depends on the view SQL and downstream query.

### Table

```sql
{{
  config(
    materialized='table',
    duplicate_key=['event_date', 'event_id'],
    partition_by=['event_date'],
    partition_type='RANGE',
    partition_by_init=[
      "PARTITION p_before_202608 VALUES LESS THAN ('2026-08-01')",
      "PARTITION p202608 VALUES LESS THAN ('2026-09-01')",
      "PARTITION pmax VALUES LESS THAN (MAXVALUE)"
    ],
    distributed_by=['event_id'],
    buckets=16,
    properties={'replication_num': '1'}
  )
}}

select
    cast(order_time as date) as event_date,
    order_id as event_id,
    status as event_type
from {{ source('raw', 'orders') }}
```

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

Duplicate Key, partition, and distribution columns must be present in the model output and comply with Doris table-creation rules. The adapter renders `partition_by_init` and `properties` into the `CREATE TABLE` statement; Doris validates the partition definitions, property names, and values. An ordinary `table` model currently does not expose Aggregate Key or standalone Unique Key configuration. Use incremental `merge` for Unique Key upserts.

### Incremental

For `append`, `merge`, and `insert_overwrite`, an incremental model has two parts:

- Model SQL, usually with `is_incremental()`, determines which source rows the current run returns.
- `incremental_strategy` determines how the adapter writes that batch to the target.

Microbatch does not use this filtering pattern. dbt Core injects time filters from the batch context and the `event_time` configured on upstream resources.

| Strategy | Doris target and behavior | Main requirements |
| --- | --- | --- |
| `append` | Executes `INSERT INTO` against a Duplicate Key table | Do not set `unique_key` |
| `merge` | Performs full-row `INSERT INTO` upserts against a MOW or MOR Unique Key table | `unique_key` is required |
| `insert_overwrite` | Overwrites the whole table, named partitions, or partitions touched by the batch | `unique_key` is rejected |
| `microbatch` | Overwrites one exact RANGE partition for each dbt Core UTC window | Configure `event_time`, `batch_size`, and `begin` |

When no strategy is set, `unique_key` selects `merge`; otherwise the adapter uses `append`. The adapter supports all four `on_schema_change` modes: `ignore`, `fail`, `append_new_columns`, and `sync_all_columns`.

`delete+insert` and `delete_insert` are rejected. Use `merge` for Doris Unique Key upserts. `merge` does not generate SQL `MERGE INTO`; it uses full-row `INSERT INTO` with Doris Unique Key semantics. Each batch must contain at most one row for each `unique_key`. To use a Sequence Column, set the visible column through `function_column.sequence_col` in `properties` and continue using `merge`. The bare `sequence_col` setting and `function_column.sequence_type` with the hidden `__DORIS_SEQUENCE_COL__` are currently not supported.

The following example performs a full-row upsert by `order_id`:

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

select
    order_id,
    customer_id,
    amount,
    updated_at
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

### Microbatch

`microbatch` uses the dbt Core batch context. Configure an `event_time` field on each direct upstream resource and on the target model. For the `raw.orders` source created in the first-model example above, add this configuration to its existing table declaration:

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

`event_time` must be an unquoted column name and must refer to the same single column as `partition_by`. `batch_size` supports `hour`, `day`, `month`, and `year`. The target is a Duplicate Key table: `duplicate_key` configures the Doris table key and is not dbt `unique_key`. Do not set `unique_key`, `overwrite_partitions`, or `partition_by_init`; the adapter derives the partition boundary and overwrite target from the current batch. If an upstream `ref()` or `source()` also configures `event_time`, dbt Core filters that input to the current window. Microbatch batches execute serially and overwrite the exact partition even when a batch is empty, so rows removed from that window are cleared.

Microbatch can also use Doris Dynamic Partition when the following properties are configured and pass adapter validation:

- `dynamic_partition.enable='true'`.
- `dynamic_partition.time_unit` matches `batch_size`, and `dynamic_partition.time_zone` is `UTC`, `Etc/UTC`, or `+00:00`.
- `dynamic_partition.create_history_partition='true'`, with either `dynamic_partition.start` or `dynamic_partition.history_partition_num`.
- `dynamic_partition.prefix` is a valid identifier, and `dynamic_partition.end` is a positive integer.
- For monthly batches, `dynamic_partition.start_day_of_month`, when set, is `1`.

Doris also requires a positive `dynamic_partition.buckets` value when creating a Dynamic Partition table; Doris validates this property rather than the adapter. The retention window must cover `begin`, `lookback`, and any manual backfill range. For an existing target, the physical properties validated by the adapter must match the model configuration; otherwise align the configuration or run `--full-refresh`.

:::caution

For `append`, `merge`, and partition-scoped `insert_overwrite`, the adapter does not discover new or changed source rows automatically. The model SQL must return the intended batch. Whole-table `insert_overwrite` must return the complete target data. Each `merge` batch must contain unique `unique_key` values. dbt Core supplies Microbatch filtering from upstream resources configured with `event_time`, so Microbatch models do not need `is_incremental()`. Run `dbt run --full-refresh` after incompatible key, partition, or physical-layout changes.

:::

### Asynchronous materialized views

dbt users configure the standard `materialized='materialized_view'`. The adapter implements it with a Doris [asynchronous materialized view](../../query-acceleration/materialized-view/async-materialized-view/overview).

:::note

The FE version gate for this materialization accepts Doris 2.x at 2.1.5 or later, Doris 3.x except 3.0.0, Doris 4.x and later, and identifiable source builds reported as `doris-0.0.0-<git-sha>`. Source builds are for development testing only. These gates are code admission conditions, not evidence that every accepted version has passed compatibility testing.

:::

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

| Setting | Default | Supported values or format |
| --- | --- | --- |
| `build_mode` | `immediate` | `immediate`, `deferred` |
| `refresh_method` | `auto` | `auto` lets Doris determine the refresh scope; `complete` refreshes all partitions |
| `refresh_trigger` | `manual` | `manual`, `schedule`, `commit` |
| `refresh_schedule` | - | Required for `schedule`; contains a positive `interval`, a `minute/hour/day/week` unit, and optional `start_time` |
| `wait_for_refresh` | `true` | Whether to wait for the `BUILD IMMEDIATE` initial build or an adapter-submitted manual refresh |
| `refresh_wait_timeout` | `300` | Refresh task timeout in seconds; positive integer |
| `refresh_poll_interval` | `1` | Refresh task polling interval in seconds; positive integer no greater than the timeout |
| `duplicate_key` | - | Duplicate Key columns for the asynchronous materialized view; string or list |
| `partition_by` | - | One Doris partition column or partition-function expression; string or one-element list |
| `distribution_type` | Selected automatically | `hash` when `distributed_by` is set; otherwise `random` |
| `distributed_by` | - | Hash Distribution columns |
| `buckets` | `auto` | Positive integer or `auto` |
| `replication_num` | - | Replica-count convenience setting; overrides the same key in `properties` |
| `properties` | `{}` | Doris asynchronous materialized-view properties |
| `on_configuration_change` | `apply` | `apply`, `continue`, `fail` |

`BUILD IMMEDIATE` starts the initial build when a definition is created or replaced. The adapter creates the new definition under a temporary name, waits for the initial build by default, and then publishes it at the target name; it does not submit an extra `REFRESH MATERIALIZED VIEW`. `BUILD DEFERRED` creates the definition without an initial build.

When the definition has not changed, refresh behavior is controlled entirely by `refresh_trigger`; there is currently no `refresh_on_run` configuration:

- `manual` submits `REFRESH MATERIALIZED VIEW ... AUTO|COMPLETE` when a later `dbt run` selects the model and waits for success by default.
- `schedule` and `commit` do not submit a refresh from a later dbt run; Doris triggers it from the schedule or base-table commit.

For example, configure a daily schedule with:

```sql
{{
  config(
    materialized='materialized_view',
    build_mode='deferred',
    refresh_method='auto',
    refresh_trigger='schedule',
    refresh_schedule={
      'interval': 1,
      'unit': 'day'
    },
    properties={'replication_num': '1'}
  )
}}

select order_date, sales_amount
from {{ ref('fct_daily_sales') }}
```

`wait_for_refresh=false` disables task polling; it does not suppress the refresh request. A dbt wait timeout does not cancel an already submitted Doris task. The adapter identifies a newly submitted task by comparing Doris MV task IDs before and after submission, so avoid concurrent manual refreshes of the same target.

When model SQL or DDL configuration changes, the default `on_configuration_change=apply` builds a temporary asynchronous materialized view and atomically replaces the existing definition. `continue` retains the existing definition without submitting a manual refresh, while `fail` stops the run. `--full-refresh` forces the definition to be redeployed.

<!-- Knowledge Type: Capability Reference / Configuration Parameters -->
<!-- Use Case: Seeds / Snapshots / Source freshness / Grants -->

## Other dbt capabilities

| Capability | Support |
| --- | --- |
| Seed | Put small, version-controlled CSV files in `seeds/`, then run `dbt seed`; supports type inference, `column_types`, and `ref` |
| Snapshot | Define `check` or `timestamp` strategies in `snapshots/`, then run `dbt snapshot`; supports hard deletes, schema evolution, and atomic replacement |
| Data tests | Configure Generic Tests in YAML or write Singular Tests in `tests/`; supports ephemeral and `store_failures` paths |
| Unit tests | Provide inline-row or CSV fixtures in model YAML, then run `dbt test --select test_type:unit` |
| Model contracts | Set `contract.enforced: true` and declare column names and types for Table, View, or Incremental models; does not create database PK or NOT NULL constraints |
| Persisted docs | Enable `persist_docs` for relation and column comments on primary relation types |
| Source freshness | Configure `loaded_at_field` or `loaded_at_query` with `freshness`, then run `dbt source freshness` |
| Grants | Use standard `grants` configuration for Doris `user` and `user@host` table privileges; role principals are currently not supported |
| Hooks | Use `pre_hook` and `post_hook` to execute Doris SQL around materializations; hook side effects have no transactional rollback |
| Documentation and lineage | Write descriptions and run `dbt docs generate` for metadata about Doris databases, tables, views, columns, comments, and asynchronous materialized views |

Seeds are suitable for small, version-controlled data such as country codes or status mappings, not bulk business-data ingestion. Use Doris Stream Load, Broker Load, or a Doris Connector for large files.

Snapshot source `unique_key` values must be non-`NULL` and unique within each batch. With the `timestamp` strategy, `updated_at` must be non-`NULL` and cannot precede the current historical version for that key.

To persist table and column descriptions:

```yaml
models:
  - name: fct_daily_sales
    description: Daily sales summary
    config:
      persist_docs:
        relation: true
        columns: true
    columns:
      - name: order_date
        description: Order date
      - name: sales_amount
        description: Daily sales amount
```

### Source freshness

Source Freshness supports two explicit timestamp paths. Use `loaded_at_field` for the common timestamp-column case:

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

When using `loaded_at_field`, set `filter` under `freshness`, such as `filter: is_valid = 1`, to limit which rows participate in freshness evaluation. Do not configure `loaded_at_field` and `loaded_at_query` together. The adapter currently does not infer load time from Doris table metadata; provide a field or query explicitly.

The adapter uses `utc_timestamp()` as the current time, matching dbt Core's convention of evaluating timezone-naive freshness timestamps as UTC.

### Grants

Declarative grants use Doris users as principals:

```yaml
models:
  doris_demo:
    +grants:
      select:
        - analyst
        - reporter@10.0.0.%
```

A name without `@host` is treated as `username@%`. Privileges map as follows: `select` to `SELECT_PRIV`, `insert` to `LOAD_PRIV`, `alter` to `ALTER_PRIV`, `create` to `CREATE_PRIV`, `drop` to `DROP_PRIV`, and `show_view` to `SHOW_VIEW_PRIV`. Doris roles are currently not supported in `grants`; configure concrete users. The account running dbt must be able to inspect principals and adjust privileges on target objects.

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

Common selectors:

```shell
# Run one model
dbt run --select fct_daily_sales

# Run the model and all upstream dependencies
dbt build --select +fct_daily_sales

# Run the model and all downstream dependencies
dbt build --select fct_daily_sales+

# Fully rebuild an incremental model
dbt run --select fct_orders --full-refresh
```

<!-- Knowledge Type: Limitations / Architecture Decision -->
<!-- Use Case: Version evaluation / Production readiness review -->

## Current limitations

- The adapter currently does not support Aggregate Key table modeling or secondary-index configuration.
- The adapter currently does not support a complete External Catalog namespace.
- The adapter currently does not implement SSL configuration, timeout/retry, multi-FE failover, server-side cancellation, or complete query telemetry.
- Some Table/View/MV type changes have a short canonical-name availability window rather than a zero-downtime switch.

<!-- Knowledge Type: Troubleshooting -->
<!-- Use Case: Connection errors / Profile database and schema mismatch -->

## Troubleshooting

### `dbt debug` cannot connect

Verify that `host` and `port` point to a reachable FE MySQL query port, and check the username, password, and network policy. The default query port is `9030`; `8030` is normally the FE HTTP port.

### `database` and `schema` differ

Profile `schema` is the target Doris database. Remove `database`; it is not a Doris catalog and does not add another namespace level. If you retain this compatibility field, set it to exactly the same value as `schema`.
