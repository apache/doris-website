---
{
    "title": "Release 4.0.2",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.2版本发布，重磅推出Doris Catalog实现多集群联邦查询，新增倒排索引拼音分词器、Ann索引扫描能力、sem聚合函数等AI增强功能。优化物化视图透明重写、Iceberg表compaction操作、Huggingface数据集访问，修复查询优化、存算分离、数据湖集成等多项缺陷，全面提升大数据分析性能和稳定性。"
}
---

## 一、新功能

### AI & Search

- 倒排索引支持自定义分析器，包含拼音分词器和拼音过滤器（#57097）
- 倒排索引的搜索函数新增多位置短语查询（PhraseQuery）支持（#57588）
- 新增 Ann 索引仅扫描能力（#57243）

### 函数

- 新增 `sem` 聚合函数（#57545）
- 支持源自 Hive 的 `factorial` 简单 SQL 函数（#57144）
- 部分正则表达式函数新增零宽断言支持（#57643）
- JSON 类型支持 GROUP BY 和 DISTINCT 操作（#57679）
- 新增 add/sub_time 时间函数（#56200）
- 新增 deduplicate_map 函数（#58403）

### 物化视图（MTMV）

- 非分区基表数据变更时，物化视图仍可参与透明查询重写（#56745）
- 创建 MTMV 支持基于视图创建（#56423）
- MTMV 刷新支持多 PCT 表（#58140）
- 物化视图包含窗口函数时，支持窗口函数重写（#55066）

### 数据湖

- 新增 Doris Catalog
  -  该功能允许用户通过 Catalog 能力关联多个独立的 Doris 集群并进行高效的联邦数据查询。解决 Doris 集群间数据无法关联查询的问题。
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/catalogs/doris-catalog
- 支持通过 rewrite_data_files 方法对 Iceberg 表进行 compaction 操作。
  -  该操作允许用户对 Iceberg 小文件进行合并，从而优化读取效率。
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#rewrite_data_files
- 支持通过 WARM UP 语句对 Hive、Iceberg、Paimon 等外部表数据进行缓存预热。
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/data-cache#cache-warmup
- 支持通过 ALTER 语句对 Iceberg 表进行 Partition Evolution 操作。
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/catalogs/iceberg-catalog#partition-evolution
- 支持 HTTP Table Valued Function
  -  支持通过 Table Valued Function 直接读取 HTTP 资源文件。
  -  文档：https://doris.apache.org/docs/4.x/sql-manual/sql-functions/table-valued-functions/http
- 支持直接访问 Huggingface 上的数据集。
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/huggingface
- 支持通过 Iceberg REST Catalog 协议访问 Microsoft OneLake
  -  文档：https://doris.apache.org/docs/4.x/lakehouse/best-practices/doris-onelake
- 支持直接映射 Hive、Iceberg、Paimon、JDBC 外表中的 binary 类型到 Doris 的 varbinary 类型。
  -  请参阅各 Catalog 文档的【列映射】小节。

## 二、优化

- 优化 `FROM_UNIXTIME` 函数性能（#57423）
- 移除 PartitionKey 比较中的 `castTo` 转换操作，提升分区处理效率（#57518）
- 降低 Catalog 中 Column 类的内存占用（#57401）
- Ann 索引训练前累积多个小批次数据，提升训练效率（#57623）
- 升级 Hadoop 依赖到 3.4.2 版本。（#58307）
- 优化 FE 和 BE 的优雅退出机制，降低节点退出对查询的影响。（#56601）
- 优化对包含大量分区的 hive 表的写入的效率。（#58166）
- 优化 Paimon 表 Split 占用内存过大的问题。（#57950）
- 优化对 Parquet RLE_DICTIONARY 编码的读取效率（#57208）
- 优化 FE 和 BE 的优雅退出机制，降低节点退出对查询的影响。(#56601 )

## 三、Bug 修复

### 查询

- 修复输入为 null 时 `utc_time` 函数返回结果错误的问题（#57716）
- 修复 UNION ALL 结合 TVF 时抛出异常的问题（#57889）
- 修复唯一键表创建物化视图时，WHERE 子句包含非键列的问题（#57915）
- 修复 window 函数：LAG/LEAD 偏移参数支持常量表达式计算（#58200）
- 修复聚合函数：可空列投影前下推聚合操作异常；非空列 count 下推聚合问题（#58234）
- 修复时间函数：second/microsecond 函数未处理时间字面量；time_to_sec 处理 null 值时因垃圾值报错（#56659、#58410）
- 修复 AI 函数：_exec_plan_fragment_impl 调用 AI 函数时出现未知错误（#58521）
- 修复地理信息：geo 模块内存泄漏（#58004）
- 修复 information_schema：偏移时区格式不兼容（#58412）

### 物化视图与模式变更

- 修复物化视图包含分组集合和扫描过滤器时重写失败的问题（#57343）
- 修复大流量模式变更时读取单行集非重叠段导致的 coredump 问题（#57191）

### 存算分离

- 修复 TopN 查询中广播远程读取的问题（#58044）
- 修复云环境下删除 tablet 任务堆积的问题（#58131）
- 修复云环境首次启动时服务上线耗时过长的问题（#58152）

### 数据湖

- 修复某些情况下，Hive 分区变更导致元数据缓存不一致的问题。(#58707)
- 修复写入 TIMESTAMP 类型分区的 Iceberg 表错误的问题。(#58603)
- 修复 Paimon 表 Incremental Read 行为和 Spark 不一致的问题。(#58239)
- 修复某些情况下，外表元数据缓存可能导致的死锁问题。(#57856)
- 修复 BE 端 s3 client 线程数不合理导致的 IO 吞吐低的问题。(#58511)
- 修复某些情况，写入存储在非 S3 对象存储上的外表时失败的问题。(#58504)
- 修复某些情况下，使用 query() 进行 JDBC Catalog SQL 透传失败的问题。(#57745)
- 修复 JNI Reader 时间统计导致读取性能下降的问题。(#58224)
- 修复 BE 侧 jni.log 无法打印的问题。(#58457)

### 其他

- 修复在非 Master 阶段 UNSET GLOBAL 变量时错误的问题(#58285)
- 修复某些情况下，异常的export任务无法取消的问题。(#57488)