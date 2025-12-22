---
{
    "title": "catalog_meta_cache_statistics",
    "language": "zh-CN",
    "description": "查看当前连接的 FE 中，External Catalog 的元数据缓存信息。"
}
---

## 概述

查看当前连接的 FE 中，External Catalog 的元数据缓存信息。

## 所属数据库


`information_schema`


## 表信息

| 列名         | 类型 | 说明         |
| :----------- | :--- | :----------- |
| CATALOG_NAME | text | Catalog 名字 |
| CACHE_NAME   | text | 缓存名字     |
| METRIC_NAME  | text | 指标名字     |
| METRIC_VALUE | text | 指标值       |


## 使用示例

```text
mysql> select * from catalog_meta_cache_statistics;
+----------------------+-----------------------------+----------------------+----------------------+
| CATALOG_NAME         | CACHE_NAME                  | METRIC_NAME          | METRIC_VALUE         |
+----------------------+-----------------------------+----------------------+----------------------+
| hive_iceberg_minio   | iceberg_table_cache         | eviction_count       | 0                    |
| hive_iceberg_minio   | iceberg_table_cache         | hit_ratio            | 0.2413793103448276   |
| hive_iceberg_minio   | iceberg_table_cache         | average_load_penalty | 2.4654859845454547E8 |
| hive_iceberg_minio   | iceberg_table_cache         | estimated_size       | 22                   |
| hive_iceberg_minio   | iceberg_table_cache         | hit_count            | 7                    |
| hive_iceberg_minio   | iceberg_table_cache         | read_count           | 29                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | eviction_count       | 0                    |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_ratio            | 1.0                  |
| hive_iceberg_minio   | iceberg_snapshot_cache      | average_load_penalty | 0.0                  |
| hive_iceberg_minio   | iceberg_snapshot_cache      | estimated_size       | 0                    |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_count            | 0                    |
| hive_iceberg_minio   | iceberg_snapshot_cache      | read_count           | 0                    |
+----------------------+-----------------------------+----------------------+----------------------+
```

METRIC_NAME 列包含以下 Caffeine 缓存性能指标：

- eviction_count：从缓存中驱逐的条目数量
- hit_ratio：缓存命中率，范围从 0.0 到 1.0
- average_load_penalty：加载新值的平均耗时（纳秒）
- estimated_size：缓存中条目的估计数量
- hit_count：缓存查找方法返回缓存值的次数
- read_count：缓存查找方法被调用的总次数