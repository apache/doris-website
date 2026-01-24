---
{
    "title": "Release 3.0.1",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.1 版本已于 2024 年 8 月 23 日正式发布。从 3.0 系列版本开始，Apache Doris 开始支持存算分离模式，用户可以在集群部署时选择采用存算一体模式或存算分离模式。同时在 3.0.1 版本中，"
}
---

亲爱的社区小伙伴们，Apache Doris 3.0.1 版本已于 2024 年 8 月 23 日正式发布。从 3.0 系列版本开始，Apache Doris 开始支持存算分离模式，用户可以在集群部署时选择采用存算一体模式或存算分离模式。同时在 3.0.1 版本中，Apache Doris 在存算分离、湖仓一体、半结构化数据分析、异步物化视图等方面进行了全面更新与改进，欢迎大家下载使用。


**官网下载：** https://doris.apache.org/download/

**GitHub 下载：** https://github.com/apache/doris/releases


## 行为变更

### 查询优化器

- 新增变量 `use_max_length_of_varchar_in_ctas`，用于控制在执行 `CREATE TABLE AS SELECT`（CTAS）操作时 VARCHAR 类型的长度行为。此变量默认设置为 true。当设置为 true 时，如果 VARCHAR 类型的列源自一个表，则采用推导长度；否则，使用最大长度。当设置为 false 时，VARCHAR 类型将始终使用推导出的长度。[#37069](https://github.com/apache/doris/pull/37069)

- 所有的数据类型将以小写形式展示，以保持与 MySQL 格式的兼容性。[#38012](https://github.com/apache/doris/pull/38012)

- 同一查询请求中的多条查询语句现在必须使用分号分隔。[#38670](https://github.com/apache/doris/pull/38670)

### 查询执行

- 将集群在执行 Shuffle 操作后默认的并行任务数设置为 100，这将提高大型集群中查询的稳定性和并发处理能力。[#38196](https://github.com/apache/doris/pull/38196)

### 存储

- `trash_file_expire_time_sec` 的默认值已从 86400 秒更改为 0 秒，这意味着如果误删除文件并清空了 FE 回收站，数据将无法恢复。

- 表属性 `enable_mow_delete_on_delete_predicate`（在版本 3.0.0 中引入）已更名为 `enable_mow_light_delete`。

- 显式事务现在被禁止对已写入数据的表执行 Delete 操作。

- 禁止对含有自增字段的表进行重量级的 Schema Change 操作。

## 新特性

### 任务调度

- 优化内部调度作业的执行逻辑，取消开始时间和立即执行参数之间的强关联。现在任务在创建时可以指定开始时间或选择立即执行，两者不再冲突，从而提高了调度的灵活性。[#36805](https://github.com/apache/doris/pull/36805)

### 存算分离

- 支持动态更改 File Cache 的使用上限。[#37484](https://github.com/apache/doris/pull/37484)

- Recycler 现在支持对象存储限速以及服务端限速重试功能。[#37663](https://github.com/apache/doris/pull/37663) [#37680](https://github.com/apache/doris/pull/37680)

### Lakehouse

- 新增会话变量 `serde_dialect`，可以设置复杂类型的输出格式。[#37039](https://github.com/apache/doris/pull/37039)

- SQL 拦截功能现在支持外部表

  - 更多内容，参考文档[SQL 拦截](../../admin-manual/workload-management/sql-blocking.md)

- Insert Overwrite 现在支持 Iceberg 表。[#37191](https://github.com/apache/doris/pull/37191)

### 异步物化视图

- 支持按小时级别分区上卷构建。[#37678](https://github.com/apache/doris/pull/37678)

- 支持原子替换异步物化视图定义语句。[#36749](https://github.com/apache/doris/pull/36749)

- 透明改写现在支持 Insert 语句。[#38115](https://github.com/apache/doris/pull/38115)

- 透明改写现在支持 Variant 类型。[#37929](https://github.com/apache/doris/pull/37929)

### 查询执行

- Group Concat 函数现在支持 DISTINCT 和 ORDER BY 选项。[#38744](https://github.com/apache/doris/pull/38744)

### 半结构化数据管理

- ES Catalog 现在将 Elasticsearch 中的 `nested` 或 `object` 类型映射为 Doris 的 JSON 类型。[#37101](https://github.com/apache/doris/pull/37101)

- 新增 `MULTI_MATCH` 函数，支持在多个字段中匹配关键词，并能利用倒排索引加速搜索。[#37722](https://github.com/apache/doris/pull/37722)

- 新增 `explode_json_object` 函数，可以将 JSON 数据中的 Object 展开为多行。[#36887](https://github.com/apache/doris/pull/36887)

- 倒排索引现在支持 Memtable 前移，在多副本写入时只需构建一次索引，减少 CPU 消耗并提升性能。[#35891](https://github.com/apache/doris/pull/35891)

- 新增 `MATCH_PHRASE` 支持正向词距（slop），例如 `msg MATCH_PHRASE 'a b 2+'` 可以匹配包含词 a 和 b，它们之间的词距不超过两个，并且 a 在 b 的前面；而普通的词距（slop）如果没有最后的加号 `+`，则不保证 a 在 b 的前面。[#36356](https://github.com/apache/doris/pull/36356)

### 其他

- 新增加了 FE 参数 `skip_audit_user_list`，在此配置项中的用户操作将不会被记录到审计日志中。[#38310](https://github.com/apache/doris/pull/38310)
  
  - 更多内容，参考文档[审计插件](../../admin-manual/audit-plugin/)

## 改进

### 存储

- 降低单个 BE 内磁盘间均衡导致写失败的可能性。[#38000](https://github.com/apache/doris/pull/38000)

- 降低 Memtable Limiter 的内存消耗。[#37511](https://github.com/apache/doris/pull/37511)

- 在替换分区操作时，将旧分区移动到 FE 回收站。[#36361](https://github.com/apache/doris/pull/36361)

- 优化了 Compaction 的内存消耗。[#37099](https://github.com/apache/doris/pull/37099)

- 增加了会话变量以控制 JDBC PreparedStatement 的审计日志，默认不打印。[#38419](https://github.com/apache/doris/pull/38419)

- 优化了 Group Commit 选择 BE 的逻辑。[#35558](https://github.com/apache/doris/pull/35558)

- 优化了列更新的性能。[#38487](https://github.com/apache/doris/pull/38487)

- 优化了 `delete bitmap cache` 的使用。[#38761](https://github.com/apache/doris/pull/38761)

- 添加了配置以控制冷热分层时查询的亲和性。[#37492](https://github.com/apache/doris/pull/37492)

### 存算分离

- 遇到对象存储服务端限速时，现在会自动重试。[#37199](https://github.com/apache/doris/pull/37199)

- 适应存算分离模式下 Memtable Flush 的线程数。[#38789](https://github.com/apache/doris/pull/38789)

- 将 Azure 作为编译选项，以便支持在不支持 Azure 的环境中编译。

- 优化了对象存储访问限速的可观测性。[#38294](https://github.com/apache/doris/pull/38294)

- 允许 File Cache TTL 队列进行 LRU 淘汰，增加了 TTL 队列的可用性。[#37312](https://github.com/apache/doris/pull/37312)

- 优化了存算分离模式下 Balance Writeeditlog IO 次数。[#37787](https://github.com/apache/doris/pull/37787)

- 优化了存算分离模式下建表的速度，批量发送创建 Tablet 的请求。[#36786](https://github.com/apache/doris/pull/36786)

- 通过退避重试的方式，优化了本地 File Cache 可能不一致时导致的读取失败问题。[#38645](https://github.com/apache/doris/pull/38645)

### Lakehouse

- 优化了 Parquet/ORC 格式读写操作的内存统计。[#37234](https://github.com/apache/doris/pull/37234)

- Trino Connector Catalog 现在支持谓词下推。[#37874](https://github.com/apache/doris/pull/37874)

- 新增会话变量 `enable_count_push_down_for_external_table`，用于控制是否开启外部表的 `count(*)` 下推优化。[#37046](https://github.com/apache/doris/pull/37046)

- 优化了 Hudi 快照读的读取逻辑，当快照为空时返回空集，与 Spark 行为保持一致。[#37702](https://github.com/apache/doris/pull/37702)

- 优化了 Hive 表分区列的读取性能。[#37377](https://github.com/apache/doris/pull/37377)

### 异步物化视图

- 透明改写计划速度提升了 20%。[#37197](https://github.com/apache/doris/pull/37197)

- 如果 Group Key 满足数据唯一性，在透明改写时不再进行上卷，以更好地进行嵌套匹配。[#38387](https://github.com/apache/doris/pull/38387)

- 透明改写现在可以更好地进行聚合消除，以提高嵌套物化视图的匹配成功率。[#36888](https://github.com/apache/doris/pull/36888)

### MySQL 兼容性

- 现在正确填充了 MySQL 协议中结果列的库名、表名和原始名称。[#38126](https://github.com/apache/doris/pull/38126)

- 支持了形如 `/*+ func(value) */` 的 Hint 格式。[#37720](https://github.com/apache/doris/pull/37720)

### 查询优化器

- 显著提升了复杂查询的计划速度。[#38317](https://github.com/apache/doris/pull/38317)

- 根据数据分桶数量，自适应选择是否进行 Bucket Shuffle，以避免极端情况下的性能劣化。[#36784](https://github.com/apache/doris/pull/36784)

- 优化了 SEMI/ANTI JOIN 的代价估算逻辑。[#37951](https://github.com/apache/doris/pull/37951) [#37060](https://github.com/apache/doris/pull/37060)

- 支持将 Limit 下推到第一阶段聚合，以提升性能。[#34853](https://github.com/apache/doris/pull/34853)

- 分区裁剪现在支持过滤条件中包含 `date_trunc` 或 `date` 函数。[#38025](https://github.com/apache/doris/pull/38025) [#38743](https://github.com/apache/doris/pull/38743)

- SQL 缓存现在支持包含用户变量的查询场景。[#37915](https://github.com/apache/doris/pull/37915)

- 优化了聚合语义不合法时的错误信息。[#38122](https://github.com/apache/doris/pull/38122)

### 查询执行

- 适配了 AggState 的 2.1 到 3.x 兼容性，并修复了 Coredump 问题。[#37104](https://github.com/apache/doris/pull/37104)

- 重构了不带 Join 时 Local Shuffle 的策略选择。[#37282](https://github.com/apache/doris/pull/37282)

- 将内部表查询的 Scanner 修改为异步方式，以防止查询内部表时卡住。[#38403](https://github.com/apache/doris/pull/38403)

- 优化了 Join 算子构建 Hash 表时的 Block Merge 过程。[#37471](https://github.com/apache/doris/pull/37471)

- 优化了 MultiCast 持有锁的时间。[#37462](https://github.com/apache/doris/pull/37462)

- 优化了 gRPC 的 keepAliveTime 并增加了链接监测机制，降低了查询过程中因 RPC 错误导致查询失败的概率。[#37304](https://github.com/apache/doris/pull/37304)

- 当内存超限时，清理 Jemalloc 中的所有 Dirty Pages。[#37164](https://github.com/apache/doris/pull/37164)

- 优化了 `aes_encrypt` /`decrypt` 函数对常量类型的处理性能。[#37194](https://github.com/apache/doris/pull/37194)

- 优化了 `json_extract` 函数对常量数据的处理性能。[#36927](https://github.com/apache/doris/pull/36927)

- 优化了 `ParseUrl` 函数对常量数据的处理性能。[#36882](https://github.com/apache/doris/pull/36882)

### 半结构化数据管理

- Bitmap 索引现在默认使用反向索引，`enable_create_bitmap_index_as_inverted_index` 默认设置为 true。[#36692](https://github.com/apache/doris/pull/36692)

- 在存算分离模式下，DESC 现在可以查看 VARIANT 类型的子列。[#38143](https://github.com/apache/doris/pull/38143)

- 移除了倒排索引查询时检查文件是否存在的步骤，以降低远程存储的访问延迟。[#36945](https://github.com/apache/doris/pull/36945)

- ARRAY / MAP / STRUCT 复杂类型现在支持 AGG 表的 `replace_if_not_null`。[#38304](https://github.com/apache/doris/pull/38304)

- 现在支持 JSON 数据的转义字符。[#37176](https://github.com/apache/doris/pull/37176) [#37251](https://github.com/apache/doris/pull/37251)

- 倒排索引查询现在在 MOW 表上与 Duplicate 表一致。[#37428](https://github.com/apache/doris/pull/37428)

- 优化了倒排索引加速 IN 查询的性能。[#37395](https://github.com/apache/doris/pull/37395)

- TOPN 查询时减少了多余的内存分配，以提升性能。[#37429](https://github.com/apache/doris/pull/37429)

- 当创建带分词的倒排索引时，现在自动开启 `support_phrase` 选项，以加速 `match_phrase` 系列短语查询。[#37949](https://github.com/apache/doris/pull/37949)

### 其他

- Audit Log 现在可以记录 SQL 类型。[#37790](https://github.com/apache/doris/pull/37790)

- 增加对 `information_schema.processlist` Show All FE 的支持。[#38701](https://github.com/apache/doris/pull/38701)

- 缓存 Ranger 的 `atamask` 和 `rowpolicy`，以加速查询效率。[#37723](https://github.com/apache/doris/pull/37723)

- 优化 Job Manager 的元数据管理，在修改元数据后立即释放锁，以减少锁持有时间。[#38162](https://github.com/apache/doris/pull/38162)

## 缺陷修复

### 升级

- 修复从 2.1 版本升级时 mtmv load 失败的问题。[#38799](https://github.com/apache/doris/pull/38799)

- 修复在 2.1 版本升级时找不到 `null_type` 的问题。[#39373](https://github.com/apache/doris/pull/39373)

- 修复从 2.1 版本升级到 3.0 版本时权限持久化的兼容性问题。[#39288](https://github.com/apache/doris/pull/39288)

### 导入

- 修复 CSV 格式解析中，换行符被包围符包围时解析失败的问题。[#38347](https://github.com/apache/doris/pull/38347)

- 修复 FE 在转发 Group Commit 时可能出现的异常问题。[#38228](https://github.com/apache/doris/pull/38228) [#38265](https://github.com/apache/doris/pull/38265)

- Group Commit 现在支持新优化器。[#37002](https://github.com/apache/doris/pull/37002)

- 修复 JDBC setNull 时 Group Commit 报告数据错误的问题。[#38262](https://github.com/apache/doris/pull/38262)

- 优化 Group Commit 遇到 `delete bitmap lock` 错误时的重试逻辑。[#37600](https://github.com/apache/doris/pull/37600)

- 修复 Routine Load 不能使用 CSV 包围符和转义符的问题。[#38402](https://github.com/apache/doris/pull/38402)

- 修复 Routine Load Job 名字大小写混用时无法显示的问题。[#38523](https://github.com/apache/doris/pull/38523)

- 优化 FE 主从切换时主动恢复 Routine Load 的逻辑。[#37876](https://github.com/apache/doris/pull/37876)

- 修复 Kafka 中数据全部过期时 Routine Load 暂停的问题。[#37288](https://github.com/apache/doris/pull/37288)

- 修复 `show routine load` 返回空结果的问题。[#38199](https://github.com/apache/doris/pull/38199)

- 修复 Routine Load 多表流式导入时的内存泄露问题。[#38255](https://github.com/apache/doris/pull/38255)

- 修复 Stream Load 不返回 Error URL 的问题。[#38325](https://github.com/apache/doris/pull/38325)

- 修复 Load Channel 可能泄露的问题。[#38031](https://github.com/apache/doris/pull/38031) [#37500](https://github.com/apache/doris/pull/37500)

- 修复导入少于预期的 Segment 时可能不报错的问题。[#36753](https://github.com/apache/doris/pull/36753)

- 修复 Load Stream 泄露的问题。[#38912](https://github.com/apache/doris/pull/38912)

- 优化下线节点对导入操作的影响。[#38198](https://github.com/apache/doris/pull/38198)

- 修复 Insert Into 空数据情况下事务不结束的问题。[#38991](https://github.com/apache/doris/pull/38991)

### 存储

**01 备份与恢复**

- 修复备份恢复后表无法写入的问题。[#37089](https://github.com/apache/doris/pull/37089)

- 修复备份恢复后视图中数据库名称错误的问题。[#37412](https://github.com/apache/doris/pull/37412)

**02 Compaction（压缩）**

- 修复有序数据压缩时 Cumu Compaction 处理 Delete 错误的的问题。[#38742](https://github.com/apache/doris/pull/38742)

- 修复顺序压缩优化导致的聚合表重复 Key 问题。[#38224](https://github.com/apache/doris/pull/38224)

- 修复大宽表下压缩操作导致 Coredump 的问题。[#37960](https://github.com/apache/doris/pull/37960)

- 修复压缩任务并发统计不准确导致的压缩饥饿问题。[#37318](https://github.com/apache/doris/pull/37318)

**03 MOW Unique Key（MOW 唯一键）**

- 解决累计压缩删除 Delete Sign 导致的副本间数据不一致问题。[#37950](https://github.com/apache/doris/pull/37950)

- 在新的优化器下，MOW Delete 表现在使用部分列更新。[#38751](https://github.com/apache/doris/pull/38751)

- 修复存算分离下 MOW 表可能出现的重复 Key 问题。[#39018](https://github.com/apache/doris/pull/39018)

- 修复 MOW Unique 和 Duplicate 表不能修改列顺序的问题。[#37067](https://github.com/apache/doris/pull/37067)

- 修复 Segcompaction 可能导致的数据正确性问题。[#37760](https://github.com/apache/doris/pull/37760)

- 修复列更新可能出现的内存泄露问题。[#37706](https://github.com/apache/doris/pull/37706)

**04 其他**

- 修复 TOPN 查询可能出现的小概率异常。[#39119](https://github.com/apache/doris/pull/39119) [#39199](https://github.com/apache/doris/pull/39199)

修复 FE 重启时自增 ID 可能重复的问题。[#37306](https://github.com/apache/doris/pull/37306)

- 修复 Delete 操作优先级队列可能的排队问题。[#37169](https://github.com/apache/doris/pull/37169)

- 优化 Delete 重试逻辑。[#37363](https://github.com/apache/doris/pull/37363)

- 修复新优化器下建表语句中 `bucket = 0` 的问题。[#38971](https://github.com/apache/doris/pull/38971)

- 修复 FE 生成 Image 失败时错误地报告成功的问题。[#37508](https://github.com/apache/doris/pull/37508)

- 修复 FE 下线节点时使用错误 nodename 可能导致的 FE 成员不一致问题。[#37987](https://github.com/apache/doris/pull/37987)

- 修复 CCR 增加分区可能失败的问题。[#37295](https://github.com/apache/doris/pull/37295)

- 修复倒排索引文件中 `int32` 溢出的问题。[#38891](https://github.com/apache/doris/pull/38891)

- 修复 TRUNCATE TABLE 失败可能导致 BE 不能下线的问题。[#37334](https://github.com/apache/doris/pull/37334)

- 修复因空指针导致的 Publish 无法继续的问题。[#37724](https://github.com/apache/doris/pull/37724) [#37531](https://github.com/apache/doris/pull/37531)
- 修复手动触发磁盘迁移时可能出现的 Coredump 问题。[#37712](https://github.com/apache/doris/pull/37712)

### 存算分离

- 修复 `show create table` 可能会展示两次 `file_cache_ttl_seconds` 属性的问题。[#38052](https://github.com/apache/doris/pull/38052)

- 修复设置 File Cache TTL 后，Segment Footer TTL 未正确设置的问题。[#37485](https://github.com/apache/doris/pull/37485)

- 修复 File Cache 因大量转换 Cache 类型可能会导致 Coredump 的问题。[#38518](https://github.com/apache/doris/pull/38518)

- 修复 File Cache 可能会泄漏 fd 的问题。[#38051](https://github.com/apache/doris/pull/38051)

- 修复 Schema Change Job 覆盖 Compaction Job 导致 Base Tablet Compaction 不能正常完成的问题。[#38210](https://github.com/apache/doris/pull/38210)

- 修复 Base Compaction Score 因 Data Race 可能会不准确的问题。[#38006](https://github.com/apache/doris/pull/38006)

- 修复导入返回的错误信息可能不能正确上传到对象存储的问题。[#38359](https://github.com/apache/doris/pull/38359)

- 修复存算分离模式和存算一体模式 2PC 导入返回信息不一致的问题。[#38076](https://github.com/apache/doris/pull/38076)

- 修复 File Cache 预热未正确设置 File Size 导致 Coredump 的问题。[#38939](https://github.com/apache/doris/pull/38939)

- 修复部分列更新没有正确出列 Delete 的问题。[#37151](https://github.com/apache/doris/pull/37151)

- 修复存算分离模式权限持久化兼容问题。[#38136](https://github.com/apache/doris/pull/38136) [#37708](https://github.com/apache/doris/pull/37708)

- 修复 Observer 遇到 `-230` 错误没有进行正确重试的问题。[#37625](https://github.com/apache/doris/pull/37625)

- 修复 `show load` 带条件时没有正确 analyze 的问题。[#37656](https://github.com/apache/doris/pull/37656)

- 修复存算分离模式下 `show streamload` 导致 BE Coredump 的问题。[#37903](https://github.com/apache/doris/pull/37903)

- 修复 `copy into` 在严格模式下未正确校验列名的问题。[#37650](https://github.com/apache/doris/pull/37650)

- 修复一表多流导入没有权限的问题。[#38878](https://github.com/apache/doris/pull/38878)

- 修复 getVersionUpdateTimeMs 可能会越界的问题。[#38074](https://github.com/apache/doris/pull/38074)

- 修复 FE Azure Blob List 没有实现正确的问题。[#37986](https://github.com/apache/doris/pull/37986)

- 修复 Azure Blob 回收时间计算不准确导致不触发回收的问题。[#37535](https://github.com/apache/doris/pull/37535)

- 修复存算分离模式下倒排索引文件漏删的问题。[#38306](https://github.com/apache/doris/pull/38306)

### Lakehouse

- 修复 Oracle Catalog 读取二进制数据的问题。[#37078](https://github.com/apache/doris/pull/37078)

- 修复多 FE 情况下，获取外表元数据可能导致的死锁问题。[#37756](https://github.com/apache/doris/pull/37756)

- 修复 JNI Scanner 打开失败导致 BE 节点宕机的问题。[#37697](https://github.com/apache/doris/pull/37697)

- 修复 Trino Connector Catalog 读取 Date 类型慢的问题。[#37266](https://github.com/apache/doris/pull/37266)

- 优化 Hive Catalog 的 Kerberos 认证逻辑。[#37301](https://github.com/apache/doris/pull/37301)

- 修复解析 MinIO 属性时，Region 属性可能解析错误的问题。[#37249](https://github.com/apache/doris/pull/37249)

- 修复 FE 创建过多的 FileSystem 导致内存泄漏的问题。[#36954](https://github.com/apache/doris/pull/36954)

- 修复读取 Paimon 时区信息错误的问题。[#37716](https://github.com/apache/doris/pull/37716)

- 修复 Hive 写回操作可能导致的线程泄漏问题。[#36990](https://github.com/apache/doris/pull/36990)

- 修复开启 Hive Metastore Event 同步功能导致的空指针问题。[#38421](https://github.com/apache/doris/pull/38421)

- 修复创建 Catalog 时报错信息不清晰或卡死的情况。[#37551](https://github.com/apache/doris/pull/37551)

- 修复读取 Hive Text 格式表时与 Hive 行为不一致的问题。[#37638](https://github.com/apache/doris/pull/37638)

- 修复切换 Catalog 和 Database 逻辑错误的问题。[#37828](https://github.com/apache/doris/pull/37828)

### MySQL 兼容性

- 修复开启 SSL 后，MySQL 协议中某些 Flag 设置不正确的问题。[#38086](https://github.com/apache/doris/pull/38086)

### 异步物化视图

- 修复基表分区数量非常多时可能导致的构建失败问题。[#37589](https://github.com/apache/doris/pull/37589)

- 修复构建嵌套物化视图时，即使可以进行分区刷新，也错误地进行了全表刷新的问题。[#38698](https://github.com/apache/doris/pull/38698)

- 修复分区刷新在分析分区依赖时，不能处理同时存在合法和不合法依赖关系的问题。[#38367](https://github.com/apache/doris/pull/38367)

- 修复最终返回结果包含 NULL Type 导致异步物化视图可能构建失败的问题。[#37019](https://github.com/apache/doris/pull/37019)

- 当包含同名的同步物化视图和异步物化视图时，透明改写可能出现规划错误。[#37311](https://github.com/apache/doris/pull/37311)

### 同步物化视图

- 现在改写后的同步物化视图也可以正确地进行分区裁剪。[#38527](https://github.com/apache/doris/pull/38527)

- 同步物化视图改写时，不再选择数据未就绪的同步物化视图。[#38148](https://github.com/apache/doris/pull/38148)

### 查询优化器

- 修复查询和 Delete 等操作同时进行可能导致的死锁问题。[#38660](https://github.com/apache/doris/pull/38660)

- 修复分桶裁剪在 Decimal 列分桶上可能错误裁剪的问题。[#37889](https://github.com/apache/doris/pull/37889)

- 修复当 Mark Join 参与 Join Reorder 时，规划可能出现错误的问题。[#39152](https://github.com/apache/doris/pull/39152)

- 修复关联子查询关联条件不是简单列时，结果错误的问题。[#37644](https://github.com/apache/doris/pull/37644)

- 修复分区裁剪不能正确处理 or 表达式的问题。[#38897](https://github.com/apache/doris/pull/38897)

- 修复当进行 JOIN 和 AGG 交换执行顺序的优化时，可能导致的规划报错问题。[#37343](https://github.com/apache/doris/pull/37343)

- 修复 `str_to_date` 在 DATEV1 类型上进行常量折叠计算错误的问题。[#37360](https://github.com/apache/doris/pull/37360)

- 修复 ACOS 函数常量折叠返回非 NaN 的问题。[#37932](https://github.com/apache/doris/pull/37932)

- 修复偶尔出现的规划报错 "The children format needs to be [WhenClause+, DefaultValue?]" 的问题。[#38491](https://github.com/apache/doris/pull/38491)

- 修复当投影中包含窗口函数，且同时存在一个列的原始列和其别名时，规划可能出现错误的问题。[#38166](https://github.com/apache/doris/pull/38166)

- 修复当聚合参数中含有 Lambda 表达式，可能导致规划报错的问题。[#37109](https://github.com/apache/doris/pull/37109)

- 修复在极端情况下可能出现的 Insert 报错："MultiCastDataSink cannot be cast to DataStreamSink" 的问题。[#38526](https://github.com/apache/doris/pull/38526)

- 修复创建表时，新优化器对于传入的 `char(0)/varchar(0)` 没有正确处理的问题。[#38427](https://github.com/apache/doris/pull/38427)

- 修复 `char(255) toSql` 行为不正确的问题。[#37340](https://github.com/apache/doris/pull/37340)

- 修复 `agg_state `类型内部的 nullable 属性可能规划错误的问题。[#37489](https://github.com/apache/doris/pull/37489)

- 修复 Mark Join 时行数统计不准确的问题。[#38270](https://github.com/apache/doris/pull/38270)

### 查询执行

- 修复多个场景下，Pipeline 执行引擎被卡住导致查询不结束的问题。[#38657](https://github.com/apache/doris/pull/38657) [#38206](https://github.com/apache/doris/pull/38206) [#38885](https://github.com/apache/doris/pull/38885) [#38151](https://github.com/apache/doris/pull/38151) [#37297](https://github.com/apache/doris/pull/37297)

- 修复 NULL 和非 NULL 列在差集计算时导致的 Coredump 问题。[#38750](https://github.com/apache/doris/pull/38750)

- 修复 Delete 语句中 DECIMAL 类型为纯小数时报错的问题。[#37801](https://github.com/apache/doris/pull/37801)

- 修复 `width_bucket` 函数结果错误的问题。[#37892](https://github.com/apache/doris/pull/37892)

- 修复当单行数据很大且返回结果集也很大时（超过 2GB）查询报错的问题。[#37990](https://github.com/apache/doris/pull/37990)

- 修复单副本导入时 rpc 链接没有正确释放导致的 Coredump 问题。[#38087](https://github.com/apache/doris/pull/38087)

- 修复 `foreach` 函数处理 NULL 导致的 Coredump 问题。[#37349](https://github.com/apache/doris/pull/37349)

- 修复 stddev 在 DecimalV2 类型下结果错误的问题。[#38731](https://github.com/apache/doris/pull/38731)

- 修复` bitmap union` 计算性能慢的问题。[#37816](https://github.com/apache/doris/pull/37816)

- 修复 Profile 中聚合算子的 RowsProduced 没有设置的问题。[#38271](https://github.com/apache/doris/pull/38271)

- 修复 Hash Join 下计算 Hash 表 Bucket 数目时溢出的问题。[#37193](https://github.com/apache/doris/pull/37193) [#37493](https://github.com/apache/doris/pull/37493)

- 修复 `jemalloc cache memory tracker` 记录不准确的问题。[#37464](https://github.com/apache/doris/pull/37464)

- 增加配置项 `enable_stacktrace`，用户可以通过设置此选项来控制 BE 日志中是否输出异常栈。[#37713](https://github.com/apache/doris/pull/37713)

- 修复 Arrow Flight SQL 在设置 `enable_parallel_result_sink` 为 false 时不能正常工作的问题。[#37779](https://github.com/apache/doris/pull/37779)

- 修复错误地使用 Colocate Join 的问题。[#37361](https://github.com/apache/doris/pull/37361) [#37729](https://github.com/apache/doris/pull/37729)

- 修复 `round` 函数在 DECIMAL128 类型上计算溢出的问题。[#37733](https://github.com/apache/doris/pull/37733) [#38106](https://github.com/apache/doris/pull/38106)

- 修复 `sleep` 函数传参 const 字符串时的 Coredump 问题。[#37681](https://github.com/apache/doris/pull/37681)

- 增加审计日志的队列长度，解决了数千并发场景下审计日志不能正常记录的问题。[#37786](https://github.com/apache/doris/pull/37786)

- 修复创建 Workload Group 导致的线程数过多，导致 BE Coredump 的问题。[#38096](https://github.com/apache/doris/pull/38096)

- 修复 MULTI_MATCH_ANY 函数导致的 Coredump 问题。[#37959](https://github.com/apache/doris/pull/37959)

- 修复`insert overwrite auto partition `导致事务回滚的问题。[#38103](https://github.com/apache/doris/pull/38103)

- 修复 TimeUtils formatter 没有使用正确时区的问题。[#37465](https://github.com/apache/doris/pull/37465)

- 修复 week/yearweek 常量折叠场景下结果错误的问题。[#37376](https://github.com/apache/doris/pull/37376)

- 修复 `convert_tz` 函数结果错误的问题。[#37358](https://github.com/apache/doris/pull/37358) [#38764](https://github.com/apache/doris/pull/38764)

- 修复 `collect_set` 函数结合窗口函数使用时 Coredump 的问题。[#38234](https://github.com/apache/doris/pull/38234)

- 修复 `percentile_approx` 在滚动升级过程中导致的 Coredump 问题。[#39321](https://github.com/apache/doris/pull/39321)

- 修复 `mod` 函数在异常输入时导致的 Coredump 问题。[#37999](https://github.com/apache/doris/pull/37999)

- 修复 Broadcast Join 在 probe 开始运行时 Hash Table 构建未完成的问题。[#37643](https://github.com/apache/doris/pull/37643)

- 修复多线程下执行相同表达式可能导致 Java UDF 结果错误的问题。[#38612](https://github.com/apache/doris/pull/38612)

- 修复 `conv` 函数返回类型错误导致的溢出问题。[#38001](https://github.com/apache/doris/pull/38001)

- 修复 `json_replace` 函数返回类型不正确的问题。[#3701](https://github.com/apache/doris/pull/37014)

- 修复 `percentile` 聚合函数 Nullable 属性设置不合理的问题。[#37330](https://github.com/apache/doris/pull/37330)

- 修复 `histogram` 函数结果不稳定的问题。[#38608](https://github.com/apache/doris/pull/38608)

- 修复 Profile 中 Task State 显示不正确的问题。[#38082](https://github.com/apache/doris/pull/38082)

- 修复系统刚启动时部分 query 被错误取消的问题。[#37662](https://github.com/apache/doris/pull/37662)

### 半结构化数据管理

- 修复时间序列压缩的一些问题。[#39170](https://github.com/apache/doris/pull/39170) [#39176](https://github.com/apache/doris/pull/39176)

- 修复压缩过程中索引大小统计错误的问题。[#37232](https://github.com/apache/doris/pull/37232)

- 修复倒排索引对不分词的超长字符串匹配可能不正确的问题。[#37679](https://github.com/apache/doris/pull/37679) [#38218](https://github.com/apache/doris/pull/38218)

- 修复 `array_range` 和 `array_with_const` 函数在大数据量下内存占用高的问题。[#38284](https://github.com/apache/doris/pull/38284) [#37495](https://github.com/apache/doris/pull/37495)

- 修复选择 ARRAY / MAP / STRUCT 类型的列时可能出现的 Coredump 问题。[#37936](https://github.com/apache/doris/pull/37936)

- 修复 Stream Load 指定 jsonpath 时 simdjson 解析错误导致导入失败的问题。[#38490](https://github.com/apache/doris/pull/38490)

- 修复  JSON 数据中有重复 Key 时处理异常的问题。[#38146](https://github.com/apache/doris/pull/38146)

- 修复 DROP INDEX 后可能出现查询报错的问题。[#37646](https://github.com/apache/doris/pull/37646)

- 修复索引压缩时在合并行检查中的错误返回问题。[#38732](https://github.com/apache/doris/pull/38732)

- 倒排索引 v2 格式现在支持修改列名。[#38079](https://github.com/apache/doris/pull/38079)

- 修复没有索引时 MATCH 函数匹配空字符串时 Coredump 的问题。[#37947](https://github.com/apache/doris/pull/37947)

- 修复倒排索引对 NULL 值处理的问题。[#37921](https://github.com/apache/doris/pull/37921) [#37842](https://github.com/apache/doris/pull/37842) [#38741](https://github.com/apache/doris/pull/38741)

- 修复 FE 重启后 `row_store_page_size` 不正确的问题。[#38240](https://github.com/apache/doris/pull/38240)

### 其他

- 修复时区配置问题，现在默认时区不再固定为 UTC+8，而是从系统配置中获取。[#37294](https://github.com/apache/doris/pull/37294)

- 修复由于存在多个 JSR 规范实现导致使用 Ranger 时出现的类冲突问题。[#37575](https://github.com/apache/doris/pull/37575)

- 修复部分 BE 代码中字段可能未初始化的问题。[#37403](https://github.com/apache/doris/pull/37403)

- 修复 Random Distributed 表 Delete 语句报错的问题。[#37985](https://github.com/apache/doris/pull/37985)

- 修复创建同步物化视图时错误地需要基表的 `alter_priv` 权限问题。[#38011](https://github.com/apache/doris/pull/38011)

- 修复当 TVF 中使用了 Resource 时未对 Resource 鉴权的问题。[#36928](https://github.com/apache/doris/pull/36928)


## 致谢

@133tosakarin、 @924060929、 @AshinGau、 @Baymine、 @BePPPower、 @BiteTheDDDDt、 @ByteYue、 @CalvinKirs、 @Ceng23333、 @DarvenDuan、 @FreeOnePlus、 @Gabriel39、 @HappenLee、 @JNSimba、 @Jibing-Li、 @KassieZ、 @Lchangliang、 @LiBinfeng-01、 @Mryange、 @SWJTU-ZhangLei、 @TangSiyang2001、 @Tech-Circle-48、 @Vallishp、 @Yukang-Lian、 @Yulei-Yang、 @airborne12、 @amorynan、 @bobhan1、 @cambyzju、 @cjj2010、 @csun5285、 @dataroaring、 @deardeng、 @eldenmoon、 @englefly、 @feiniaofeiafei、 @felixwluo、 @freemandealer、 @gavinchou、 @ghkang98、 @hello-stephen、 @hubgeter、 @hust-hhb、 @jacktengg、 @kaijchen、 @kaka11chen、 @keanji-x、 @liaoxin01、 @liutang123、 @luwei16、 @luzhijing、 @lxr599、 @morningman、 @morrySnow、 @mrhhsg、 @mymeiyi、 @platoneko、 @qidaye、 @qzsee、 @seawinde、 @shuke987、 @sollhui、 @starocean999、 @suxiaogang223、 @w41ter、 @wangbo、 @wangshuo128、 @whutpencil、 @wsjz、 @wuwenchi、 @wyxxxcat、 @xiaokang、 @xiedeyantu、 @xinyiZzz、 @xy720、 @xzj7019、 @yagagagaga、 @yiguolei、 @yujun777、 @z404289981、 @zclllyybb、 @zddr、 @zfr9527、 @zhangbutao、 @zhangstar333、 @zhannngchen、 @zhiqiang-hhhh、 @zjj、 @zy-kkk、 @zzzxl1993