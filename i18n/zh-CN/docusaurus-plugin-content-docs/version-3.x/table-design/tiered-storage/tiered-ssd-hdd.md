---
{
    "title": "SSD 和 HDD 层级存储",
    "language": "zh-CN",
    "description": "Doris 支持在不同磁盘类型（SSD 和 HDD）之间进行分层存储，结合动态分区功能，根据冷热数据的特性将数据从 SSD 动态迁移到 HDD。这种方式既降低了存储成本，又在热数据的读写上保持了高性能。"
}
---

Doris 支持在不同磁盘类型（SSD 和 HDD）之间进行分层存储，结合动态分区功能，根据冷热数据的特性将数据从 SSD 动态迁移到 HDD。这种方式既降低了存储成本，又在热数据的读写上保持了高性能。

## 动态分区与层级存储

通过配置动态分区参数，用户可以设置哪些分区存储在 SSD 上，以及冷却后自动迁移到 HDD 上。

- **热分区**：最近活跃的分区，优先存储在 SSD 上，保证高性能。
- **冷分区**：较少访问的分区，会逐步迁移到 HDD，以降低存储开销。

有关动态分区的更多信息，请参考：[数据划分 - 动态分区](../../table-design/data-partitioning/dynamic-partitioning)。


## 参数说明

### `dynamic_partition.hot_partition_num`

- **功能**：
  - 指定最近的多少个分区为热分区，这些分区存储在 SSD 上，其余分区存储在 HDD 上。

- **注意**：
  - 必须同时设置 `dynamic_partition.storage_medium = HDD`，否则此参数不会生效。
  - 如果存储路径下没有 SSD 设备，则该配置会导致分区创建失败。

**示例说明**：

假设当前日期为 **2021-05-20**，按天分区，动态分区配置如下：
```sql
dynamic_partition.hot_partition_num = 2
dynamic_partition.start = -3
dynamic_partition.end = 3
```

系统会自动创建以下分区，并配置其存储介质和冷却时间：

  ```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
  ```

### `dynamic_partition.storage_medium`

- **功能**：
  - 指定动态分区的最终存储介质。默认是 HDD，可选择 SSD。

- **注意**：
  - 当设置为 SSD 时，`hot_partition_num` 属性将不再生效，所有分区将默认为 SSD 存储介质并且冷却时间为 9999-12-31 23:59:59。

## 示例

### 1. 创建一个分层存储表

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
        "dynamic_partition.create_history_partition"= "true",
        "dynamic_partition.start" = "-3"
    );
```

### 2. 检查分区存储介质

```sql
    SHOW PARTITIONS FROM tiered_table;
```

可以看见 7 个分区，5 个使用 SSD, 其它的 2 个使用 HDD。

```Plain
  p20210517：["2021-05-17", "2021-05-18") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210518：["2021-05-18", "2021-05-19") storage_medium=HDD storage_cooldown_time=9999-12-31 23:59:59
  p20210519：["2021-05-19", "2021-05-20") storage_medium=SSD storage_cooldown_time=2021-05-21 00:00:00
  p20210520：["2021-05-20", "2021-05-21") storage_medium=SSD storage_cooldown_time=2021-05-22 00:00:00
  p20210521：["2021-05-21", "2021-05-22") storage_medium=SSD storage_cooldown_time=2021-05-23 00:00:00
  p20210522：["2021-05-22", "2021-05-23") storage_medium=SSD storage_cooldown_time=2021-05-24 00:00:00
  p20210523：["2021-05-23", "2021-05-24") storage_medium=SSD storage_cooldown_time=2021-05-25 00:00:00
```
