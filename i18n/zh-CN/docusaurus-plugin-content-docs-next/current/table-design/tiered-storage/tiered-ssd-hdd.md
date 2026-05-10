---
{
    "title": "本地磁盘分层存储",
    "language": "zh-CN",
    "description": "Doris SSD 与 HDD 层级存储功能介绍：基于动态分区将热数据保留在 SSD、自动迁移冷数据至 HDD，平衡查询性能与存储成本。",
    "keywords": [
        "Doris 层级存储",
        "SSD HDD 冷热分离",
        "动态分区",
        "hot_partition_num",
        "storage_medium",
        "storage_cooldown_time",
        "冷热数据迁移"
    ]
}
---

<!-- 知识类型: 功能介绍 + 配置参数 + 操作步骤 -->
<!-- 适用场景: 冷热数据分离 / 存储成本优化 / 查询性能保障 -->

Doris 支持在 SSD 与 HDD 之间进行层级存储。通过结合动态分区，系统可以根据数据冷热特性，将热数据保留在 SSD、将冷数据自动迁移到 HDD，从而在保障热数据高性能读写的同时降低整体存储成本。

## 适用场景

本文档适用于以下场景：

- 表数据按时间分区，且具有明显的冷热访问特征
- 集群同时具备 SSD 与 HDD 存储介质
- 希望对近期热数据使用 SSD 加速查询，对历史冷数据使用 HDD 节约成本
- 希望通过动态分区自动管理数据生命周期，避免人工迁移

## 快速导航

- [核心概念](#核心概念)：动态分区与层级存储的关系
- [参数说明](#参数说明)：`hot_partition_num` 与 `storage_medium` 的使用
- [使用示例](#使用示例)：建表 SQL 与分区分布验证
- [常见问题（FAQ）](#常见问题-faq)：使用过程中常见问题
- [故障排查（Troubleshooting）](#故障排查-troubleshooting)：分区创建失败等异常处理

## 核心概念

<!-- 知识类型: 功能介绍 -->

层级存储基于动态分区实现。Doris 会根据分区的活跃程度自动选择存储介质，并在冷却时间到达后将数据迁移到目标介质。

### 热分区与冷分区

| 类型   | 说明                       | 存储介质 | 性能特点         |
| ------ | -------------------------- | -------- | ---------------- |
| 热分区 | 最近活跃、频繁访问的分区   | SSD      | 高 IOPS，低延迟  |
| 冷分区 | 历史数据，访问频率较低     | HDD      | 容量大，成本低   |

### 工作机制

层级存储的执行流程如下：

1. 创建表时启用动态分区，并指定 `dynamic_partition.storage_medium = HDD`。
2. 通过 `dynamic_partition.hot_partition_num` 指定最近 N 个分区为热分区，存放在 SSD 上。
3. 系统为每个热分区设置 `storage_cooldown_time`（冷却时间）。
4. 冷却时间到达后，分区数据从 SSD 自动迁移至 HDD。

更多动态分区相关内容，请参考：[数据划分 - 动态分区](../../table-design/data-partitioning/dynamic-partitioning)。

## 参数说明

<!-- 知识类型: 配置参数 -->

层级存储依赖以下两个动态分区参数：

| 参数                                 | 作用                                                       | 默认值 | 备注                                       |
| ------------------------------------ | ---------------------------------------------------------- | ------ | ------------------------------------------ |
| `dynamic_partition.hot_partition_num` | 指定最近多少个分区为热分区，存储在 SSD 上                  | 无     | 必须配合 `storage_medium = HDD` 使用       |
| `dynamic_partition.storage_medium`    | 指定动态分区的最终存储介质                                 | HDD    | 设为 SSD 时 `hot_partition_num` 不再生效   |

### dynamic_partition.hot_partition_num

- **功能**：指定最近 N 个分区为热分区，这些分区存储在 SSD 上，其余分区存储在 HDD 上。
- **使用条件**：
    - 必须同时设置 `dynamic_partition.storage_medium = HDD`，否则该参数不会生效。
    - 存储路径下必须存在 SSD 设备，否则分区创建会失败。

**示例说明**：

假设当前日期为 **2021-05-20**，按天分区，动态分区配置如下：

```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

系统会自动创建以下分区，并配置对应的存储介质和冷却时间：

```Plain
p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

### dynamic_partition.storage_medium

- **功能**：指定动态分区的最终存储介质，可选 `HDD`（默认）或 `SSD`。
- **注意事项**：
    - 当设置为 `SSD` 时，`hot_partition_num` 参数失效。
    - 此时所有分区均使用 SSD 存储，冷却时间统一为 `9999-12-31 23:59:59`，即不进行迁移。

## 使用示例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 建表 / 验证存储介质分布 -->

下述步骤展示如何创建一张支持层级存储的表，并验证分区的存储介质分布。

### 步骤一：创建分层存储表

目的：建表并启用 SSD/HDD 分层存储，最近 2 个分区使用 SSD，其余使用 HDD。

```sql
CREATE TABLE tiered_table (k DATE)
PARTITION BY RANGE(k)()
DISTRIBUTED BY HASH (k) BUCKETS 5
PROPERTIES
(
    "dynamic_partition.storage_medium" = "hdd",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.hot_partition_num" = "2",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "5",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.start" = "-3"
);
```

### 步骤二：检查分区存储介质

目的：确认分区是否按预期分配到 SSD 和 HDD。

```sql
SHOW PARTITIONS FROM tiered_table;
```

预期输出：共 7 个分区，其中 5 个使用 SSD，2 个使用 HDD。

```Plain
p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```

## 常见问题（FAQ）

<!-- 知识类型: FAQ -->

### Q1：`hot_partition_num` 不生效怎么办？

请确认是否同时设置了 `dynamic_partition.storage_medium = HDD`。仅当最终介质为 HDD 时，热分区配置才会生效。

### Q2：可以只用 SSD 存储吗？

可以。将 `dynamic_partition.storage_medium` 设置为 `SSD`，所有分区都会使用 SSD，并且不会发生冷却迁移。此时无需配置 `hot_partition_num`。

### Q3：冷却时间到达后数据如何迁移？

当分区的 `storage_cooldown_time` 到达后，系统会自动将该分区数据从 SSD 迁移到 HDD，无需人工干预。

### Q4：层级存储和冷热数据归档（如对象存储）的区别？

SSD/HDD 层级存储用于本地不同磁盘介质间的数据流动，适合中短期冷热分离。若需将历史数据归档到对象存储（S3/HDFS 等），请参考冷热数据分层存储相关文档。

## 故障排查（Troubleshooting）

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 建表失败 / 分区创建失败 -->

| 错误现象                       | 可能原因                              | 解决方案                                                       |
| ------------------------------ | ------------------------------------- | -------------------------------------------------------------- |
| 分区创建失败                   | 存储路径下没有 SSD 设备               | 在 BE 节点上配置 SSD 存储路径，或调整为仅使用 HDD 存储         |
| `hot_partition_num` 设置无效   | 未设置 `storage_medium = HDD`         | 同时配置 `dynamic_partition.storage_medium = HDD`              |
| 所有分区均为 SSD，未冷却到 HDD | `storage_medium` 被设置为 `SSD`       | 将 `storage_medium` 改为 `HDD`，并配置 `hot_partition_num`     |
| 数据未按预期迁移到 HDD         | `storage_cooldown_time` 尚未到达      | 等待冷却时间到达，或检查时间设置是否正确                       |
