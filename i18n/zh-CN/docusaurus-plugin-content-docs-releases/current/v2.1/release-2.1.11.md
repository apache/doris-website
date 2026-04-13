---
{
    "title": "Release 2.1.11",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，我们很高兴地向大家宣布，在 8 月 15 日我们引来了 Apache Doris 2.1.11 版本的正式发布，欢迎大家下载使用。"
}
---

亲爱的社区小伙伴们，我们很高兴地向大家宣布，在 8 月 15 日我们引来了 Apache Doris 2.1.11 版本的正式发布，欢迎大家下载使用。


## 行为变更

- time_series_max_tablet_version_num 控制时序 compaction 策略表的最大版本数目。[#51371](https://github.com/apache/doris/pull/51371)
- 修复冷热分层时 hdfs root_path 没有生效的问题。[#48441](https://github.com/apache/doris/pull/48441)
- 在 新优化器（Nereids）中，当查询时的表达式的深度或宽度超过阈值限制时，无论是否开始查询回退到老优化器，都不会回退。[#52431](https://github.com/apache/doris/pull/52431)
- 统一了开始 unicode 名字与否的名字检查规则，现在非 unicode 名字规则是 unicode 名字规则的严格子集。[#53264](https://github.com/apache/doris/pull/53264)

## 新功能

### 查询执行引擎

- 引入系统表 routine_load_job 查看routine load job 信息。[#48963](https://github.com/apache/doris/pull/48963)

### 查询优化器

- 支持了 MySQL 的 GROUP BY 上卷语法 GROUP BY ... WITH ROLLUP。[#51978](https://github.com/apache/doris/pull/51978)

## 改进提升

### 查询优化器

- 优化了在聚合模型表和主键模型 mor 表上收集统计信息的性能。[#51675](https://github.com/apache/doris/pull/51675)

### 异步物化视图

- 优化了透明改写的规划性能 [#51309](https://github.com/apache/doris/pull/51309) 
- 优化了刷新的性能 [#51493](https://github.com/apache/doris/pull/51493)

## Bug 修复

### 导入

- 修复 routineload alter 属性之后 show 展示结果不符合预期的问题 [#53038](https://github.com/apache/doris/pull/53038)

### 湖仓一体

- 修复某些情况读取 iceberg equality delete 数据错误的问题  [#51253](https://github.com/apache/doris/pull/51253)
- 修复iceberg hadoop catalog 在 kerberos 环境下报错的问题  [#50623](https://github.com/apache/doris/pull/50623) [#52149](https://github.com/apache/doris/pull/52149)
- 修复 Kerberos 环境下 Iceberg 表写入事务提交失败的问题  [#51508](https://github.com/apache/doris/pull/51508)
- 修复 Iceberg 表写入事务提交错误的问题  [#52716](https://github.com/apache/doris/pull/52716)
- 修复某些情况下访问 kerberos 环境的 Hudi 表数据报错的问题  [#51713 ](https://github.com/apache/doris/pull/51713)
- SQL Server Catalog 支持识别 IDENTITY 列信息  [#51285](https://github.com/apache/doris/pull/51285)
- 修复某些情况下 Jdbc Catalog 表无法获取行数信息的问题  [#50901](https://github.com/apache/doris/pull/50901)
- 优化 orc zlib 在 x86 环境下的解压性能并修复潜在问题  [#51775](https://github.com/apache/doris/pull/51775)
- 在 Profile 中增加 Parquet/ORC 条件过滤和延迟物化相关的指标  [#51248](https://github.com/apache/doris/pull/51248)
- 优化 ORC Footer 的读取性能  [#51117](https://github.com/apache/doris/pull/51117)
- 修复 Table Valued Function 无法读压缩格式的 json 文件的问题  [#51983](https://github.com/apache/doris/pull/51983)
- 修复某些情况下并发刷新 Catalog 导致元数据不一致的问题  [#51787](https://github.com/apache/doris/pull/51787)

### 索引

- 修复了倒排索引在处理包含 CAST 操作的 IN 谓词时出现的查询错误，避免返回错误的查询结果。[#50860](https://github.com/apache/doris/pull/50860)
- 修复了倒排索引在执行异常情况下的内存泄漏问题。[#52747](https://github.com/apache/doris/pull/52747)

### 半结构化数据类型

- 修复了一些json 函数在null 值情况下结果错误的问题。
- 修复了一些json 函数相关的bug。[#52543](https://github.com/apache/doris/pull/52543) [#51516](https://github.com/apache/doris/pull/51516) 

### 查询优化器

- 修复解析字符串为日期失败时，查询无法继续执行的问题 [#50900](https://github.com/apache/doris/pull/50900)
- 修复了个别场景下常量折叠结果错误的问题 [#51738](https://github.com/apache/doris/pull/51738)
- 修复个别数组函数在遇到 null literal 作为输入时，无法正常规划的问题 [#50899](https://github.com/apache/doris/pull/50899)
- 修复在极端场景下，开启 local shuffle 可能导致结果错误的问题 [#51313](https://github.com/apache/doris/pull/51313) [#52871 ](https://github.com/apache/doris/pull/52871)
- 修复了 replace view 可能导致 desc view 时看不到列信息的问题 [#52043](https://github.com/apache/doris/pull/52043) 
- 修复了 prepare command 在非 master FE 节点上有可能无法正确执行的问题 [#52265](https://github.com/apache/doris/pull/52265)

### 异步物化视图

- 修复当基表列的类型变更，可能导致透明改写后查询失败的问题 [#50730](https://github.com/apache/doris/pull/50730)
- 修复了个别场景下，透明改写分区补偿错误的问题 [#51899](https://github.com/apache/doris/pull/51899) [#52218](https://github.com/apache/doris/pull/52218)

### 查询执行引擎

- 修复TopN计算时如果遇到variant 列类型，可能会core的问题。[#52573](https://github.com/apache/doris/pull/52573) 
- 修复函数bitmap_from_base64在输入错误数据时会Core的问题。[#53018](https://github.com/apache/doris/pull/53018) 
- 修复了bitmap_union 函数在超大数据量时，一些结果错误的问题。[#52033](https://github.com/apache/doris/pull/52033)
- 修复了multi_distinct_group_concat在窗口函数中使用时计算错误的问题。[#51875](https://github.com/apache/doris/pull/51875)
- 修复了array_map 函数，在极端值时可能core的问题。[#51618](https://github.com/apache/doris/pull/51618) [#50913](https://github.com/apache/doris/pull/50913)
- 修复了错误的时区处理的问题。[#51454](https://github.com/apache/doris/pull/51454) 

### Others

- 修复多语句在主 FE 和非主 FE 行为不一致的问题。[#52632](https://github.com/apache/doris/pull/52632)
- 修复 prepared statment  在非主 FE 报错的问题。[#48689](https://github.com/apache/doris/pull/48689)
- 修复 roolup 操作时可能导致 CCR 中断的问题。[#50830](https://github.com/apache/doris/pull/50830)