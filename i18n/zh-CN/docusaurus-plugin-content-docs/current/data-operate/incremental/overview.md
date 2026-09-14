---
{
    "title": "变更数据与增量消费概述",
    "language": "zh-CN",
    "description": "Doris 5.0 起支持记录内表的行级变更（Row Binlog），并通过 Table Stream 按位点增量消费变更、按时间窗口查询增量、查询历史快照，本文介绍这组能力解决的问题、典型场景、能力矩阵与前置条件。"
}
---

<!-- 知识类型: 概念说明 + 选型指南 -->
<!-- 适用场景: 增量 ETL / 下游同步 / 变更审计 / 按时间窗口取增量 / 历史快照查询 -->

从 5.0 版本开始，Doris 可以为内表记录行级变更日志（Row Binlog），并在此基础上提供三种读取变更的方式：

- **Table Stream**：一个有名字的消费对象，替你记住"消费到哪了"，每次读取只返回上次消费之后的变化，读取和写入目标表在同一个事务里完成。
- **增量查询（`@incr`）**：不建对象，直接指定时间窗口读取某张表在这段时间内的变化。
- **时间旅行（`FOR TIME AS OF`）**：直接查询一张表在过去某个时刻的数据镜像。

:::caution 实验性功能
该功能自 5.0.0 版本起提供，目前处于实验阶段，默认关闭。开启方式见本文 [前置条件](#前置条件)。
:::

## 解决什么问题

在 Doris 内部做增量处理时，用户通常会遇到这些问题：

- **下游只想拿增量，拿不到**：上游表每天有大量更新和删除，下游报表、宽表、聚合表只能定期全量重算，或者依赖业务方在数据里维护 `update_time` 字段。
- **更新和删除不可见**：Unique Key 表的更新会直接覆盖旧值，删除的数据也会消失，事后无法知道"改了什么、删了什么"。
- **多张表的增量口径对不齐**：用增量数据关联维表时，维表是"现在"的状态，增量是"过去一段时间"的状态，两者口径不一致。
- **临时排查需要历史状态**：数据被误改、误删后，想看看某个时刻表里是什么样子。

Row Binlog 把每一行的新增、更新（含更新前后的值）、删除都记录下来，并带上全局单调递增的提交时间戳；Table Stream、增量查询和时间旅行则以不同的方式读取这些记录。

## 两层能力

```text
 INSERT / UPDATE / DELETE / Stream Load / ...
                     │
                     ▼
 ┌──────────────────────────────────────────────────────┐
 │ Row Binlog: op type, before/after images, commit TSO │
 └──────────────────────────────────────────────────────┘
        │                     │                      │
        ▼                     ▼                      ▼
  Table Stream          @incr query            FOR TIME AS OF
  (stateful,            (stateless,            (time travel,
   offset-based)         time window)           historical image)
```

| 能力 | 是否需要建对象 / 谁来记录读到哪 | 适合 |
|---|---|---|
| Table Stream | 需要 `CREATE STREAM`<br />Doris 按分区维护消费位点 | 持续的增量 ETL、下游同步、消费必须不重不漏 |
| 增量查询 `@incr` | 不需要<br />用户自己指定时间窗口 | 临时分析、外部调度系统自己管理位点 |
| 时间旅行 `FOR TIME AS OF` | 不需要<br />不涉及位点 | 查看历史状态、误操作排查、与增量数据对齐口径 |

## 典型场景

**1. 增量同步到下游表**

订单表每天有大量状态更新。创建一个 `min_delta` 类型的 Table Stream，定时执行 `INSERT INTO 下游表 SELECT ... FROM 订单表的 stream`，每次只处理两次执行之间的净变化：新增的订单、状态变化的订单（带变更前后的值）、被删除的订单。读取变更和写入下游在一个事务内完成，失败自动回滚、不会漏消费或重复消费。见 [Table Stream 基础](table-stream.md)。

**2. 只追加的日志、事件表**

对于只有新增没有更新的明细表，使用 `append_only` 类型的 Stream，每次只拿新写入的行，开销最小。见 [Table Stream 基础](table-stream.md#消费类型)。

**3. 变更审计与回放**

需要保留每一次修改的完整轨迹时，使用 `detail` 类型的 Stream，或用 `@incr` 的 `DETAIL` 模式按时间窗口导出逐条变更，落到审计表。见 [增量查询与时间旅行](incremental-query.md)。

**4. 增量数据关联维表时的口径对齐**

消费订单增量时需要关联用户表。用 `用户表的 stream@snapshot()` 读取与消费位点对齐的用户表镜像，避免"新订单关联到了旧用户信息"或者反过来。见 [Table Stream 进阶](table-stream-advanced.md#快照读取-snapshot)。

**5. 查看某个时刻的数据**

`SELECT * FROM orders FOR TIME AS OF '2026-09-14 10:00:00'` 直接返回表在该时刻的镜像，用于误操作排查、口径核对。见 [增量查询与时间旅行](incremental-query.md#时间旅行)。

## 能力一览

### 表模型支持

| 表模型 | Row Binlog / before 镜像 | 可用的变更类型 |
|---|---|---|
| Duplicate Key | 支持<br />不支持 before 镜像 | 仅 APPEND |
| Unique Key（Merge-on-Write，无 cluster key） | 支持<br />支持 before 镜像（`binlog.need_historical_value = true`） | APPEND / UPDATE_BEFORE / UPDATE_AFTER / DELETE |
| Unique Key（Merge-on-Read） | 不支持 | - |
| Aggregate Key | 不支持 | - |

其它限制（auto-increment 列、VARIANT 列、schema change 范围等）见 [Row Binlog](row-binlog.md#支持范围与限制)。

### 消费类型选型

| 你需要 | 选择 | 说明 |
|---|---|---|
| 只要新增的行 | `append_only` | 更新、删除不输出；开销最小 |
| 两次消费之间每个 key 的净变化 | `min_delta`（默认） | 同一 key 多次修改折叠成一条 UPDATE_BEFORE + UPDATE_AFTER；插入后又删除的 key 不输出 |
| 每一次修改的完整记录 | `detail` | 逐条输出，不折叠 |

`min_delta` 和 `detail` 中的 UPDATE_BEFORE / DELETE 需要 before 镜像，因此基表必须是 MoW 表且开启 `binlog.need_historical_value`。

## 前置条件

1. **版本**：Doris 5.0.0 及以上。
2. **FE 配置**：在 `fe.conf` 中开启以下两项并重启 FE（两项均为非动态配置）：

    ```text
    enable_feature_binlog = true
    enable_table_stream = true
    ```

    `enable_feature_binlog` 控制 Row Binlog 与提交时间戳（TSO）的分配，`enable_table_stream` 控制 Table Stream 的 DDL。未开启时，创建 Stream 会报 `Table Stream is experimental. Please set enable_table_stream=true to enable it.`。

3. **建表时开启 Row Binlog**：Row Binlog 只能在建表时开启，已有表无法通过 `ALTER TABLE` 开启，需要重建表并导入数据。
4. **部署模式**：Row Binlog 与 Table Stream 在存算一体、存算分离模式下均可使用；`@incr` 增量查询与时间旅行目前请在存算一体模式下使用，存算分离模式的支持仍在完善中。

:::tip 写入开销
开启 Row Binlog 后，每次写入需要额外生成并持久化变更记录，对 MoW 表还需要读取旧值，导入吞吐会有可感知的下降。建议只对确实需要增量消费的表开启，并在上线前用真实负载评估。
:::

## 文档导读

| 文档 | 内容 |
|---|---|
| [快速上手](quick-start.md) | 10 分钟走通建表、建 Stream、写入、查看变更、消费的完整流程 |
| [Row Binlog](row-binlog.md) | 开启方式、属性、支持范围、变更记录模型、对 DDL 的约束、开销与排查 |
| [增量查询与时间旅行](incremental-query.md) | `@incr` 时间窗口查询、三种增量模式、`FOR TIME AS OF` |
| [Table Stream 基础](table-stream.md) | 创建与管理、三种消费类型、初始数据、查询与消费的区别、虚拟列 |
| [Table Stream 进阶](table-stream-advanced.md) | 分区级位点、快照与重置、一致性关联、并发消费、基表变更的影响、监控与故障恢复 |
