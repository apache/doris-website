---
{
    "title": "读写分离与主备集群 File Cache 预热配置指南",
    "sidebar_label": "读写分离：File Cache 预热",
    "language": "zh-CN",
    "description": "介绍 Doris File Cache 主动增量预热机制，支持读写分离和主备集群架构，涵盖计算组级和表级事件驱动预热、任务创建、状态观测、指标监控及常见问题排查。",
    "keywords": ["读写分离", "主备集群", "File Cache 预热", "主动增量预热", "表级别预热", "ON TABLES", "compute group 同步", "高可用"]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 读写分离部署 / 主备集群高可用 / File Cache 预热 -->

## 背景与适用场景

在 Apache Doris 存算分离架构中，多个计算组（Compute Group）可以共享同一份远端存储数据。写入计算组负责导入、Compaction 或 Schema Change，查询计算组负责在线查询。新 Rowset 生成后，如果查询计算组尚未将对应文件加载到本地 File Cache，首次查询就需要访问对象存储或 HDFS，容易带来查询延迟抖动。

File Cache 主动增量预热用于在写入侧产生新数据后，提前将相关 Segment 和索引文件预热到目标计算组的本地缓存中。它主要适用于以下场景：

| 场景 | 说明 | 核心收益 |
|------|------|----------|
| 读写分离 | 写入计算组持续导入数据，查询计算组只负责查询 | 降低查询计算组读取新数据时的 Cache Miss |
| 主备集群高可用 | 备计算组持续同步主计算组热点数据 | 缩短故障切换后的冷缓存恢复时间 |
| 多租户或分层数仓 | 不同查询计算组只访问部分业务库表 | 通过表级过滤减少无效预热和缓存占用 |
| 成本优化 | 表数量较多，但热点查询集中在少量表 | 降低远端存储读取和网络传输开销 |

:::tip 版本信息
File Cache 主动增量预热功能已在 Apache Doris 3.1.0 版本中引入。表级事件驱动预热是在主动增量预热基础上增加的 `ON TABLES` 过滤能力，用于按库表范围控制需要预热的新写入数据。
:::

## 功能概览

File Cache 主动预热支持三类同步模式：

| 同步模式 | 参数值 | 适用场景 |
|------|--------|----------|
| 一次性同步 | `once` | 新计算组上线时手动触发初始预热 |
| 周期性同步 | `periodic` | 按固定间隔同步热点数据，适用于持续保温场景 |
| 事件驱动同步 | `event_driven` | 自动预热 Load、Compaction、Schema Change 过程中产生的数据 |

事件驱动同步又可以分为两种范围：

| 范围 | 语法形态 | 说明 |
|------|----------|------|
| 计算组级事件驱动预热 | 不带 `ON TABLES` | 源计算组上符合事件类型的新写入数据都会触发预热 |
| 表级事件驱动预热 | 带 `ON TABLES (...)` | 只有匹配规则的表产生新写入数据时才触发预热 |

表级事件驱动预热适合只关心部分核心表的查询计算组。与计算组级预热相比，它可以减少不必要的远端读取、网络传输和目标计算组缓存占用。

## 创建预热任务

### 一次性同步

一次性同步适用于新计算组上线时的初始预热：

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>;
```

### 周期性同步

周期性同步适用于持续保持热点数据同步：

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);
```

`sync_interval_sec` 表示同步间隔，单位为秒，默认值为 `600`。

### 计算组级事件驱动预热

计算组级事件驱动预热适用于读写分离场景，会监听源计算组上的写入事件，并将 Load、Compaction、Schema Change 过程中产生的数据预热到目标计算组：

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

`sync_event`：创建事件驱动预热任务时，当前请配置为 `load`。

### 表级事件驱动预热

表级事件驱动预热在计算组级事件驱动预热的基础上增加 `ON TABLES` 子句，用于指定需要预热的库表范围：

```sql
WARM UP COMPUTE GROUP <target_compute_group> WITH COMPUTE GROUP <source_compute_group>
ON TABLES (
    INCLUDE '<database_pattern>.<table_pattern>'
    [, INCLUDE '<database_pattern>.<table_pattern>' ...]
    [, EXCLUDE '<database_pattern>.<table_pattern>' ...]
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

参数说明：

| 参数 | 是否必选 | 说明 |
|------|----------|------|
| `<target_compute_group>` | 是 | 目标计算组名称。匹配表的新写入数据会被预热到该计算组的本地 File Cache |
| `<source_compute_group>` | 是 | 源计算组名称。系统监听该计算组上的写入事件 |
| `ON TABLES` | 否 | 表级过滤规则。省略时为计算组级事件驱动预热 |
| `INCLUDE` | 使用 `ON TABLES` 时必选 | 声明需要纳入预热范围的库表模式，至少需要一条 |
| `EXCLUDE` | 否 | 从 `INCLUDE` 结果中排除不需要预热的库表模式 |
| `sync_mode` | 是 | 表级事件驱动预热固定使用 `event_driven` |
| `sync_event` | 是 | 表级事件驱动预热当前用于 `load` 事件 |

:::caution 注意
同一对源计算组和目标计算组之间，不要同时配置计算组级 `load` 事件驱动预热和表级 `ON TABLES` 事件驱动预热。两者语义存在重叠，系统会在创建阶段拒绝冲突配置。需要从计算组级切换到表级时，先取消旧 Job，再创建新的 `ON TABLES` Job。
:::

## ON TABLES 匹配规则

### 模式格式

`ON TABLES` 中的模式必须使用 `'库名.表名'` 格式，并用单引号包裹。支持以下通配符：

| 通配符 | 含义 | 示例 |
|--------|------|------|
| `*` | 匹配任意数量的任意字符，包括零个字符 | `'ods.*'` 匹配 `ods` 库下所有表 |
| `?` | 匹配恰好一个任意字符 | `'logs.access_202?'` 匹配 `logs.access_2020` 到 `logs.access_2029` |

不使用通配符时为精确匹配，例如 `'sales.orders'` 只匹配 `sales` 库中的 `orders` 表。

常见模式示例：

| 模式 | 含义 |
|------|------|
| `'mydb.*'` | 匹配 `mydb` 库下所有表 |
| `'*.orders'` | 匹配所有库中名为 `orders` 的表 |
| `'dw.fact_*'` | 匹配 `dw` 库下 `fact_` 开头的表 |
| `'*.*_bak'` | 匹配所有库中 `_bak` 结尾的表 |
| `'sales.orders'` | 精确匹配 `sales.orders` |

### INCLUDE 和 EXCLUDE

系统按以下逻辑计算最终预热范围：

```text
最终预热范围 = 所有 INCLUDE 规则匹配到的表 - 所有 EXCLUDE 规则匹配到的表
```

规则说明：

- `INCLUDE` 和 `EXCLUDE` 的书写顺序不影响最终结果。
- 至少需要一条 `INCLUDE` 规则，不能只写 `EXCLUDE`。
- 多条 `INCLUDE` 规则之间是并集关系。
- 多条 `EXCLUDE` 规则会从 `INCLUDE` 的候选集合中继续排除。
- 匹配遵循 Doris 库名和表名规则，建议使用与实际库表完全一致的大小写。

示例：

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP write_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dw.fact_*',
    INCLUDE 'dw.dim_*',
    EXCLUDE 'ods.tmp_*',
    EXCLUDE '*.*_bak'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

该示例会预热：

- `ods` 库下除 `tmp_` 前缀以外的表；
- `dw` 库下 `fact_` 和 `dim_` 前缀的表；
- 排除所有库中 `_bak` 结尾的备份表。

### 物化视图

`ON TABLES` 规则同时匹配普通表和异步物化视图。异步物化视图在数据库目录中作为独立表存在，会按照名称被 `INCLUDE` 和 `EXCLUDE` 规则匹配。

同步物化视图（Rollup）是基表的内部索引，不是独立表。当基表被预热时，其同步物化视图相关数据会随基表一起处理，无需单独配置。

## 使用示例

### 只预热指定表

```sql
WARM UP COMPUTE GROUP report_cg WITH COMPUTE GROUP business_cg
ON TABLES (
    INCLUDE 'sales.orders',
    INCLUDE 'sales.customers',
    INCLUDE 'inventory.stock_level'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 预热整个数据库

```sql
WARM UP COMPUTE GROUP analytics_cg WITH COMPUTE GROUP load_cg
ON TABLES (
    INCLUDE 'analytics_db.*'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 预热多个库并排除临时表

```sql
WARM UP COMPUTE GROUP query_cg WITH COMPUTE GROUP etl_cg
ON TABLES (
    INCLUDE 'ods.*',
    INCLUDE 'dwd.*',
    INCLUDE 'dws.*',
    EXCLUDE '*.tmp_*',
    EXCLUDE '*.*_backup'
)
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

### 同一张表预热到多个目标计算组

如果同一张表需要服务多个查询计算组，需要为每个目标计算组分别创建 Job：

```sql
WARM UP COMPUTE GROUP realtime_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");

WARM UP COMPUTE GROUP batch_cg WITH COMPUTE GROUP write_cg
ON TABLES (INCLUDE 'sales.orders')
PROPERTIES ("sync_mode" = "event_driven", "sync_event" = "load");
```

## 管理预热任务

### 查看任务

查看所有预热任务：

```sql
SHOW WARM UP JOB;
```

查看指定任务：

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

结果字段说明：

| 字段名 | 说明 |
|--------|------|
| `JobId` | 预热任务唯一 ID |
| `SrcComputeGroup` | 源计算组名称 |
| `DstComputeGroup` | 目标计算组名称 |
| `Status` | 任务状态，例如 `PENDING`、`RUNNING`、`FINISHED`、`CANCELLED` |
| `Type` | 预热范围。`CLUSTER` 表示计算组级，`TABLE` 表示指定表，`TABLES` 表示 `ON TABLES` 规则匹配 |
| `SyncMode` | 同步模式，例如 `ONCE`、`PERIODIC(interval_sec)`、`EVENT_DRIVEN(event)` |
| `CreateTime` | 任务创建时间 |
| `StartTime` | 最近一次开始时间 |
| `FinishBatch` | 已完成的 batch 数量 |
| `AllBatch` | 总 batch 数量 |
| `FinishTime` | 最近一次完成时间。事件驱动任务通常持续运行 |
| `ErrMsg` | 最近一次错误信息，无错误时为空 |
| `Tables` | 显式指定的表列表，主要用于一次性或周期性表级预热 |
| `TableFilter` | `ON TABLES` 规则的规范化展示。计算组级任务为空 |
| `MatchedTables` | 当前实际匹配到的表名列表，会随定期刷新反映表新增、删除或重命名 |
| `SyncStats` | 事件驱动任务的同步进度。列表查询展示摘要，按 ID 查询展示详细 JSON |

`SHOW WARM UP JOB` 列表适合日常巡检。为了避免列表过宽，`SyncStats` 会展示最近 30 分钟的摘要：

```json
{
  "window": "30m",
  "src_size": "58.2mb",
  "dst_size": "57.5mb",
  "gap_size": "716kb",
  "trigger_gap_ms": 1200
}
```

按 Job ID 查询时，`SyncStats` 会展示更详细的 5 分钟、30 分钟和 1 小时窗口指标：

```sql
SHOW WARM UP JOB WHERE id = <job_id>;
```

`SyncStats` 示例：

```json
{
  "seg_num": {
    "requested_5m": 42,
    "finish_5m": 40,
    "gap_5m": 2,
    "fail_5m": 0,
    "requested_30m": 180,
    "finish_30m": 178,
    "gap_30m": 2,
    "fail_30m": 0,
    "requested_1h": 320,
    "finish_1h": 318,
    "gap_1h": 2,
    "fail_1h": 0
  },
  "seg_size": {
    "requested_5m": "12.5mb",
    "finish_5m": "11.8mb",
    "gap_5m": "716kb",
    "fail_5m": "0b",
    "requested_30m": "58.2mb",
    "finish_30m": "57.5mb",
    "gap_30m": "716kb",
    "fail_30m": "0b",
    "requested_1h": "102.3mb",
    "finish_1h": "101.6mb",
    "gap_1h": "716kb",
    "fail_1h": "0b"
  },
  "idx_num": {
    "requested_5m": 10,
    "finish_5m": 10,
    "gap_5m": 0,
    "fail_5m": 0
  },
  "idx_size": {
    "requested_5m": "2.1mb",
    "finish_5m": "2.1mb",
    "gap_5m": "0b",
    "fail_5m": "0b"
  },
  "last_trigger_ts": "14:32:15",
  "last_finish_ts": "14:32:18",
  "progress_trigger_ts": "14:32:14",
  "trigger_gap_ms": 1000
}
```

重点关注以下字段：

| 字段 | 说明 |
|------|------|
| `requested_*` | 源计算组已提交的预热请求量 |
| `finish_*` | 目标计算组已完成的预热量 |
| `gap_*` | 缺口，表示尚未完成的量 |
| `fail_*` | 目标计算组预热失败量 |
| `last_trigger_ts` | 最近一次预热触发时间 |
| `progress_trigger_ts` | 目标计算组当前预热进度对应的上游触发时间 |
| `last_finish_ts` | 最近一次预热完成时间 |
| `trigger_gap_ms` | 源端最新触发时间与目标端进度水位之间的时间差，单位毫秒 |

### 取消任务

```sql
CANCEL WARM UP JOB WHERE id = <job_id>;
```

取消后，系统停止监听该 Job 对应的事件并停止继续触发预热。已经写入目标计算组 File Cache 的数据不会被主动清除，会按正常缓存淘汰策略释放。

当前版本不支持直接修改已有 Job 的 `ON TABLES` 规则。如需调整预热范围，需要先取消旧 Job，再创建新 Job。

## 匹配刷新与行为说明

### 新建、删除和重命名表

`ON TABLES` 规则会在 Job 创建时执行，并在任务运行过程中定期重新评估。默认刷新周期为 60 秒。

这意味着：

- 创建 Job 后新建的表，如果名称匹配规则，会在后续刷新周期中自动纳入预热范围。
- 已匹配的表被删除后，会在后续刷新周期中从 `MatchedTables` 中移除。
- 已匹配的表被重命名后，是否继续预热取决于新名称是否仍匹配规则。

在新表创建到下一次规则刷新之间，可能存在最长 60 秒的延迟窗口。延迟窗口内对新表写入的数据不会触发该表级 Job 的预热；刷新后发生的新写入会正常触发。

### 创建时无匹配表

创建表级事件驱动预热 Job 时，`ON TABLES` 规则需要至少匹配一张已存在的表。如果没有任何表匹配，创建会失败。请检查库名、表名和通配符是否正确。

如果希望提前配置预热关系，建议先创建至少一张符合规则的表，再创建预热 Job。

### Schema Change

`ON TABLES` 只决定表集合，不改变事件类型本身的触发语义。对于当前 Job 已配置且当前版本支持的事件类型，产生的新数据会按所属表的匹配结果处理；如果 Job 配置为 `sync_event = "load"`，则只监听对应的导入事件。

## 工作原理

### 周期性同步执行流程

1. FE 注册任务并记录同步间隔。
2. FE 周期性检查是否到达触发时间。
3. 到达触发时间后，FE 将待预热的表或分区转换为对应 Tablet 并分发任务。
4. BE 从远端存储读取文件并写入目标计算组的 File Cache。

### 事件驱动同步执行流程

1. 用户创建事件驱动 Job，FE 持久化该同步关系。
2. FE 将事件驱动配置下发到源计算组 BE。
3. 源计算组 BE 在写入事件提交后触发预热逻辑。
4. 对于表级事件驱动 Job，源 BE 只处理当前匹配表集合内的 Rowset。
5. 目标计算组 BE 下载对应 Segment 和索引文件，写入本地 File Cache。
6. FE 通过 `SHOW WARM UP JOB` 和 FE 指标暴露任务状态与同步进度。

## 指标监控

### SQL 观测

最直接的观测方式是使用 `SHOW WARM UP JOB`：

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE id = <job_id>;
```

使用建议：

- `gap_size` 或详细 `gap_*` 持续趋近于 0，表示目标计算组基本跟上源计算组写入速度。
- `trigger_gap_ms` 趋近于 0，表示目标计算组已经追上源计算组最新触发事件。
- `fail_*` 大于 0 时，需要结合 BE 日志排查磁盘空间、远端存储访问或网络错误。
- 5 分钟窗口适合看实时波动，30 分钟和 1 小时窗口适合看持续趋势。

### FE Prometheus 指标

在 cloud 模式下，FE 会周期性从 BE 拉取并聚合事件驱动预热进度，默认每 15 秒刷新一次。刷新间隔由 FE 配置项 `cloud_warm_up_sync_stats_refresh_interval_ms` 控制，默认值为 `15000` 毫秒。

可以从 FE `/metrics` 采集以下指标：

| 指标名 | 说明 |
|--------|------|
| `doris_fe_file_cache_warm_up_sync_job_info` | Job 元信息，值恒为 1。包含 `job_id`、`job_type`、`sync_mode`、`sync_event`、`job_state`、源/目标计算组等标签 |
| `doris_fe_file_cache_warm_up_sync_job_size_bytes` | 源端已提交和目标端已完成的预热总大小，单位为字节。包含 `side` 和 `window` 标签 |
| `doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms` | 源端最新触发时间与目标端进度水位之间的时间差，单位为毫秒 |

常用 PromQL 示例：

```promql
# 每个 Job 最近 5 分钟源端已提交的预热总大小
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}

# 每个 Job 最近 5 分钟目标端已完成的预热总大小
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# 每个 Job 最近 5 分钟的同步大小缺口
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="src",window="5m"}
  - ignoring(side)
doris_fe_file_cache_warm_up_sync_job_size_bytes{side="dst",window="5m"}

# 每个 Job 的触发进度时间差
doris_fe_file_cache_warm_up_sync_job_trigger_gap_ms
```

`ignoring(side)` 表示在计算源端和目标端大小差值时忽略 `side` 标签，让 Prometheus 可以把同一个 Job、同一个窗口下的 `src` 和 `dst` 序列对齐相减。

## 完整操作流程

1. 查看当前计算组，确认源计算组和目标计算组名称：

    ```sql
    SHOW COMPUTE GROUPS;
    ```

2. 确认需要预热的库表范围：

    ```sql
    SHOW TABLES FROM ods;
    SHOW TABLES FROM dw;
    ```

3. 创建表级事件驱动预热 Job：

    ```sql
    WARM UP COMPUTE GROUP read_cg WITH COMPUTE GROUP write_cg
    ON TABLES (
        INCLUDE 'ods.*',
        INCLUDE 'dw.fact_*',
        EXCLUDE 'ods.tmp_*'
    )
    PROPERTIES (
        "sync_mode" = "event_driven",
        "sync_event" = "load"
    );
    ```

4. 查看 Job 状态和匹配表：

    ```sql
    SHOW WARM UP JOB;
    ```

5. 写入数据后观察同步进度：

    ```sql
    SHOW WARM UP JOB WHERE id = <job_id>;
    ```

6. 如需调整规则，取消旧 Job 后重新创建：

    ```sql
    CANCEL WARM UP JOB WHERE id = <job_id>;
    ```

## 最佳实践

- 查询计算组只访问少量核心表时，优先使用表级事件驱动预热，避免计算组级预热占用过多缓存空间。
- 对于库表命名规范清晰的数仓，使用 `INCLUDE 'dws.*'`、`INCLUDE 'ads.*'`、`EXCLUDE '*.tmp_*'` 这类规则维护成本更低。
- 避免让多个 Job 覆盖同一批热点表，否则虽然目标端会尽量避免重复下载，但任务管理和指标解释会变复杂。
- 需要修改预热范围时，使用取消并重建的方式，不要依赖旧 Job 自动改变规则。
- 通过 `SHOW WARM UP JOB` 观察单个 Job 详情，通过 FE Prometheus 指标接入 Grafana 做长期趋势监控。

## 常见问题

**Q：什么时候应该使用表级事件驱动预热？**

当目标计算组只查询部分库表，或者源计算组表数量很多但热点表较少时，使用表级事件驱动预热可以减少无效预热和缓存污染。

**Q：不使用 `ON TABLES` 时是什么行为？**

不使用 `ON TABLES` 时为计算组级事件驱动预热，源计算组上符合事件类型的新写入数据都会触发预热。

**Q：`INCLUDE` 和 `EXCLUDE` 的顺序有影响吗？**

没有影响。系统先计算所有 `INCLUDE` 的并集，再从中移除所有 `EXCLUDE` 匹配的表。

**Q：创建 Job 后新建了符合规则的表，会自动预热吗？**

会。系统会定期重新评估规则，新表会在后续刷新周期中纳入预热范围。默认刷新周期为 60 秒。

**Q：表被重命名后还会继续预热吗？**

取决于新表名是否仍匹配 `ON TABLES` 规则。匹配则继续预热，不匹配则在后续刷新周期中停止预热。

**Q：可以只预热某个分区的新写入数据吗？**

表级事件驱动预热的过滤粒度是表，不支持在 `ON TABLES` 中指定分区。被匹配表上的新写入数据都会按表级规则处理。

**Q：如何验证预热是否生效？**

可以先通过 `SHOW WARM UP JOB WHERE id = <job_id>` 查看 `Status`、`MatchedTables` 和 `SyncStats`，确认 Job 正常运行且同步缺口趋近于 0。随后在目标计算组上查询相关表，结合 File Cache 命中率、FE 指标和 BE 日志确认是否仍存在大量远端读取。

**Q：修改同步任务的配置需要怎么操作？**

当前版本不支持直接修改已有任务配置。需要先执行 `CANCEL WARM UP JOB WHERE id = <job_id>` 取消旧任务，再创建新任务。
