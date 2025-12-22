---
{
    "title": "高并发点查",
    "language": "zh-CN",
    "description": "Doris 基于列存格式引擎构建，在高并发服务场景中，用户总是希望从系统中获取整行数据。但是，当表宽时，列存格式将大大放大随机读取 IO。Doris 查询引擎和计划对于某些简单的查询（如点查询）来说太重了。需要一个在 FE 的查询规划中规划短路径来处理这样的查询。FE 是 SQL 查询的访问层服务，"
}
---

:::tip
高并发点查功能自 Doris 2.0 版本起具有重大性能提升
:::

## 描述 

Doris 基于列存格式引擎构建，在高并发服务场景中，用户总是希望从系统中获取整行数据。但是，当表宽时，列存格式将大大放大随机读取 IO。Doris 查询引擎和计划对于某些简单的查询（如点查询）来说太重了。需要一个在 FE 的查询规划中规划短路径来处理这样的查询。FE 是 SQL 查询的访问层服务，使用 Java 编写，分析和解析 SQL 也会导致高并发查询的高 CPU 开销。为了解决上述问题，我们在 Doris 中引入了行存、短查询路径、PreparedStatement 来解决上述问题，下面是开启这些优化的指南。

## 行存

用户可以在 Olap 表中开启行存模式，但是需要额外的空间来存储行存。目前的行存实现是将行存编码后存在单独的一列中，这样做是为了简化行存的实现。行存模式仅支持在建表的时候开启，需要在建表语句的 property 中指定如下属性：

```sql
"store_row_column" = "true"
```

## 在 Unique 模型下的点查优化

上述的行存用于在 Unique 模型下开启 Merge-On-Write 策略是减少点查时的 IO 开销。当`enable_unique_key_merge_on_write`与`store_row_column`在创建 Unique 表开启时，对于主键的点查会走短路径来对 SQL 执行进行优化，仅需要执行一次 RPC 即可执行完成查询。下面是在 Unique 模型下，点查结合行存开启 Merge-On-Write 策略的例子：

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

**注意：**

1. `enable_unique_key_merge_on_write`应该被开启，存储引擎需要根据主键来快速点查

2. 当条件只包含主键时，如`select * from tbl_point_query where k1 = 123`，类似的查询会走短路径来优化查询

3. `light_schema_change`应该被开启，因为主键点查的优化依赖了轻量级 Schema Change 中的`column unique id`来定位列

4. 只支持单表 key 列等值查询不支持 join、嵌套子查询， **where 条件里需要有且仅有 key 列的等值**，可以认为是一种 key value 查询

5. 开启行存会导致空间膨胀，占用更多的磁盘空间，如果只需要查询部分列，在 Doris 3.0 后建议使用`"row_store_columns"="key,v1,v2"` 类似的方式指定部份列作为行存，查询的时候只查询这部份列，例如

    ```sql
    SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1
    ```

## 使用 PreparedStatement

为了减少 SQL 解析和表达式计算的开销，我们在 FE 端提供了与 MySQL 协议完全兼容的`PreparedStatement`特性（目前只支持主键点查）。当`PreparedStatement`在 FE 开启，SQL 和其表达式将被提前计算并缓存到 Session 级别的内存缓存中，后续的查询直接使用缓存对象即可。当 CPU 成为主键点查的瓶颈，在开启 `PreparedStatement` 后，将会有 4 倍 + 的性能提升。下面是在 JDBC 中使用 `PreparedStatement` 的例子

1. 设置 JDBC url 并在 Server 端开启 prepared statement

    ```
    url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
    ```

2. 使用 `PreparedStatement`

    ```java
    // use `?` for placement holders, readStatement should be reused
    PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
    ...
    readStatement.setInt(1,1234);
    ResultSet resultSet = readStatement.executeQuery();
    ...
    readStatement.setInt(1,1235);
    resultSet = readStatement.executeQuery();
    ...
    ```

## 开启行缓存

Doris 中有针对 Page 级别的 Cache，每个 Page 中存的是某一列的数据，所以 Page cache 是针对列的缓存，对于前面提到的行存，一行里包括了多列数据，缓存可能被大查询给刷掉，为了增加行缓存命中率，单独引入了行存缓存，行缓存复用了 Doris 中的 LRU Cache 机制来保障内存的使用，通过指定下面的的 BE 配置来开启

- `disable_storage_row_cache` 是否开启行缓存，默认不开启

- `row_cache_mem_limit` 指定 Row cache 占用内存的百分比，默认 20% 内存

## 性能优化

1. 通常，通过增加 Observer 数量来提升处理 query 能力是有效的

2. query 负载均衡：点查中如果发现接受点查请求的 fe cpu 使用过高，或请求响应变慢，可使用 jdbc load balance 进行负载均衡，将请求分散到多个节点，分担压力（同时也可以使用其他方式进行 query 负载均衡配置，如 Nginx，proxySQL）

3. 通过将点查请求定向发送至 Observer 角色来分担高并发点查的请求压力，减少向 fe master 发送点查请求，通常可以解决 Fe Master 节点查询耗时上下浮动问题，以获得更好性能与稳定性

## FAQ

#### Q1. 如何确定配置无误使用了并发点查的短路径优化

A：explain sql，当执行计划中出现 SHORT-CIRCUIT，证明使用了短路径优化

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ; 
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                            |
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
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0 |  
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         | 
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
   ```

#### Q2. 如何确定 prepared statement 生效

A：当发送请求到 Doris 之后，在 fe.audit.log 中找到相应的 query 请求，发现 Stmt=EXECUTE() ，说明 prepared statement 生效

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
   3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVaria
   bles=
```
   
#### Q3. 非主键查询能否使用到高并发点查的特殊优化

A：不能，高并发点查只针对于 key 列的等值查询，且查询中不能包含 join，嵌套子查询

#### Q4. useServerPrepStmts 在普通查询中是否有用

A：Prepared Statement 目前只在主键点查的情况下生效

#### Q5. 优化器选择需要进行全局设置吗

A：在使用 prepared statement 进行查询时，Doris 会选择性能最好的查询方式，不需要手动设置优化器

#### Q6. FE 成为瓶颈怎么处理？

A：如果占用过高 cpu，%CPU 过高，则在 jdbc url 开启以下配置

```
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```
- 打开 loadbalance 确保多个 FE 都能提供服务，并且 FE 数量越多越好 (每个实例都部署一个)
- 打开 useServerPrepStmts，减少 fe 解析、规划开销
- 打开 cachePrepStmts 客户端缓存 prepared statement，不用频繁向 FE 发送 prepared 请求
- 调整 prepStmtCacheSize，设置最大可缓存的查询模版数量 ()
- 调整 prepStmtCacheSqlLimit，设置单条缓存的 SQL 模版的最大长度

#### Q7. 存算分离下怎么优化查询性能？

A：

- `set global enable_snapshot_point_query = false`, 点查从 meta service 获取 version 会多一次额外的 RPC，并且 meta service 在高 QPS 场景下容易成为瓶颈，设置成 false 可以加速查询但是会降低数据可见性（需权衡性能和可见性）
- 配置 BE 参数 enable_file_cache_keep_base_compaction_output=1，使得 Base Compact 后的结果数据放入缓存，避免远程访问导致的查询抖动。