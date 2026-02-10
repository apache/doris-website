---
{
    "title": "Release 2.1.1",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.1.1 版本已于 2024 年 4 月 3 日正式发布。该版本针对 2.1.0 版本出现的问题进行较为全面的优化，提交了若干改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，Apache Doris 2.1.1 版本已于 2024 年 4 月 3 日正式发布。该版本针对 2.1.0 版本出现的问题进行较为全面的优化，提交了若干改进项以及问题修复，进一步提升了系统的性能及稳定性，欢迎大家下载体验。

- **立即下载：** https://doris.apache.org/download/

- **GitHub Release:** https://github.com/apache/doris/releases


## 1 行为变更

1. 改变了 Float 类型字段返回值序列化的方式，可以提升大数据量下 Float 返回的性能。

- https://github.com/apache/doris/pull/32049 

2. 将部分 Table Valued Function 变更为系统表 `active_queries()`, `workload_groups()`。

- https://github.com/apache/doris/pull/32314 

3. 由于 `show query``/l``oad profile stmt` 语句在实际用户场景中使用较少，该语句将不再支持与维护。同时该功能在 Pipeline 与 PipelineX 引擎中不支持。

- https://github.com/apache/doris/pull/32467

4. 升级 Arrow Flight 版本至 15.0.2，同时用户需要使用 ADBC 15.0.2 版本访问 Doris。

- https://github.com/apache/doris/pull/32827.  

## 2 升级问题

1. 修复了从 2.0.x 滚动升级至 2.1.x 的过程中，部分 BE 节点升级出现 Core 的问题。

- https://github.com/apache/doris/pull/32672

- https://github.com/apache/doris/pull/32444 

- https://github.com/apache/doris/pull/32162 

2. 修复了在 2.0.x 滚动升级至 2.1.x 过程中，使用 JDBC Catalog 会出现 Query 报错的问题。

- https://github.com/apache/doris/pull/32618

## 3 新功能

1. 默认开启列级权限。

- https://github.com/apache/doris/pull/32659

2. Pipeline 和 PipelineX 引擎能够在 K8S 下准确获取 CPU 核数。

- https://github.com/apache/doris/pull/32370 

3. 支持读取 Parquet INT96 类型

- https://github.com/apache/doris/pull/32394 

4. 支持 IP 透传的协议，以方便在 FE 之前启用代理的同时还能获取客户端准确的 IP 地址，实现白名单权限控制。

- https://github.com/apache/doris/pull/32338/files 

5. 增加对 Workload Queue 检测指标。

- https://github.com/apache/doris/pull/32259 

6. 增加系统表 `backend_active_tasks `，以实时监测每个 BE 上活跃任务以及消耗的资源信息。

- https://github.com/apache/doris/pull/31945 

7. 在 Spark Doris Connector 中增加 IPV4 和 IPV6 的支持。

- https://github.com/apache/doris/pull/32240

8. CCR 支持倒排索引。

- https://github.com/apache/doris/pull/32101 

9. 支持查询 Experimental 的 Session Variable。  

- https://github.com/apache/doris/pull/31837

10. 支持建立 `bitmap_union(bitmap_from_array())` 函数的物化视图。

-https://github.com/apache/doris/pull/31962

11. 支持对 Hive 中 `HIVE_DEFAULT_PARTITION` 分区进行列裁剪。

- https://github.com/apache/doris/pull/31736 

12. 支持 `set variable` 语句中使用函数。

- https://github.com/apache/doris/pull/32492

13. Arrow 序列化方式增加对 Variant 类型的支持。

- https://github.com/apache/doris/pull/32809

## 4 改进与优化 

1. 当系统自动重启或者滚动升级之后，自动启动 Routine Load 导入任务。

- https://github.com/apache/doris/pull/32239  

2. 优化了 Routine Load 任务在各个 BE 上的分布方式，让各个 BE 负载更加均衡。

- https://github.com/apache/doris/pull/32021 

3. 升级 Spark 的版本，解决部分 Spark Load 的安全问题。

- https://github.com/apache/doris/pull/30368

4. 在冷热分离过程中，自动跳过被删除的 Tablet. 

- https://github.com/apache/doris/pull/32079

5. Workload Group 支持对 Routine Load 的资源进行限制。

- https://github.com/apache/doris/pull/31671

6. 大幅度优化多表物化视图查询改写性能。

- https://github.com/apache/doris/pull/31886

7. 优化 Broker Load 任务对 FE 的内存使用

- https://github.com/apache/doris/pull/31985

8. 优化 Partition 的裁剪逻辑。

- https://github.com/apache/doris/pull/31970 

9. 优化 Tablet Schema Cache 对 BE 内存使用。

- https://github.com/apache/doris/pull/31141

10. 多表物化视图增加更多对 JOIN 类型的支持，包括 INNER JOIN、LEFT OUTER JOIN、RIGHT OUTER JOIN、FULL OUTER JOIN、LEFT SEMI JOIN、RIGHT SEMI JOIN、LEFT ANTI JOIN、RIGHT ANTI JOIN 

- https://github.com/apache/doris/pull/32909 

## 5 Bugs 修复

1. 修复 TopN 下推导致的问题。

- https://github.com/apache/doris/pull/326332.

2. 修复 JAVA UDF 带来的内存泄露问题。

- https://github.com/apache/doris/pull/32630

3. 修复 ODBC 表备份恢复问题。 

- https://github.com/apache/doris/pull/31989

4. 修复对 Variant 类型进行运算时常量折叠会导致 BE 出错的问题

- https://github.com/apache/doris/pull/32265

5. 修复了部分导入任务失败时 Routine Load 卡住的问题。

- https://github.com/apache/doris/pull/32638

6. 修复 SEMI JOIN 结果不正确的问题。

- https://github.com/apache/doris/pull/32477 

7. 当列的数据为空时，修复建立倒排索引会出错的问题。 

- https://github.com/apache/doris/pull/32669 

8. 修复`<=> join` 操作会出现 Core 的问题。

- https://github.com/apache/doris/pull/32623 

9. 修复部分列更新在有 Sequence 列结果准确性的问题。

- https://github.com/apache/doris/pull/32574

10. 修复 Select Outfile 导出到 Parquet 或者 ORC 格式的列类型映射问题。

- https://github.com/apache/doris/pull/32281 

11. 修复在 Restore 过程中 BE 有时候会 Core 的问题。

- https://github.com/apache/doris/pull/32489

12. 修复 `array_agg `函数结果不对的问题。

- https://github.com/apache/doris/pull/32387 

13. 使 Variant 类型应当一直是 nullable. 

- https://github.com/apache/doris/pull/32248

14. 修复 Schema Change 没有正确处理空 Block 的问题。

- https://github.com/apache/doris/pull/32396

15. 修复使用 `json_length()` 函数时部分场景会出错的问题。

- https://github.com/apache/doris/pull/32145 

16. 修复 Iceberg 表没有正确处理 Date Cast 转换的问题。

- https://github.com/apache/doris/pull/32194 

17. 修复 Variant 类型建立 Index 时出现的部分 Bug。

- https://github.com/apache/doris/pull/31992 

18. 修复当多个 `map_agg` 函数同时使用时结果不正确的问题。

- https://github.com/apache/doris/pull/31928

19. 修复 `money_format` 函数的返回结果不正确的问题。

- https://github.com/apache/doris/pull/31883 

20. 修复在高并发的建立链接时部分请求会卡住的问题。

- https://github.com/apache/doris/pull/31594