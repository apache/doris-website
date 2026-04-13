---
{
    "title": "Release 2.1.9",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 2.1.9 版本已于 2025 年 04 月 02 日正式发布。 该版本持续在倒排索引、查询优化器与存储管理等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。"
}
---

亲爱的社区小伙伴们，**Apache Doris 2.1.9 版本已于 2025 年 04 月 02 日正式发布。** 该版本持续在倒排索引、查询优化器与存储管理等方面进行改进提升与问题修复，进一步加强系统的性能和稳定性，欢迎大家下载体验。

- [立即下载](https://doris.apache.org/download)

- [GitHub 下载](https://github.com/apache/doris/releases/tag/2.1.9-rc02)


## 行为变更

- Audit Log 中的 SQLHash  现在通过当前执行的 SQL 精确计算，解决了同一请求中所有 SQL 使用相同 SQLHash 的问题。[#48242](https://github.com/apache/doris/pull/48242)
- 查询返回的 ColumnLabelName 与 SQL 中的输入完全一致。[#47093 ](https://github.com/apache/doris/pull/47093)
- 所有在用户属性中设置的变量，优先级均高于 session 级别设置的变量。 [#47185](https://github.com/apache/doris/pull/47185)

## 新功能

### 存储管理

- 禁止 rename 分区列。[#47596](https://github.com/apache/doris/pull/47596)

### 其他

- FE 监控指标新增 Catalog、Database、Table 数量指标。[#47891](https://github.com/apache/doris/pull/47891)

## 改进提升

### 倒排索引

- VARIANT 类型中的 ARRAY 支持倒排索引。[#47688 ](https://github.com/apache/doris/pull/47688)
- Profile 中展示每个过滤条件的倒排索引性能指标。[#47504](https://github.com/apache/doris/pull/47504)

### 查询优化器

- 支持在聚合查询中使用 `SELECT`` *`，如果下层 relation 仅输出聚合 key 列。[#48006](https://github.com/apache/doris/pull/48006)

### 存储管理

- CCR 优化回收 binlog 效率、小文件传输效率，并增强了混沌环境下的健壮性。[#47547](https://github.com/apache/doris/pull/47547) [#47313 ](https://github.com/apache/doris/pull/47313)[#45061](https://github.com/apache/doris/pull/45061)
- 改进了导入的错误提示，使错误提示更加具体。[#47918](https://github.com/apache/doris/pull/47918) [#47470](https://github.com/apache/doris/pull/47470) 

## Bug 修复

### 湖仓一体

- 修复 BE 端无法正确配置 krb5.conf 路径的问题。[#47679](https://github.com/apache/doris/pull/47679)
- 禁止 `SELECT ``OUTFILE` 语句重试以避免重复导出数据。[#48095](https://github.com/apache/doris/pull/48095)
- 修复无法通过 JAVA API 访问 Paimon 表的问题。[#47192](https://github.com/apache/doris/pull/47192)
- 修复无法写入存储位置为 `s3a://` 的 Hive 表的问题。[#47162](https://github.com/apache/doris/pull/47162)
- 修复 Catalog 的 Comment 字段没有被持久化的问题。[#46946](https://github.com/apache/doris/pull/46946)
- 修复某些情况下，JDBC BE 端类加载泄漏的问题。[#46912](https://github.com/apache/doris/pull/46912)
- 修复 JDBC Catalog 无法使用高版本 ClickHouse JDBC Driver 的问题。 [#46026](https://github.com/apache/doris/pull/46026)
- 修复某些情况下，读取 Iceberg Position Delete 导致 BE 宕机的问题。[#47977](https://github.com/apache/doris/pull/47977)
- 修复多分区列情况下读取 MaxCompute 表数据错误的问题。[#48325](https://github.com/apache/doris/pull/48325)
- 修复某些情况下读取 Parquet 复杂列类型错误的问题。[#47734](https://github.com/apache/doris/pull/47734)

### 倒排索引

- 修复 ARRAY 类型倒排索引空值处理错误的问题。[#48231](https://github.com/apache/doris/pull/48231)
- 修复对刚刚添加的列执行 `BUILD INDEX` 异常的问题。[#48389](https://github.com/apache/doris/pull/48389)
- 修复特殊字符 UTF8 编码索引被截断导致结果错误的问题。[#48657](https://github.com/apache/doris/pull/48657)

### 半结构化数据类型

- 修复 `array_agg` 函数在特殊情况下 crash 的问题。[#46927](https://github.com/apache/doris/pull/46927)
- 修复 Stream Load 导入 JSON 类型时，chunk 参数设置错误导致 crash 的问题。 [#48196](https://github.com/apache/doris/pull/48196)

### 查询优化器

- 修复时间函数内嵌套 `current_date` 等关键字函数无法的进行常量折叠的问题。[#47288](https://github.com/apache/doris/pull/47288)
- 修复非确定性函数相关的结果错误问题。[#48321](https://github.com/apache/doris/pull/48321) 
- 修复当原表有 on update 列属性时，CREATE TABLE LIKE 无法执行的问题。[#48007](https://github.com/apache/doris/pull/48007)
- 修复直查聚合模型表的物化视图可能产生非预期规划报错的问题。[#47658](https://github.com/apache/doris/pull/47658)
- 修复 PrepareStatement 因为内部 ID 溢出导致异常的问题。[#47950](https://github.com/apache/doris/pull/47950)

### 查询执行引擎

- 修复了查询系统表时，可能的查询卡住或者空指针的问题。[#48370](https://github.com/apache/doris/pull/48370)
- LEAD/LAG 函数支持了 DOUBLE 类型。[#47940](https://github.com/apache/doris/pull/47940)
- 修复了 `case when` 条件超过 256 个时，查询报错的问题。[#47179](https://github.com/apache/doris/pull/47179)
- 修复了 `str_to_date` 函数在空格的时候，结果错误的问题。[#48920](https://github.com/apache/doris/pull/48920)
- 修复了`split_part` 函数在常量折叠时遇到 || ，结果错误的问题。[#48910](https://github.com/apache/doris/pull/48910)
- 修复了 `log` 函数结果错误的问题。[#47228](https://github.com/apache/doris/pull/47228)
- 修复了 `array` / `map` 函数在 lambda 表达式中使用时导致的 core 的问题。[#49140](https://github.com/apache/doris/pull/49140)

### 存储管理

- 修复了导入聚合表时，可能的内存写脏问题。[#47523](https://github.com/apache/doris/pull/47523)
- 修复内存紧张时 MoW 导入偶发 coredump 问题。[#47715](https://github.com/apache/doris/pull/47715)
- 修复 MoW 在 BE 重启和 Schema Change 时可能出现重复 key 的问题。[#48056](https://github.com/apache/doris/pull/48056) [#48775](https://github.com/apache/doris/pull/48775)  
- 修复 Group Commit 和全局打开列更新以及 memtable 前移时的问题。[#48120](https://github.com/apache/doris/pull/48120) [#47968](https://github.com/apache/doris/pull/47968)

### 权限管理

- 使用 LDAP 时不再会抛出 PartialResultException 异常。[#47858](https://github.com/apache/doris/pull/47858)