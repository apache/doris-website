---
{
    "title": "Release 3.0.2",
    "language": "zh-CN",
    "description": "亲爱的社区小伙伴们，Apache Doris 3.0.2 版本已于 2024 年 10 月 15 日正式发布。 3.0.2 版本在存算分离、存储、湖仓一体、查询优化器以及执行引擎持续升级改进，欢迎大家下载使用。"
}
---

亲爱的社区小伙伴们，**Apache Doris 3.0.2 版本已于 2024 年 10 月 15 日正式发布。** 3.0.2 版本在存算分离、存储、湖仓一体、查询优化器以及执行引擎持续升级改进，欢迎大家下载使用。

- GitHub 下载：https://github.com/apache/doris/releases

- 官网下载：https://doris.apache.org/download

## 行为变更

### 存储

- 限制单个备份任务的 Tablet 数量，避免 FE 内存溢出。[#40518](https://github.com/apache/doris/pull/40518) 
- `SHOW PARTITIONS`命令现在显示分区的`CommittedVersion`。[#28274](https://github.com/apache/doris/pull/28274) 

### 其他

- `fe.log`的默认打印模式（异步）现在包含文件行号信息。如果遇到因行号输出导致的性能问题，请选择 BRIEF 模式。[#39419](https://github.com/apache/doris/pull/39419) 
- 默认将 Session 变量`ENABLE_PREPARED_STMT_AUDIT_LOG` 的值从 `true` 更改为 `false`，不再打印 Prepare 语句的审计日志。[#38865](https://github.com/apache/doris/pull/38865) 
- 将 Session 变量 `max_allowed_packet` 的默认值从 1MB 调整为 16MB，与 MySQL 8.4 保持一致。[#38697](https://github.com/apache/doris/pull/38697) 
- FE 和 BE 的 JVM 默认使用 UTF-8 字符集。[#39521](https://github.com/apache/doris/pull/39521) 

## 新特性

### 存储

- 备份和恢复现在支持清除不在备份中的表或分区。[#39028](https://github.com/apache/doris/pull/39028) 

### 存算分离

- 支持并行回收多个 Tablet 上的过期数据。[#37630](https://github.com/apache/doris/pull/37630) 
- 支持通过`ALTER`语句变更 Storage Vault。[#38685](https://github.com/apache/doris/pull/38685) [#37606](https://github.com/apache/doris/pull/37606) 
- 支持单个事务同时导入大量 Tablet（5000+）（实验性功能）。[#38243](https://github.com/apache/doris/pull/38243) 
- 支持自动中止因节点重启等原因导致的未决事务，解决未决事务阻塞 Secommission 或 Schema Change 的问题。[#37669](https://github.com/apache/doris/pull/37669) 
- 新增 Session 变量 `enable_segment_cache` 控制查询时是否使用 Segment Cache（默认为`true`）。[#37141](https://github.com/apache/doris/pull/37141) 
- 解决存算分离模式下进行 Schema Change 时不能大量导入的问题。[#39558](https://github.com/apache/doris/pull/39558) 
- 支持在存算分离模式下允许添加多个 Follower 角色的 FE。[#38388](https://github.com/apache/doris/pull/38388) 
- 支持在无盘或低性能 HDD 环境下使用内存作为 File Cache 以加速查询。[#38811](https://github.com/apache/doris/pull/38811) 

### Lakehouse

- 新增 Lakesoul Catalog
- 新增系统表 `catalog_meta_cache_statistics`，用于查看 External Catalog 中各类元数据缓存的使用情况。[#40155](https://github.com/apache/doris/pull/40155) 

### 查询优化器

- 支持 `is [not] true/false`表达式。[#38623](https://github.com/apache/doris/pull/38623) 

### 查询执行

- 新增 CRC32 函数。[#38204](https://github.com/apache/doris/pull/38204) 
- 新增聚合函数 Skew 和 Kurt。[#41277](https://github.com/apache/doris/pull/41277) 
- 将 Profile 持久化到 FE 的磁盘中，以保留更多的 Profile。[#33690](https://github.com/apache/doris/pull/33690) 
- 新增系统表`workload_group_privileges`以查看 Workload Group 相关的权限信息。[#38436](https://github.com/apache/doris/pull/38436) 
- 新增系统表`workload_group_resource_usage`以监控 Workload Group 的资源统计信息。[#39177](https://github.com/apache/doris/pull/39177) 
- Workload Group 现在支持限制本地 IO 和远程 IO 的读取。[#39012](https://github.com/apache/doris/pull/39012) 
- Workload Group 现在支持 cgroupv2 以限制 CPU 使用。[#39374](https://github.com/apache/doris/pull/39374) 
- 新增系统表`information_schema.partitions`以查看一些建表属性。[#40636](https://github.com/apache/doris/pull/40636) 

### 其他

- 支持使用`SHOW`语句展示 BE 的配置信息，例如`SHOW BACKEND CONFIG LIKE ${pattern}`。[#36525](https://github.com/apache/doris/pull/36525) 

## 改进与优化

### 导入

- 优化了 Routine Load 在遇到 Kafka 频繁 EOF 时的导入效率。[#39975](https://github.com/apache/doris/pull/39975) 
- Stream Load 结果中增加了读取 HTTP 数据的耗时时间`ReceiveDataTimeMs`，可以快速判断网络原因导致的 Stream Load 慢问题。[#40735](https://github.com/apache/doris/pull/40735) 
- 优化了 Routine Load 超时逻辑，避免了倒排和 MOW 写入频繁超时问题。[#40818](https://github.com/apache/doris/pull/40818) 

### 存储

- 支持批量添加分区。[#37114](https://github.com/apache/doris/pull/37114) 

### 存算分离

- 添加了 meta-service HTTP 接口`/MetaService/http/show_meta_ranges`，便于统计 FDB 中 KV 分布组成。[#39208](https://github.com/apache/doris/pull/39208) 
- meta-service/recycler stop 脚本确保进程完全退出后才返回。[#40218](https://github.com/apache/doris/pull/40218) 
- 支持使用 Session 变量`version_comment`（Cloud Mode）来显示当前部署模式为存算分离模式。[#38269](https://github.com/apache/doris/pull/38269) 
- 修复了提交事务失败时返回的详细消息。[#40584](https://github.com/apache/doris/pull/40584) 
- 支持使用一个 meta-service 进程同时提供元数据服务和数据回收服务。[#40223](https://github.com/apache/doris/pull/40223) 
- 优化了 file_cache 的默认配置，避免了未设置时可能导致的无法正确运行的问题。[#41421](https://github.com/apache/doris/pull/41421) [#41507](https://github.com/apache/doris/pull/41507) 
- 通过批量获取多个 Partition 的 Version 提高了查询性能。[#38949](https://github.com/apache/doris/pull/38949) 
- 延迟变更 Tablet 的分布，避免了临时网络抖动引起的查询性能问题。[#40371](https://github.com/apache/doris/pull/40371) 
- 优化了 Balance 逻辑中的读写锁。[#40633](https://github.com/apache/doris/pull/40633) 
- 提高了 File Cache 在重启/宕机等情况下处理 TTL 文件名的鲁棒性。[#40226](https://github.com/apache/doris/pull/40226) 
- 增加了 BE HTTP 接口`/api/file_cache?op=hash`，方便计算 Segment 文件在盘上的 Hash 文件名。[#40831](https://github.com/apache/doris/pull/40831) 
- 优化了统一命名，兼容使用 Compute Group 代表 BE 分组（原 Cloud Cluster）。[#40767](https://github.com/apache/doris/pull/40767) 
- 优化了主键表计算 Delete Bitmap 时获取锁的等待时间。[#40341](https://github.com/apache/doris/pull/40341)
- 当主键表 Delete Bitmap 数量多时，通过提前合并多个 Delete Bitmap 来优化查询时 CPU 消耗高的问题。[#40204](https://github.com/apache/doris/pull/40204) 
- 支持通过 SQL 语句管理存算分离模式下的 FE/BE 节点，隐藏部署存算分离模式时直接和 meta-service 交互的逻辑。[#40264](https://github.com/apache/doris/pull/40264) 
- 增加了快速部署 FDB 脚本。[#39803](https://github.com/apache/doris/pull/39803) 
- 优化了`SHOW CACHE HOTSPOT`的输出，使其和其他`SHOW`语句的列名风格统一。[#41322](https://github.com/apache/doris/pull/41322) 
- 使用 Storage Vault 作为存储后端时，不允许使用`latest_fs()`以规避同个表绑定不同的存储后端。[#40516](https://github.com/apache/doris/pull/40516) 
- 优化了 MOW 表导入时计算 Delete Bitmap 的超时策略。[#40562](https://github.com/apache/doris/pull/40562) [#40333](https://github.com/apache/doris/pull/40333) 
- 存算分离模式下 be.conf 的 `enable_file_cache` 默认开启。[#41502](https://github.com/apache/doris/pull/41502) 

### Lakehouse

- 读取 CSV 格式的表时，支持通过会话`keep_carriage_return`设置对`\r`符号的读取行为。[#39980](https://github.com/apache/doris/pull/39980) 
- BE 的 JVM 最大内存默认调整为 2GB（仅影响新部署用户）。[#41403](https://github.com/apache/doris/pull/41403) 
- Hive Catalog 新增`hive.recursive_directories_table`和`hive.ignore_absent_partitions`属性，用于指定是否递归遍历数据目录，以及是否忽略缺失的分区。[#39494](https://github.com/apache/doris/pull/39494) 
- 优化了 Catalog 刷新逻辑，避免了刷新产生大量连接。[#39205](https://github.com/apache/doris/pull/39205) 
- `SHOW CREATE DATABASE`和`SHOW CREATE TABLE`针对外部数据源，增加了 Location 信息显示。[#39179](https://github.com/apache/doris/pull/39179) 
- 新优化器支持通过`INSERT INTO`命令将数据插入到 JDBC 外表。[#41511](https://github.com/apache/doris/pull/41511) 
- MaxCompute Catalog 支持复杂类型。[#39259](https://github.com/apache/doris/pull/39259) 
- 优化了外表数据分片的读取合并逻辑。[#38311](https://github.com/apache/doris/pull/38311) 
- 优化了外表元数据缓存的一些刷新策略。[#38506](https://github.com/apache/doris/pull/38506) 
- Paimon 表支持`IN/NOT IN`谓词下推。[#38390](https://github.com/apache/doris/pull/38390) 
- 兼容 Paimon 0.9 版本创建的 Parquet 格式的表。[#41020](https://github.com/apache/doris/pull/41020) 

### 异步物化视图

- 构建异步物化视图支持同时使用 Immediate 和 Starttime。[#39573](https://github.com/apache/doris/pull/39573) 
- 基于外表的异步物化视图，在刷新物化视图前会刷新外表的元数据缓存，保证基于最新外表数据构建。[#38212](https://github.com/apache/doris/pull/38212) 
- 分区增量构建支持按照周和季度粒度上卷。[#39286](https://github.com/apache/doris/pull/39286) 

### 查询优化器

- 聚合函数`GROUP_CONCAT`现在支持同时使用`DISTINCT`和`ORDER BY`。[#38080](https://github.com/apache/doris/pull/38080) 
- 优化了统计信息的收集、使用，以及估算行数和代价计算的逻辑，现在可以生成更高效稳定的执行计划。
- 窗口函数分区数据预过滤支持包含多个窗口函数的情况。[#38393](https://github.com/apache/doris/pull/38393) 

### 查询执行

- 通过并行运行 Prepare Pipeline Task 来降低查询延时。[#40874](https://github.com/apache/doris/pull/40874) 
- 在 Profile 中显示 Catalog 信息。[#38283](https://github.com/apache/doris/pull/38283) 
- 优化了`IN`过滤条件的计算性能。[#40917](https://github.com/apache/doris/pull/40917) 
- 在 K8S 中支持 cgroupv2 来限制 Doris 的内存使用。[#39256](https://github.com/apache/doris/pull/39256) 
- 优化了字符串到 DATETIME 类型的转换性能。[#38385](https://github.com/apache/doris/pull/38385) 
- 当字符串是一个小数时，支持将其 CAST 为 INT，这将更兼容 MySQL 的某些行为。[#38847](https://github.com/apache/doris/pull/38847) 

### 半结构化数据管理

- 优化了倒排索引匹配的性能。[#41122](https://github.com/apache/doris/pull/41122) 
- 暂时禁止在数组上创建带分词的倒排索引。[#39062](https://github.com/apache/doris/pull/39062) 
- `explode_json_array`支持二进制 JSON 类型。[#37278](https://github.com/apache/doris/pull/37278) 
- IP 数据类型支持 BloomFilter 索引。[#39253](https://github.com/apache/doris/pull/39253) 
- IP 数据类型支持行存。[#39258](https://github.com/apache/doris/pull/39258) 
- ARRAY、MAP、STRUCT 嵌套数据类型支持 Schema Change。[#39210](https://github.com/apache/doris/pull/39210) 
- 创建 MTMV 时遇到 VARIANT 数据类型自动截断 KEY。[#39988](https://github.com/apache/doris/pull/39988) 
- 查询时懒加载倒排索引提升性能。[#38979](https://github.com/apache/doris/pull/38979) 
- `add inverted index file size for open file`。[#37482](https://github.com/apache/doris/pull/37482) 
- Compaction 时减少倒排索引访问对象存储接口提升性能。[#41079](https://github.com/apache/doris/pull/41079) 
- 增加了 3 个倒排索引相关的 Query Profile Metric。[#36696](https://github.com/apache/doris/pull/36696) 
- 减少非 PreparedStatement SQL 的 Cache 开销提升性能。[#40910](https://github.com/apache/doris/pull/40910) 
- 预热缓存支持倒排索引。[#38986](https://github.com/apache/doris/pull/38986) 
- 倒排索引写入即缓存。[#39076](https://github.com/apache/doris/pull/39076) 

### 兼容性

- 修复了 Thrift ID 在 Master 上与 Branch-2.1 不兼容的问题。[#41057](https://github.com/apache/doris/pull/41057) 

### 其他

- BE HTTP API 支持鉴权，需要鉴权时将 `config::enable_all_http_auth` 设置为 true（默认为 false）。[#39577](https://github.com/apache/doris/pull/39577) 
- 优化了 REFRESH 操作所需的用户权限。从 ALTER 权限放宽到 SHOW 权限。[#39008](https://github.com/apache/doris/pull/39008) 
- 减少了调用 `advanceNextId()` 时 nextId 的范围。[#40160](https://github.com/apache/doris/pull/40160) 
- 优化了 Java UDF 的缓存机制。[#40404](https://github.com/apache/doris/pull/40404) 

## 缺陷修复

### 导入

- 修复了`abortTransaction`没有处理返回码的问题。[#41275](https://github.com/apache/doris/pull/41275) 
- 修复了存算分离模式下提交/中止事务失败时未调用`afterCommit/afterAbort`的问题。[#41267](https://github.com/apache/doris/pull/41267) 
- 修复了存算分离模式下 Routine Load 修改消费偏移量无法工作的问题。[#39159](https://github.com/apache/doris/pull/39159) 
- 修复了获取错误日志文件路径时重复关闭文件的问题。[#41320](https://github.com/apache/doris/pull/41320) 
- 修复了存算分离模式下 Routine Load 作业进度缓存不正确的问题。[#39313](https://github.com/apache/doris/pull/39313) 
- 修复了存算分离模式下 Routine Load 提交事务失败导致卡住的问题。[#40539](https://github.com/apache/doris/pull/40539) 
- 修复了存算分离模式下 Routine Load 一直报数据质量检查错误的问题。[#39790](https://github.com/apache/doris/pull/39790) 
- 修复了存算分离模式下 Routine Load 未在提交前事务进行检查的问题。[#39775](https://github.com/apache/doris/pull/39775) 
- 修复了存算分离模式下 Routine Load 未在中止事务前进行检查的问题。[#40463](https://github.com/apache/doris/pull/40463) 
- 修复了 Cluster Key 不支持某些数据类型的问题。[#38966](https://github.com/apache/doris/pull/38966) 
- 修复了事务被重复提交的问题。[#39786](https://github.com/apache/doris/pull/39786) 
- 修复了 WAL 在 BE 退出时 Use After Free 的问题。[#33131](https://github.com/apache/doris/pull/33131) 
- 修复了存算分离模式下 WAL 回放未跳过已经完成了的导入事务的问题。[#41262](https://github.com/apache/doris/pull/41262) 
- 修复了存算分离模式下 Group Commit 选择 BE 的逻辑。[#39986](https://github.com/apache/doris/pull/39986) [#38644](https://github.com/apache/doris/pull/38644) 
- 修复了 Insert Into 开启 Group Commit 时 BE 可能 Coredump 的问题。[#39339](https://github.com/apache/doris/pull/39339) 
- 修复了 Insert Into 开启 Group Commit 时可能会卡住的问题。[#39391](https://github.com/apache/doris/pull/39391) 
- 修复了导入不打开 Group Commit 选项时可能会报找不到表的问题。[#39731](https://github.com/apache/doris/pull/39731) 
- 修复了 Tablet 数量太多提交事务超时的问题。[#40031](https://github.com/apache/doris/pull/40031) 
- 修复了 Auto Partition 并发 open 的问题。[#38605](https://github.com/apache/doris/pull/38605) 
- 修复了导入锁粒度太大的问题。[#40134](https://github.com/apache/doris/pull/40134) 
- 修复了 Varchar 长度为 0 导致 Coredump 的问题。[#40940](https://github.com/apache/doris/pull/40940) 
- 修复了日志打印的 index ID 值不正确的问题。[#38790](https://github.com/apache/doris/pull/38790) 
- 修复了 Memtable 前移未 Close BRPC Streaming 的问题。[#40105](https://github.com/apache/doris/pull/40105) 
- 修复了 Memtable 前移 bvar 统计不准确的问题。[#39075](https://github.com/apache/doris/pull/39075) 
- 修复了 Memtable 前移多副本容错的问题。[#38003](https://github.com/apache/doris/pull/38003) 
- 修复了 Routine Load 一流多表错误计算消息长度的问题。[#40367](https://github.com/apache/doris/pull/40367) 
- 修复了 Broker Load 进度汇报不准确的问题。[#40325](https://github.com/apache/doris/pull/40325) 
- 修复了 Broker Load 扫描数据量汇报不准确的问题。[#40694](https://github.com/apache/doris/pull/40694) 
- 修复了存算分离模式下 Routine Load 并发的问题。[#39242](https://github.com/apache/doris/pull/39242) 
- 修复了存算分离模式下 Routine Load Job 被取消的问题。[#39514](https://github.com/apache/doris/pull/39514) 
- 修复了删除 Kafka Topic 时进度未被重置的问题。[#38474](https://github.com/apache/doris/pull/38474) 
- 修复了 Routine Load 事务状态转换时更新进度的问题。[#39311](https://github.com/apache/doris/pull/39311) 
- 修复了 Routine Load 从暂停状态切换到暂停状态的问题。[#40728](https://github.com/apache/doris/pull/40728) 
- 修复了 Stream Load 记录因数据库被删除被漏记录的问题。[#39360](https://github.com/apache/doris/pull/39360) 

### 存储

- 修复了 Storage Policy 丢失的问题。[#38700](https://github.com/apache/doris/pull/38700) 
- 修复了跨版本备份恢复报错的问题。[#38370](https://github.com/apache/doris/pull/38370) 
- 修复了 CCR Binlog NPE 问题。[#39909](https://github.com/apache/doris/pull/39909) 
- 修复了可能的 MOW 重复 Key 问题。[#41309](https://github.com/apache/doris/pull/41309) [#39791](https://github.com/apache/doris/pull/39791) [#39958](https://github.com/apache/doris/pull/39958) [#38369](https://github.com/apache/doris/pull/38369) [#38331](https://github.com/apache/doris/pull/38331) 
- 修复了高频写入场景下备份恢复之后不能写入的问题。[#40118](https://github.com/apache/doris/pull/40118) [#38321](https://github.com/apache/doris/pull/38321) 
- 修复了删除空字符串和 Schema Change 交叉可能触发的数据错误问题。[#41064](https://github.com/apache/doris/pull/41064) 
- 修复了列更新导致的数据统计不正确问题。[#40880](https://github.com/apache/doris/pull/40880) 
- 限制了 Tablet Meta PB 的大小，防止大小过大导致 BE 宕机。[#39455](https://github.com/apache/doris/pull/39455) 
- 修复了`begin; insert into values; commit`新优化器可能的列错位问题。[#39295](https://github.com/apache/doris/pull/39295) 

### 存算分离

- 修复了存算分离模式下多个 FE 的 Tablet 分布可能不一致的问题。[#41458](https://github.com/apache/doris/pull/41458) 
- 修复了 TVF 在多计算组环境下可能不工作的问题。[#39249](https://github.com/apache/doris/pull/39249) 
- 修复了存算分离模式 BE 退出时 Compaction 使用了已经释放的资源问题。[#39302](https://github.com/apache/doris/pull/39302) 
- 修复了自动启停可能导致 FE replay 卡住的问题。[#40027](https://github.com/apache/doris/pull/40027) 
- 修复了 BE 状态和 Meta-Service 中存储的状态不一致的问题。[#40799](https://github.com/apache/doris/pull/40799) 
- 修复了 FE->Meta-Service 连接池不能自动过期重连的问题。[#41202](https://github.com/apache/doris/pull/41202) [#40661](https://github.com/apache/doris/pull/40661) 
- 修复了 Rebalance 过程中有一些 Tablet 可能会来回进行非预期的 Balance 问题。[#39792](https://github.com/apache/doris/pull/39792) 
- 修复了 FE 重启后 Storage Vault 权限丢失的问题。[#40260](https://github.com/apache/doris/pull/40260) 
- 修复了 Tablet 行数等统计信息可能因为 FDB Scan Range 分页导致统计不全的问题。[#40494](https://github.com/apache/doris/pull/40494) 
- 修复了同个 Label 下关联大量的 Abort 事务导致的性能问题。[#40606](https://github.com/apache/doris/pull/40606) 
- 修复了 commit_txn 没有自动重入的问题，保持存算一体和存算分离行为一致。[#39615](https://github.com/apache/doris/pull/39615) 
- 修复了 Drop Column 时投影列变多的问题。[#40187](https://github.com/apache/doris/pull/40187) 
- 修复了 Delete 语句返回值没有正确处理导致删除之后数据仍可见的问题。[#39428](https://github.com/apache/doris/pull/39428) 
- 修复了文件缓存预热时因为 Rowset 元数据竞争导致的 coredump 问题。[#39361](https://github.com/apache/doris/pull/39361) 
- 修复了 TTL 缓存开启 LRU 淘汰时会用满整个缓存空间的问题。[#39814](https://github.com/apache/doris/pull/39814) 
- 修复了基于 HDFS 存储后端导入 Commit Rowset 失败时临时文件不能回收的问题。[#40215](https://github.com/apache/doris/pull/40215) 

### Lakehouse

- 修复了一些 JDBC Catalog 谓词下推的问题。[#39064](https://github.com/apache/doris/pull/39064) 
- 修复了当 Parquet 格式中 Struct 类型列缺失时无法读取的问题。[#38718](https://github.com/apache/doris/pull/38718) 
- 修复了部分情况下 FE 侧 FileSystem 泄露的问题。[#38610](https://github.com/apache/doris/pull/38610) 
- 修复了部分情况下 Hive/Iceberg 表写回导致元数据缓存信息不一致的问题。[#40729](https://github.com/apache/doris/pull/40729) 
- 修复了部分情况下为外表生成分区 ID 不稳定的问题。[#39325](https://github.com/apache/doris/pull/39325) 
- 修复了部分情况下外表查询会选择在黑名单中的 BE 节点的问题。[#39451](https://github.com/apache/doris/pull/39451) 
- 优化了分批获取外表分区信息时的超时时间，避免了长时间占用线程。[#39346](https://github.com/apache/doris/pull/39346) 
- 修复了部分情况下查询 Hudi 表导致内存泄露的问题。[#41256](https://github.com/apache/doris/pull/41256) 
- 修复了部分情况下 JDBC Catalog 可能存在连接池连接泄露的问题。[#39582](https://github.com/apache/doris/pull/39582) 
- 修复了部分情况下 JDBC Catalog 可能存在 BE 内存泄露的问题。[#41041](https://github.com/apache/doris/pull/41041) 
- 修复了无法查询阿里云 OSS 上 Hudi 数据的问题。[#41316](https://github.com/apache/doris/pull/41316) 
- 修复了无法读取 MaxCompute 空分区的问题。[#40046](https://github.com/apache/doris/pull/40046) 
- 修复了通过 JDBC Catalog 查询 Oracle 表示性能差的问题。[#41513](https://github.com/apache/doris/pull/41513) 
- 修复了开启文件缓存功能后，查询 Paimon 表 Deletion Vector 时 BE 宕机的问题。[#39877](https://github.com/apache/doris/pull/39877) 
- 修复了无法访问开启 HA 的 HDFS 集群上 Paimon 表的问题。[#39806](https://github.com/apache/doris/pull/39806) 
- 临时关闭了 Parquet 的 Page Index 过滤功能以避免一些潜在问题。[#38691](https://github.com/apache/doris/pull/38691) 
- 修复了无法读取 Parquet 文件中 Unsigned 类型的问题。[#39926](https://github.com/apache/doris/pull/39926) 
- 修复了部分情况下读取 Parquet 文件可能导致死循环的问题。[#39523](https://github.com/apache/doris/pull/39523) 

### 异步物化视图

- 修复了分区构建时，如果两侧有相同的列名，可能选择错误的表跟踪分区的问题。[#40810](https://github.com/apache/doris/pull/40810) 
- 修复了透明改写分区补偿可能导致结果错误的问题。[#40803](https://github.com/apache/doris/pull/40803) 
- 修复了透明改写在外表不生效的问题。[#38909](https://github.com/apache/doris/pull/38909) 
- 修复了嵌套物化视图可能不能正常刷新的问题。[#40433](https://github.com/apache/doris/pull/40433) 

### 同步物化视图

- 修复了在 MOW 表上创建同步物化视图可能导致查询结果错误的问题。[#39171](https://github.com/apache/doris/pull/39171) 

### 查询优化器

- 修复了升级后原有同步物化视图可能不可用的问题。[#41283](https://github.com/apache/doris/pull/41283) 
- 修复了 DATETIME 字面量比较时，没有正确处理毫秒的问题。[#40121](https://github.com/apache/doris/pull/40121) 
- 修复了条件函数分区裁剪可能错误的问题。[#39298](https://github.com/apache/doris/pull/39298) 
- 修复了存在同步物化视图的 MOW 表无法执行 Delete 的问题。[#39578](https://github.com/apache/doris/pull/39578) 
- 修复了 JDBC 外表查询谓词中的 Slot 的 Nullable 可能规划不正确，导致查询报错的问题。[#41014](https://github.com/apache/doris/pull/41014) 

### 查询执行

- 修复了 Runtime Filter 在使用过程中导致的内存泄露问题。[#39155](https://github.com/apache/doris/pull/39155) 
- 修复了 Window Function 在使用内存特别多的问题。[#39581](https://github.com/apache/doris/pull/39581) 
- 修复了一系列滚动升级期间函数兼容性的问题。[#41023](https://github.com/apache/doris/pull/41023) [#40438](https://github.com/apache/doris/pull/40438) [#39648](https://github.com/apache/doris/pull/39648) 
- 修复了`encryption_function` 在常量时结果错误的问题。[#40201](https://github.com/apache/doris/pull/40201) 
- 修复了单表物化视图导入时报错的问题。[#39061](https://github.com/apache/doris/pull/39061) 
- 修复了窗口函数分区结果计算错误的问题。[#39100](https://github.com/apache/doris/pull/39100) [#40761](https://github.com/apache/doris/pull/40761) 
- 修复了 TOPN 计算在有 Null 值时计算错误的问题。[#39497](https://github.com/apache/doris/pull/39497) 
- 修复了 `map_agg` 函数计算结果错误的问题。[#39743](https://github.com/apache/doris/pull/39743) 
- 修复了 Cancel 返回的消息错误的问题。[#38982](https://github.com/apache/doris/pull/38982) 
- 修复了 Encrypt 和 Decrypt 函数导致 BE Core 的问题。[#40726](https://github.com/apache/doris/pull/40726) 
- 修复了在高并发场景下，过多的 Scanner 导致查询卡住的问题。[#40495](https://github.com/apache/doris/pull/40495) 
- Runtime Filter 中支持 TIME 类型。[#38258](https://github.com/apache/doris/pull/38258) 
- 修复了 Window Funnel 函数结果错误的问题。[#40960](https://github.com/apache/doris/pull/40960) 

### 半结构化数据管理

- 修复了没有索引时 Match 函数报错的问题。[#38989](https://github.com/apache/doris/pull/38989) 
- 修复了 ARRAY 数据类型作为 `array_min`/`array_max` 函数参数时 Crash 的问题。[#39492](https://github.com/apache/doris/pull/39492) 
- 修复了 `array_enumerate_uniq` 函数 Nullable 的问题。[#38384](https://github.com/apache/doris/pull/38384) 
- 修复了添加或删除列时 BloomFilter 索引没有更新的问题。[#38431](https://github.com/apache/doris/pull/38431) 
- 修复了 ES-Catalog 解析异常 Array 数据的问题。[#39104](https://github.com/apache/doris/pull/39104) 
- 修复了 ES-Catalog 不合理条件下推的问题。[#40111](https://github.com/apache/doris/pull/40111) 
- 修复了 `map()`/ `struct()` 函数修改了输入数据导致异常的问题。[#39699](https://github.com/apache/doris/pull/39699) 
- 修复了特殊情况下索引 Compaction Crash 的问题。[#40294](https://github.com/apache/doris/pull/40294) 
- 修复了 ARRAY 类型倒排索引缺少 Nullbitmap 的问题。[#38907](https://github.com/apache/doris/pull/38907) 
- 修复了倒排索引 `count()` 结果的问题。[#41152](https://github.com/apache/doris/pull/41152) 
- 修复了 `explode_map` 使用别名时结果正确性问题。[#39757](https://github.com/apache/doris/pull/39757) 
- 修复了 VARIANT 类型中异常 JSON 数据无法使用行存的问题。[#39394](https://github.com/apache/doris/pull/39394) 
- 修复了 VARIANT 类型中返回 ARRAY 结果时内存泄漏的问题。[#41358](https://github.com/apache/doris/pull/41358) 
- 修复了 VARIANT 类型修改列名的问题。[#40320](https://github.com/apache/doris/pull/40320) 
- 修复了 VARIANT 类型转成 DECIMAL 类型可能丢失精度的问题。[#39650](https://github.com/apache/doris/pull/39650) 
- 修复了 VARIANT 类型 Nullable 处理问题。[#39732](https://github.com/apache/doris/pull/39732) 
- 修复了 VARIANT 类型稀疏列读取问题。[#40295](https://github.com/apache/doris/pull/40295) 

### 其他

- 修复了新旧 Audit Log Plugin 兼容性问题。[#41401](https://github.com/apache/doris/pull/41401) 
- 修复了某些情况下用户能看到他人进程的问题。[#39747](https://github.com/apache/doris/pull/39747) 
- 修复了有权限的用户也不能导出的问题。[#38365](https://github.com/apache/doris/pull/38365) 
- 修复了 CREATE TABLE LIKE 需要已有表的 CREATE 权限的问题。[#37879](https://github.com/apache/doris/pull/37879) 
- 修复了一些功能没有校验权限的问题。[#39726](https://github.com/apache/doris/pull/39726) 
- 修复了使用 SSL 连接时未正确关闭连接的问题。[#38587](https://github.com/apache/doris/pull/38587) 
- 修复了部分情况下执行 ALTER VIEW 操作导致 FE 无法启动的问题。[#40872](https://github.com/apache/doris/pull/40872) 

