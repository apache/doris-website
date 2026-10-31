---
{
    "title": "从 MaxCompute 到 Doris",
    "language": "zh-CN",
    "description": "本文档介绍如何通过 MaxCompute Catalog 将阿里云 MaxCompute 中的数据快速导入到 Apache Doris 中。"
}
---

本文档介绍如何通过 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 将阿里云 MaxCompute 中的数据快速导入到 Apache Doris 中。

本文档基于 Apache Doris 2.1.9 版本。

## 环境准备

### 01 开通 MaxCompute 开放存储 API

在 [MaxCompute 控制台](https://maxcompute.console.aliyun.com/) 左侧导航栏 -> `租户管理` -> `租户属性`  -> 打开 `开放存储(Storage API)开关`

### 02 开通 MaxCompute 权限

Doris 使用 AK/SK 访问 MaxCompute 服务。请确保 AK/SK 对应的 IAM 用户，拥有对应 MaxCompute 服务的以下角色或权限：

``` json
{
    "Statement": [{
            "Action": ["odps:List",
                "odps:Usage"],
            "Effect": "Allow",
            "Resource": ["acs:odps:*:regions/*/quotas/pay-as-you-go"]}],
    "Version": "1"
}
```

### 03 确认 Doris 和 MaxCompute 网络环境

强烈建议 Doris 集群和 MaxCompute 服务在同一个 VPC 中，并确保设置了正确的安全组。

本文实例是在同 VPC 网络情况下的测试结果。

## 导入 MaxCompute 数据

### 01 创建 Catalog

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "AKxxxxx",
  "mc.secret_key" = "SKxxxxx",
  "mc.endpoint" = "xxxxx"
);
```

如需支持 Schema 层级（3.1.3+）：

```sql
CREATE CATALOG mc PROPERTIES (
  "type" = "max_compute",
  "mc.default.project" = "xxx",
  "mc.access_key" = "AKxxxxx",
  "mc.secret_key" = "SKxxxxx",
  "mc.endpoint" = "xxxxx",
  'mc.enable.namespace.schema' = 'true'
);
```

具体请参阅 [MaxCompute Catalog](../catalogs/maxcompute-catalog.md) 文档。

### 02 导入 TPCH 数据集

我们使用 MaxCompute 公开数据集中的 TPCH 100 数据集作为示例（数据已经导入到 MaxCompute 中），并使用 `CREATE TABLE AS SELECT` 语句将 MaxCompute 的数据导入到 Doris 中。

该数据集有 7 张表。其中最大的 `lineitem` 表有 16 列，600037902 行。磁盘空间占用约为 30GB。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE tpch_100g;
-- ingest data
CREATE TABLE tpch_100g.lineitem AS SELECT * FROM mc.selectdb_test.lineitem;
CREATE TABLE tpch_100g.nation AS SELECT * FROM mc.selectdb_test.nation;
CREATE TABLE tpch_100g.orders AS SELECT * FROM mc.selectdb_test.orders;
CREATE TABLE tpch_100g.part AS SELECT * FROM mc.selectdb_test.part;
CREATE TABLE tpch_100g.partsupp AS SELECT * FROM mc.selectdb_test.partsupp;
CREATE TABLE tpch_100g.region AS SELECT * FROM mc.selectdb_test.region;
CREATE TABLE tpch_100g.supplier AS SELECT * FROM mc.selectdb_test.supplier;
```

在 Doris 集群单 BE 16C 64G 规格下，上述操作串行执行，耗时约为 6-7 分钟。

### 03 导入 Github Event 数据集

我们使用 MaxCompute 公开数据集中的 Github Event 数据集作为示例（数据已经导入到 MaxCompute 中），并使用 `CREATE TABLE AS SELECT` 语句将 MaxCompute 的数据导入到 Doris 中。

这里我们选择 `dwd_github_events_odps` 表的 '2015-01-01' 到 '2016-01-01' 共 365 个分区的数据。数据共 32 列，212786803 行。磁盘空间占用约为 10GB。

```sql
-- switch catalog
SWITCH internal;
-- create database
CREATE DATABASE github_events;
-- ingest data
CREATE TABLE github_events.dwd_github_events_odps
AS SELECT * FROM mc.github_events.dwd_github_events_odps
WHERE ds BETWEEN '2015-01-01' AND '2016-01-01';
```

在 Doris 集群单 BE 16C 64G 规格下，上述操作耗时约为 2 分钟。
