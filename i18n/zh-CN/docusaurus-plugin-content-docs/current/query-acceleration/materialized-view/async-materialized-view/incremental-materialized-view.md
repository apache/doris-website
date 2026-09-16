---
{
    "title": "物化视图增量维护（IVM）",
    "language": "zh-CN",
    "description": "Doris 5.0 如何用物化视图增量维护（IVM）按行处理基表增删改，并配置刷新、回退、诊断和生产运维。",
    "keywords": [
        "Incremental View Maintenance",
        "IVM",
        "Doris IVM",
        "异步物化视图",
        "物化视图增量维护",
        "物化视图行级更新",
        "IVM 增量刷新",
        "IVM 刷新间隔",
        "IVM 定时刷新",
        "IVM 回退",
        "IvmFallbackReason",
        "内部 Table Stream",
        "行级增量刷新",
        "REFRESH INCREMENTAL",
        "INCREMENTAL FALLBACK",
        "Row Binlog",
        "Table Stream"
    ]
}
---

<!-- 知识类型: 功能说明 / 操作指南 / 参数参考 / 故障排查 -->
<!-- 适用场景: 基表频繁增删改 / 变化行数占比较小 / 全量或分区重算成本高 -->

物化视图增量维护（Incremental View Maintenance，IVM）根据基表的行级变化维护异步物化视图。普通异步物化视图会重算全部数据或受影响的整个分区；IVM 只计算基表两次刷新之间的新增、更新和删除，并把这些变化应用到物化视图。

:::caution 实验性功能
IVM 从 Doris 5.0.0 开始支持，目前处于实验阶段，默认关闭。使用前需要在 FE 配置中开启 Row Binlog 和 Table Stream，详见 [前置条件](#前置条件)。
:::

<!-- 知识类型: 场景选型 -->
<!-- 适用场景: IVM 选型 / 刷新成本评估 -->

## 适用场景

先比较每次变化的行数、受影响分区的大小和数据一致性要求，再选择刷新方式。

| 场景 | 建议 | 原因 |
|---|---|---|
| 基表频繁增删改，变化行数只占全表或分区的一小部分 | 使用 IVM | 只计算两次刷新之间的行级变化，避免重算完整分区 |
| 变化集中在少量分区，重算这些分区的成本可接受 | 使用 `PARTITIONS` | 配置更简单，按受影响分区重算 |
| 首次建立基线、数据量较小或需要恢复 IVM 基线 | 使用 `COMPLETE` | 重新计算物化视图的全部数据 |
| 要求与基表事务同步、实时一致 | 不使用异步物化视图 | IVM 仍通过异步任务刷新，不提供实时一致性 |

<!-- 知识类型: 架构决策 -->
<!-- 适用场景: INCREMENTAL / PARTITIONS / COMPLETE / AUTO 选型 -->

## 与分区增量刷新的区别

Doris 支持四种异步物化视图刷新方式。IVM 对应 `INCREMENTAL`，不要把它与 `PARTITIONS` 的分区增量刷新混淆。

| 刷新方式 | 计算粒度 | 适用场景 | 不满足条件时的行为 |
|---|---|---|---|
| `INCREMENTAL` | 行级变化 | 变化行数远小于全表或受影响分区 | 默认直接失败；指定 `FALLBACK` 后可回退 |
| `PARTITIONS` | 受影响的整个物化视图分区 | 变化集中在少量分区，且重算这些分区的成本可接受 | 默认直接失败；指定 `FALLBACK` 后回退到 `COMPLETE` |
| `COMPLETE` | 全部数据 | 数据量较小、首次建立基线或需要恢复 IVM 基线 | 始终完整重算 |
| `AUTO` | Doris 自动选择 | 希望 Doris 自动选择可用策略 | 依次尝试可用的 IVM、分区刷新和完整刷新 |

`INCREMENTAL FALLBACK` 只改变刷新运行时的失败处理。创建物化视图时，定义 SQL 仍必须满足 IVM 要求；`FALLBACK` 不会让不支持 IVM 的定义通过创建检查。

<!-- 知识类型: 工作原理 -->
<!-- 适用场景: 理解 IVM 数据流 / 一致性机制 -->

## 工作原理

IVM 复用 Doris 的 Row Binlog 和 Table Stream 能力：

![IVM 工作原理：基表变化依次进入 Row Binlog 和内部 Table Stream，增量计划结合未消费变化与一致性快照更新物化视图，并在同一事务中推进消费位点](/images/next/query-acceleration/ivm-workflow.jpg)

创建支持 IVM 的物化视图时，Doris 为每张参与增量维护的基表创建一个内部 Table Stream。内部 Stream 的名称以 `__doris_ivm_stream_` 开头。用户不需要创建、消费或删除这些 Stream。

刷新时，Doris 根据每张基表的未消费变化生成增量计划。关联查询还会读取与消费位点对齐的基表快照，保证多表计算使用一致的数据边界。物化视图数据和消费位点在同一个事务中提交；事务失败时，两者都不会提交。

<!-- 知识类型: 部署前检查 -->
<!-- 适用场景: 启用 IVM / 建表前评估 -->

## 前置条件

### 版本和 FE 配置

1. 使用 Doris 5.0.0 或更高版本。
2. 在所有 FE 的 `fe.conf` 中设置以下配置并重启 FE：

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

这两个配置均为非动态配置。`enable_feature_binlog` 开启 Row Binlog 和全局提交时间戳，`enable_table_stream` 开启 Table Stream DDL 和内部 Stream 管理。

### 基表要求

参与增量维护的基表必须是 Internal Catalog 中的 Doris OLAP 内表，并满足以下要求：

| 基表模型 | 是否支持 | 要求与行为 |
|---|---|---|
| Unique Key Merge-on-Write | 支持 | 必须开启 Row Binlog 和 before 镜像，可处理新增、更新和删除 |
| Duplicate Key | 支持 | 必须开启 Row Binlog；只提供追加变化，不记录通过删除谓词执行的删除 |
| Unique Key Merge-on-Read | 不支持 | 请改用 Merge-on-Write |
| Aggregate Key | 不支持增量维护 | 仅可作为 `excluded_trigger_tables` 中不参与增量触发的表 |
| 外表 | 不支持 | IVM 的增量基表必须是 Doris 内表 |

对于需要处理更新和删除的业务，建议使用 Unique Key Merge-on-Write 表，并在建表时设置：

```sql
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);
```

Row Binlog 只能在建表时开启，开启后不能关闭。完整的表模型、列类型、写入方式和 DDL 限制见 [Row Binlog](../../../data-operate/incremental/row-binlog)。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 首次配置 / 功能验证 -->

## 快速上手

下面的示例创建一个按订单状态聚合的 IVM。第一次使用 `COMPLETE` 建立完整基线，之后使用 `INCREMENTAL FALLBACK` 处理行级变化。

执行流程如下：

1. 创建开启 Row Binlog 的 Unique Key Merge-on-Write 基表。
2. 使用 `REFRESH INCREMENTAL FALLBACK` 创建 IVM。
3. 执行 `COMPLETE` 刷新，建立完整基线。
4. 修改基表数据并执行增量刷新。
5. 查询刷新任务，确认执行结果和回退原因。

### 第 1 步：创建基表并写入初始数据

创建支持更新和删除的基表，同时开启 Row Binlog 和 before 镜像：

```sql
CREATE DATABASE IF NOT EXISTS ivm_demo;
USE ivm_demo;

CREATE TABLE orders (
    order_id BIGINT,
    order_status VARCHAR(16),
    amount DECIMAL(10, 2)
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true",
    "binlog.enable" = "true",
    "binlog.format" = "ROW",
    "binlog.need_historical_value" = "true"
);

INSERT INTO orders VALUES
    (1, 'created', 100.00),
    (2, 'created', 200.00),
    (3, 'paid',    300.00);
```

### 第 2 步：创建 IVM

在 `CREATE MATERIALIZED VIEW` 中指定 `REFRESH INCREMENTAL`。本例同时指定 `FALLBACK`，当某次变化无法安全地增量计算时，Doris 可以回退到分区刷新或完整刷新。触发方式使用 `ON MANUAL`，便于逐步观察每次刷新的结果；生产环境通常改为定时或提交触发，见 [设置自动刷新间隔](#设置自动刷新间隔)。

```sql
CREATE MATERIALIZED VIEW orders_by_status
BUILD DEFERRED
REFRESH INCREMENTAL FALLBACK ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
AS
SELECT
    order_status,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY order_status;
```

创建成功后，Doris 会自动创建对应的内部 Table Stream。可以通过 `mv_infos` 查看映射关系：

```sql
SELECT Name, RefreshInfo, IvmBaseTableStreams
FROM mv_infos("database" = "ivm_demo")
WHERE Name = "orders_by_status";
```

### 第 3 步：建立完整基线

首次刷新使用 `COMPLETE`，为后续增量维护建立基线：

```sql
REFRESH MATERIALIZED VIEW orders_by_status COMPLETE;
```

刷新任务异步执行。任务成功后，查询物化视图：

```sql
SELECT order_status, order_count, total_amount
FROM orders_by_status
ORDER BY order_status;
```

```text
+--------------+-------------+--------------+
| order_status | order_count | total_amount |
+--------------+-------------+--------------+
| created      |           2 |       300.00 |
| paid         |           1 |       300.00 |
+--------------+-------------+--------------+
```

### 第 4 步：写入变化并执行增量刷新

下面依次更新订单 1、删除订单 2，并新增订单 4：

```sql
INSERT INTO orders VALUES (1, 'paid', 100.00);
DELETE FROM orders WHERE order_id = 2;
INSERT INTO orders VALUES (4, 'created', 400.00);

REFRESH MATERIALIZED VIEW orders_by_status INCREMENTAL FALLBACK;
```

刷新任务成功后，IVM 只处理上述行级变化。物化视图结果为：

```sql
SELECT order_status, order_count, total_amount
FROM orders_by_status
ORDER BY order_status;
```

```text
+--------------+-------------+--------------+
| order_status | order_count | total_amount |
+--------------+-------------+--------------+
| created      |           1 |       400.00 |
| paid         |           2 |       400.00 |
+--------------+-------------+--------------+
```

### 第 5 步：确认刷新方式和回退原因

查询最新刷新任务，确认请求方式、实际刷新范围和回退原因：

```sql
SELECT Status, TaskContext, RefreshMode, IvmFallbackReason, ErrorMsg
FROM tasks("type" = "mv")
WHERE MvDatabaseName = "ivm_demo"
  AND MvName = "orders_by_status"
ORDER BY CreateTime DESC, TaskId DESC
LIMIT 1;
```

- `TaskContext` 记录本次请求的刷新方式，例如 `INCREMENTAL`。
- `RefreshMode` 记录任务实际刷新的分区范围，可取 `COMPLETE`、`PARTIAL` 或 `NOT_REFRESH`。
- `IvmFallbackReason` 为空表示没有发生 IVM 回退；非空时记录稳定的回退原因。
- `ErrorMsg` 记录严格增量刷新失败的具体信息。

<!-- 知识类型: 兼容性参考 -->
<!-- 适用场景: 创建前 SQL 评估 / 不支持语法排查 -->

## 支持的查询

IVM 在创建物化视图时检查定义 SQL。使用显式 `REFRESH INCREMENTAL` 时，不支持的定义会直接创建失败。

### 支持的关系运算

| 运算 | 支持情况 |
|---|---|
| 列选择和表达式投影 | 支持 |
| `WHERE` 过滤 | 支持 |
| `GROUP BY` 聚合 | 支持，聚合必须位于查询顶层，聚合之上只能有投影 |
| `INNER JOIN`、`CROSS JOIN` | 支持 |
| `LEFT OUTER JOIN`、`RIGHT OUTER JOIN`、`FULL OUTER JOIN` | 支持；保留端必须具有确定性的行标识 |
| 嵌套外连接 | 支持；位于空值产生端的复杂子树会明显增大刷新计划 |
| `UNION ALL` | 支持 |
| 单行常量关系 | 支持；首次刷新会使用 `COMPLETE` 建立基线 |
| 子查询别名 | 支持 |
| 基于另一个 IVM 创建 IVM | 支持 |

以下形式不支持：

- `SELECT DISTINCT` 和 `UNION DISTINCT`。
- 带常量分支的 `UNION ALL`。
- `ORDER BY`、`LIMIT` 和窗口函数。
- Mark Join，例如包含析取条件的相关子查询转换出的 Join。
- 不在上述白名单中的计划节点。
- 使用普通异步物化视图作为 IVM 基表。链式维护要求下层物化视图本身也是 IVM。

### 支持的聚合函数

IVM 支持以下聚合函数，参数可以是列或确定性表达式：

- `COUNT(*)`、`COUNT(expr)`
- `SUM`
- `AVG`
- `MIN`
- `MAX`
- `BITMAP_UNION`
- `BITMAP_UNION_COUNT`
- `ARRAY_AGG`
- `COLLECT_LIST`

不支持带 `DISTINCT` 的聚合函数。`ARRAY_AGG` 不支持 JSONB 或 VARIANT 元素类型。

部分聚合函数在删除数据时无法只根据当前增量安全地得到新结果：

- 删除的值可能是当前 `MIN` 或 `MAX` 时，需要重新读取完整数据。
- 删除影响 Bitmap 聚合结果时，需要重新计算完整 Bitmap。

严格 `INCREMENTAL` 会在这些情况下失败；`INCREMENTAL FALLBACK` 会回退到 `COMPLETE`。

<!-- 知识类型: 运行机制 / 故障处理 -->
<!-- 适用场景: 刷新策略配置 / 自动刷新间隔 / IVM 回退排查 / 基线恢复 -->

## 刷新和回退

### 创建时选择刷新策略

| 定义 | 创建时行为 | 后续默认刷新行为 |
|---|---|---|
| `REFRESH INCREMENTAL` | 严格检查 IVM 支持范围，不支持则创建失败 | 只尝试 IVM，失败时任务失败 |
| `REFRESH INCREMENTAL FALLBACK` | 与严格模式相同，仍需通过 IVM 检查 | 先尝试 IVM，失败后按原因回退 |
| `REFRESH AUTO` | 先探测定义是否支持 IVM；不支持时按普通异步物化视图创建 | 对支持 IVM 的视图依次尝试 IVM、分区刷新和完整刷新 |
| `REFRESH PARTITIONS [FALLBACK]` | 要求物化视图定义 `PARTITION BY` | 重算变化分区；指定 `FALLBACK` 后可回退到完整刷新 |
| `REFRESH COMPLETE` | 不创建 IVM 元数据 | 始终完整刷新 |

### 设置自动刷新间隔

IVM 复用异步物化视图的触发方式，没有单独的触发语法。在 `REFRESH INCREMENTAL [FALLBACK]` 之后通过 `ON` 子句指定：

| 触发方式 | 语法 | 说明 |
|---|---|---|
| 手动触发 | `ON MANUAL` | 默认值。只在执行 `REFRESH MATERIALIZED VIEW` 时刷新 |
| 定时触发 | `ON SCHEDULE EVERY <interval> <unit> [STARTS '<start_time>']` | 按固定间隔自动执行增量刷新 |
| 提交触发 | `ON COMMIT` | 基表导入事务提交后自动执行增量刷新 |

定时触发的间隔规则如下：

- `<interval>` 必须是正整数，`<unit>` 支持 `MINUTE`、`HOUR`、`DAY`、`WEEK`。
- **最小刷新间隔为 `EVERY 1 MINUTE`。** 指定 `SECOND` 会报错 `interval time unit can not be second`。FE 配置 `enable_job_schedule_second_for_test` 可以放开秒级间隔，但该配置仅供测试，生产环境不要开启。
- `STARTS` 指定首次调度时间，格式为 `'yyyy-MM-dd HH:mm:ss'`，必须晚于当前时间。不指定时，第一次刷新在创建物化视图后经过一个间隔执行。后续调度时间固定为首次调度时间加整数倍间隔，不受上一次任务结束时间影响。

下面的示例每 5 分钟执行一次增量刷新，无法增量计算时允许回退：

```sql
CREATE MATERIALIZED VIEW orders_by_status
BUILD IMMEDIATE
REFRESH INCREMENTAL FALLBACK ON SCHEDULE EVERY 5 MINUTE
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
)
AS
SELECT
    order_status,
    COUNT(*) AS order_count,
    SUM(amount) AS total_amount
FROM orders
GROUP BY order_status;
```

定时触发和提交触发的任务按物化视图创建时定义的刷新策略执行：`INCREMENTAL` 只尝试 IVM，`INCREMENTAL FALLBACK` 先尝试 IVM 再按原因回退，`AUTO` 依次尝试 IVM、分区刷新和完整刷新。自动触发的任务还有以下行为：

- **首次自动刷新会自动建立基线。** 物化视图还没有刷新成功过时（例如使用 `BUILD DEFERRED` 创建后尚未刷新），第一次定时或提交触发的任务会自动执行 `COMPLETE` 建立完整基线，不需要手工执行 `COMPLETE`；之后的任务才执行增量刷新。
- **同一物化视图的刷新任务串行执行，多余的触发会被跳过。** 自动触发的任务最多保留一个正在运行和一个等待执行。当刷新间隔短于单次刷新耗时，或者 `ON COMMIT` 下基表提交非常频繁时，新的触发会被跳过，FE 指标 `async_materialized_view_task_skip_num` 累加。等待中的任务执行时会一次性消费积累的全部变化，因此不会丢失变化，但实际刷新延迟会大于设定间隔。选择间隔时，应保证正常负载下单次增量刷新能在一个间隔内完成。
- **`ON COMMIT` 只由参与增量维护的基表触发。** `excluded_trigger_tables` 中的基表提交不触发刷新，详见 [excluded_trigger_tables](#excluded_trigger_tables)。

修改触发方式时只指定 `ON` 子句，不要重复写 `INCREMENTAL`。IVM 的刷新方式不能通过 `ALTER` 修改，`ALTER MATERIALIZED VIEW ... REFRESH INCREMENTAL ...` 会被拒绝；只修改触发方式是允许的，修改后 Doris 会按新的触发方式重建调度任务：

```sql
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON SCHEDULE EVERY 1 MINUTE;
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON COMMIT;
ALTER MATERIALIZED VIEW orders_by_status REFRESH ON MANUAL;
```

### 手动覆盖刷新方式

IVM 创建后，可以根据需要执行：

```sql
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL FALLBACK;
REFRESH MATERIALIZED VIEW <mv_name> PARTITIONS;
REFRESH MATERIALIZED VIEW <mv_name> PARTITIONS FALLBACK;
REFRESH MATERIALIZED VIEW <mv_name> COMPLETE;
```

IVM 不允许使用旧的 `PARTITION (<partition_name>)` 或 `PARTITIONS (<partition_name>, ...)` 语法指定刷新分区。需要使用 `PARTITIONS` 关键字让 Doris 计算应刷新的分区，或者使用 `COMPLETE` 刷新全部数据。

### 回退顺序

当请求允许回退时，Doris 默认按以下顺序尝试：

```text
IVM -> PARTITIONS -> COMPLETE
```

某些失败表示现有 IVM 基线已不能安全使用，Doris 会跳过分区刷新并直接执行 `COMPLETE`。常见原因包括：

| `IvmFallbackReason` | 含义 | 恢复方式 |
|---|---|---|
| `BINLOG_BROKEN` | 上一次刷新未完整结束，或内部 Stream 无法继续使用 | 完整刷新并重新对齐基线 |
| `MIN_MAX_BOUNDARY_HIT` | 删除可能改变当前 `MIN` 或 `MAX` | 完整重算聚合结果 |
| `BITMAP_AGG_DELETE` | 删除影响 Bitmap 聚合 | 完整重算 Bitmap |
| `PLAN_SIGNATURE_MISMATCH` | 当前查询计划与已持久化的 IVM 布局不一致 | 完整刷新并建立新基线 |
| `INCOMPLETE_REFRESH_SNAPSHOT` | 还没有可供回退链使用的完整刷新快照 | 完整刷新建立基线 |

严格 `INCREMENTAL` 不执行回退。任务失败后，物化视图保留刷新前的数据，内部 Stream 消费位点也不会推进。处理错误后，可以重新执行增量刷新，或者执行 `COMPLETE` 重建基线。

### 首次刷新和基线重建

建议创建 IVM 后先执行一次 `COMPLETE`，再开始增量刷新。以下情况也可能要求重建完整基线：

- 物化视图或基表结构变化导致 IVM 布局签名变化。
- Row Binlog 或内部 Stream 的连续性被破坏。
- 扩大或移除 `ivm_partition_window_limit`，使之前被忽略的分区重新进入维护范围。
- 修改 `excluded_trigger_tables`，改变参与增量维护的基表集合。

存在待重建基线时，严格 `INCREMENTAL` 会失败并提示先执行 `AUTO` 或 `COMPLETE`。

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 增量计划验证 / 刷新数据预览 -->

## 预览和解释增量计划

### 使用 EXPLAIN 查看刷新计划

下面的命令只生成计划，不修改物化视图数据、内部 Stream 位点或 IVM 元数据：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL;
```

默认计划只包含当前有未消费数据的 Stream。需要检查完整的增量计划结构时，使用：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH ALL STREAMS;
```

`WITH ALL STREAMS` 会把当前已经消费完的 Stream 也放入计划，适合检查多表 Join 的完整增量形态。它不会改变任何持久化状态。

也可以解释完整刷新计划：

```sql
EXPLAIN REFRESH MATERIALIZED VIEW <mv_name> COMPLETE;
```

### 使用 DRY RUN 查看待写入数据

`WITH DRY RUN` 执行下一次增量刷新的增量查询并把结果返回给客户端，但不写入物化视图，也不推进 Stream 位点：

```sql
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN LIMIT 100;
REFRESH MATERIALIZED VIEW <mv_name> INCREMENTAL WITH DRY RUN LIMIT 100 OFFSET 200;
```

返回结果是刷新内部实际使用的写入行，因此除了业务列，还包含 IVM、Sequence 和 Delete Sign 等内部列。只要基表数据没有变化，重复执行会得到相同结果。

`DRY RUN` 只支持 IVM 的 `INCREMENTAL` 刷新，不能与 `COMPLETE`、`EXPLAIN` 或分区刷新组合使用。

<!-- 知识类型: 运维说明 -->
<!-- 适用场景: 内部 Stream 监控 / 生命周期管理 -->

## 内部 Table Stream

IVM 自动管理内部 Table Stream 的完整生命周期：

- 创建 IVM 时，为每张参与增量维护的基表创建内部 Stream。
- 修改 `excluded_trigger_tables` 时，按新的基表集合增加或删除内部 Stream。
- 删除 IVM 时，清理该物化视图拥有的内部 Stream。
- 刷新时按基表分区记录和推进消费位点。

通过 `mv_infos` 可以直接查看基表和内部 Stream 的映射：

```sql
SELECT Name, IvmBaseTableStreams
FROM mv_infos("database" = "<database_name>")
WHERE Name = "<mv_name>";
```

也可以在 `information_schema.table_streams` 和 `information_schema.table_stream_consumption` 中查看 Stream 状态和分区积压。

:::warning 不要手工管理内部 Stream
内部 Stream 以 `__doris_ivm_stream_` 开头，仅供 IVM 使用。不要对其执行 `INSERT INTO ... SELECT` 消费，也不要手工删除或重建。Doris 会拒绝把内部 Stream 用于普通 `INSERT INTO` 消费。
:::

Table Stream 的位点、快照和并发语义见 [Table Stream 基础](../../../data-operate/incremental/table-stream) 和 [Table Stream 进阶](../../../data-operate/incremental/table-stream-advanced)。

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: IVM Key 设计 / 增量分区窗口 / 刷新资源控制 -->

## IVM 属性

先根据行标识、分区窗口和触发关系选择属性，再结合下面的小节评估具体影响。

| 属性 | 默认值 | 是否可修改 | 作用 |
|---|---|---|---|
| `ivm_use_full_keys` | `false` | 否 | 把来源行标识 Key 加入物化视图的 Unique Key，降低 Hash 碰撞风险 |
| `ivm_partition_window_limit` | 不限制 | 是 | 只维护指定基表按分区值排序后的最后 N 个分区 |
| `excluded_trigger_tables` | 不排除 | 是 | 指定不创建内部 Stream、也不独立触发增量刷新的基表 |

### ivm_use_full_keys

`ivm_use_full_keys` 控制物化视图的 Unique Key 是否同时包含来源行的标识 Key：

| 项目 | 说明 |
|---|---|
| 类型 | Boolean |
| 默认值 | `false` |
| 是否可修改 | 否，只能在创建 IVM 时设置 |
| 作用 | 降低复合行标识使用 Hash 时发生碰撞的风险 |
| 代价 | 增加物化视图 Key 的宽度和存储开销 |

```sql
PROPERTIES (
    "ivm_use_full_keys" = "true"
)
```

当查询包含多表 Join、`UNION ALL` 或链式 IVM，并且业务更重视避免行标识 Hash 碰撞时，可以开启该属性。开启前应确认来源 Key 的类型和总长度满足 Doris Unique Key 限制。

### ivm_partition_window_limit

`ivm_partition_window_limit` 限制 IVM 每次只维护指定基表按分区值排序后的最后 N 个分区。格式为 `<table_name>:<partition_count>`，多张表用逗号分隔：

```sql
PROPERTIES (
    "ivm_partition_window_limit" = "orders:7,users:1"
)
```

该属性只限制 IVM 增量刷新读取的分区，不是物化视图分区保留策略。`COMPLETE` 仍会读取完整基表并建立完整结果。被窗口排除的旧分区变化不会进入后续 IVM 结果，因此这是有损配置，只适合业务明确只关心最近分区的场景。

可以通过 `ALTER MATERIALIZED VIEW ... SET` 修改该属性。扩大窗口或移除限制会要求下一次执行完整基线重建，因为先前被忽略的变化无法从已有位点恢复。

### excluded_trigger_tables

`excluded_trigger_tables` 中的基表不创建内部 Stream，也不独立触发增量刷新。刷新由其他基表变化触发时，Doris 仍会在计算中读取该表的当前数据。

只应排除变化很少的维表，或者业务允许其变化延迟到其他基表触发刷新时才进入结果。排除一张频繁变化的表会使物化视图在该表单独变化后保持旧结果。

### 资源和分区属性

- `workload_group`：指定刷新任务使用的 Workload Group，用于限制 CPU 和内存资源。
- `partition_sync_limit`、`partition_sync_time_unit`：控制物化视图保留和同步的分区范围，与 `ivm_partition_window_limit` 的增量读取窗口不同。
- `refresh_partition_num`：控制分区刷新和回退时单条 `INSERT` 处理的分区数量，不控制 IVM delta 的行数。

所有物化视图属性见 [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)。

<!-- 知识类型: 使用限制 -->
<!-- 适用场景: 生产上线评估 / 性能风险检查 -->

## 限制和注意事项

- IVM 只能在创建物化视图时启用。不能通过 `ALTER MATERIALIZED VIEW` 把普通物化视图改为 IVM，也不能把 IVM 改为其他默认刷新方式。需要切换时，请重建物化视图。
- 开启 Row Binlog 会增加写入和存储开销。Unique Key MoW 表还需要读取并保存更新前的值。只为确实需要 IVM 的基表开启，并在生产上线前使用真实负载评估导入吞吐。
- IVM 仍通过异步任务刷新，不提供与基表事务同步的实时一致性。刷新延迟取决于触发方式、排队时间和增量计划的执行时间。定时触发的最小间隔为 1 分钟，见 [设置自动刷新间隔](#设置自动刷新间隔)。
- 复杂的嵌套外连接会扩大增量计划，尤其是空值产生端的复杂子树。遇到规划或刷新开销过高时，可以简化 Join，或者先把复杂子树物化为下层 IVM。
- `MIN`、`MAX` 和 Bitmap 聚合在部分删除场景下需要完整重算。生产环境建议使用 `INCREMENTAL FALLBACK` 或 `AUTO`，并监控 `IvmFallbackReason`。
- Row Binlog 的表模型、列类型、Schema Change 和删除行为限制会直接影响 IVM，详见 [Row Binlog 的支持范围与限制](../../../data-operate/incremental/row-binlog#支持范围与限制)。

<!-- 知识类型: 常见问题 / 故障排查 -->
<!-- 适用场景: 创建失败 / 刷新回退 / 基线重建 / 数据延迟 -->

## 常见问题

遇到创建失败、刷新回退或数据未更新时，按下表定位原因。

| 问题 | 排查与处理 |
|---|---|
| `CREATE MATERIALIZED VIEW ... REFRESH INCREMENTAL` 创建失败 | 检查 FE 是否开启 `enable_feature_binlog` 和 `enable_table_stream`，基表是否满足模型与 Row Binlog 要求，以及定义 SQL 是否在 IVM 支持范围内 |
| 严格增量刷新提示重建基线 | 执行 `COMPLETE` 或 `AUTO` 刷新，建立新的完整基线后再执行严格增量刷新 |
| `ON SCHEDULE EVERY 30 SECOND` 报错 `interval time unit can not be second` | 定时刷新的最小间隔是 `EVERY 1 MINUTE`，单位只支持 `MINUTE`、`HOUR`、`DAY`、`WEEK`。需要更低延迟时改用 `ON COMMIT`，见 [设置自动刷新间隔](#设置自动刷新间隔) |
| 定时刷新的实际延迟大于设定间隔 | 同一物化视图的任务串行执行，单次刷新耗时超过间隔时多余触发会被跳过。检查 `tasks("type"="mv")` 中的任务耗时和 FE 指标 `async_materialized_view_task_skip_num`，拉长间隔、简化定义或通过 `workload_group` 增加刷新资源 |
| 刷新任务回退到 `COMPLETE` | 查询 `tasks("type"="mv")` 的 `IvmFallbackReason`，并根据 [回退顺序](#回退顺序) 中的原因处理 |
| 被排除的基表单独变化后，视图数据未更新 | `excluded_trigger_tables` 中的表不会独立触发刷新。等待其他基表变化触发刷新，或调整属性并按提示重建基线 |
| 能否手工消费或重置内部 Stream | 不能。内部 Stream 仅供 IVM 使用，由 Doris 管理生命周期和消费位点 |

<!-- 知识类型: 最佳实践 -->
<!-- 适用场景: 生产部署 / 资源规划 / 持续运维 -->

## 最佳实践

1. **先比较变化行数和分区大小。** 变化只占分区很小比例时优先考虑 IVM；变化覆盖大部分分区时，`PARTITIONS` 可能更简单。
2. **生产环境启用安全回退。** 使用 `INCREMENTAL FALLBACK` 或 `AUTO`，避免删除或基线问题让刷新长期失败。
3. **按刷新耗时选择触发方式和间隔。** 定时触发的最小间隔为 1 分钟，间隔应大于正常负载下单次增量刷新的耗时；需要更低延迟且基表提交不频繁时使用 `ON COMMIT`。
4. **先建立完整基线。** 创建后先运行 `COMPLETE`，确认结果正确，再开始增量刷新。
5. **更新和删除场景使用 Unique Key MoW。** Duplicate Key 表只适合追加型数据。
6. **为刷新任务隔离资源。** 通过 `workload_group` 避免复杂增量计划与在线查询争抢资源。
7. **监控任务和 Stream 积压。** 同时观察 `tasks("type"="mv")`、`mv_infos` 和 `information_schema.table_stream_consumption`。
8. **定期检查回退原因。** 偶发回退可以保证正确性；持续回退说明查询形态、Binlog 连续性或基线需要处理。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 示例环境清理 -->

## 清理示例

```sql
DROP MATERIALIZED VIEW orders_by_status;
DROP TABLE orders;
DROP DATABASE ivm_demo;
```

删除 IVM 时，Doris 会一并清理其内部 Table Stream，不需要单独执行 `DROP STREAM`。

<!-- 知识类型: 文档导航 -->

## 更多参考

- 异步物化视图的整体能力和适用场景：[异步物化视图概述](overview)
- 创建、查询和维护异步物化视图：[创建、查询与维护异步物化视图](functions-and-demands)
- 刷新策略选型与资源规划：[异步物化视图使用指南](use-guide)
- Row Binlog 的开启方式和限制：[Row Binlog](../../../data-operate/incremental/row-binlog)
- Table Stream 的消费、位点和快照语义：[Table Stream 基础](../../../data-operate/incremental/table-stream)
- 手动刷新语法：[REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)
- 查看 IVM 与内部 Stream 映射：[MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)
- 查看刷新范围和回退原因：[TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)
