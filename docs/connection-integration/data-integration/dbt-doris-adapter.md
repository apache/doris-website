---
{
    "title": "DBT Doris Adapter",
    "language": "en",
    "description": "Use the dbt-doris adapter to build ELT data transformation pipelines on Apache Doris, with support for view, table, and incremental materializations as well as advanced capabilities such as seed and catalog."
}
---

<!-- Knowledge type: Tool integration guide -->
<!-- Use case: Use dbt on Doris for data transformation (the T step in ELT) -->

[DBT (Data Build Tool)](https://docs.getdbt.com/docs/introduction) is the component that focuses on the T (Transform) step, the data transformation phase, in the ELT (Extract, Load, Transform) flow. The `dbt-doris` adapter is built on top of `dbt-core` and relies on the `mysql-connector-python` driver to perform data transformation on Doris.

Code repository: https://github.com/apache/doris/tree/master/extension/dbt-doris

## Version Compatibility

Before choosing a dbt-doris version, verify the version compatibility between Doris, Python, and dbt-core:

| Doris    | Python        | dbt-core | dbt-doris |
| -------- | ------------- | -------- | --------- |
| >= 1.2.5 | >= 3.8, <=3.10 | >= 1.5.0 | <= 0.3    |
| >= 1.2.5 | >= 3.9        | >= 1.8.0 | >= 0.4    |

## Quick Start

### Install the dbt-doris Adapter

Install the adapter with pip:

```shell
pip install dbt-doris
```

The install command automatically pulls in all dependencies required to run dbt. After installation, verify it with the following command:

```shell
dbt --version
```

If the system does not recognize the `dbt` command, create a symbolic link:

```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```

### Initialize a dbt Project

Run the following command to enter the interactive initialization flow:

```shell
dbt init

```

Enter the configuration items in the table below as prompted to complete project initialization:

| Item     | Default | Description                                                                |
| -------- | ---- | ----------------------------------------------------------------- |
| project  | -    | Project name                                                              |
| database | -    | Select the adapter (enter the corresponding number)                                                     |
| host     | -    | Doris host                                                       |
| port     | 9030 | Doris MySQL Protocol port                                          |
| schema   | -    | In dbt-doris this is equivalent to database, that is, the database name                                        |
| username | -    | Doris username                                                         |
| password | -    | Doris password                                                          |
| threads  | 1    | dbt-doris parallelism (setting it too high increases the risk of run failures; align it with your cluster capacity)                                |

### Run the dbt Project

Enter the newly created project directory and execute the default dbt models:

```shell
dbt run
```

After a successful run, two example models are executed:

- `my_first_dbt_model`: materialized as a table
- `my_second_dbt_model`: materialized as a view

You can log in to Doris to inspect the resulting data and the table creation statements. For more details on running dbt, see the [dbt official documentation](https://docs.getdbt.com/docs/get-started/run-your-dbt-projects).

## Materialization

<!-- Knowledge type: Architecture decision -->

dbt-doris supports the following three materialization types:

| Materialization | Use case                                                | Pros                       | Cons                              |
| ----------- | --------------------------------------------------- | ------------------------ | ------------------------------- |
| view        | Models that only perform lightweight transformations such as renaming or column changes                                 | No extra storage; always based on the latest source records              | Slow queries for large or nested scenarios                   |
| table       | Models frequently queried by BI tools or downstream systems                                   | Fast queries                    | Long build time, extra storage, and no incremental support             |
| incremental | Event-based scenarios, or models where dbt runs are too slow and need incremental syncing                          | Only new data is transformed, significantly reducing build time                 | More complex configuration; an advanced dbt usage that requires the scenario and components to be aligned         |

> The default materialization is `view`. Start with view, and switch to another type only when performance issues arise.

### View Materialization

Each model run rebuilds the view through a `CREATE VIEW AS` statement.

Configure it in `dbt_project.yml`:

```yaml
models:
    <resource-path>:
        +materialized: view
```

Or configure it in the model file:

```jinja
{{ config(materialized = "view") }}
```

### Table Materialization

Each model run rebuilds the table through a `CREATE TABLE AS SELECT` statement.

dbt-doris guarantees the atomicity of table materialization during data updates with the following steps:

1. Execute `CREATE TABLE this_table_temp AS {{ model sql }}` to create a temporary table first.
2. If `this_table` does not exist (first-time creation), execute `RENAME` to rename the temporary table to the final table.
3. If `this_table` already exists, execute `ALTER TABLE this_table REPLACE WITH TABLE this_table_temp PROPERTIES('swap' = 'False')`. This operation swaps the table names and drops `this_table_temp`. Atomicity is guaranteed by the [Doris kernel transaction mechanism](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE).

Configure it in `dbt_project.yml`:

```yaml
models:
    <resource-path>:
        +materialized: table
        +duplicate_key: [ <column-name>, ... ],
        +replication_num: int,
        +partition_by: [ <column-name>, ... ],
        +partition_type: <engine-type>,
        +partition_by_init: [<pertition-init>, ... ]
        +distributed_by: [ <column-name>, ... ],
        +buckets: int | 'auto',
        +properties: {<key>:<value>,...}
```

Or configure it in the model file:

```jinja
{{ config(
    materialized = "table",
    duplicate_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    ]
) }}
```

Configuration item descriptions:

| Item               | Description                                | Required    |
| ----------------- | --------------------------------- | ------- |
| `materialized`    | Materialization type (corresponds to the Doris Duplicate detail model)       | Required |
| `duplicate_key`   | Sort columns of the Duplicate model                          | Optional |
| `replication_num` | Number of table replicas                              | Optional |
| `partition_by`    | Table partition columns                              | Optional |
| `partition_type`  | Partition type, `range` or `list`, default `RANGE`     | Optional |
| `partition_by_init` | Initial table partitions                          | Optional |
| `distributed_by`  | Bucket columns                               | Optional |
| `buckets`         | Number of buckets                              | Optional |
| `properties`      | Other configurations for table creation                           | Optional |

### Incremental Materialization

Incremental materialization takes the result of the previous dbt run as the baseline and incrementally inserts or updates new records into the table. dbt-doris provides two incremental strategies (set via `incremental_strategy`):

- `insert_overwrite`: depends on the unique model. The model must be specified as incremental at initialization, and incremental data is overwritten through aggregation columns.
- `append`: depends on the duplicate model. Only appends incremental data without modifying historical data, and does not require a `unique_key`.

Configure it in `dbt_project.yml`:

```yaml
models:
    <resource-path>:
        +materialized: incremental
        +incremental_strategy: <strategy>
        +unique_key: [ <column-name>, ... ],
        +replication_num: int,
        +partition_by: [ <column-name>, ... ],
        +partition_type: <engine-type>,
        +partition_by_init: [<pertition-init>, ... ]
        +distributed_by: [ <column-name>, ... ],
        +buckets: int | 'auto',
        +properties: {<key>:<value>,...}
```

Or configure it in the model file:

```jinja
{{ config(
    materialized = "incremental",
    incremental_strategy = "<strategy>"
    unique_key = [ "<column-name>", ... ],
    replication_num = "<int>"
    partition_by = [ "<column-name>", ... ],
    partition_type = "<engine-type>",
    partition_by_init = ["<pertition-init>", ... ]
    distributed_by = [ "<column-name>", ... ],
    buckets = "<int>" | "auto",
    properties = {"<key>":"<value>",...}
      ...
    )
}}
```

Configuration item descriptions:

| Item                    | Description                            | Required    |
| ---------------------- | ----------------------------- | ------- |
| `materialized`         | Materialization type                          | Required |
| `incremental_strategy` | Incremental strategy                          | Optional |
| `unique_key`           | Key columns of the unique table                  | Optional |
| `replication_num`      | Number of table replicas                          | Optional |
| `partition_by`         | Table partition columns                          | Optional |
| `partition_type`       | Partition type, `range` or `list`, default `RANGE` | Optional |
| `partition_by_init`    | Initial table partitions                       | Optional |
| `distributed_by`       | Bucket columns                           | Optional |
| `buckets`              | Number of buckets                          | Optional |
| `properties`           | Other configurations for table creation                       | Optional |

## Seed: Loading CSV Data

[Seed](https://docs.getdbt.com/docs/build/seeds) is used to load data files such as CSV into the database to participate in model building. Note the following when using it:

1. Seed should not be used to load raw data (for example, large CSV files exported from a production database).
2. Seeds are version-controlled and are best suited for small files that contain business logic, such as country/region code lists or employee IDs.
3. For large files, dbt seed has poor performance, so use methods such as Stream Load to load CSV into Doris instead.

After placing the CSV files and the seed configuration files in the `seeds` directory of the dbt project, run:

```shell
dbt seed --select seed_name
```

A common seed configuration file example (which supports custom column types):

```yaml
seeds:
    seed_name: # Seed name; used as the table name after build
        config:
            schema: demo_seed # Used as part of the database after build
            full_refresh: true
            replication_num: 1
            column_types:
                id: bigint
                phone: varchar(32)
                ip: varchar(15)
                name: varchar(20)
                cost: DecimalV3(19,10)
```

## Usage Examples

<!-- Knowledge type: Operation steps -->

### View Model Example

```sql
{{ config(materialized='view') }}

select
    u.user_id,
    max(o.create_time) as create_time,
    sum (o.cost) as balance
from {{ ref('sell_order') }} as o
left join {{ ref('sell_user') }} as u
on u.account_id=o.account_id
group by u.user_id
order by u.user_id
```

### Table Model Example

```sql
{{ config(materialized='table') }}

select
    u.user_id,
    max(o.create_time) as create_time,
    sum (o.cost) as balance
from {{ ref('sell_order') }} as o
left join {{ ref('sell_user') }} as u
on u.account_id=o.account_id
group by u.user_id
order by u.user_id
```

### Incremental Model Example (duplicate Mode)

The duplicate mode does not aggregate data and does not require a `unique_key`:

```sql
{{ config(
    materialized='incremental',
    replication_num=1
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```

### Incremental Model Example (unique Mode)

The unique mode aggregates data and must specify a `unique_key`:

```sql
{{ config(
    materialized='incremental',
    unique_key=['account_id','create_time']
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```

### Incremental Model Full Refresh Example

```sql
{{ config(
    materialized='incremental',
    full_refresh = true
)}}

select * from
 {{ source('dbt_source', 'sell_user') }}
```

### Bucketing Rule Example

`buckets` accepts `auto` or a positive integer, corresponding to automatic bucketing or a fixed bucket count, respectively:

```sql
{{ config(
    materialized='incremental',
    unique_key=['account_id',"create_time"],
    distributed_by=['account_id'],
    buckets='auto'
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    create_time > (select max(create_time) from {{this}})
{% endif %}
```

### Replica Count Example

```sql
{{ config(
    materialized='table',
    replication_num=1
)}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select * from source_data
```

### Dynamic Partition Example

```sql
{{ config(
    materialized='incremental',
    partition_by = 'create_time',
    partition_type = 'range',
    -- The properties here are the properties in the create table statement; the dynamic partition configurations are written below
    properties = {
        "dynamic_partition.time_unit":"DAY",
        "dynamic_partition.end":"8",
        "dynamic_partition.prefix":"p",
        "dynamic_partition.buckets":"4",
        "dynamic_partition.create_history_partition":"true",
        "dynamic_partition.history_partition_num":"3"
    }
) }}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    create_time = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
{% endif %}
```

### Regular Partition Example

In the current Doris version, historical partitions must be manually specified through `partition_by_init`:

```sql
{{ config(
    materialized='incremental',
    partition_by = 'create_time',
    partition_type = 'range',
    -- partition_by_init is used to specify the historical partitions of the partitioned table
    partition_by_init = [
        "PARTITION `p20240601` VALUES [(\"2024-06-01\"),  (\"2024-06-02\"))",
        "PARTITION `p20240602` VALUES [(\"2024-06-02\"),  (\"2024-06-03\"))"
    ]
 )}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    -- If the my_date variable is provided, this branch is taken (using the dbt run --vars '{"my_date": "\"2024-06-03\""}' command);
    -- If the my_date variable is not provided (running dbt run directly), use the day before the current date.
    -- Using the Doris CURDATE() function is recommended; this is also the common approach in production.
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }}

{% endif %}
```

### Batch Date Parameter Example

```sql
{{ config(
    materialized='incremental',
    partition_by = 'create_time',
    partition_type = 'range',
    ...
)}}

with source_data as (
    select
        *
    from {{ ref('sell_order2') }}
)

select
    *
    from source_data

{% if is_incremental() %}
    where
    -- If the my_date variable is provided, this branch is taken (using the dbt run --vars '{"my_date": "\"2024-06-03\""}' command);
    -- If the my_date variable is not provided (running dbt run directly), use the day before the current date.
    -- Using the Doris CURDATE() function is recommended; this is also the common approach in production.
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }}

{% endif %}
```

### Custom Column Type and Precision Example

In the `schema.yaml` file, you can configure the type of each `column` under `models` through `data_type`:

```yaml
models:
    - name: sell_user
      description: "A dbt model named sell_user"
      columns:
          - name: user_id
            data_type: BIGINT
          - name: account_id
            data_type: VARCHAR(12)
          - name: status
          - name: cost_sum
            data_type: DECIMAL(38,9)
          - name: update_time
            data_type: DATETIME
          - name: create_time
            data_type: DATETIME
```

### Catalog Access Example

[Data Catalog](../../lakehouse/catalog-overview.md) is the capability in Doris data lake features that points to different data sources. Its hierarchy sits above Database.

It is recommended to access Catalog through the built-in `catalog_source` macro of dbt-doris:

```sql
{{ config(materialized='table', replication_num=1) }}

select *
--  Use the macro 'catalog_source' instead of the macro 'source'
--  catalog name is 'mysql_catalog'
--  database name is 'dbt_source'
--  table name is 'sell_user'
from {{ catalog_source('mysql_catalog', 'dbt_source', 'sell_user') }}
```
