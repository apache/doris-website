---
{
    "title": "SHOW TABLET",
    "language": "zh-CN",
    "description": "查看 Tablet 信息：按 tablet id 定位单个 Tablet，或列出一张表 / 指定分区下所有 Tablet 的副本分布、版本与数据量。",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "Doris Tablet 信息",
        "副本分布",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "tablet 排查"
    ]
}
---

## 描述

`SHOW TABLET` 用于查看 Tablet 信息（仅管理员使用），支持两种形式：

- `SHOW TABLET <tablet_id>`：已知 tablet id 时，反查该 Tablet 归属的库、表、分区与索引。
- `SHOW TABLETS FROM <table_name>`：列出一张表或指定分区下所有 Tablet 的副本分布、版本、数据量与 Compaction 状态。

两者常配合使用：先用前者定位 Tablet 的归属，再用后者查看同一分区内其他副本的状态。

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 副本状态排查 / 数据倾斜分析 / Compaction 排查 -->

:::info 备注

两条语句都只支持 Internal Catalog 中的表，不支持 External Catalog。

:::

## 语法

```sql
-- 按 tablet id 查看单个 Tablet
SHOW TABLET <tablet_id>

-- 查看一张表下所有 Tablet
SHOW TABLETS FROM <table_name>
    [ PARTITIONS ( <partition_name> [, ... ] ) ]
    [ WHERE <where_condition> ]
    [ ORDER BY <column_name> [ ASC | DESC ] [, ... ] ]
    [ LIMIT [ <offset>, ] <row_count> ]
```

## 参数

### SHOW TABLET

**1. `<tablet_id>`**

> 必选。要查询的 Tablet ID。

### SHOW TABLETS FROM

**1. `<table_name>`**

> 必选。表名，支持 `db_name.table_name` 形式。

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> 可选。只查看指定分区下的 Tablet。不指定时查看该表所有分区。

**3. `WHERE <where_condition>`**

> 可选。过滤条件。只支持以下三个字段的等值比较，多个条件之间用 `AND` 连接：
>
> | 字段 | 类型 | 说明 |
> | --- | --- | --- |
> | `Version` | 整数 | 按副本版本过滤 |
> | `BackendId` | 整数 | 按副本所在的 BE 节点 ID 过滤 |
> | `State` | 字符串 | 按副本状态过滤，取值为 `NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION` |
>
> 使用其他字段、非等值比较或 `OR` 连接都会报错：
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> 可选。按返回结果中的列排序，排序列必须是下方「返回值」中列出的列名。

**5. `LIMIT [ <offset>, ] <row_count>`**

> 可选。限制返回行数。Tablet 数量较多时建议配合使用。

## 返回值

### SHOW TABLET

| 列名          | 数据类型 | 说明                                             |
|---------------|----------|--------------------------------------------------|
| DbName        | String   | 包含该 tablet 的数据库名称。                     |
| TableName     | String   | 包含该 tablet 的表名称。                         |
| PartitionName | String   | 包含该 tablet 的分区名称。                       |
| IndexName     | String   | 包含该 tablet 的索引名称。                       |
| DbId          | Int      | 数据库的 ID。                                    |
| TableId       | Int      | 表的 ID。                                        |
| PartitionId   | Int      | 分区的 ID。                                      |
| IndexId       | Int      | 索引的 ID。                                      |
| IsSync        | Boolean  | 该 tablet 是否与其副本同步。                     |
| Order         | Int      | tablet 在所属索引中的顺序。                      |
| QueryHits     | Int      | 该 tablet 上的查询命中次数。                     |
| WindowAccessCount | Int  | 滑动统计窗口内该 tablet 的访问次数。             |
| LastAccessTime| Int      | 该 tablet 最近一次被访问的时间戳（毫秒）。从未被访问时为 `0`。 |
| DetailCmd     | String   | 获取有关该 tablet 更详细信息的命令。             |

### SHOW TABLETS FROM

每一行对应一个副本（Replica），因此同一个 `TabletId` 会按副本数出现多行。

| 列名 | 数据类型 | 说明 |
|---|---|---|
| TabletId | Int | Tablet ID |
| ReplicaId | Int | 副本 ID |
| BackendId | Int | 副本所在的 BE 节点 ID |
| SchemaHash | Int | 副本对应的 Schema Hash |
| Version | Int | 副本当前的可见版本 |
| LstSuccessVersion | Int | 最近一次成功导入的版本 |
| LstFailedVersion | Int | 最近一次失败的版本，`-1` 表示没有失败版本 |
| LstFailedTime | String | 最近一次版本失败的时间，无失败时为 `\N` |
| LocalDataSize | Int | 副本的本地数据大小（字节）。存算分离模式下通常为 `0`，详见下方「存算分离模式下的数据大小语义」 |
| RemoteDataSize | Int | 副本的远端数据大小（字节） |
| RowCount | Int | 副本的行数 |
| State | String | 副本状态：`NORMAL`、`ROLLUP`、`CLONE`、`DECOMMISSION` |
| LstConsistencyCheckTime | String | 最近一次一致性检查的时间，未检查过时为 `\N` |
| CheckVersion | Int | 最近一次一致性检查的版本，`-1` 表示未检查过 |
| VisibleVersionCount | Int | 副本的可见版本数量 |
| VersionCount | Int | 副本的总版本数量，可用于判断 Compaction 是否滞后 |
| QueryHits | Int | 该副本上的查询命中次数 |
| WindowAccessCount | Int | 滑动统计窗口内该 Tablet 的访问次数 |
| LastAccessTime | Int | 该 Tablet 最近一次被访问的时间戳（毫秒）。从未被访问时为 `0` |
| PathHash | Int | 副本所在数据目录的 Hash |
| Path | String | 副本所在的 BE 数据根目录。无法解析时为空 |
| MetaUrl | String | 查看该副本元数据的 HTTP 地址，格式为 `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | 查看该副本 Compaction 状态的 HTTP 地址，格式为 `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | 冷数据副本 ID，未开启冷热分层时为 `-1` |
| CooldownMetaId | String | 冷数据元数据 ID，未开启冷热分层时为空 |
| PrimaryBackendId | Int | 该 Tablet 的主 BE 节点 ID。**仅存算分离模式下返回该列** |

### 存算分离模式下的数据大小语义

<!-- 知识类型: 行为说明 -->
<!-- 适用场景: 存算分离容量核对 -->

:::caution 版本行为变更（4.0.8）

自 4.0.8 版本起，存算分离模式下副本的数据量统一按**远端数据**语义上报：未单独记录远端大小的数据量会被计入 `RemoteDataSize`，对应的 `LocalDataSize` 显示为 `0`。因此存算分离集群中通常看到 `LocalDataSize` 为 `0`，实际数据量体现在 `RemoteDataSize` 上。

在 4.0.8 之前，这部分数据量会被记入 `LocalDataSize`，导致 `SHOW TABLETS`、[`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions) 与 [`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) 三者的本地/远端口径互相矛盾。该变更只调整展示口径，不改变数据的实际存储位置与总量。

:::

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象     | 说明                                                                     |
|:------------|:---------|:-------------------------------------------------------------------------|
| Admin_priv  | 全局     | 两条语句都需要全局 `ADMIN` 权限，权限不足时报 `Access denied` 错误。      |

## 示例

### 按 tablet id 查看单个 Tablet

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | WindowAccessCount | LastAccessTime | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | 0                 | 0              | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
```

`DetailCmd` 列给出的 `SHOW PROC` 语句可以进一步查看该 Tablet 的副本明细。

### 查看一张表下所有 Tablet

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### 只查看指定分区

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### 按副本状态与所在节点过滤

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### 排查 Compaction 滞后的 Tablet

按版本数量倒序排列，版本数最多的 Tablet 通常是 Compaction 压力最大的：

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

结果中的 `CompactionStatus` 列是一个 HTTP 地址，在浏览器打开即可查看该副本详细的 Compaction 状态。

### 排查数据倾斜

按数据量倒序排列，可以快速找到明显偏大的 Tablet：

```sql
-- 存算一体模式
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- 存算分离模式（数据量体现在 RemoteDataSize 上）
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
