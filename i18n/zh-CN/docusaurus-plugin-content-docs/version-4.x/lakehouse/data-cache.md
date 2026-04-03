---
{
    "title": "数据缓存",
    "language": "zh-CN",
    "description": "Apache Doris 数据缓存（Data Cache）将 HDFS 及对象存储数据缓存至本地磁盘，加速 Lakehouse 查询性能。支持缓存预热、配额限制与准入控制，适用于 Hive、Iceberg、Hudi、Paimon 表查询场景。"
}
---

数据缓存（Data Cache）通过缓存最近访问的远端存储系统（HDFS 或对象存储）的数据文件到本地磁盘上，加速后续访问相同数据的查询。在频繁访问相同数据的查询场景中，Data Cache 可以避免重复的远端数据访问开销，提升热点数据的查询分析性能和稳定性。

## 适用场景

数据缓存功能仅作用于 Hive、Iceberg、Hudi、Paimon 表的查询。对内表查询，或非文件的外表查询（如 JDBC、Elasticsearch）等无效果。

数据缓存是否能提升查询效率，取决于多方面因素，下面给出数据缓存的适用场景：

* 高速本地磁盘

  建议使用高速本地磁盘，如 SSD 或 NVME 介质的本地磁盘作为数据缓存目录。不建议使用机械硬盘作为数据缓存目录。本质上，需确保本地磁盘的 IO 带宽和 IOPS 显著高于网络带宽、源端存储系统的 IO 带宽和 IOPS，才可能带来明显的性能提升。

* 足够的缓存空间大小

  数据缓存使用 LRU 策略作为缓存淘汰策略。如果查询的数据并没有明显的冷热区分，则缓存数据有可能处于频繁的更新和汰换过程中，反而可能降低查询性能。推荐查询模式有明显冷热区分（如大部分查询只访问当天的数据，几乎不访问历史数据），并且缓存空间足够存储热数据的场景下开启数据缓存。

* 远端存储的 IO 延迟不稳定

  这种情况通常出现在 HDFS 存储上。多数企业中不同的业务部门会共用同一套 HDFS，因此可能导致高峰期 HDFS 的 IO 延迟非常不稳定。这种情况下，如需确保 IO 延迟稳定，建议开启数据缓存。但仍需考虑前两种情况。

## 开启数据缓存

数据缓存功能是默认关闭的，需要在 FE 和 BE 中设置相关参数进行开启。

### BE 配置

首先，需要在 `be.conf` 中配置缓存路径信息，并重启 BE 节点让配置生效。

| 参数                  | 必选项 | 说明                                     |
| ------------------- | --- | -------------------------------------- |
| `enable_file_cache` | 是   | 是否启用 Data Cache，默认 false               |
| `file_cache_path`   | 是   | 缓存目录的相关配置，JSON 格式。                      |
| `clear_file_cache`  | 否   | 默认 false。如果为 true，则当 BE 节点重启时，会清空缓存目录。 |

`file_cache_path` 的配置示例：

```sql
file_cache_path=[{"path": "/path/to/file_cache1", "total_size":53687091200},{"path": "/path/to/file_cache2", "total_size":53687091200},{"path": "/path/to/file_cache3", "total_size":53687091200}]
```

`path` 是缓存的保存路径，可以配置一个或多个。建议同一块磁盘只配置一个路径。

`total_size` 是缓存的空间大小上限。单位是字节。超过缓存空间后，会通过 LRU 策略进行缓存数据的淘汰。

### FE 配置

单个会话中开启 Data Cache:

```sql
SET enable_file_cache = true;
```

全局开启 Data Cache:

```sql
SET GLOBAL enable_file_cache = true;
```

注意，如果没有开启 `enable_file_cache`，即使 BE 配置了缓存目录，也不会使用缓存。同样，如果 BE 没有配置缓存目录，即使开启 `enable_file_cache`，也不会使用缓存。

## 缓存可观测性

### 查看缓存命中情况

执行 `set enable_profile=true` 打开会话变量，可以在 FE 的 Web 页面的 `Queries` 标签中查看到作业的 Profile。数据缓存相关的指标如下：

```sql
-  FileCache:  0ns
    -  BytesScannedFromCache:  2.02  GB
    -  BytesScannedFromRemote:  0.00  
    -  BytesWriteIntoCache:  0.00  
    -  LocalIOUseTimer:  2s723ms
    -  NumLocalIOTotal:  444
    -  NumRemoteIOTotal:  0
    -  NumSkipCacheIOTotal:  0
    -  RemoteIOUseTimer:  0ns
    -  WriteCacheIOUseTimer:  0ns
```

* `BytesScannedFromCache`：从本地缓存中读取的数据量。

* `BytesScannedFromRemote`：从远端读取的数据量。

* `BytesWriteIntoCache`：写入缓存的数据量。

* `LocalIOUseTimer`：本地缓存的 IO 时间。

* `RemoteIOUseTimer`：远端读取的 IO 时间。

* `NumLocalIOTotal`：本地缓存的 IO 次数。

* `NumRemoteIOTotal`：远端 IO 次数。

* `WriteCacheIOUseTimer`：写入缓存的 IO 时间。

如果 `BytesScannedFromRemote` 为 0，表示全部命中缓存。

### 监控指标

用户可以通过系统表 [`file_cache_statistics`](../admin-manual/system-tables/information_schema/file_cache_statistics) 查看各个 Backend 节点的缓存统计指标。

## 缓存的配额

> 该功能自 4.0.3 版本支持。

缓存配额（Cache Query Limit）功能允许用户限制单个查询可以使用的文件缓存百分比。在多用户或复杂查询共享缓存资源的场景下，单个大查询可能会占用过多的缓存空间，导致其他查询的热点数据被淘汰。通过设置查询配额，可以保证资源的公平使用，防止缓存抖动。

查询占用的缓存空间指的是该查询因数据未命中而填充到缓存中的数据总大小。如果该查询填充的总大小已经达到配额限制，那么查询后续填充的数据会基于 LRU 算法替换先前填充的数据。

### 配置说明

该功能涉及 BE 和 FE 两端的配置，以及会话变量（Session Variable）的设置。

**1. BE 配置**

- `enable_file_cache_query_limit`:
  - 类型：Boolean
  - 默认值：`false`
  - 说明：BE 端文件缓存查询限制功能的主开关。只有开启此开关，BE 才会处理 FE 传递的查询限制参数。

**2. FE 配置**

- `file_cache_query_limit_max_percent`:
  - 类型：Integer
  - 默认值：`100`
  - 说明：查询的最大配额约束，用于校验会话变量的上限。它确保用户设置的查询限制不会超过此值。

**3. 会话变量 (Session Variables)**

- `file_cache_query_limit_percent`:
  - 类型：Integer (1-100)
  - 说明：文件缓存查询限制百分比。设置单个查询可使用的最大缓存比例。该值上限受 `file_cache_query_limit_max_percent` 约束。建议计算后的缓存配额不低于 256MB，如果低于该值，BE 会在日志中进行告警提示。

**使用示例**

```sql
-- 设置会话变量，限制单个查询最多使用 50% 的缓存
SET file_cache_query_limit_percent = 50;

-- 执行查询
SELECT * FROM large_table;
```

**注意：**
1. 设置的值必须在 [0, `file_cache_query_limit_max_percent`] 范围内。

## 缓存预热

Data Cache 提供缓存“预热（Warmup）”功能，允许将外部数据提前加载到 BE 节点的本地缓存中，从而提升后续首次查询的命中率和查询性能。

> 该功能自 4.0.2 版本支持。

### 语法

```sql
WARM UP SELECT <select_expr_list>
FROM <table_reference>
[WHERE <boolean_expression>]
```

使用限制：

* 支持：

  * 单表查询（仅允许一个 table_reference）
  * 指定列的简单 SELECT
  * WHERE 过滤（支持常规谓词）

* 不支持：

  * JOIN、UNION、子查询、CTE
  * GROUP BY、HAVING、ORDER BY
  * LIMIT
  * INTO OUTFILE
  * 多表 / 复杂查询计划
  * 其它复杂语法

### 示例

1. 预热整张表

  ```sql
  WARM UP SELECT * FROM hive_db.tpch100_parquet.lineitem;
  ```

2. 根据分区预热部分列

  ```sql
  WARM UP SELECT l_orderkey, l_shipmode
  FROM hive_db.tpch100_parquet.lineitem
  WHERE dt = '2025-01-01';
  ```

3. 根据过滤条件预热部分列

  ```sql
  WARM UP SELECT l_shipmode, l_linestatus
  FROM hive_db.tpch100_parquet.lineitem
  WHERE l_orderkey = 123456;
  ```

### 执行返回结果

执行 `WARM UP SELECT` 后，FE 会下发任务至各 BE。BE 扫描远端数据并写入 Data Cache。

系统会直接返回各 BE 的扫描与缓存写入统计信息（注意：统计信息基本准确，但会有一定误差）。例如：

```
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| BackendId     | ScanRows  | ScanBytes   | ScanBytesFromLocalStorage | ScanBytesFromRemoteStorage | BytesWriteIntoCache |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
| 1755134092928 | 294744184 | 11821864798 | 538154009                 | 11283717130                | 11899799492         |
| 1755134092929 | 305293718 | 12244439301 | 560970435                 | 11683475207                | 12332861380         |
| TOTAL         | 600037902 | 24066304099 | 1099124444                | 22967192337                | 24232660872         |
+---------------+-----------+-------------+---------------------------+----------------------------+---------------------+
```

字段解释

* `ScanRows`：扫描读取行数。
* `ScanBytes`：扫描读取数据量。
* `ScanBytesFromLocalStorage`：从本地缓存扫描读取的数据量。
* `ScanBytesFromRemoteStorage`：从远端存储扫描读取的数据量。
* `BytesWriteIntoCache`：本次预热写入 Data Cache 的数据量。

## 缓存准入控制

> 该功能为实验性功能，自 4.1.0 版本起支持。

通过缓存准入控制功能，用户可以基于操作用户、Catalog、Database 以及 Table 等维度配置规则，精细化管理查询产生的数据是否允许写入 Data Cache。

在某些业务场景（如全表扫描的大规模 ETL 作业或不可预期的 Ad-hoc 分析）中，大量的冷数据读取可能会迅速填满缓存空间，导致高频访问的“热数据”被频繁置换（即缓存污染问题）。此时系统整体的缓存命中率和查询性能将出现严重下滑。通过配置缓存准入规则拒绝此类作业的数据进入缓存，可以有效保护热数据，确保整个系统的 Data Cache 命中率维持在稳定水平。

缓存准入控制功能默认关闭，需要在 FE 节点上配置相关参数来开启。

### FE 配置

需要在 FE 节点的配置文件 `fe.conf` 中新增如下参数以开启缓存准入控制。开启及配置目录路径需要重启 FE 节点生效，但目录下规则文件的修改支持动态加载。

| 参数                                      | 必选项 | 说明                                                         |
| ----------------------------------------- | ------ | ------------------------------------------------------------ |
| `enable_file_cache_admission_control`     | 是     | 是否启用缓存准入控制功能。默认为 `false`（不启用）。           |
| `file_cache_admission_control_json_dir`   | 是     | 存放缓存准入规则 JSON 文件的目录路径。该目录下的所有 `.json` 文件均会被自动加载并实时监听修改，规则更替**动态生效**无需重启节点。 |

### 准入控制规则配置

规则文件应存放于 `file_cache_admission_control_json_dir` 所配置的目录下，且后缀需为 `.json`。

#### 参数说明

规则以 JSON 数组形式提供，每个 JSON Object 代表一条规则，各字段及说明如下：

| 字段名              | 类型     | 说明                                                         | 示例         |
| ------------------- | -------- | ------------------------------------------------------------ | ------------ |
| `id`                | Long     | 规则 ID，供用户区分不同的规则。                              | `1`          |
| `user_identity`     | String   | 用户标识（格式为 `user@host`，其中 `%` 表示匹配所有 IP）。**留空 (`""`) 表示匹配全局所有用户**。 | `"root@%"`   |
| `catalog_name`      | String   | Catalog 名称。**留空 (`""`) 表示匹配所有 Catalog**。         | `"hive_cat"` |
| `database_name`     | String   | Database 名称。**留空 (`""`) 表示匹配所有 Database**。       | `"db1"`      |
| `table_name`        | String   | Table 名称。**留空 (`""`) 表示匹配所有表**。                 | `"tbl1"`     |
| `partition_pattern` | String   | （当前版本暂未实现）分区正则表达式。留空表示匹配所有分区。   | `""`         |
| `rule_type`         | Integer  | 规则类型。`0` 表示禁止缓存（黑名单）；`1` 表示允许缓存（白名单）。 | `0`          |
| `enabled`           | Integer  | 该规则是否生效启用。`0` 表示停用；`1` 表示启用。             | `1`          |
| `created_time`      | Long     | 记录的创建时间（UNIX 时间戳，秒）。                          | `1766557246` |
| `updated_time`      | Long     | 记录的最新更新时间（UNIX 时间戳，秒）。                      | `1766557246` |

#### JSON 文件样例

```json
[
  {
    "id": 1,
    "user_identity": "root@%",
    "catalog_name": "hive_cat",
    "database_name": "db1",
    "table_name": "table1",
    "partition_pattern": "",
    "rule_type": 0,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  },
  {
    "id": 2,
    "user_identity": "",
    "catalog_name": "hive_cat",
    "database_name": "",
    "table_name": "",
    "partition_pattern": "",
    "rule_type": 1,
    "enabled": 1,
    "created_time": 1766557246,
    "updated_time": 1766557246
  }
]
```

#### 从 MySQL 导入规则

对于有自动化系统对接需求的用户，在 Doris 源码库 `tools/export_mysql_rule_to_json.sh` 路径下提供了辅助脚本。可以使用该脚本将预先存储在 MySQL 数据库表中的缓存准入规则导出为符合上述格式的 JSON 配置文件。

### 规则匹配原理

#### 规则作用域分类

根据填写的字段明确程度，规则支持以下几种层级和形式的生效范围：

| user_identity | catalog_name | database_name | table_name | 级别与作用域                 |
| ------------- | ------------ | ------------- | ---------- | ---------------------------- |
| **非空**      | **非空**     | **非空**      | **非空**   | **指定用户・Table 级规则**   |
| 空缺或留空       | **非空**     | **非空**      | **非空**   | **全体用户・Table 级规则**   |
| **非空**      | **非空**     | **非空**      | 空缺或留空         | **指定用户・Database 级规则**|
| 空缺或留空       | **非空**     | **非空**      | 空缺或留空         | **全体用户・Database 级规则**|
| **非空**      | **非空**     | 空缺或留空            | 空缺或留空         | **指定用户・Catalog 级规则** |
| 空缺或留空       | **非空**     | 空缺或留空            | 空缺或留空         | **全体用户・Catalog 级规则** |
| **非空**      | 空缺或留空           | 空缺或留空            | 空缺或留空         | **指定用户・全局规则**       |

> **说明：**
> - **空缺或留空**：表示该字段在 JSON 中配置为空字符串 `""` 或者是直接省略不配置（效果等同于空字符串 `""`）。
> - **非空**：表示对应字段必须是一个明确的值（如 `"hive_cat"`）。
> - 任何跳跃或不符合层级依赖关系的规则配置均视为**无效规则**，不会被解析生效。例如：配置了 `database_name` 但 `catalog_name` 为空。

#### 匹配及优先级顺序

判定某个查询访问目标表数据时是否写入缓存，受配置的多条规则综合影响。匹配原则如下：

1. **精确优先原则**：按层级由明细到宽泛的顺序（Table → Database → Catalog → 全局）进行匹配，优先匹配精确度更高的规则。
2. **拒绝优先（安全优先）**：在同一个规则内或同级别（如既存在指定用户的黑名单规则，又存在全局的白名单规则），**禁止缓存（黑名单）规则的优先级永远高于允许缓存（白名单）规则**。拒绝访问的决策最先被识别生效。

完整的决策推导链路如下：

```text
1. Table 级规则匹配
   a) 命中黑名单 (rule_type=0) -> 拒绝
   b) 命中白名单 (rule_type=1) -> 允许
2. Database 级规则匹配
   ...
3. Catalog 级规则匹配
   ...
4. 全局规则匹配 (仅匹配 user_identity)
   ...
5. 兜底默认决策：如果所有的层级也没有匹配上，系统默认【拒绝】写入缓存操作（等同全局黑名单）。
```

> **提示**：由于系统默认兜底为拒绝准入，因此在实际部署该功能时，最佳实践通常是建立一条广泛的全局允许规则（如全员白名单，或某个重要业务 Catalog 的白名单），然后再针对已知会进行全表扫描的大表配置针对性的 Table 级黑名单，由此实现精细化的冷热数据剥离。

### 缓存决策可观测性

当开启规则并在系统中生效起作用后，用户可以通过向目标表发送 `EXPLAIN` 命令，审查其 File Cache 准入控制决策情况（聚焦关注节点下方的 `file cache request` 决策输出信息）。

```text
|   0:VHIVE_SCAN_NODE(74)                                                                                          |
|      table: test_file_cache_features.tpch1_parquet.lineitem                                                      |
|      inputSplitNum=10, totalFileSize=205792918, scanRanges=10                                                    |
|      partition=1/1                                                                                               |
|      cardinality=1469949, numNodes=1                                                                             |
|      pushdown agg=NONE                                                                                           |
|      file cache request ADMITTED: user_identity:root@%, reason:user table-level whitelist rule, cost:0.058 ms    |
|      limit: 1                                                                                                    |
```

重点字段与判定说明：
- **ADMITTED** / **DENIED**：代表请求被允许写入缓存（ADMITTED）或被直接拒绝（DENIED）。如果被拒绝，数据访问直接击穿至远端底层存储。
- **user_identity**：执行本次查询鉴别出的用户凭证身份。
- **reason**：命中判定策略的具体原因说明。常见的输出原因如：`user table-level whitelist rule`（当前示例：指定用户 Table 级白名单规则）；`common table-level blacklist rule`（全体用户 Table 级黑名单规则）。此类原因格式一般为 `[作用范围] [规则级别] [规则类型] rule`。
- **cost**：完成整个准入匹配计算过程的耗时开销（以毫秒 ms 为单位）。如果开销过大，可通过简化规则层级数进行调整。

## 附录

### 原理

数据缓存将访问的远程数据缓存到本地的 BE 节点。原始的数据文件会根据访问的 IO 大小切分为 Block，Block 被存储到本地文件 `cache_path/hash(filepath).substr(0, 3)/hash(filepath)/offset` 中，并在 BE 节点中保存 Block 的元信息。当访问相同的远程文件时，Doris 会检查本地缓存中是否存在该文件的缓存数据，并根据 Block 的 offset 和 size，确认哪些数据从本地 Block 读取，哪些数据从远程拉取，并缓存远程拉取的新数据。BE 节点重启的时候，扫描 `cache_path` 目录，恢复 Block 的元信息。当缓存大小达到阈值上限的时候，按照 LRU 原则清理长久未访问的 Block。
