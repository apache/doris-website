---
{
    "title": "高并发点查",
    "language": "zh-CN",
    "description": "如何在 Doris 中开启高并发点查？通过行存、短路径、PreparedStatement 与行缓存，显著提升主键点查 QPS 与响应延迟。",
    "keywords": [
        "Doris 高并发点查",
        "主键点查优化",
        "PreparedStatement",
        "行存 store_row_column",
        "Merge-On-Write 点查",
        "SHORT-CIRCUIT 短路径",
        "行缓存 row cache",
        "FE CPU 高 点查瓶颈"
    ]
}
---

<!-- 知识类型: 能力定义 / 配置参数 / 性能调优 -->
<!-- 适用场景: 高并发主键点查、KV 风格查询、低延迟在线服务 -->

:::tip
高并发点查功能自 Doris 2.0 版本起具有重大性能提升。
:::

## 什么是高并发点查

高并发点查是 Doris 针对**主键等值查询**场景的专项优化能力。在高并发服务场景中，用户希望从系统中按主键获取整行数据；而 Doris 默认的列存格式与查询规划路径并不适合这种 KV 风格的请求。

为了解决这一问题，Doris 在以下几个层面进行了优化：

| 优化点               | 解决的问题                                                  |
| -------------------- | ----------------------------------------------------------- |
| 行存（Row Store）    | 列存对宽表整行读取会放大随机 IO，引入行存减少 IO 开销       |
| 短查询路径（SHORT-CIRCUIT） | FE 的查询规划/解析对简单查询过重，短路径绕过常规规划流程     |
| PreparedStatement    | SQL 解析与表达式计算占用 FE CPU，缓存计划/表达式以降低开销   |
| 行缓存（Row Cache）  | Page Cache 易被大查询淘汰，引入独立行缓存提高命中率         |

## 快速开启清单

在使用高并发点查前，请确认以下条件均已满足：

- [ ] 表为 **Unique Key 模型**，且开启 `enable_unique_key_merge_on_write = true`
- [ ] 建表时设置 `store_row_column = true` 开启行存
- [ ] 建表时开启 `light_schema_change = true`
- [ ] 查询语句仅包含 **Key 列等值条件**，无 join 与嵌套子查询
- [ ] JDBC URL 开启 `useServerPrepStmts=true` 使用 PreparedStatement
- [ ] （可选）BE 配置 `disable_storage_row_cache = false` 开启行缓存
- [ ] 通过 `EXPLAIN` 验证执行计划中存在 `SHORT-CIRCUIT` 标记

## 行存（Row Store）

<!-- 知识类型: 配置参数 -->

行存模式用于减少宽表整行读取时的随机 IO 开销。当前实现是将一行数据编码后存储在单独的一列中。

- 仅支持在**建表时**开启，建表后无法修改。
- 在建表语句的 `PROPERTIES` 中指定如下属性：

```sql
"store_row_column" = "true"
```

- 开启行存会带来空间膨胀。**Doris 3.0 起**，如果只需查询部分列，建议使用 `row_store_columns` 仅将需要的列纳入行存：

```sql
"row_store_columns" = "key,v1,v2"
```

查询时仅访问这些列即可，例如：

```sql
SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1;
```

## Unique 模型下的点查优化

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 主键点查建表 -->

在 Unique 模型上同时开启 Merge-On-Write 与行存后，主键的点查会自动走**短路径**，对 SQL 执行进行优化，仅需一次 RPC 即可完成查询。

### 建表示例

```sql
CREATE TABLE `tbl_point_query` (
    `k1` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k1`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```

### 关键约束与说明

| 约束/属性                          | 说明                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `enable_unique_key_merge_on_write` | 必须开启，存储引擎依赖该属性进行主键快速点查                         |
| `light_schema_change`              | 必须开启，主键点查依赖其中的 `column unique id` 来定位列              |
| 查询条件                           | 仅支持单表 Key 列**等值查询**，不支持 join、嵌套子查询                 |
| 谓词形式                           | `WHERE` 中需**有且仅有 Key 列的等值条件**，可视为一种 KV 查询          |
| 行存空间                           | 开启行存会导致空间膨胀，3.0+ 推荐使用 `row_store_columns` 指定部分列   |

例如：`SELECT * FROM tbl_point_query WHERE k1 = 123` 即满足条件，会走短路径优化。

## 使用 PreparedStatement

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: FE CPU 成为点查瓶颈 -->

为了减少 SQL 解析与表达式计算的开销，Doris 在 FE 端提供了与 MySQL 协议**完全兼容**的 `PreparedStatement` 特性（目前仅支持主键点查）。

- 开启后，SQL 与表达式将被提前计算并缓存到 Session 级别的内存缓存中。
- 后续查询直接复用缓存对象，避免重复解析与计算。
- 当 CPU 是主键点查的瓶颈时，开启 `PreparedStatement` 可获得 **4 倍以上**的性能提升。

### 步骤 1：JDBC URL 开启 Server 端 PreparedStatement

```text
url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
```

### 步骤 2：在代码中使用 PreparedStatement

```java
// use `?` for placement holders, readStatement should be reused
PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
...
readStatement.setInt(1, 1234);
ResultSet resultSet = readStatement.executeQuery();
...
readStatement.setInt(1, 1235);
resultSet = readStatement.executeQuery();
...
```

## 开启行缓存（Row Cache）

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 行存命中率低、Page Cache 易被淘汰 -->

Doris 默认提供 **Page 级别的 Cache**，每个 Page 中存储某一列的数据，因此 Page Cache 是面向列的缓存。对于行存而言，一行包括多列数据，缓存可能被大查询冲刷掉。

为提升命中率，Doris 单独引入了**行缓存（Row Cache）**，复用 LRU Cache 机制保障内存使用。通过以下 BE 配置开启：

| 配置项                       | 默认值     | 说明                              |
| ---------------------------- | ---------- | --------------------------------- |
| `disable_storage_row_cache`  | `true`（默认不开启）| 是否关闭行缓存，设置为 `false` 开启 |
| `row_cache_mem_limit`        | `20%`      | Row Cache 占用内存的百分比         |

## 性能优化建议

<!-- 知识类型: 性能调优 -->

在以上能力开启后，可结合部署架构进一步提升点查吞吐与稳定性：

1. **增加 Observer 节点数量**：通常通过增加 Observer 数量来提升处理 Query 能力是有效的。
2. **Query 负载均衡**：若发现接收点查请求的 FE CPU 过高或响应变慢，可使用 JDBC Load Balance 将请求分散到多个节点；也可使用 Nginx、ProxySQL 等其他方案。
3. **将点查请求定向至 Observer**：减少向 FE Master 发送点查请求，通常可缓解 FE Master 节点查询耗时上下浮动的问题，获得更好的性能与稳定性。

## FAQ

### Q1：如何确认配置无误并使用了高并发点查的短路径优化？

执行 `EXPLAIN`，若执行计划中出现 `SHORT-CIRCUIT`，则证明已使用短路径优化：

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                             |
|     `test`.`tbl_point_query`.`v1`                                                             |
|     `test`.`tbl_point_query`.`v2`                                                             |
|     `test`.`tbl_point_query`.`v3`                                                             |
|     `test`.`tbl_point_query`.`v4`                                                             |
|     `test`.`tbl_point_query`.`v5`                                                             |
|     `test`.`tbl_point_query`.`v6`                                                             |
|     `test`.`tbl_point_query`.`v7`                                                             |
|   PARTITION: UNPARTITIONED                                                                    |
|                                                                                               |
|   HAS_COLO_PLAN_NODE: false                                                                   |
|                                                                                               |
|   VRESULT SINK                                                                                |
|      MYSQL_PROTOCAL                                                                           |
|                                                                                               |
|   0:VOlapScanNode                                                                             |
|      TABLE: test.tbl_point_query(tbl_point_query), PREAGGREGATION: ON                         |
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0  |
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
```

### Q2：如何确认 PreparedStatement 已生效？

发送请求到 Doris 后，在 `fe.audit.log` 中找到对应的 Query 请求，若 `Stmt=EXECUTE()`，则说明 PreparedStatement 已生效：

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVariables=
```

### Q3：非主键查询能否使用高并发点查的特殊优化？

不能。高并发点查仅针对 **Key 列的等值查询**，且查询中**不能包含 join 与嵌套子查询**。

### Q4：`useServerPrepStmts` 在普通查询中是否有用？

PreparedStatement 目前**仅在主键点查**的情况下生效。

### Q5：优化器选择需要进行全局设置吗？

不需要。在使用 PreparedStatement 进行查询时，Doris 会自动选择性能最好的查询方式，无需手动设置优化器。

### Q6：FE 成为瓶颈怎么处理？

若 FE 占用 CPU 过高（`%CPU` 偏高），建议在 JDBC URL 中开启如下负载均衡与缓存配置：

```text
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```

| 参数                    | 作用                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `loadbalance`           | 确保多个 FE 都能提供服务，FE 数量越多越好（每个实例都部署一个）|
| `useServerPrepStmts`    | 减少 FE 解析、规划开销                                       |
| `cachePrepStmts`        | 客户端缓存 PreparedStatement，避免频繁向 FE 发送 prepared 请求 |
| `prepStmtCacheSize`     | 设置最大可缓存的查询模板数量                                  |
| `prepStmtCacheSqlLimit` | 设置单条缓存 SQL 模板的最大长度                              |

### Q7：存算分离下怎么优化查询性能？

可从以下两个方向调整：

- **关闭快照点查**：

    ```sql
    SET GLOBAL enable_snapshot_point_query = false;
    ```

    点查从 Meta Service 获取 version 会多一次额外的 RPC，且 Meta Service 在高 QPS 场景下容易成为瓶颈。设置为 `false` 可加速查询，但会降低数据可见性（**需权衡性能与可见性**）。

- **开启 Base Compaction 输出缓存**：将 BE 参数设置为 `enable_file_cache_keep_base_compaction_output=1`，使 Base Compaction 后的结果数据放入缓存，避免远程访问导致的查询抖动。
