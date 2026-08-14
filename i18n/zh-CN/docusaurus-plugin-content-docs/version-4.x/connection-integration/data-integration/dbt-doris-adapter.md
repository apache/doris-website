---
{
    "title": "Apache Doris dbt Adapter",
    "language": "zh-CN",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 3,
    "description": "安装和配置 dbt-for-apache-doris，连接 Apache Doris，并构建增量模型、Source Freshness、异步物化视图及其他 dbt 数据转换功能。",
    "keywords": [
        "Apache Doris dbt",
        "dbt Doris Adapter",
        "dbt-for-apache-doris",
        "dbt Doris 配置",
        "Doris 数据转换",
        "Doris 增量模型",
        "Doris insert_overwrite",
        "Doris microbatch",
        "Doris Source Freshness",
        "Doris 异步物化视图",
        "dbt External Catalog",
        "dbt debug 无法连接"
    ]
}
---

<!-- 知识类型: 工具集成指南 / 能力定义 -->
<!-- 适用场景: Apache Doris dbt 数据转换 / ELT 建模 -->

[dbt](https://docs.getdbt.com/docs/introduction) 用于管理 ELT（Extract、Load、Transform）
流程中的转换环节。`dbt-for-apache-doris` Adapter 会将 dbt Model
编译为 Doris SQL，并通过 Doris Frontend（FE）的 MySQL Query Port 执行建表、数据转换、
测试和文档生成。原始数据需要提前写入 Doris；Adapter 不负责采集或同步源数据。

:::caution

`dbt-for-apache-doris` 由 VeloDB 提供和维护。它不属于 Apache Doris 项目，也不由 Apache Doris 社区发布或背书。生产使用前，请自行评估 Adapter，核验安装包完整性及发布信息，并遵守第三方项目许可证。Adapter 问题请反馈至 [`dbt-for-apache-doris` 项目](https://github.com/velodb/dbt-for-apache-doris/issues)。

:::

<!-- 知识类型: 版本要求 / 环境要求 / 已发布版本 -->
<!-- 适用场景: 安装前版本核对 / 环境准备 / 版本查询 -->

## 环境要求

| 项目 | 要求 |
| --- | --- |
| Python | 3.10 或更高版本 |

## 已发布版本

| 版本 |
| --- |
| [1.1.0](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) |

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Adapter 安装 / 安装结果验证 -->

## 安装 dbt-for-apache-doris

以下命令以已发布的 [`v1.1.0`](https://github.com/velodb/dbt-for-apache-doris/releases/tag/v1.1.0) 为安装示例。安装其他版本时，请替换 `pip` 依赖中的版本号。

建议在独立的 Python 虚拟环境中从 PyPI 安装 Adapter：

```shell
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.0"
dbt --version
```

Windows PowerShell 使用以下命令：

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install "dbt-for-apache-doris==1.1.0"
dbt --version
```

在本示例中，输出的 `Plugins` 列表中应包含 `doris: 1.1.0`。dbt Core 和 MySQL Connector/Python 会作为依赖项自动安装。

<!-- 知识类型: 配置参数 / 操作步骤 -->
<!-- 适用场景: Doris Profile 配置 / 连接验证 / 跨 Database 读取 -->

## 配置连接

执行以下命令创建项目：

```shell
dbt init doris_demo
cd doris_demo
```

在 `~/.dbt/profiles.yml` 中配置 Doris 连接：

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

配置项说明：

| 配置项 | 推荐配置 | 当前实现的行为 |
| --- | --- | --- |
| `type` | 必须显式设置为 `doris` | 选择 Doris Adapter |
| `host` | 显式设置 Doris FE 地址 | 省略时底层凭据回退到 `127.0.0.1`；`dbt init` 不提供默认输入 |
| `port` | 通常使用 `9030` | 省略时为 `9030`，指 FE Query Port，不是 HTTP Port |
| `username` | 显式设置专用 Doris 用户 | 省略时底层凭据回退到 `root`；`dbt init` 不提供默认输入 |
| `password` | 建议通过环境变量传入 | 省略时为空字符串 |
| `schema` | 必须填写目标 Doris Database 名称 | `dbt init` 的提示默认值为 `dbt`；底层凭据本身的默认值为 `None` |
| `threads` | 按 FE 和任务负载设置 | `dbt init` 的提示默认值为 `1` |
| `database` | 不要在 Profile 中配置 | 这是 dbt 通用凭据字段；如果提供，当前实现要求它与 `schema` 完全相同 |

Adapter 将 dbt Schema 映射为 Doris Database。目标 Database 不存在时，
Adapter 会尝试创建它，因此执行用户需要相应权限。执行用户还需要读取源表，以及在
目标 Database 中创建、修改、删除和写入对象的权限。

这里的 `database` 不是 Doris Catalog。它只是 dbt 通用的
`database.schema.identifier` 命名模型遗留到 Adapter 的字段；Doris Internal
Catalog 中只需要 `database.table` 两层，因此 Profile 使用 `schema` 表示 Doris
Database，并省略 `database`。Source 资源中的 `database` 是另一种用法：当前
Adapter 会把它作为 Doris Database 覆盖 `schema`，用于跨 Database 读取。Profile
和标准 `source()` 当前不能同时表示 Doris Catalog 与 Database 两个层级。

:::caution

当前不支持 External Catalog 的 Catalog、Database、Table 三段式命名空间。

:::

确保 `dbt_project.yml` 中的 `profile` 与 `profiles.yml` 顶层名称一致：

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

在 macOS 或 Linux 中验证连接：

```shell
export DORIS_PASSWORD='your_password'
dbt debug
```

Windows PowerShell 使用：

```powershell
$env:DORIS_PASSWORD = 'your_password'
dbt debug
```

<!-- 知识类型: 操作步骤 / 最小示例 -->
<!-- 适用场景: 快速验证 dbt 到 Doris 的建模流程 -->

## 构建第一个 Model

先在 Doris 中准备示例 Source。副本数 `1` 只适用于单 BE 开发环境：

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

然后在 `models/sources.yml` 中声明 Source：

```yaml
version: 2

sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
```

创建 `models/fct_daily_sales.sql`：

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

在 `models/schema.yml` 中添加说明和数据测试：

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

构建 Model 并执行测试：

```shell
dbt build --select fct_daily_sales
```

Model 默认创建在 Profile 的 `schema` 所指定的 Doris Database 中。本例生成
`analytics.fct_daily_sales`。本快速示例将副本数设为 `1` 以适配单 BE 开发环境；
生产环境应按集群部署调整。

Source 位于其他 Doris Database 时，优先直接设置 `schema`：

```yaml
sources:
  - name: finance
    schema: finance_raw
    tables:
      - name: payments
```

为兼容已有 dbt 项目，也可以只设置 `database: finance_raw`，或同时把 `database` 和
`schema` 设置为相同值。对于 Source，若两者不同，当前 Adapter 会采用 `database`
作为 Doris Database；这与 Profile 中必须保持两者相同的连接校验不同。为了避免
歧义，新项目建议统一使用 `schema`。

<!-- 知识类型: 能力定义 / 配置参数 / 架构选型决策 -->
<!-- 适用场景: Materialization 选型 / 增量加工 / 物化视图 -->

## Materialization

`dbt-for-apache-doris` 支持以下主要 Materialization：

| Materialization | Doris 对象或行为 | 适用场景 |
| --- | --- | --- |
| `view` | Doris View | 轻量转换、始终读取最新源数据 |
| `table` | 每次运行完整重建的 Doris Duplicate Key Table | 结果规模可控、需要稳定查询性能 |
| `incremental` | 按策略追加、Upsert 或覆盖本批数据 | 大表增量加工 |
| `materialized_view` | Doris 异步物化视图 | 由 Doris 管理刷新和透明改写 |
| `ephemeral` | 由 dbt 编译为下游 Model 中的公共表表达式（CTE） | 只复用 SQL、不创建 Doris 对象 |

Seed 和 Snapshot 也可创建 Doris Table。Adapter 当前不包含自定义 `partition`
Materialization；需要替换分区时使用
Incremental `insert_overwrite`。下文示例沿用单 BE 开发环境，将
`replication_num` 设为 `1`；生产环境应按实际部署设置副本数。

### View

```sql
{{ config(materialized='view') }}

select order_id, customer_id, amount
from {{ source('raw', 'orders') }}
where status = 'PAID'
```

每次运行会更新 View 定义。View 不保存数据，查询成本由 View SQL 和下游查询决定。

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

Table Materialization 创建 Duplicate Key 表，后续运行会完整替换目标。Table Model 可配置以下建表参数：

| 配置项 | 类型和默认值 | 说明 |
| --- | --- | --- |
| `duplicate_key` | 字符串或列表；可选 | Duplicate Key 列 |
| `partition_by` | 字符串或列表；可选 | 分区列 |
| `partition_type` | `RANGE` 或 `LIST`；默认 `RANGE` | 与 `partition_by` 配合使用的分区类型 |
| `partition_by_init` | 字符串列表；可选 | 创建表时与 `partition_by` 配合使用的 Doris 分区定义 |
| `distributed_by` | 字符串或列表；可选 | Hash Distribution 列 |
| `buckets` | 正整数；生成 Hash Distribution 时默认 `10` | Hash 分桶数；仅在配置 `distributed_by` 时使用 |
| `replication_num` | 正整数或数字字符串；可选 | 副本数；顶层配置会覆盖 `properties` 中的同名项 |
| `properties` | 字典；可选 | 生成到 Doris `PROPERTIES` 中的键值对 |

`duplicate_key`、分区列和分桶列必须出现在 Model 输出中，并满足 Doris 建表规则。
Adapter 会将 `partition_by_init` 和 `properties` 生成到 `CREATE TABLE` 语句中；分区定义、
属性名称和取值是否合法，由 Doris 校验。

普通 Table Model 当前不支持配置 Aggregate Key 或独立 Unique Key；Unique Key Upsert 使用 Incremental `merge`。

### Incremental

对于 `append`、`merge` 和 `insert_overwrite`，Incremental Model 由两部分共同决定：

- Model SQL（通常配合 `is_incremental()`）决定本次返回哪些源数据；
- `incremental_strategy` 决定 Adapter 如何将本批数据写入目标表。

`microbatch` 不使用这套筛选方式；它由 dbt Core 根据批次上下文和上游资源的
`event_time` 注入时间过滤。

以下示例按 `order_id` 执行全行 Upsert：

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

支持的增量策略：

| `incremental_strategy` | 目标表和写入语义 | 主要配置 |
| --- | --- | --- |
| `append` | 向 Duplicate Key 表追加数据，不去重 | 不需要 `unique_key` |
| `merge` | 向 Merge-on-Write 或 Merge-on-Read Unique Key 表执行全行 `INSERT INTO` Upsert | 必须设置 `unique_key` |
| `insert_overwrite` | 使用 Doris `INSERT OVERWRITE` 覆盖整表、指定分区或本批涉及的分区 | 不能设置 `unique_key`；可设置 `overwrite_partitions` |
| `microbatch` | 按 dbt Core 的 UTC 时间窗口逐批覆盖一个精确的 Doris RANGE 分区 | 设置 `event_time`、`batch_size` 和 `begin`；不能设置 `unique_key` |

未设置 `incremental_strategy` 时，有 `unique_key` 使用 `merge`，否则使用
`append`。Adapter 支持 `ignore`、`fail`、`append_new_columns` 和
`sync_all_columns` 四种 `on_schema_change` 策略。

`delete+insert` 和 `delete_insert` 已被当前实现明确拒绝；Doris Unique Key Upsert
应使用 `merge`。`merge` 不生成原生 `MERGE INTO`，而是依赖 Doris Unique Key
表的全行 `INSERT INTO` 语义。每批数据中的 `unique_key` 必须唯一。需要 Sequence
Column 时，在 `properties` 中设置可见列
`function_column.sequence_col`，并继续使用 `merge`。裸 `sequence_col` 配置和使用隐藏
`__DORIS_SEQUENCE_COL__` 的 `function_column.sequence_type` 当前均不受支持。

覆盖指定 Doris 分区：

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

首次运行走 CTAS 建表路径，不执行 `INSERT OVERWRITE`，所以示例必须用
`partition_by_init` 创建目标分区。`overwrite_partitions` 只决定目标表已存在时的覆盖
范围。省略 `overwrite_partitions` 会覆盖整张表；设置分区名列表会只覆盖这些分区；
设置 `'*'` 时，Doris 根据本批数据动态覆盖涉及的分区。空批次
无法识别需要清空的分区；需要清空分区时应显式指定分区名。

### Microbatch

`microbatch` 使用 dbt Core 的批处理上下文，把每个 UTC 时间窗口映射为一个
精确的 Doris RANGE 分区，并逐分区执行 `INSERT OVERWRITE`。例如：

先为每个直接上游资源和目标 Model 配置 Event Time 字段，使 dbt Core 能向每批输入
注入时间过滤。对于前文示例中创建的 `raw.orders` Source，在已有 Table 声明下增加：

```yaml
sources:
  - name: raw
    schema: raw
    tables:
      - name: orders
        config:
          event_time: order_time
```

再定义 Microbatch Model：

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

`event_time` 必须是未加引号的列名，并与 `partition_by` 指向同一个单列；
`batch_size` 支持 `hour`、
`day`、`month` 和 `year`。目标是 Duplicate Key 表；`duplicate_key` 是 Doris 表的
Key 配置，不是 dbt 的 `unique_key`。不要为 Microbatch 设置 `unique_key`、
`overwrite_partitions` 或 `partition_by_init`，分区边界和覆盖目标由 Adapter 根据
当前批次管理。若上游 `ref()` 或 `source()` 也配置了 `event_time`，dbt Core 会按
当前批次窗口过滤输入。Microbatch 批次串行执行；即使遇到空批次，也会覆盖对应的
精确分区，因此可以清除该窗口中已不存在的数据。

Microbatch 也可使用 Doris Dynamic Partition，但必须在 `properties` 中显式启用并
满足当前 Adapter 的校验：

- `dynamic_partition.enable='true'`；
- `dynamic_partition.time_unit` 与 `batch_size` 一致，且
  `dynamic_partition.time_zone` 为 `UTC`、`Etc/UTC` 或 `+00:00`；
- `dynamic_partition.create_history_partition='true'`，并设置
  `dynamic_partition.start` 或 `dynamic_partition.history_partition_num`；
- `dynamic_partition.prefix` 是合法标识符，`dynamic_partition.end` 是正整数；
- 月批次若设置 `dynamic_partition.start_day_of_month`，其值必须为 `1`。

Doris 创建 Dynamic Partition 表时还要求 `dynamic_partition.buckets` 为正整数；该项
由 Doris 校验，不在 Adapter 上述校验项中。保留窗口必须覆盖 `begin`、`lookback`
和手动回填范围。目标表已存在时，Adapter 校验的物理属性必须与 Model 配置一致，
否则需要对齐配置或执行 `--full-refresh`。

:::caution
对于 `append`、`merge` 和按分区执行的 `insert_overwrite`，Adapter 不会自动识别
新增或变更的源数据；Model SQL 必须返回预期批次。整表 `insert_overwrite` 则应返回
目标表所需的完整数据。同一批 `merge` 数据中的 `unique_key` 必须唯一。Microbatch
的时间过滤由 dbt Core 根据已配置 `event_time` 的上游资源生成，不需要使用
`is_incremental()`。修改 Key、分区方式或其他不兼容表结构后，应执行
`dbt run --full-refresh`。
:::

### 异步物化视图

设置 `materialized='materialized_view'` 可以由 dbt 管理 Doris
[异步物化视图](../../query-acceleration/materialized-view/async-materialized-view/overview)：

:::note
使用该 Materialization 时，Adapter 的 FE 版本检查接受 Doris 2.x 的 2.1.5 及以上
版本、Doris 3.x 中除 3.0.0 外的版本、Doris 4.x 和更高版本，以及形如
`doris-0.0.0-<git-sha>` 的可识别源码构建。源码构建仅用于开发测试；这些规则只是
代码中的准入条件，不是相关版本均已通过兼容性测试的结论。
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

主要配置：

| 配置项 | 默认值 | 支持值或格式 |
| --- | --- | --- |
| `build_mode` | `immediate` | `immediate`、`deferred` |
| `refresh_method` | `auto` | `auto` 由 Doris 决定刷新范围；`complete` 刷新全部分区 |
| `refresh_trigger` | `manual` | `manual`、`schedule`、`commit` |
| `refresh_schedule` | - | `schedule` 触发器必填；包含正整数 `interval`、`minute/hour/day/week` 单位和可选 `start_time` |
| `wait_for_refresh` | `true` | 是否等待 `BUILD IMMEDIATE` 初始构建或 Adapter 提交的手动刷新任务 |
| `refresh_wait_timeout` | `300` | 等待刷新任务的超时秒数，正整数 |
| `refresh_poll_interval` | `1` | 查询刷新任务状态的间隔秒数，正整数且不大于超时值 |
| `duplicate_key` | - | 异步物化视图的 Duplicate Key 列，字符串或列表 |
| `partition_by` | - | 一个 Doris 分区列或分区函数表达式，字符串或单元素列表 |
| `distribution_type` | 自动选择 | 有 `distributed_by` 时为 `hash`，否则为 `random` |
| `distributed_by` | - | Hash Distribution 列 |
| `buckets` | `auto` | 正整数或 `auto` |
| `replication_num` | - | 副本数便捷配置；会覆盖 `properties` 中的同名值 |
| `properties` | `{}` | Doris 异步物化视图属性 |
| `on_configuration_change` | `apply` | `apply`、`continue`、`fail` |

默认的 `BUILD IMMEDIATE` 会在创建或替换定义时启动初始构建。Adapter 先创建临时
名称的异步物化视图，默认等待初始构建成功，再发布为目标名称；这一步不会额外提交
一次 `REFRESH MATERIALIZED VIEW`。`BUILD DEFERRED` 只创建定义，不执行初始构建。

定义未变化时，刷新行为完全由 `refresh_trigger` 决定，当前实现没有
`refresh_on_run` 配置：

- `manual`：每次后续 `dbt run` 选中该 Model 时，提交
  `REFRESH MATERIALIZED VIEW ... AUTO|COMPLETE`；默认等待任务成功；
- `schedule` 或 `commit`：后续选中运行跳过刷新，由 Doris 按定时计划或基表提交
  触发刷新。

定时刷新示例：

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

设置 `wait_for_refresh=false` 只是不轮询任务状态，并不会阻止手动刷新请求。Doris
刷新任务本身仍是异步任务；dbt 等待超时不会取消已经提交的任务。Adapter 通过比较
提交前后的 Doris MV Task ID 识别新任务，因此应避免同一个异步物化视图被并发手动
刷新。

Model SQL 或 DDL 配置变化时，`on_configuration_change=apply` 默认通过临时异步
物化视图和 Doris 原子替换部署新定义；`continue` 保留旧定义且不提交手动刷新，
`fail` 终止运行。`--full-refresh` 会强制重新部署定义。

<!-- 知识类型: 能力参考 / 配置参数 -->
<!-- 适用场景: Seed / Snapshot / Source Freshness / Grants -->

## 使用其他 dbt 功能

| 功能 | 用法 |
| --- | --- |
| Seed | 将小型、版本受控的 CSV 放入 `seeds/`，执行 `dbt seed`；支持类型推断、`column_types` 和 `ref` |
| Snapshot | 在 `snapshots/` 中定义 `check` 或 `timestamp` 策略，执行 `dbt snapshot`；支持 Hard Delete、Schema 演进和原子替换 |
| Data Test | 在 YAML 中配置 Generic Test，或在 `tests/` 中编写 Singular Test；支持 Ephemeral 和 `store_failures` 路径 |
| Unit Test | 在 Model YAML 中提供 Inline Row 或 CSV Fixture，执行 `dbt test --select test_type:unit` |
| Model Contract | 对 Table、View 或 Incremental Model 设置 `contract.enforced: true` 并声明字段名称和类型；不会创建数据库 PK 或 NOT NULL 约束 |
| Persisted Docs | 启用 `persist_docs`，为主要 Relation 类型写入 Relation 和字段注释 |
| Source Freshness | 配置 `loaded_at_field` 或 `loaded_at_query` 以及 `freshness`，执行 `dbt source freshness` |
| Grants | 使用标准 `grants` 配置管理 Doris `user` 和 `user@host` 表权限；当前不支持 Role 授权主体 |
| Hooks | 使用 `pre_hook` 和 `post_hook` 在 Materialization 前后执行 Doris SQL；Hook 副作用没有事务回滚 |
| 文档与血缘 | 编写 Description 并执行 `dbt docs generate`，生成 Doris Database、Table、View、字段、注释和异步物化视图元数据 |

Seed 适合国家代码、状态映射等小型静态数据，不适合批量导入业务数据。大文件应使用
Doris Stream Load、Broker Load 或 Doris Connector。

Snapshot 源数据中的 `unique_key` 必须非 `NULL` 且每批唯一；使用 `timestamp` 策略
时，`updated_at` 必须非 `NULL`，且不能早于该 Key 的当前历史版本。

为 Table 写入表和字段说明：

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

### Source Freshness

Source Freshness 支持两种显式取值方式。常见场景使用
`loaded_at_field`：

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

使用 `loaded_at_field` 时，如只需过滤参与 Freshness 计算的行，可在 `freshness` 下
配置 `filter`，例如 `filter: is_valid = 1`。需要自定义取值 SQL 或聚合逻辑时使用
`loaded_at_query`：

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

二者不能同时配置。Adapter 使用 `utc_timestamp()` 作为当前时间，以符合 dbt Core
对无时区时间戳按 UTC 计算 Freshness 的约定。当前实现没有从 Doris 表元数据自动
推导加载时间；必须提供字段或查询。

### Grants

声明式 Grants 以 Doris 用户为授权主体：

```yaml
models:
  doris_demo:
    +grants:
      select:
        - analyst
        - reporter@10.0.0.%
```

未带 `@host` 的名称按 `username@%` 处理。权限映射为：`select` → `SELECT_PRIV`、
`insert` → `LOAD_PRIV`、`alter` → `ALTER_PRIV`、`create` → `CREATE_PRIV`、`drop` →
`DROP_PRIV`、`show_view` → `SHOW_VIEW_PRIV`。当前不支持把 Doris Role 写入
`grants`，应配置具体用户；执行 dbt 的用户需要能够检查授权主体并调整目标对象权限。

<!-- 知识类型: 命令参考 -->
<!-- 适用场景: dbt 项目开发 / 运行 / 测试 / 文档生成 -->

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `dbt debug` | 检查项目配置和 Doris 连接 |
| `dbt parse` | 解析项目，不执行 SQL |
| `dbt compile` | 编译 Model 并查看生成的 Doris SQL |
| `dbt run` | 构建选中的 Model |
| `dbt test` | 执行 Data Test 和 Unit Test |
| `dbt build` | 按依赖顺序执行 Seed、Model、Snapshot 和 Test |
| `dbt seed` | 加载 Seed CSV |
| `dbt snapshot` | 更新 Snapshot |
| `dbt source freshness` | 检查 Source Freshness |
| `dbt docs generate` | 生成 Catalog、文档和血缘数据 |

常用选择器：

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

<!-- 知识类型: 限制说明 / 架构选型决策 -->
<!-- 适用场景: 版本评估 / 生产上线前检查 -->

## 当前限制

- 当前不支持 Aggregate Key 表建模和 Secondary Index 配置。
- 当前不支持完整的 External Catalog 命名空间。
- 当前未实现 SSL 配置、超时与重试、多 FE 故障转移、服务端取消和完整的查询遥测。
- 部分 Table、View 和 MV 类型切换存在短暂的标准对象名不可用窗口，无法做到零停机切换。

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 连接失败 / Profile database 与 schema 不一致 -->

## 故障处理

### `dbt debug` 无法连接

确认 `host` 和 `port` 指向可访问的 Doris FE Query Port，并检查用户名、密码和
网络策略。`9030` 是默认 Query Port，`8030` 通常是 FE HTTP Port。

### `database` 与 `schema` 不一致

Profile 中的 `schema` 就是目标 Doris Database。删除 `database`；它不是 Doris
Catalog，而且在 Profile 中没有提供额外命名层级。如果保留该兼容字段，当前实现
要求它与 `schema` 完全相同。
