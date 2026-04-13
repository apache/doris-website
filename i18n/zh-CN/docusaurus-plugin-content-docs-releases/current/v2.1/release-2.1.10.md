---
{
    "title": "Release 2.1.10",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.1.10 版本已于 2025 年 05 月 17 日正式发布。 该版本持续在查询执行引擎、湖仓一体等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 2.1.10 版本已于 2025 年 05 月 17 日正式发布。** 该版本持续在查询执行引擎、湖仓一体等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。

- [立即下载](https://doris.apache.org/download)

- [GitHub 下载](https://github.com/apache/doris/releases/tag/2.1.10-rc01)

## 行为变更

- DELETE 不再错误的需要目标表的 SELECT_PRIV 权限 [#49794](https://github.com/apache/doris/pull/49794)
- Insert Overwrite 不再限制对同一个表并发只能为 1 [#48673](https://github.com/apache/doris/pull/48673)
- Merge on write unique 表禁止使用时序 compaction [#49905](https://github.com/apache/doris/pull/49905)
- 禁止在 VARIANT 类型上 build index。[#49159](https://github.com/apache/doris/pull/49159)

## 新功能

### 查询执行引擎

- 支持了更多的 GEO 类型的计算函数`ST_CONTAINS ` , `ST_INTERSECTS`, `ST_TOUCHES`，`GeometryFromText`，`ST_Intersects`, `ST_Disjoint`, `ST_Touches`。[#49665](https://github.com/apache/doris/pull/49665) [#48695](https://github.com/apache/doris/pull/48695)
- 支持 `years_of_week` 函数。[#48870](https://github.com/apache/doris/pull/48870)

## 湖仓一体

- Hive Catalog 支持 Catalog 级别的分区缓存开关控制 [#50724](https://github.com/apache/doris/pull/50724)
  - 更多详情，可参考[文档](https://doris.apache.org/zh-CN/docs/dev/lakehouse/meta-cache#关闭-hive-catalog-元数据缓存)

## 改进提升

### 湖仓一体

- Paimon 依赖版本升级到 1.0.1
- Iceberg 依赖版本升级到 1.6.1
- 将 Parquet Footer 的内存开销纳入 Memory Tracker 管控，以避免可能的 OOM 问题。[#49037](https://github.com/apache/doris/pull/49037)
- 优化 JDBC Catalog 的谓词下推逻辑，支持 AND/OR 等连接谓词的下推[#50542](https://github.com/apache/doris/pull/50542)
- 预编译版本默认携带 Jindofs 扩展包以支持阿里云 OSS-HDFS 访问。

### 半结构化管理

- ANY 函数支持 JSON 类型 [#50311](https://github.com/apache/doris/pull/50311)
- JSON_REPLACE，JSON_INSERT，JSON_SET，JSON_ARRAY 函数支持 JSON 数据类型和复杂数据类型[#50308](https://github.com/apache/doris/pull/50308)

### 查询优化器

- 当 in 表达式的 options 多于 `Config.max_distribution_pruner_recursion_depth` 时，不执行分桶裁剪，以提升规划速度 [#49387](https://github.com/apache/doris/pull/49387)

### 存储管理

- 减少日志和改进部分日志。[#47647](https://github.com/apache/doris/pull/47647)  [#48523](https://github.com/apache/doris/pull/48523)

### 其他

- 避免 thrift rpc END_OF_FILE 异常 [#49649](https://github.com/apache/doris/pull/49649)

## Bug 修复

### 湖仓一体

- 修复某些情况下，在 Hive 侧新建表，Doris 侧无法立即查看到的问题 [#50188](https://github.com/apache/doris/pull/50188)
- 修复某些 Text 格式 Hive 表访问报错 "Storage schema reading not supported" 的 问题 [#50038](https://github.com/apache/doris/pull/50038)
  - 查看[文档 get_schema_from_table 详情](https://doris.apache.org/zh-CN/docs/dev/lakehouse/catalogs/hive-catalog?_highlight=get_schema_from_table#语法)
- 修复某些情况下，写入 Hive/Iceberg 表时，元数据提交并发问题 [#49842](https://github.com/apache/doris/pull/49842)
- 修复某些情况下，写入存储在 oss-hdfs 上的 Hive 表失败的问题 [#49754](https://github.com/apache/doris/pull/49754)
- 修复当 Hive 分区键值有逗号的情况下，访问失败的问题 [#49382](https://github.com/apache/doris/pull/49382)
- 修复某些情况下，Paimon 表 Split 分配不均匀的问题 [#50083](https://github.com/apache/doris/pull/50083)
- 修复读取存储在 OSS 上的 Paimon 表时，无法正确处理 Delete 文件的问题 [#49645](https://github.com/apache/doris/pull/49645)
- 修复 MaxCompute Catalog 中，读取高精度 Timestamp 列时无法访问的问题 [#49600](https://github.com/apache/doris/pull/49600)
- 修复某些情况下，删除 Catalog 可能导致部分资源泄露的问题 [#49621](https://github.com/apache/doris/pull/49621)
- 修复某些情况下，读取 LZO 压缩格式的数据失败的问题 [#49538](https://github.com/apache/doris/pull/49538)
- 修复某些情况下，ORC 延迟物化功能导致复杂类型读取错误的问题 [#50136](https://github.com/apache/doris/pull/50136)
- 修复某些情况下，读取 pyorc-0.3 版本产生的 ORC 文件报错的问题 [#50358](https://github.com/apache/doris/pull/50358)
- 修复某些情况下，EXPORT 操作导致元数据死锁的问题 [#50088](https://github.com/apache/doris/pull/50088)

### 索引

- 修复多次添加、删除和重命名列操作后构建倒排索引的错误 [#50056](https://github.com/apache/doris/pull/50056)
- 在 index compaction 中索引对应的列唯一 ID 的校验，避免潜在的数据异常和系统错误 [#47562](https://github.com/apache/doris/pull/47562)

### 半结构化数据类型

- 修复某些情况下，VARIANT 类型转 JSON 类型返回 NULL 错误的结果 [#50180](https://github.com/apache/doris/pull/50180)
- 修复某些情况下，JSONB CAST 导致 crash [#49810](https://github.com/apache/doris/pull/49810)
- 禁止在 VARIANT 类型上 build index [#49159](https://github.com/apache/doris/pull/49159)
- 修复 named_struct 函数 decimal 类型精度正确性 [#48964](https://github.com/apache/doris/pull/48964)

### 查询优化器

- 修复常量折叠中的一些问题 [#49413](https://github.com/apache/doris/pull/49413) [#50425](https://github.com/apache/doris/pull/50425) [#49686](https://github.com/apache/doris/pull/49686) [#49575](https://github.com/apache/doris/pull/49575) [#50142](https://github.com/apache/doris/pull/50142)
- 公共表达式提取在 lambda 表达式上可能工作异常 [#49166](https://github.com/apache/doris/pull/49166)
- 修复消除 group by key 中的常量可能不能正常工作的问题 [#49589](https://github.com/apache/doris/pull/49589)
- 修复在极端场景下，由于统计信息的推导错误，规划无法正常执行的问题 [#49415](https://github.com/apache/doris/pull/49415)
- 修复部分依赖 BE 中元数据的 information_schema 表，不能获取完整数据的问题 [#50721](https://github.com/apache/doris/pull/50721)

### 查询执行引擎

- 修复了找不到 explode_json_array_json_outer 函数的问题。[#50164](https://github.com/apache/doris/pull/50164)
- 修复了 substring_index 不支持动态参数的问题。[#50149](https://github.com/apache/doris/pull/50149)
- 修复了很多 st_contains 函数计算结果不对的问题。[#50115](https://github.com/apache/doris/pull/50115)
- 修复了 array_range 函数可能导致的 core 的问题。[#49993](https://github.com/apache/doris/pull/49993)
- 修复了 date_diff 函数计算结果错误的问题。[#49429](https://github.com/apache/doris/pull/49429)
- 修复了一系列字符串函数在非 ASCII 编码下的乱码或者结果错误的问题。[#49231](https://github.com/apache/doris/pull/49231) [#49846](https://github.com/apache/doris/pull/49846) [#49127](https://github.com/apache/doris/pull/49127) [#40710](https://github.com/apache/doris/pull/40710)

### 存储管理

- 修复某些情况下，动态分区表（Dynamic Partition Table）回放元数据失败的问题[#49569](https://github.com/apache/doris/pull/49569)
- 修复 ARM 下 streamload 可能因为操作序列丢数据的问题 [#48948](https://github.com/apache/doris/pull/48948)
- 修复 full compaction 报错以及可能导致 mow 数据重复的问题 [#49825](https://github.com/apache/doris/pull/49825)  [#48958](https://github.com/apache/doris/pull/48958)
- 修复没有持久化分区 Storage Policy 的问题。 [#49721](https://github.com/apache/doris/pull/49721)
- 修复导入之后文件极小概率不存在的问题。[ #50343](https://github.com/apache/doris/pull/50343)
- 修复 CCR 和磁盘均衡并发可能导致的文件找不见问题。[#50663 ](https://github.com/apache/doris/pull/50663)
- 修复备份恢复大快照时可能出现的 connection reset 问题。[#49649](https://github.com/apache/doris/pull/49649)
- 修复 FE Follower 丢失本地备份快照的问题。[#49550](https://github.com/apache/doris/pull/49550)

### Others

- 修复某些场景下，审计日志可能丢失的问题 [#50357](https://github.com/apache/doris/pull/50357)
- 修复审计日志中 isQuery 标记可能不正确的问题 [#49959](https://github.com/apache/doris/pull/49959)
- 修复审计日志中部分查询 sqlHash 不正确的问题 [#49984](https://github.com/apache/doris/pull/49984)