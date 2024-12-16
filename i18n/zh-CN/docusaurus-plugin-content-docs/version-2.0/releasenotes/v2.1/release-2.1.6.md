---
{
    "title": "Release 2.1.6",
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

亲爱的社区小伙伴们，**Apache Doris 2.1.6 版本已于 2024 年 9 月 10 日正式发布。**2.1.6 版本在湖仓一体、异步物化视图、半结构化数据管理持续升级改进，同时在查询优化器、执行引擎、存储管理、数据导入与导出以及权限管理等方面完成了若干修复。欢迎大家下载使用。

- 官网下载：https://doris.apache.org/download

- GitHub 下载：https://github.com/apache/doris/releases/tag/2.1.6-rc04

## 行为变更

- 移除 `create repository` 命令中的 `delete_if_exists` 选项。[#38192](https://github.com/apache/doris/pull/38192)

- 新增会话变量 `enable_prepared_stmt_audit_log`，用于控制 JDBC 预编译语句是否记录审计日志，默认不记录。[#38624](https://github.com/apache/doris/pull/38624) [#39009](https://github.com/apache/doris/pull/39009)

- 采用文件描述符限制和内存限制来管理 Segment Cache。[#39689](https://github.com/apache/doris/pull/39689)

- 当 `sys_log_mode` 配置项设置为 `BRIEF` 时，在日志中增加文件位置信息，以提供更详细的上下文。[#39571](https://github.com/apache/doris/pull/39571)

- 将会话变量 `max_allowed_packet` 的默认值调整为 16MB，提高数据传输限制。[#38697](https://github.com/apache/doris/pull/38697)

- 在单次请求中，若包含多个 SQL 语句，各语句间必须使用分号进行分隔，以增强语句的清晰度和执行效率。[#38670](https://github.com/apache/doris/pull/38670) 

- 现在支持 SQL 语句以分号开始，提供更灵活的语句书写方式。[#39399](https://github.com/apache/doris/pull/39399)

- 在执行如 `show create table` 等语句时，类型格式与 MySQL 保持一致，提升与 MySQL 的兼容性。[#38012](https://github.com/apache/doris/pull/38012)

- 当新优化器规划查询超时后，不再回退到旧优化器，以避免潜在的性能下降问题。[#39499](https://github.com/apache/doris/pull/39499)

## 新功能

### Lakehouse

- 实现 Iceberg 表的写回功能。
  
  - 更多信息，请查看文档数据湖构建-[Iceberg](https://doris.apache.org/zh-CN/docs/lakehouse/datalake-building/iceberg-build)

- 增强 SQL 拦截规则，支持对外表的拦截处理。

  - 更多信息，请查看文档查询管理-[SQL 拦截](https://doris.apache.org/zh-CN/docs/admin-manual/query-admin/sql-interception)

- 新增系统表`file_cache_statistics`，用于查看 BE 节点的数据缓存性能指标。

  - 更多信息，请查看文档系统表-[file_cache_statistics](https://doris.apache.org/docs/admin-manual/system-tables/file_cache_statistics/)

### 异步物化视图

- 支持在 Insert 中进行透明改写。[#38115](https://github.com/apache/doris/pull/38115)

- 支持对查询中存在 VARIANT 类型时的透明改写。[#37929](https://github.com/apache/doris/pull/37929)

### 半结构化数据管理

- 支持 ARRAY MAP 类型到 JSON 类型的 CAST 转换功能。[#36548](https://github.com/apache/doris/pull/36548)

- 引入`json_keys`函数，用于提取 JSON 中的键名。[#36411](https://github.com/apache/doris/pull/36411)

- 支持在导入 JSON 时指定`json path`$``[#38213](https://github.com/apache/doris/pull/38213)

- ARRAY / MAP / STRUCT 类型支持`replace_if_not_null`[#38304](https://github.com/apache/doris/pull/38304)

- 允许调整 ARRAY / MAP / STRUCT 类型的列顺序。[#39210](https://github.com/apache/doris/pull/39210)

- 新增`multi_match`函数，支持在多个字段中匹配关键词，并利用倒排索引加速查询。[#37722](https://github.com/apache/doris/pull/37722)

### 查询优化器

- 完善 MySQL 协议返回列的信息，包括原始数据库名、表名、列名和别名。[#38126](https://github.com/apache/doris/pull/38126)

- 增强聚合函数`group_concat`，支持同时使用`order by`和`distinct`进行复杂数据聚合。[#38080](https://github.com/apache/doris/pull/38080)

- 改进了 SQL 缓存机制，支持通过注释区分不同的查询以复用缓存结果。[#40049](https://github.com/apache/doris/pull/40049)

- 增强分区裁剪功能，支持在过滤条件中使用`date_trunc`和`date`函数。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- 允许在表别名前使用数据库名作为限定名前缀。[#38640](https://github.com/apache/doris/pull/38640)

- 支持 Hint 格式注释。[#39113](https://github.com/apache/doris/pull/39113)

### 执行引擎

- `Group concat`函数现支持`distinct`和`order by`选项。[#38744](https://github.com/apache/doris/pull/38744)

### Others

- 新增系统表`table_properties`，便于用户查看和管理表的各项属性。
 
  - 更多信息，请查看文档 [table_properties](https://doris.apache.org/zh-CN/docs/admin-manual/system-tables/information_schema/table_properties/)
- 新增 FE 中死锁和慢锁检测功能。
 
  - 更多信息，请查看文档 [FE 锁管理](https://doris.apache.org/zh-CN/docs/admin-manual/maint-monitor/frontend-lock-manager/)

## 改进提升

### 湖仓一体

- 革新外表元数据缓存机制。
  
  - 更多信息，请查看文档 [元数据缓存](https://doris.apache.org/zh-CN/docs/lakehouse/metacache/)。

- 新增会话变量`keep_carriage_return`，默认关闭。读取 Hive Text 格式表时，默认将`\r\n`与`\n`均视为换行符。[#38099](https://github.com/apache/doris/pull/38099)

- 优化 Parquet / ORC 文件读写内存统计。[#37257](https://github.com/apache/doris/pull/37257)

- Paimon 表支持 IN/ NOT IN 谓词下推。[#38390](https://github.com/apache/doris/pull/38390)

- 升级优化器，支持 Hudi 表的 Time Travel 语法。[#38591](https://github.com/apache/doris/pull/38591)

- Kerberos 认证流程优化，提升安全认证效率与稳定性。[#37301](https://github.com/apache/doris/pull/37301)

- 支持 Rename column 操作后读取 Hive 表。[#38809](https://github.com/apache/doris/pull/38809)

- 提升外表分区列读取性能。[#38810](https://github.com/apache/doris/pull/38810)

- 优化外表查询规划，优化数据分片合并策略，有效避免小分片对查询性能的影响。[#38964](https://github.com/apache/doris/pull/38964)

- SHOW CREATE DATABASE / TABLE 新增 Location 等属性展示。[#39644](https://github.com/apache/doris/pull/39644)

- MaxCompute Catalog 扩展支持复杂类型。[#39822](https://github.com/apache/doris/pull/39822)

- 优化文件缓存加载策略，通过异步加载方式避免 BE 启动时间过长的问题。[#39036](https://github.com/apache/doris/pull/39036)

- 升级文件缓存淘汰策略，有效管理长时间占用锁的资源。[#39721](https://github.com/apache/doris/pull/39721)

### 异步物化视图

- 支持小时、周及季度级别的分区上卷构建。[#37678](https://github.com/apache/doris/pull/37678)

- 基于 Hive 外表的物化视图，在刷新前自动更新元数据缓存，以保证每次刷新可以获取最新数据。[#38212](https://github.com/apache/doris/pull/38212)

- 通过批量获取元数据，优化存算分离模式下的透明改写规划性能。[#39301 ](https://github.com/apache/doris/pull/39301)

- 通过禁止重复枚举，进一步提升透明改写的规划性能。[#39541 ](https://github.com/apache/doris/pull/39541)

- 优化基于 Hive 外表分区刷新物化视图的透明改写性能。[#38525](https://github.com/apache/doris/pull/38525)

### 半结构化数据管理

- 优化 TOPN 查询内存分配，显著提升查询性能。[#37429](https://github.com/apache/doris/pull/37429)

- 优化倒排索引字符串处理性能。[#37395](https://github.com/apache/doris/pull/37395)

- 优化倒排索引在 MOW 表中的性能。[#37428](https://github.com/apache/doris/pull/37428)

- 建表时支持指定行存 `page_size`，以控制压缩效果。[#37145](https://github.com/apache/doris/pull/37145)

### 查询优化器

- 调整 Mark Join 行数估计算法，提高基数估算准确性。[#38270](https://github.com/apache/doris/pull/38270)

- 优化 Semi / Anti Join 代价估计算法，能够正确选择最佳 Join 顺序。[#37951](https://github.com/apache/doris/pull/37951)

- 调整部分列无统计信息情况下的过滤估计算法，使估算更精准。[#39592](https://github.com/apache/doris/pull/39592)

- 改进 Set Operation 算子 Instance 计算逻辑，防止在极端情况下并行度不足的问题。[#39999](https://github.com/apache/doris/pull/39999)

- 优化 Bucket Shuffle 使用策略，数据打散不充分时也能获得更好的性能。[#36784](https://github.com/apache/doris/pull/36784)

- 窗口函数数据提前过滤，支持单投影中存在多窗口函数的情况。[#38393](https://github.com/apache/doris/pull/38393)

- 过滤条件含 `NullLiteral` 时，智能折叠为 False，转换为 `EmptySet`，减少不必要的数据扫描量。[#38135](https://github.com/apache/doris/pull/38135)

- 扩大谓词推导适用范围，在特定模式的查询下能够大幅减少数据扫描量。[#37314](https://github.com/apache/doris/pull/37314)

- 在分区裁剪中支持部分短路计算逻辑，以提升分区裁剪性能。在特定场景下，性能提升超过 100%。[#38191](https://github.com/apache/doris/pull/38191)

- 在用户变量中，支持计算任意的标量函数。[#39144 ](https://github.com/apache/doris/pull/39144)

- 当查询中存在别名冲突时，报错信息能够保持与 MySQL 一致。[#38104 ](https://github.com/apache/doris/pull/38104)

### 执行引擎

- 实现 AggState 从 2.1 到 3.x 版本的兼容，并解决了 coredump 问题。[#37104](https://github.com/apache/doris/pull/37104)

- 重构无 Join 操作时的 Local Shuffle 策略选择机制。[#37282](https://github.com/apache/doris/pull/37282)

- 将内部表查询的 scanner 调整为异步模式，以防止查询内部表时出现卡顿。[#38403](https://github.com/apache/doris/pull/38403)

- 优化 Join 算子在构建 Hash 表时的 Block Merge 流程。[#37471](https://github.com/apache/doris/pull/37471)

- 缩短 MultiCast 持有锁的时间。[#37462](https://github.com/apache/doris/pull/37462)

- 优化 gRPC 的 keepAliveTime 设置并增加了链接监测机制，降低了因 RPC 错误导致的查询失败率。[#37304](https://github.com/apache/doris/pull/37304)

- 当内存超出限制时，将清理 `jemalloc` 中的所有 Dirty Pages。[#37164](https://github.com/apache/doris/pull/37164)

- 提升 `aes_encrypt`/`decrypt` 函数对常量类型的处理效率。[#37194](https://github.com/apache/doris/pull/37194)

- 加快 `json_extract` 函数对常量数据的处理速度。[#36927](https://github.com/apache/doris/pull/36927)

- 提高 `ParseUrl` 函数处理常量数据的性能。[#36882](https://github.com/apache/doris/pull/36882)

### 存储管理

**备份恢复 / 跨集群同步**

- Restore 功能现已支持删除多余的 Tablet 和分区选项。[#39363](https://github.com/apache/doris/pull/39363)

- 在创建 Repository 时，支持检查存储连通性。[#39538](https://github.com/apache/doris/pull/39538)

- Binlog 支持 Drop 表操作，使 CCR 能够支持 Drop 表的增量同步。[#38541](https://github.com/apache/doris/pull/38541)

**Compaction**

- 改进高优 Compaction 任务不受并发控制限制的问题。[#38189](https://github.com/apache/doris/pull/38189)

- 根据数据特性自动调整 Compaction 的内存消耗。[#37486](https://github.com/apache/doris/pull/37486)

- 修复顺序数据优化策略可能引发的聚合表或 MOR UNIQUE 表数据准确性问题。[#38299](https://github.com/apache/doris/pull/38299)

- 优化补副本期间 Compaction 选择 rowset 的策略，以避免触发 -235 错误。[#39262](https://github.com/apache/doris/pull/39262)

**Merge-on-Write**

- 解决了列更新和 Compaction 并发时列更新慢的问题。[#38682](https://github.com/apache/doris/pull/38682)

- 修复一次导入大量数据时，Segcompaction 可能导致 MOW 数据不正确的问题。[#38992](https://github.com/apache/doris/pull/38992) [#39707](https://github.com/apache/doris/pull/39707)

- 解决 BE 重启后，可能导致列更新数据丢失的问题。[#39035](https://github.com/apache/doris/pull/39035)

**其他**

- 增加了 FE 配置，用于控制冷热分层下查询是否优先访问本地数据的副本。[#38322](https://github.com/apache/doris/pull/38322)

- 解决了过期的 BE 汇报消息未包含新创建 Tablet 的问题。[#38839 ](https://github.com/apache/doris/pull/38839)[#39605](https://github.com/apache/doris/pull/39605)

- 优化副本调度优先级策略，优先调度缺少数据的副本。[#38884](https://github.com/apache/doris/pull/38884)

- 对于有未完成 ALTER JOB 的 Tablet，不进行均衡调度。[#39202](https://github.com/apache/doris/pull/39202)

- List 分区方式的表现支持修改分桶数。[#39688](https://github.com/apache/doris/pull/39688)

- 优先选择在线的磁盘服务进行查询。[#39654](https://github.com/apache/doris/pull/39654)

- 改进了同步物化视图的 Base 表不支持删除时的提示信息。[#39857](https://github.com/apache/doris/pull/39857)

- 改进了单列超过 4G 时的报错信息。[#39897](https://github.com/apache/doris/pull/39897)

- 修复了 Insert 语句遇到 Plan 错误时未正确中止事务的问题。[#38260](https://github.com/apache/doris/pull/38260)

- 修复了 SSL 链接关闭时的异常问题。[#38677](https://github.com/apache/doris/pull/38677)

- 修复了使用 Label 中止事务时未持有表锁的问题。[#38842](https://github.com/apache/doris/pull/38842)

- 修复了 Gson Pretty 导致 Image 过大的问题。[#39135](https://github.com/apache/doris/pull/39135)

- 修复了 CREAT TABLE 语句在新优化器下未检查 Bucket 为 0 的问题。[#38999](https://github.com/apache/doris/pull/38999)

- 修复了 DELETE 条件谓词中包含中文列时报错的问题。[#39500](https://github.com/apache/doris/pull/39500)

- 修复了分区均衡模式下频繁均衡 Tablet 的问题。[#39606](https://github.com/apache/doris/pull/39606)

- 修复了分区丢失 Storage Policy 属性的问题。[#39677](https://github.com/apache/doris/pull/39677)

- 修复了事务内导入多个表时统计信息不正确的问题。[#39548](https://github.com/apache/doris/pull/39548)

- 修复了 Random 分桶表删除时报错的问题。[#39830](https://github.com/apache/doris/pull/39830)

- 修复了 UDF 不存在导致 FE 无法启动的问题。[#39868](https://github.com/apache/doris/pull/39868)

- 修复了 FE 主从 Last Failed Version 不一致的问题。[#39947](https://github.com/apache/doris/pull/39947)

- 修复了 Schema Change Job 被取消时，相关 Tablet 可能仍处于 Schema Change 状态的问题。[#39327](https://github.com/apache/doris/pull/39327)

- 修复了单个语句修改类型和列顺序 SC 时出现的报错问题。[#39107](https://github.com/apache/doris/pull/39107)

### 数据导入

- 改进了导入发生 -238 错误时的错误信息提示。[#39182](https://github.com/apache/doris/pull/39182)

- 实现在 Restore 分区时，其他分区可以同时进行导入。[#39915](https://github.com/apache/doris/pull/39915)

- 优化了 Group Commit FE 选择 BE 的策略。[#37830](https://github.com/apache/doris/pull/37830) [#39010](https://github.com/apache/doris/pull/39010)

- 对于一些常见的 Stream Load 错误信息，避免了程序栈的打印，简化了错误处理。[#38418](https://github.com/apache/doris/pull/38418)

- 改进下线的 BE 可能影响导入出错的问题。[#38256](https://github.com/apache/doris/pull/38256)

### 权限管理

- 优化了开启 Ranger 鉴权插件后的访问性能。[#38575](https://github.com/apache/doris/pull/38575)

- 优化了 Refresh Catalog / Database / Table 操作的权限策略，用户仅需 SHOW 权限即可执行此操作。[#39008](https://github.com/apache/doris/pull/39008)

## Bug 修复

### 湖仓一体

- 修复切换 Catalog 时可能出现的数据库找不到问题。[#38114](https://github.com/apache/doris/pull/38114)

- 解决了读取 S3 上不存在的数据时出现的异常报错。[#38253](https://github.com/apache/doris/pull/38253)

- 修正导出操作时，指定异常路径可能导致导出位置异常的问题。[#38602](https://github.com/apache/doris/pull/38602)

- 修复 Paimon 表时间列时区问题。[#37716](https://github.com/apache/doris/pull/37716)

- 临时关闭 Parquet PageIndex 功能以避免部分错误行为。

- 修复外表查询时，错误选取黑名单中 Backend 节点的问题。[#38984](https://github.com/apache/doris/pull/38984)

- 解决读取 Parquet Struct 列类型中缺失子列导致查询错误的问题。[#39192](https://github.com/apache/doris/pull/39192)

- 修复 JDBC Catalog 的谓词下推问题。[#39082](https://github.com/apache/doris/pull/39082)

- 修正 Parquet 格式读取时，历史格式导致查询结果错误的问题。[#39375](https://github.com/apache/doris/pull/39375)

- 增强了 Oracle JDBC Catalog 对 OJDBC6 驱动的兼容性。[#39408](https://github.com/apache/doris/pull/39408)

- 解决了 Refresh Catalog/Database/Table 操作可能导致的 FE 内存泄漏问题。[#39186](https://github.com/apache/doris/pull/39186) [#39871](https://github.com/apache/doris/pull/39871)

- 修复了 JDBC Catalog 在某些情况下的线程泄漏问题。 [#39666 ](https://github.com/apache/doris/pull/39666)[#39582](https://github.com/apache/doris/pull/39582)

- 修复开启 Hive Metastore 事件订阅后，可能出现事件处理失败的问题。[#39239](https://github.com/apache/doris/pull/39239)

- 禁止读取自定义 Escape CHAR 和 NULL Format 的 Hive Text 格式表，防止数据错误。[#39869](https://github.com/apache/doris/pull/39869)

- 修复某些情况下，无法访问通过 Iceberg API 创建的 Iceberg 表的问题。[#39203](https://github.com/apache/doris/pull/39203)

- 修复无法读取存储在开启高可用的 HDFS 集群上的 Paimon 表的问题。[#39876](https://github.com/apache/doris/pull/39876)

- 修复开启文件缓存后，读取 Paimon 表 Deletion Vector 可能导致错误的问题。[#39875](https://github.com/apache/doris/pull/39875)

- 修复某些情况下读取 Parquet 可能导致死锁的问题 [#39945](https://github.com/apache/doris/pull/39945)

### 异步物化视图

- 修复无法在 Follower FE 上使用 `show create materialized view` 命令的问题。[#38794](https://github.com/apache/doris/pull/38794)

- 统一异步物化视图在元数据中的对象类型，使其在数据工具中正常显示。[#38797](https://github.com/apache/doris/pull/38797)

- 修复嵌套异步物化视图总是进行全量刷新的问题。[#38698](https://github.com/apache/doris/pull/38698)

- 修正 Cancel 任务在重启 FE 后状态可能显示为 running 的问题。 [#39424](https://github.com/apache/doris/pull/39424)

- 修复错误使用上下文，导致刷新物化视图任务可能非预期失败的问题。[#39690](https://github.com/apache/doris/pull/39690)

- 修复基于外表创建异步物化视图时，VARCHAR 类型因长度不合理导致写入失败的问题。[#37668](https://github.com/apache/doris/pull/37668)

- 修复 FE 重启或 Catalog 重建后，基于外表的异步物化视图可能失效的问题。[#39355](https://github.com/apache/doris/pull/39355)

- 禁止 List 分区的物化视图使用分区上卷，以防止生成错误数据。[#38124](https://github.com/apache/doris/pull/38124)

- 修复在聚合上卷透明改写时，SELECT List 中存在字面量导致的结果错误问题。[#38958](https://github.com/apache/doris/pull/38958)

- 修复当查询中存在形如`a = a`的过滤条件时，透明改写可能出错的问题。[#39629](https://github.com/apache/doris/pull/39629)

- 修复透明改写直查外表无法成功的问题。[#39041](https://github.com/apache/doris/pull/39041)

### 半结构化数据管理

- 删除老优化器上 `PreparedStatement` 的支持。[#39465](https://github.com/apache/doris/pull/39465)

- 修复 JSON 转义字符处理的问题。[#37251 ](https://github.com/apache/doris/pull/37251)

- 修复 JSON 字段重复处理的问题。 [#38490](https://github.com/apache/doris/pull/38490)

- 修复部分 ARRAY MAP 函数的问题。[#39307](https://github.com/apache/doris/pull/39307) [ #39699 ](https://github.com/apache/doris/pull/39699) [#39757](https://github.com/apache/doris/pull/39757)

- 修复倒排索引查询和 LIKE 查询复杂组合的问题。[#36687](https://github.com/apache/doris/pull/36687)

### 查询优化器

- 修复分区过滤条件中存在 `or` 时，可能导致分区裁剪错误的问题。[#38897 ](https://github.com/apache/doris/pull/38897)

- 修复存在复杂表达式时，可能导致的分区裁剪错误的问题。[#39298](https://github.com/apache/doris/pull/39298)

- 修复 AGG_STATE 类型中的子类型，Nullable 可能规划不正确导致执行报错的问题。[#37489](https://github.com/apache/doris/pull/37489)

- 修复 Set Operation 算子 Nullable 可能规划不正确，导致执行报错的问题。[#39109](https://github.com/apache/doris/pull/39109)

- 修复 Intersect 算子执行优先级不正确的问题。 [#39095](https://github.com/apache/doris/pull/39095)

- 修复当查询中存在最大合法日期字面量时，可能出现 NPE 的问题。[#39482](https://github.com/apache/doris/pull/39482)

- 修复偶现的规划报错，导致的执行时报错 Slot 不合法的问题。[#39640](https://github.com/apache/doris/pull/39640)

- 修复重复引用 CTE 中的列，可能导致结果缺少部分列数据的问题。[#39850](https://github.com/apache/doris/pull/39850)

- 修复在查询中存在 CASE WHEN 时，偶现的规划报错问题。[#38491](https://github.com/apache/doris/pull/38491)

- 修复不能将 IP 类型隐式转换为 STRING 类型的问题。[#39318](https://github.com/apache/doris/pull/39318)

- 修复在使用多维聚合时，当 SELECT List 中存在相同列和其别名时，可能出现的规划报错问题。[#38166](https://github.com/apache/doris/pull/38166)

- 修复使用 BE 常量折叠时，处理 BOOLEAN 类型可能不正确的问题。[#39019](https://github.com/apache/doris/pull/39019)

- 修复在表达式中存在 `default_cluster:` 作为 Database 名称前缀导致的规划报错问题。[#39114](https://github.com/apache/doris/pull/39114)

- 修复 Insert Into 可能导致的死锁问题。[#38660](https://github.com/apache/doris/pull/38660)

- 修复没有在规划全过程持有表锁导致可能出现规划报错的问题。 [#38950](https://github.com/apache/doris/pull/38950)

- 修复创建表时不能正确处理 CHAR(0), VARCHAR(0) 的问题。[#38427](https://github.com/apache/doris/pull/38427)

- 修复 SHOW CREAT TABLE 可能错误的显示出隐藏列的问题。[#38796](https://github.com/apache/doris/pull/38796)

- 修复创建表时没有禁止使用和隐藏列同名列的问题。 [#38796](https://github.com/apache/doris/pull/38796)

- 修复在执行 INSERT INTO AS SELECT 时，如果存在 CTE，偶现的规划报错问题。[#38526](https://github.com/apache/doris/pull/38526)

- 修复 INSERT INTO VALUES 无法自动填充 NULL 默认值的问题。[#39122](https://github.com/apache/doris/pull/39122)

- 修复在 DELETE 中使用 CTE，但是没有使用 USING 时，导致的 NPE 问题。[#39379](https://github.com/apache/doris/pull/39379)

- 修复对随机分布的聚合模型表执行删除操作会失败的问题。[#37985](https://github.com/apache/doris/pull/37985)

### 执行引擎

- 修复多个场景下，Pipeline 执行引擎被卡顿，导致查询不结束的问题。[#38657](https://github.com/apache/doris/pull/38657) [#38206](https://github.com/apache/doris/pull/38206) [#38885](https://github.com/apache/doris/pull/38885)  

- 修复了 NULL 和非 NULL 列在差集计算时导致的 Coredump 问题。[#38737](https://github.com/apache/doris/pull/38737)

- 修复了 `width_bucket` 函数结果错误的问题。[#37892](https://github.com/apache/doris/pull/37892)

- 修复了当单行数据很大且返回结果集也很大时（超过 2GB）查询报错的问题。[#37990](https://github.com/apache/doris/pull/37990)

- 修复了 `stddev` 在 `DecimalV2` 类型下结果错误的问题。[#38731](https://github.com/apache/doris/pull/38731)

- 修复了 `MULTI_MATCH_ANY` 函数导致的 Coredump 问题。[#37959](https://github.com/apache/doris/pull/37959)

- 修复了 INSERT OVERWRITE AUTO PARTITION 导致事务回滚的问题。[#38103](https://github.com/apache/doris/pull/38103)

- 修复了 `convert_tz` 函数结果错误的问题。[#37358](https://github.com/apache/doris/pull/37358) [#38764](https://github.com/apache/doris/pull/38764)

- 修复了 `collect_set` 函数结合窗口函数使用时 Coredump 的问题。[#38234](https://github.com/apache/doris/pull/38234)

- 修复了 `mod` 函数在异常输入时导致的 Coredump 问题。[#37999](https://github.com/apache/doris/pull/37999)

- 修复了多线程下执行相同表达式可能导致 Java UDF 结果错误的问题。[#38612](https://github.com/apache/doris/pull/38612)

- 修复了 `conv` 函数返回类型错误导致的溢出问题。[#38001](https://github.com/apache/doris/pull/38001)

- 修复了 `histogram` 函数结果不稳定的问题。[#38608](https://github.com/apache/doris/pull/38608)

### 存储管理

- 修复备份恢复后，写入数据时可能出现不可读的问题。[#38343](https://github.com/apache/doris/pull/38343)

- 修复跨版本 Restore Version 使用问题。[#38396](https://github.com/apache/doris/pull/38396)

- 修复 Backup 失败时 Job 没有取消的问题。[#38993](https://github.com/apache/doris/pull/38993)

- 修复 2.1.4 升级到 2.1.5 CCR 报 NPE，导致 FE 不能启动的问题。[#39910](https://github.com/apache/doris/pull/39910)

- 修复 Restore 之后视图和物化视图不能使用的问题。[#38072](https://github.com/apache/doris/pull/38072) [#39848](https://github.com/apache/doris/pull/39848)

### 数据导入

**Routine Load**

- 修复 Routine Load 一流多表可能得内存泄露的问题。 [#38824](https://github.com/apache/doris/pull/38824)

- 修复 Routine Load 包围符和转义符不生效的问题。[#38825](https://github.com/apache/doris/pull/38825)

- 修复 Routine Load 任务名包含大写字母时 `show routineload` 结果不正确的问题。[#38826](https://github.com/apache/doris/pull/38826)

- 修复改变 Routine Load Topic 时没有重置 Offset Cache 的问题。[#38474](https://github.com/apache/doris/pull/38474)

- 修复并发情况下 `show routineload` 可能触发异常的问题。[#39525](https://github.com/apache/doris/pull/39525)

- 修复 Routine Load 可能重复导入数据的问题。[#39526](https://github.com/apache/doris/pull/39526)

**Group Commit**

- 修复 JDBC 方式下打开 Group Commit 时 setNull 导致的数据报错问题 [#38276](https://github.com/apache/doris/pull/38276)

- 修复打开 `group commit insert` 发往非 Master FE 时可能导致 NPE 问题 [#38345](https://github.com/apache/doris/pull/38345)

- 修复 Group Commit 内部写数据错误处理不正确的问题。[#38997](https://github.com/apache/doris/pull/38997)

- 修复 Group Commit 执行规划失败时可能触发的 Coredump。[#39396](https://github.com/apache/doris/pull/39396)

**其它**

- 修复并发导入 Auto Partition 表可能报 Tablet 不存在的问题。[#38793](https://github.com/apache/doris/pull/38793)

- 修复可能的 Load Stream 泄露问题。[#39039](https://github.com/apache/doris/pull/39039)

- 修复 INSERT INTO SELECT 没有数据时开启事务的问题。[#39108](https://github.com/apache/doris/pull/39108)

- 使用 Memtable 前移时忽略单副本导入的配置。[#39154](https://github.com/apache/doris/pull/39154)

- 修复后台导入 `stream load record` 遇见 Database 删除时异常中止的问题。 [#39527](https://github.com/apache/doris/pull/39527)

- 修复 Strict Mode 模式下，出现数据错误时错误信息提示不准确的问题。[#39587](https://github.com/apache/doris/pull/39587)

- 修复 Stream Load 遇见错误数据不返回 Error URL 的问题。[#38417](https://github.com/apache/doris/pull/38417)

- 修复 Insert Overwrite 和 Auto Partition 配合使用的问题。[#38442](https://github.com/apache/doris/pull/38442)

- 修复 CSV 遇到行分隔符被包围符包围数据时解析错误的问题。[#38445](https://github.com/apache/doris/pull/38445)

### 数据导出

- 修复导出操作中指定 `delete_existing_files` 属性后，可能会重复删除导出数据的问题。[#39304](https://github.com/apache/doris/pull/39304)

### 权限管理

- 修复创建物化视图时，错误地要求拥有 ALTER TABLE 的权限的问题。[#38011](https://github.com/apache/doris/pull/38011)

- 修复 `show routine load` 时，Database 显式为空的问题。[#38365](https://github.com/apache/doris/pull/38365)

- 修复 `create table like` 错误的要求拥有对原表的创建权限的问题。[#37879](https://github.com/apache/doris/pull/37879)

- 修复赋权操作没有检查对象是否存在的问题。[#39597](https://github.com/apache/doris/pull/39597)

## 版本升级说明

Doris 升级请遵守不要跨两个二位版本升级的原则，依次往后升级。

比如从 0.15.x 升级到 2.0.x 版本，则建议先升级至 1.1 最新版本，然后升级到最新的 1.2 版本，最后升级到最新的 2.0 版本，以此类推。