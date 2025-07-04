---
{
    "title": "catalog_meta_cache_statistics",
    "language": "zh-CN"
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