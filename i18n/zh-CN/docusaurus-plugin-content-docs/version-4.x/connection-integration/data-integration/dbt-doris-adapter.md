---
{
    "title": "DBT Doris Adapter",
    "language": "zh-CN",
    "description": "使用 dbt-doris 适配器在 Apache Doris 中构建 ELT 数据转换流水线，支持 view、table、incremental 三种物化方式与 seed、catalog 等高级能力。"
}
---

<!-- 知识类型: 工具集成指南 -->
<!-- 适用场景: 在 Doris 上使用 dbt 进行数据转换（ELT 中的 T 环节） -->

[DBT（Data Build Tool）](https://docs.getdbt.com/docs/introduction) 是专注于 ELT（提取、加载、转换）流程中 T（Transform）—— 数据转换环节的组件。`dbt-doris` adapter 基于 `dbt-core` 开发，依赖 `mysql-connector-python` 驱动，对 Doris 进行数据转换。

代码仓库地址：https://github.com/apache/doris/tree/master/extension/dbt-doris

## 版本兼容性

在选择 dbt-doris 版本前，请先核对 Doris、Python 与 dbt-core 的版本对应关系：

| Doris    | Python        | dbt-core | dbt-doris |
| -------- | ------------- | -------- | --------- |
| >= 1.2.5 | >= 3.8, <=3.10 | >= 1.5.0 | <= 0.3    |
| >= 1.2.5 | >= 3.9        | >= 1.8.0 | >= 0.4    |

## 快速开始

### 安装 dbt-doris adapter

使用 pip 安装 adapter：

```shell
pip install dbt-doris
```

安装命令会自动拉取 dbt 运行所需的全部依赖。安装完成后，可使用以下命令验证：

```shell
dbt --version
```

如果系统未识别 `dbt` 命令，可创建一条软链接：

```shell
ln -s /usr/local/python3/bin/dbt /usr/bin/dbt
```

### 初始化 dbt 项目

执行以下命令进入交互式初始化流程：

```shell
dbt init
```

根据提示输入下表配置项，即可完成项目初始化：

| 配置项     | 默认值 | 说明                                                                |
| -------- | ---- | ----------------------------------------------------------------- |
| project  | -    | 项目名称                                                              |
| database | -    | 选择适配器（输入对应编号）                                                     |
| host     | -    | Doris 的 host                                                       |
| port     | 9030 | Doris 的 MySQL Protocol 端口                                          |
| schema   | -    | dbt-doris 中等同于 database，即库名                                        |
| username | -    | Doris 的用户名                                                         |
| password | -    | Doris 的密码                                                          |
| threads  | 1    | dbt-doris 的并行度（设置过高会增加运行失败风险，建议与集群能力匹配）                                |

### 运行 dbt 项目

进入新创建的项目目录，执行默认的 dbt 模型：

```shell
dbt run
```

执行成功后会运行两个示例 model：

- `my_first_dbt_model`：物化为 table
- `my_second_dbt_model`：物化为 view

可登录 Doris 查看二者的数据结果及建表语句。更多 dbt 运行说明可参考 [dbt 官方文档](https://docs.getdbt.com/docs/get-started/run-your-dbt-projects)。

## 物化方式（Materialization）

<!-- 知识类型: 架构选型决策 -->

dbt-doris 支持以下三种物化方式：

| 物化方式      | 适用场景                                                | 优点                       | 缺点                              |
| ----------- | --------------------------------------------------- | ------------------------ | ------------------------------- |
| view        | 仅做轻量转换（如重命名、列变更）的模型                                 | 无额外存储，始终基于源数据最新记录              | 大规模或嵌套场景下查询较慢                   |
| table       | 被 BI 工具或下游频繁查询的模型                                   | 查询速度快                    | 构建耗时较长，占用额外存储，不支持增量             |
| incremental | 基于事件的场景或 dbt 运行过慢需要增量同步的模型                          | 仅转换新数据，构建时间显著缩短                 | 配置较复杂，属于 dbt 高级用法，需要场景与组件适配         |

> 默认物化方式为 `view`。建议先以 view 起步，仅在出现性能问题时再切换为其他方式。

### View 物化

每次运行模型时通过 `CREATE VIEW AS` 语句重新构建为视图。

在 `dbt_project.yml` 中配置：

```yaml
models:
    <resource-path>:
        +materialized: view
```

或在 model 文件中配置：

```jinja
{{ config(materialized = "view") }}
```

### Table 物化

每次运行模型时通过 `CREATE TABLE AS SELECT` 语句重建为表。

dbt-doris 通过以下步骤保证 table 物化在数据更迭时的原子性：

1. 执行 `CREATE TABLE this_table_temp AS {{ model sql }}`，先创建临时表。
2. 若 `this_table` 不存在（首次创建），执行 `RENAME` 将临时表更名为最终表。
3. 若 `this_table` 已存在，执行 `ALTER TABLE this_table REPLACE WITH TABLE this_table_temp PROPERTIES('swap' = 'False')`。该操作会交换表名并删除 `this_table_temp`，由 [Doris 内核事务机制](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-REPLACE) 保证原子性。

在 `dbt_project.yml` 中配置：

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

或在 model 文件中配置：

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

配置项说明：

| 配置项               | 说明                                | 是否必填    |
| ----------------- | --------------------------------- | ------- |
| `materialized`    | 物化形式（对应 Doris 明细模型 Duplicate）       | Required |
| `duplicate_key`   | 明细模型的排序列                          | Optional |
| `replication_num` | 表副本数                              | Optional |
| `partition_by`    | 表分区列                              | Optional |
| `partition_type`  | 分区类型，`range` 或 `list`，默认 `RANGE`     | Optional |
| `partition_by_init` | 初始化的表分区                          | Optional |
| `distributed_by`  | 分桶列                               | Optional |
| `buckets`         | 分桶数量                              | Optional |
| `properties`      | 建表的其他配置                           | Optional |

### Incremental 物化

以上次 dbt 运行结果为基准，将新增记录增量插入或更新到表中。dbt-doris 提供两种增量策略（通过 `incremental_strategy` 设置）：

- `insert_overwrite`：依赖 unique 模型。在初始化时即指定物化为 incremental，通过聚合列实现增量数据的覆盖。
- `append`：依赖 duplicate 模型。仅追加增量数据，不修改历史数据，无需指定 `unique_key`。

在 `dbt_project.yml` 中配置：

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

或在 model 文件中配置：

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

配置项说明：

| 配置项                    | 说明                            | 是否必填    |
| ---------------------- | ----------------------------- | ------- |
| `materialized`         | 物化形式                          | Required |
| `incremental_strategy` | 增量策略                          | Optional |
| `unique_key`           | unique 表的 key 列                  | Optional |
| `replication_num`      | 表副本数                          | Optional |
| `partition_by`         | 表分区列                          | Optional |
| `partition_type`       | 分区类型，`range` 或 `list`，默认 `RANGE` | Optional |
| `partition_by_init`    | 初始化的表分区                       | Optional |
| `distributed_by`       | 分桶列                           | Optional |
| `buckets`              | 分桶数量                          | Optional |
| `properties`           | 建表的其他配置                       | Optional |

## Seed：加载 CSV 数据

[Seed](https://docs.getdbt.com/docs/build/seeds) 用于加载 CSV 等数据文件入库参与模型构建。使用时请注意：

1. seed 不应用于加载原始数据（例如从生产数据库导出的大型 CSV 文件）。
2. seed 受版本控制，最适合包含业务逻辑的小文件，例如国家/地区代码列表或员工 ID。
3. 对于大文件，dbt seed 性能不佳，建议使用 Stream Load 等方式将 CSV 加载到 Doris。

将 CSV 文件与 seed 配置文件放置于 dbt 项目的 `seeds` 目录后，运行：

```shell
dbt seed --select seed_name
```

常见的 seed 配置文件示例（支持自定义列类型）：

```yaml
seeds:
    seed_name: # 种子名称，构建后将作为表名
        config:
            schema: demo_seed # 构建后将作为 database 的一部分
            full_refresh: true
            replication_num: 1
            column_types:
                id: bigint
                phone: varchar(32)
                ip: varchar(15)
                name: varchar(20)
                cost: DecimalV3(19,10)
```

## 使用示例

<!-- 知识类型: 操作步骤 -->

### 视图模型示例

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

### 表模型示例

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

### 增量模型示例（duplicate 模式）

duplicate 模式不做数据聚合，无需指定 `unique_key`：

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

### 增量模型示例（unique 模式）

unique 模式会做数据聚合，必须指定 `unique_key`：

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

### 增量模型全量刷新示例

```sql
{{ config(
    materialized='incremental',
    full_refresh = true
)}}

select * from
 {{ source('dbt_source', 'sell_user') }}
```

### 设置分桶规则示例

`buckets` 可填 `auto` 或正整数，分别对应自动分桶与固定分桶数：

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

### 设置副本数示例

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

### 动态分区示例

```sql
{{ config(
    materialized='incremental',
    partition_by = 'create_time',
    partition_type = 'range',
    -- 这里的 properties 是 create table 语句中的 properties，下面写了动态分区的相关配置
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

### 常规分区示例

当前 Doris 版本的历史分区需要通过 `partition_by_init` 手动指定：

```sql
{{ config(
    materialized='incremental',
    partition_by = 'create_time',
    partition_type = 'range',
    -- partition_by_init 用于指定分区表的历史分区
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
    -- 如果提供了 my_date 变量，则走该通路（通过 dbt run --vars '{"my_date": "\"2024-06-03\""}' 命令）；
    -- 如果未提供 my_date 变量（直接 dbt run），则使用当前日期的前一天。
    -- 推荐使用 Doris 的 CURDATE() 函数，这也是生产环境常用方式。
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }}

{% endif %}
```

### 批处理日期参数示例

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
    -- 如果提供了 my_date 变量，则走该通路（通过 dbt run --vars '{"my_date": "\"2024-06-03\""}' 命令）；
    -- 如果未提供 my_date 变量（直接 dbt run），则使用当前日期的前一天。
    -- 推荐使用 Doris 的 CURDATE() 函数，这也是生产环境常用方式。
    create_time = {{ var('my_date' , 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)') }}

{% endif %}
```

### 自定义列类型与精度示例

可在 `schema.yaml` 文件中通过 `data_type` 配置 `models` 中各 `columns` 的类型：

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

### 访问 Catalog 示例

[Data Catalog](../../lakehouse/catalog-overview.md) 是 Doris 数据湖功能中指向不同数据源的能力，其层级位于 Database 之上。

推荐通过 dbt-doris 内置的 `catalog_source` Macros 访问 Catalog：

```sql
{{ config(materialized='table', replication_num=1) }}

select *
--  使用 macros 'catalog_source'，而非 macros 'source'
--  catalog name 为 'mysql_catalog'
--  database name 为 'dbt_source'
--  table name 为 'sell_user'
from {{ catalog_source('mysql_catalog', 'dbt_source', 'sell_user') }}
```
