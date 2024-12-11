---
{
    "title": "Release 2.1.7",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

亲爱的社区小伙伴们，**Apache Doris 2.1.7 版本已于 2024 年 11 月 10 日正式发布。**2.1.7 版本持续升级改进，同时在湖仓一体、异步物化视图、半结构化数据管理、查询优化器、执行引擎、存储管理、以及权限管理等方面完成了若干修复。欢迎大家下载使用。

- [立即下载](https://doris.apache.org/download)
- [GitHub 下载](https://github.com/apache/doris/releases/tag/2.1.7-rc03)

## 行为变更

- 以下全局变量会被强制设置到下列默认值
  - enable_nereids_dml: true
  - enable_nereids_dml_with_pipeline: true
  - enable_nereids_planner: true
  - enable_fallback_to_original_planner: true
  - enable_pipeline_x_engine: true
- 审计日志增加了新的列 [#42262](https://github.com/apache/doris/pull/42262)
  - 更多信息，请参考[管理指南](https://doris.apache.org/zh-CN/docs/admin-manual/audit-plugin/)

## 新功能

### 异步物化视图

- 异步物化视图增加了一个属性 use_for_rewrite 用于控制是否参与透明改写 [#40332](https://github.com/apache/doris/pull/40332)

### 查询执行引擎

- 在 Profile 中输出变更的 session variable 列表。[#41016 ](https://github.com/apache/doris/pull/41016)
- 增加了`trim_in`、`ltrim_in` 和 `rtrim_in` 函数的支持。[#42641](https://github.com/apache/doris/pull/42641)
- 增加了一些 URL 函数，包括对 `to``p_level_domain`、`first_significant_subdomain` 、`cut_to_first_significant_subdomain` 支持。[#42916](https://github.com/apache/doris/pull/42916)
- 增加了 `bit_set` 函数。[#42099](https://github.com/apache/doris/pull/42099)
- 增加了`count_substrings` 函数。[#42055](https://github.com/apache/doris/pull/42055)
- 增加 `translate` 和 `url_encode` 函数。[#41051](https://github.com/apache/doris/pull/41051)
- 增加 `normal_cdf`, `to_iso8601`, `from_iso8601_date` 函数。[ #40695](https://github.com/apache/doris/pull/40695)


### 存储管理

- 增加了 `information_schema.table_options` 和 `information_schema.``table_properties` 系统表，支持查询建表时设置的一些属性。[#34384](https://github.com/apache/doris/pull/34384)
  - 更多信息，请参考系统表：
    - [table_options](https://doris.apache.org/docs/admin-manual/system-tables/information_schema/table_options/)
    - [table_properties](https://doris.apache.org/zh-CN/docs/admin-manual/system-tables/information_schema/table_properties/)
- 支持 `bitmap_empty` 作为默认值。[#40364](https://github.com/apache/doris/pull/40364)
- 增加了一个新的 Session 变量`require_sequence_in_insert` 来控制向 Unique Key 表进行`insert into select` 写入时，是否必须提供 Sequence 列。[#41655](https://github.com/apache/doris/pull/41655)

### 其他

允许在 BE WebUI 页面生成火焰图。[#41044](https://github.com/apache/doris/pull/41044)

## 改进提升

### 湖仓一体

- 支持写入数据到 Hive Text 格式表。[#40537](https://github.com/apache/doris/pull/40537)
  - 更多信息，请参考[使用 Hive 构建数据湖](https://doris.apache.org/zh-CN/docs/lakehouse/datalake-building/hive-build/)文档
- 使用 MaxCompute Open Storage API 访问 MaxCompute 数据。[#41610](https://github.com/apache/doris/pull/41610)
  - 更多信息，请参考 [MaxCompute](https://doris.apache.org/zh-CN/docs/lakehouse/database/max-compute/) 文档
- 支持 Paimon DLF Catalog。[#41694](https://github.com/apache/doris/pull/41694)
  - 更多信息，请参考 [Paimon Catalog](https://doris.apache.org/zh-CN/docs/lakehouse/datalake-analytics/paimon/) 文档
- 新增语法 `table$partitions` 语法支持直接查询 Hive 分区信息 [#41230](https://github.com/apache/doris/pull/41230)
  - 更多信息，请参考[通过 Hive 分析数据湖](https://doris.apache.org/zh-CN/docs/lakehouse/datalake-analytics/hive/)文档
- 支持 brotli 压缩格式的 Parquet 文件读取。[#42162](https://github.com/apache/doris/pull/42162)
- 支持读取 Parquet 文件中的 DECIMAL 256 类型。[#42241](https://github.com/apache/doris/pull/42241)
- 支持读取 OpenCsvSerde 格式的 Hive 表。[#42939](https://github.com/apache/doris/pull/42939)https://github.com/apache/doris/pull/42939

### 异步物化视图

- 细化了异步物化视图中构建时锁持有的粒度。[#40402](https://github.com/apache/doris/pull/40402) [#41010](https://github.com/apache/doris/pull/41010)

### 查询优化器

- 优化了极端情况下统计信息收集和使用的准确性，以提升规划稳定性。[#40457](https://github.com/apache/doris/pull/40457)
- 现在可以在更多情况下生成 Runtime Filter，以提升查询性能。 [#40815](https://github.com/apache/doris/pull/40815)
- 提升数值，日期和字符串函数的常量折叠能力，以提升查询性能。[#40820 ](https://github.com/apache/doris/pull/40820)
- 优化了列裁剪的算法，以提升查询性能。[#41548](https://github.com/apache/doris/pull/41548) 

### 查询执行引擎

- 支持并行的 Prepare 降低短查询的耗时。[#40270](https://github.com/apache/doris/pull/40270)
- 修正了 Profile 中一些 Counter 的名字，保持跟审计日志一致。[#41993](https://github.com/apache/doris/pull/41993)
- 增加了新的 Local Shuffle 规则，使得部分查询更快。[#40637](https://github.com/apache/doris/pull/40637)

### 存储管理

- Show Partitions 命令支持显示 Commit Version。 [#28274](https://github.com/apache/doris/pull/28274)
- 建表时检查不合理的 Partition EXPR。[#40158](https://github.com/apache/doris/pull/40158)
- 优化 Routine Load EOF 时的调度逻辑。[#40509](https://github.com/apache/doris/pull/40509)
- Routine Load 感知 Schema 变化。[#40508](https://github.com/apache/doris/pull/40508)
- 优化 Routine Load Task 超时逻辑。[#41135](https://github.com/apache/doris/pull/41135)

### 其他

- 支持通过 BE 配置关闭 BRPC 的内置服务端口。[#41047](https://github.com/apache/doris/pull/41047)
- 修复审计日志缺失字段以及重复记录的问题。[#41047](https://github.com/apache/doris/pull/43015)

## Bug 修复

### 湖仓一体

- 修复了 INSERT OVERWRITE 的行为跟 Hive 不一致的问题。[#39840](https://github.com/apache/doris/pull/39840)
- 清理临时创建的文件夹，解决 HDFS 上空文件夹太多的问题。[#40424](https://github.com/apache/doris/pull/40424)
- 修复某些情况下，使用 JDBC Catalog 导致 FE 内存泄露的问题。[#40923](https://github.com/apache/doris/pull/40923)
- 修复某些情况下，使用 JDBC Catalog 导致 BE 内存泄露的问题。[#41266](https://github.com/apache/doris/pull/41266)
- 修复某些情况下，读取 Snappy 压缩格式错误的问题。[#40862](https://github.com/apache/doris/pull/40862)
- 修复某些情况下，FE 端 FileSystem 可能泄露的问题。[#41108](https://github.com/apache/doris/pull/41108)
- 修复某些情况下，通过 EXPLAIN VERBOSE 查看外表执行计划可能导致空指针的问题。[#41231](https://github.com/apache/doris/pull/41231)
- 修复无法读取 Paimon parquet 格式表的问题。[#41487](https://github.com/apache/doris/pull/41487)
- 修复 JDBC Oracle Catalog 兼容性改动引入的性能问题。[#41407](https://github.com/apache/doris/pull/41407)
- 禁止下推隐式转换后的谓词条件已解决 JDBC Catalog 某些情况下查询结果不正确的问题。[#42242](https://github.com/apache/doris/pull/42242)
- 修复 External Catalog 中表名大小写访问异常的一些问题。[#42261](https://github.com/apache/doris/pull/42261)

### 异步物化视图

- 修复用户指定的 Start Time 不生效的问题。[#39573](https://github.com/apache/doris/pull/39573)
- 修复嵌套物化视图不刷新的问题。[#40433](https://github.com/apache/doris/pull/40433)
- 修复删除重建基表后，物化视图可能不刷新的问题。[#41762](https://github.com/apache/doris/pull/41762)
- 修复分区补偿改写可能导致结果错误的问题。[#40803]( https://github.com/apache/doris/pull/40803)
- 当 `sql_select_limit` 设置时，改写结果可能错误的问题。[#40106](https://github.com/apache/doris/pull/40106)

### 半结构化管理

- 修复了索引文件句柄泄露的问题。[#41915](https://github.com/apache/doris/pull/41915)
- 修复了特殊情况下倒排索引 `count()` 不准确的问题。[#41127](https://github.com/apache/doris/pull/41127)
- 修复了未开启 Light Schema Change 时 Variant 异常的问题。[#40908](https://github.com/apache/doris/pull/40908)
- 修复了 Variant 返回数组时内存泄漏的问题。[#41339](https://github.com/apache/doris/pull/41339)

### 查询优化器

- 修正了外表查询时，可能存在过滤条件 nullable 计算错误，导致执行异常的问题。[#41014](https://github.com/apache/doris/pull/41014)
- 修复范围比较表达式优化可能发生错误的问题。[#41356](https://github.com/apache/doris/pull/41356)

### 查询执行引擎

- `match_regexp` 函数不能正确处理空字符串的问题。[#39503](https://github.com/apache/doris/pull/39503)
- 解决在高并发场景下，Scanner 线程池卡死的问题。[#40495](https://github.com/apache/doris/pull/40495)
- 修复了 `data_floor` 函数结果错误的问题。[#41948](https://github.com/apache/doris/pull/41948)
- 修复了部分场景下，Cancel 消息不正确的问题。[#41798](https://github.com/apache/doris/pull/41798)
- 修复 Arrow Flight 打印太多的 Warn 日志的问题。[#41770] (https://github.com/apache/doris/pull/41770)
- 解决部分场景下 Runtime Filter 发送失败的问题。[#41698](https://github.com/apache/doris/pull/41698)
- 修复了一些系统表查询的时候不能正常结束或者卡住的问题。[#41592](https://github.com/apache/doris/pull/41592)
- 修复了窗口函数结果不正确的问题。[#40761](https://github.com/apache/doris/pull/40761)
- 修复 ENCRYPT 和 DECRYPT 函数导致 BE Core 的问题。[#40726](https://github.com/apache/doris/pull/40726)
- 修复 CONV 函数结果错误的问题。[#40530](https://github.com/apache/doris/pull/40530)

### 存储管理

- Memtable 前移在多副本情况下，有机器宕机时导入失败的问题。[#38003](https://github.com/apache/doris/pull/38003)
- 导入过程中，Memtable 在 Flush 阶段时，统计的内存不准确。[#39536](https://github.com/apache/doris/pull/39536)
- 修复 Memtable 前移多副本容错的问题。[#40477](https://github.com/apache/doris/pull/40477)
- 修复 Memtable 前移 bvar 统计不准的问题。[#40985](https://github.com/apache/doris/pull/40985)
- 修复 s3 Load 进度汇报不准的问题。[#40987](https://github.com/apache/doris/pull/40987)

### 权限管理

- 修复了 SHOW COLUMNS, SHOW SYNC, SHOW DATA FROM DB.TABLE 相关的权限问题。 [#39726](https://github.com/apache/doris/pull/39726)

### Others

- 修复 2.0 版本的审计日志插件在 2.1 版本无法使用的问题[#41400](https://github.com/apache/doris/pull/41400)