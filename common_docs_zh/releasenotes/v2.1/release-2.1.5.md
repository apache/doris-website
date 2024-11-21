---
{
    "title": "Release 2.1.5",
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

亲爱的社区小伙伴们，Apache Doris 2.1.5 版本已于 2024 年 7 月 24 日正式发布。2.1.5 版本在湖仓一体、多表物化视图、半结构化数据分析等方面进行了全面更新及改进，同时在倒排索引、查询优化器、查询引擎、存储管理等 10 余方向上完成了若干问题修复，欢迎大家下载使用。

**官网下载：** https://doris.apache.org/download/

**GitHub 下载：** https://github.com/apache/doris/releases

## 行为变更

- JDBC Catalog 的默认连接池大小从 10 调整为 30。[#37023](https://github.com/apache/doris/pull/37023)

- 创建 JDBC Catalog 时，参数 `connection_pool_max_size` 的默认值改为 30，以避免高并发场景下连接池耗尽的问题。

- 将系统的保留内存的最小值，即 `low water mark` 调整为 `min (6.4G, MemTotal * 5%)`，以更好地防止 BE 出现 OOM 问题。

- 修改了单请求多个语句的处理逻辑，当客户端未设置 `CLIENT_MULTI_STATEMENTS` 标志位时，将仅返回最后一个语句的结果，而非所有语句结果。

- 不再允许直接更改异步物化视图的数据。[#37129](https://github.com/apache/doris/pull/37129)

- 增加会话变量 `use_max_length_of_varchar_in_ctas`，用于控制 CTAS 时 VARCHAR 和 CHAR 类型长度的生成行为。默认值是 true。当设置为 false 时，使用推导出的 VARCHAR 长度，而不是使用最大长度。[#37284](https://github.com/apache/doris/pull/37284)

- 统计信息收集，默认开启了通过文件大小预估 Hive 表行数的功能。[#37694](https://github.com/apache/doris/pull/37694)

- 默认开启异步物化视图透明改写机制。[#35897](https://github.com/apache/doris/pull/35897)

- 透明改写利用分区物化视图，如果分物物化视图部分分区失效，默认行为是将所有基础表与物化视图联合，以保证查询数据的正确性。 [#35897](https://github.com/apache/doris/pull/35897)

## 新功能

### 湖仓一体

- 会话变量 `read_csv_empty_line_as_null` 用于控制在读取 CSV 格式文件时，是否忽略空行。默认情况下忽略空行，当设置为 true 时，空行将被读取为所有列均为 Null 的行。[#37153](https://github.com/apache/doris/pull/37153)  
  
  - 更多信息，请参考[文档](https://doris.apache.org/docs/lakehouse/datalake-analytics/hive?_highlight=compress_type)。

- 新增兼容 Presto 的复杂类型输出格式。通过设置 `set serde_dialect="presto"`，可以控制复杂类型的输出格式 与 Presto 一致，用于平滑迁移 Presto 业务。[#37253](https://github.com/apache/doris/pull/37253)

​        

### 多表物化视图
- 支持在构建物化视图中使用非确定性函数。[#37651](https://github.com/apache/doris/pull/37651)

- 支持原子替换异步物化视图定义。[#37147](https://github.com/apache/doris/pull/37147)

- 支持通过 `show create materialized view` 查看异步物化视图创建语句。 [#37125](https://github.com/apache/doris/pull/37125)

- 支持对多维聚合查询的透明改写。[#37436](https://github.com/apache/doris/pull/37436)

- 支持对非聚合物化视图的聚合查询进行透明改写。  [#37497](https://github.com/apache/doris/pull/37497)

- 支持使用 Key 列，对查询中的 DISTINCT 聚合做透明改写。[#37651](https://github.com/apache/doris/pull/37651)

- 支持对物化视图进行分区，通过使用 `date_trunc` 对分区进行汇总。[#31812](https://github.com/apache/doris/pull/31812) [#35562](https://github.com/apache/doris/pull/35562)

- 支持分区表值函数（TVF） [#36479](https://github.com/apache/doris/pull/36479)

### 半结构化数据分析

- 使用 VARIANT 类型的表支持部分列更新。 [#34925](https://github.com/apache/doris/pull/34925)

- 支持默认开启 PreparedStatement。 [#36581](https://github.com/apache/doris/pull/36581)

- VARIANT 类型支持导出为 CSV 格式。[#37857](https://github.com/apache/doris/pull/37857)

- 支持 `explode_json_object` 函数，用于将 JSON Object 行转列。 [#36887](https://github.com/apache/doris/pull/36887)

- ES Catalog 将 ES 的 NESTED 或者 OBJECT 类型映射成 Doris JSON 类型。[#37101](https://github.com/apache/doris/pull/37101)

- 默认情况下，对于具有指定分词器的倒排索引，默认开启 `support_phrase` 以提升 `match_phrase` 系列查询性能。[#37949](https://github.com/apache/doris/pull/37949)

### 查询优化器

- 支持 `explain DELETE FROM` 语句。[#37100](https://github.com/apache/doris/pull/37100)

- 支持常量表达式参数的 Hint 形式。[#37988](https://github.com/apache/doris/pull/37988)

### 内存管理

- 增加了 HTTP API 以清除缓存。 [#36599](https://github.com/apache/doris/pull/36599)

### 权限管理

- 支持对表值函数（TVF）中的资源进行鉴权。 [#37132](https://github.com/apache/doris/pull/37132)

## 改进提升

### 湖仓一体

- 将 Paimon 升级至 0.8.1 版本。

- 修复在部分情况下，查询 Paimon 表时导致 `org.apache.commons.lang.StringUtils` 的问题。[#37512](https://github.com/apache/doris/pull/37512)

- 支持腾讯云 LakeFS。 [#36891](https://github.com/apache/doris/pull/36891)

- 优化了外部表查询时获取文件列表的超时时间。 [#36842](https://github.com/apache/doris/pull/36842)

- 可通过会话变量 `fetch_splits_max_wait_time_ms` 进行设置

- 改进了 SQLServer JDBC Catalog 的默认连接逻辑。 [#36971](https://github.com/apache/doris/pull/36971)

  - 默认情况下，不干预连接加密设置。仅当 `force_sqlserver_jdbc_encrypt_false` 设置为 true 时，才会强制在 JDBC URL 中添加 `encrypt=false` 以减少认证错误，从而提供更灵活的控制加密行为的能力。

- Hive 表的 `show create table` 语句增加序列化/反序列化。[#37096](https://github.com/apache/doris/pull/37096)

- FE 端 Hive 表列表默认缓存时间由 1 天改为 4 小时

- 数据导出（Export/Outfile）支持指定 Parquet 和 ORC 的压缩格式。

  - 更多信息，请参考[文档](https://doris.apache.org/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/EXPORT/?_highlight=compress_type)。

- 当使用 CTAS+TVF 创建表时，TVF 中的分区列将被自动映射为 Varchar（65533）而非 String，以便该分区列能够作为内表的分区列使用。 [#37161](https://github.com/apache/doris/pull/37161)

- 优化 Hive 写入操作元数据的访问次数。[#37127](https://github.com/apache/doris/pull/37127)

- ES Catalog 支持将 NESTED/OBJECT 类型映射到 Doris 的 JSON 类型。[#37182](https://github.com/apache/doris/pull/37182)

- 优化使用低版本 OBJECT 驱动连接 Oracle 时的报错信息。[#37634](https://github.com/apache/doris/pull/37634)

- 当 Hudi 表 Incremental Read 返回空集时，Doris 同样返回空集而非报错。[#37636](https://github.com/apache/doris/pull/37634)

- 修复部分情况下内外表关联查询可能导致 FE 超时的问题。[#37757](https://github.com/apache/doris/pull/37757)

- 修复了在从旧版本升级到新版本时，如果开启了 Hive Metastore Even Listener 情况下，可能出现 FE 元数据回放错误的问题。 [#37757](https://github.com/apache/doris/pull/37757)

 

### 多表物化视图

- 创建异步物化视图时，支持自动选择 Key 列。 [#36601](https://github.com/apache/doris/pull/36601)

- 异步物化视图分区刷新支持定义中使用 `date_trunc` 函数。[#35562](https://github.com/apache/doris/pull/35562)

- 嵌套物化视图中，当下层命中聚合上卷改写后，上层现在依然可以继续进行透明改写。 [#37651](https://github.com/apache/doris/pull/37651)

- 当 Schema Change 不影响异步物化视图数据正确性时，异步物化视图保持可用状态。 [#37122](https://github.com/apache/doris/pull/37122)

- 提升了透明改写的规划速度。[#37935](https://github.com/apache/doris/pull/37935)

- 计算异步物化视图可用性时，不再考虑当前的刷新状态。[#36617](https://github.com/apache/doris/pull/36617)

### 半结构化数据管理

- 通过采样优化 DESC 查看 VARIANT 子列的性能。 [#37217](https://github.com/apache/doris/pull/37217)

- 行存 `page_size` 默认从 4K 调到 16K 压缩率提升 30%，而且支持表级别可配置。

- JSON 类型支持 Key 为空的特殊 JSON 数据。 [#36762](https://github.com/apache/doris/pull/36762)

### 倒排索引

- 减少倒排索引 Exists 调用避免对象存储访问延迟。[#36945](https://github.com/apache/doris/pull/36945)

- 优化倒排索引查询流程额外开销。[#35357](https://github.com/apache/doris/pull/35357)

- 在物化视图中不创建倒排索引。 [#36869](https://github.com/apache/doris/pull/36869)

### 查询优化器

- 当比较表达式两侧都是 Literal 时，String Literal 会尝试向另一侧的类型转换。 [#36921](https://github.com/apache/doris/pull/36921)

- 重构了 VARIANT 类型的子路径下推功能，现在可以更好地支持复杂的下推场景。 [#36923](https://github.com/apache/doris/pull/36923)

- 优化了物化视图代价计算的逻辑，能够更准确的选择代价更低的物化视图。 [#37098](https://github.com/apache/doris/pull/37098)

- 提升了 SQL 中使用用户变量时的 SQL 缓存规划速度。 [#37119](https://github.com/apache/doris/pull/37119)

- 优化了 NOT NULL 表达式的估行逻辑，当查询中存在 NOT NULL 时可以获得更好的性能。  [#37498](https://github.com/apache/doris/pull/37498)

- 优化了 LIKE 表达式的 NULL 拒绝推导逻辑。[#37864](https://github.com/apache/doris/pull/37864)

- 优化查询指定分区失败时的报错信息，可以更清楚看到是哪个表导致的问题。 [#37280](https://github.com/apache/doris/pull/37280)

### 查询引擎

- 将某些场景下 BITMAP_UNION 算子的性能提升了 3 倍。

- 提升 Arrow Flight 在 ARM 环境下的读取性能。

- 优化了 `explode`、`explode_map`、`explode_json` 函数的执行性能。

### 数据导入

- 支持为 `INSERT INTO ... FROM TABLE VALUE FUNCTION` 语句设置 `max_filter_ratio` 参数。

  - 更多信息，请参考[文档](https://doris.apache.org/zh-CN/docs/data-operate/import/import-way/insert-into-manual/)

## Bug 修复

### 湖仓一体

- 修复部分情况下查询 Parquet 格式导致 BE 宕机的问题。[#37086](https://github.com/apache/doris/pull/37086)

- 修复查询 Parquet 格式，BE 端打印大量日志的问题。[#37012](https://github.com/apache/doris/pull/37012)

- 修复部分情况下 FE 端重复创建大量 FileSystem 对象的问题。[#37142](https://github.com/apache/doris/pull/37142)

- 修复部分情况下，写入 Hive 后的事务信息未清理的问题。[#37172](https://github.com/apache/doris/pull/37172)

- 修复部分情况下，Hive 表写入操作导致线程泄露的问题。[#37247](https://github.com/apache/doris/pull/37247)

- 修复部分情况下，无法正确获取 Hive Text 格式行列分隔符的问题。[#37188](https://github.com/apache/doris/pull/37188)

- 修复部分情况下，读取 lz4 压缩块时的并发问题。[#37187](https://github.com/apache/doris/pull/37187)

- 修复部分情况下，Iceberg 表 `count(*)` 返回错误的问题。[#37810](https://github.com/apache/doris/pull/37810)。

- 修复部分情况下，创建基于 MinIO 的 Paimon Catalog 导致 FE 元数据回放错误的问题。[#37249](https://github.com/apache/doris/pull/37249)

- 修复部分情况下使用 Ranger 创建 Catalog 客户端卡死的问题。 [#37551](https://github.com/apache/doris/pull/37551)

### 多表物化视图

- 修复当基表增加新的分区时，可能导致的分区聚合上卷改写后结果错误的问题。 [#37651](https://github.com/apache/doris/pull/37651)

- 修复关联的基表分区删除后，物化视图分区状态没有被置为不同步的问题。 [#36602](https://github.com/apache/doris/pull/36602)

- 修复异步物化视图构建偶现的死锁问题。 [#37133](https://github.com/apache/doris/pull/37133)

- 修复异步物化视图单次刷新大量分区时偶现的，报错 `nereids cost too much time` 问题。[#37589](https://github.com/apache/doris/pull/37589)

- 修复创建异步物化视图时，如果最终的 Select List 中存在 Null Literal，则无法创建的问题。[#37281](https://github.com/apache/doris/pull/37281)

- 修复单表物化视图，如果构建了聚合的物化视图，虽然改写成功，但是 CBO 没有选择的问题。 [#35721](https://github.com/apache/doris/pull/35721) [#36058](https://github.com/apache/doris/pull/36058)

- 修复 Join 输入都是聚合的情况下，构建分区物化视图，分区推导失败的问题。[#34781](https://github.com/apache/doris/pull/34781)

### 半结构化数据管理

- 修复 VARIANT 在并发/异常数据等特殊情况下的问题。[#37976](https://github.com/apache/doris/pull/37976) [#37839](https://github.com/apache/doris/pull/37839) [#37794](https://github.com/apache/doris/pull/37794) [#37674](https://github.com/apache/doris/pull/37674) [#36997](https://github.com/apache/doris/pull/36997)

- 修复 VARIANT 用在不支持的 SQL 中 Coredump 的问题。 [#37640](https://github.com/apache/doris/pull/37640)

- 修复 1.x 版本升级到 2.x 或者更高版本时因为 MAP 数据类型 Coredump 的问题。 [#36937](https://github.com/apache/doris/pull/36937)

- 修复 ES Catalog 对 Array 的支持。 [#36936](https://github.com/apache/doris/pull/36936)

### 倒排索引

- 修复倒排索引 v2 DROP INDEX 元数据没有删除的问题。 [#37646](https://github.com/apache/doris/pull/37646)

- 修复字符串长度超过“ignore above”时查询准确性问题。 [#37679](https://github.com/apache/doris/pull/37679)

- 修复索引大小统计的问题。 [#37232](https://github.com/apache/doris/pull/37232) [#37564](https://github.com/apache/doris/pull/37564)

### 查询优化器

- 修复部分因为保留关键字而导致导入无法执行的问题。[#35938](https://github.com/apache/doris/pull/35938)

- 修复了在创建表时 CHAR(255) 类型错误的记录为 CHAR(1) 的问题。 [#37671](https://github.com/apache/doris/pull/37671)

- 修复了在相关子查询中的连接表达式为复杂表达式时返回错误结果的问题。[#37683](https://github.com/apache/doris/pull/37683)

- 修复了 DECIMAL 类型分桶裁剪有可能错误的问题。[#38013](https://github.com/apache/doris/pull/38013)

- 修复了部分场景下开启 Pipeline Local Shuffle 后，聚合算子计算结果错误的问题。[#38061](https://github.com/apache/doris/pull/38016)

- 修复当聚合算子中存在相等的表达式时，可能出现的规划报错问题。[#36622](https://github.com/apache/doris/pull/36622)

- 修复当聚合算子中存在 Lambda 表达式时，可能出现的规划报错问题。[#37285](https://github.com/apache/doris/pull/37285)

- 修复了由窗口函数生成的字面量在优化为字面量时类型错误导致无法执行的问题。 [#37283](https://github.com/apache/doris/pull/37283)

- 修复了聚合函数 `foreach combinator` 错误输出 Null 属性问题。[#37980](https://github.com/apache/doris/pull/37980)


- 修复了 acos 函数在参数为超越范围值的字面量时不能规划的问题。[#37996](https://github.com/apache/doris/pull/37996)

- 修复当查询指定的同步物化视图时，显示指定查询分区导致规划报错的问题。[#36982](https://github.com/apache/doris/pull/36982)

- 修复了在规划过程中偶尔出现 NPE 的问题。[#38024](https://github.com/apache/doris/pull/38024)

### 查询引擎

- 修复 DELETE WHERE 语句中，在 DECIMAL 数据类型作为条件报错的问题。[#37801](https://github.com/apache/doris/pull/37801)

- 修复查询执行结束，但是 BE 内存不释放的问题。[#37792](https://github.com/apache/doris/pull/37792) [#37297](https://github.com/apache/doris/pull/37297)

- 修复在千级别 QPS 场景下，Audit Log 占用 FE 内存太多的问题。https://github.com/apache/doris/pull/37786

- 修复 sleep 函数在输入非法值时 BE Core 的问题。[#37681](https://github.com/apache/doris/pull/37681)

- 修复执行过程中 `sync filter size meet error` 的问题。 [#37103](https://github.com/apache/doris/pull/37103)

- 修复执行过程中，使用时区时结果不对的问题。[#37062](https://github.com/apache/doris/pull/37062)

- 修复 `cast string` 到 `int` 时结果不对的问题。  [#36788](https://github.com/apache/doris/pull/36788)

- 修复 Arrow Flight 协议在开启 Pipelinex 时查询报错的问题。 [#35804](https://github.com/apache/doris/pull/35804)

- 修复 `cast string to date/datetime` 报错的问题。 [#35637](https://github.com/apache/doris/pull/35637)

- 修复使用 `<=>` 做大表关联查询时 BE Core 的问题。 [#36263](https://github.com/apache/doris/pull/36263)

### 存储管理

- 修复列更新写入时遇到 DELETE SIGN 数据不可见问题。[#36755](https://github.com/apache/doris/pull/36755)

- 优化 Schema Change 期间 FE 的内存占用。[#36756](https://github.com/apache/doris/pull/36756)

- 修复 BE 重启时事务没有 Abort 导致的 BE 下线卡住问题。[#36437](https://github.com/apache/doris/pull/36437)

- 修复 NOT-NULL 到 NULL 类型变更的偶发报错问题。 [#36389](https://github.com/apache/doris/pull/36389)

- 优化 BE 宕机时的副本修复调度。 [#36897](https://github.com/apache/doris/pull/36897)

- 单个 BE 创建 Tablet 时支持 round-robin 选择磁盘。 [#36900](https://github.com/apache/doris/pull/36900)

- 修复 Publish 慢导致的查询 -230 错误。 [#36222](https://github.com/apache/doris/pull/36222)

- 优化 Partition Balance 的速度。 [#36976](https://github.com/apache/doris/pull/36976)

- 使用 FD 数目和内存控制 Segment Cache 避免 FD 不足。 [#37035](https://github.com/apache/doris/pull/37035)

- 修复 Clone 和 Alter 并发可能导致的副本丢失问题。 [#36858](https://github.com/apache/doris/pull/36858)

- 修复不能调整列顺序问题。[#37226](https://github.com/apache/doris/pull/37226)

- 禁止自增列的部分 Schema Change 操作。 [#37331](https://github.com/apache/doris/pull/37331)

- 修复 Delete 操作报错不准确。 [#37374](https://github.com/apache/doris/pull/37374)

- BE 侧 Trash 过期时间调整为一天。 [#37409](https://github.com/apache/doris/pull/37409)

- 优化 Compaction 内存占用和调度。 [#37491](https://github.com/apache/doris/pull/37491)

- 检查潜在的过大 Backup 导致 FE 重启的问题。[#37466](https://github.com/apache/doris/pull/37466)

- 恢复动态分区删除策略以及交叉分区的行为到 2.1.3。[#37570](https://github.com/apache/doris/pull/37570) [#37506](https://github.com/apache/doris/pull/37506)

- 修复 DELETE 谓词重部分 DECIMAL 报错问题。 [#37710](https://github.com/apache/doris/pull/37710)

### 数据导入

- 修复导入时错误处理竞争导致的数据不可见问题。[#36744](https://github.com/apache/doris/pull/36744)

- Stream Load 导入支持 `hhl_from_base64`。 [#36819](https://github.com/apache/doris/pull/36819)

- 修复潜在的单表非常多 Tablet 导入失败时可能导致 FE OOM 的问题。 [#36944](https://github.com/apache/doris/pull/36944)

- 修复 FE 主从切换时自增列可能重复的问题。[#36961](https://github.com/apache/doris/pull/36961)

- 修复 INSERT INTO SELECT 自增列报错问题。 [#37029](https://github.com/apache/doris/pull/37029)

- 降低数据下刷线程数，优化内存占用。 [#37092](https://github.com/apache/doris/pull/37092)

- 优化 Routine Load 任务自动恢复和错误信息。 [#37371](https://github.com/apache/doris/pull/37371)

- 增加 Routine Load 默认攒批大小。 [#37388](https://github.com/apache/doris/pull/37388)

- 修复 Routine Load 在 Kafka EOF 过期的任务停止问题。[#37983](https://github.com/apache/doris/pull/37983)

- 修复一流多表 Coredump。 [#37370](https://github.com/apache/doris/pull/37370)

- 修复 Group Commit 内存估计不准导致的提前反压问题。[#37379](https://github.com/apache/doris/pull/37379)

- 优化 Group Commit BE 侧线程占用。 [#37380](https://github.com/apache/doris/pull/37380)

- 修复数据没有分区时没有错误 URL 的问题。 [#37401](https://github.com/apache/doris/pull/37401)

- 修复导入时潜在的内存误操作问题。 [#38021](https://github.com/apache/doris/pull/38021)

### 主键模型

- 降低主键表 Compaction 的内存占用。 [#36968](https://github.com/apache/doris/pull/36968)

- 修复主键副本 Clone 失败时可能的重复数据问题。 [#37229](https://github.com/apache/doris/pull/37229)

### 内存管理

- 修复 Jemalloc Cache 统计不准的问题。[#37464](https://github.com/apache/doris/pull/37464)

- 修复在 K8s / CGroup 中不能正确获取内存大小的问题。 [#36966](https://github.com/apache/doris/pull/36966)

### 权限管理

- 修复 Table Valued Function 引用 Resource 时没有鉴权的问题。 [#37132](https://github.com/apache/doris/pull/37132)

- 修复 Show Role 语句中没有 Workload Group 权限的问题。 [#36032](https://github.com/apache/doris/pull/36032)

- 修复创建 Row Policy 时，同时执行两条语句，导致 FE 重启失败的问题。[#37342](https://github.com/apache/doris/pull/37342)

- 修复部分情况下，老版本升级后，因为 Row Policy 导致 FE 元数据回放失败的问题。[#37342](https://github.com/apache/doris/pull/37342)

### 其他

- 修复计算节点参与内部表创建的问题。[#37961](https://github.com/apache/doris/pull/37961)

- 修复 `enable_strong_read_consistency = true` 时从延迟问题。 [#37641](https://github.com/apache/doris/pull/37641)