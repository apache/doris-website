---
{
    "title": "Release 4.0.6",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.6 版本发布说明：存算分离支持 Compaction 读写分离与调度、内存优化，新增 Compaction 任务跟踪、数据血缘 SPI、enable_recycler 动态开关等运维能力，并修复大量查询正确性、导入数据丢失、崩溃、挂起与资源泄漏问题。包含多项默认值与权限相关的行为变更，升级前请务必阅读。"
}
---

# 版本概述

Apache Doris 4.0.6 是 4.0 系列的维护版本，聚焦稳定性与运维体验，建议所有 4.0.x 用户升级，其中存算分离（云）模式用户的收益尤为明显。

本次发布的重点包括：

- **存算分离增强**：支持 Compaction 读写分离，优化 Tablet 调度与 FE 侧内存占用，并减少对 Meta Service 的 RPC 压力。
- **运维可观测性**：新增 Compaction 任务跟踪（System Table + HTTP API）、`enable_recycler` 动态开关、memtable flush 线程池在线调整，以及多项 brpc / bvar 指标。
- **数据血缘**：引入 Lineage SPI 采集框架。
- **大量正确性与稳定性修复**：覆盖查询结果错误、导入数据丢失（如 Broker Load 仅加载首个文件、PostgreSQL DML 被静默丢弃）、崩溃、挂起与资源泄漏。

> 升级前，请先阅读下方 **行为变更**，其中包含若干默认值与权限的调整。

# 行为变更

- **存算分离（云）模式下 `enable_strict_consistency_dml` 默认关闭** (#61891)。如业务依赖严格一致性 DML，请在升级后显式开启该配置。
- **Time Series Compaction 触发阈值默认值由 2000 调整为 1000** (#61979)，Compaction 触发更为积极。
- **`segments_key_bounds_truncation_threshold` 默认值调整为 36** (#61984)。
- **Cluster Snapshot 相关命令现要求 root 权限** (#60239)。
- **不再允许将 JSONB、Variant 列作为分布列（Distribution Column）** (#63211)；此前的错误用法在建表时将被拒绝。

# 新功能与改进

## 函数与类型

- 新增 `mmhash3_u64_v2` 哈希函数 (#61846)。
- 新增 `json_object_flatten` 标量函数，用于将嵌套 JSON 展平 (#62825)。
- `array_sort` 新增 Lambda 表达式（functor）版本，支持自定义排序逻辑 (#57828)。
- 聚合函数 `max` / `min` 支持 Array 类型，`max_by` / `min_by` 支持部分复杂类型 (#58490, #58736)。

## 查询优化

- 限制 not-null 推导的成本，降低优化器在复杂查询下的规划开销 (#63318)。
- 分区裁剪后按比例缩放列统计的 `num_nulls`，提升行数估算准确性 (#62265)。

## 存储与 Compaction

- 新增 **Compaction 任务跟踪能力**：可通过 System Table 与 HTTP API 查询当前 Compaction 任务 (#61696)。
- 支持在线动态调整 memtable flush 线程池大小，无需重启 BE (#60423)。
- 支持自适应 Write Buffer 大小 (#61810)。
- 更早释放未使用内存，降低导入与写入过程中的内存占用 (#62185)。

## 存算分离（云模式）

- **支持 Compaction 读写分离** (#60310)。
- 优先调度最近活跃的 Tablet，提升缓存命中与调度效率 (#59539, #57200, #61562)。
- 减少对 Meta Service 的 `get_tablet_stats` RPC 调用，降低元数据服务压力 (#60543)。
- 优化 CloudTabletStatMgr / CloudTabletRebalancer 的内存占用 (#59776, #61318)。
- 新增 `enable_recycler` 配置，可动态跳过 Recycler (#63286)。
- 支持 File Cache microbench 配置热加载 (#58922)。

## 湖仓一体

- Iceberg 支持 REST 与 S3 Tables 的 IAM Role 鉴权 (#60498)。
- Paimon 支持 Jindo OSS 及 Token 传播 (#62106)。
- 支持禁用 Iceberg REST Catalog 的 View 操作 (#63319)。

## 数据血缘

- 引入 Lineage SPI 框架，支持数据血缘采集 (#61004)。

## 可观测性与运维

- `start_fe.sh` 新增 `--drop_backends` 参数 (#63306)。
- 为 Sub Txn Load 新增事务写放大 brpc 指标 (#63545)。
- Recycler 为 Operation Log 新增 bvar 指标 (#60520)。
- 统计信息收集自动跳过超长字符串列，降低采集开销 (#62686)。
- 移除 JDK17 启动参数中的 class histogram trace，避免 Full GC 时打印大量日志 (#62422)。

## 安全与认证

- Stream Load 时在 BE Info 中隐藏 Token 与认证信息 (#60656, #59743)。
- 增强 LDAP 认证的健壮性与诊断能力 (#61673)。
- 升级存在安全漏洞的依赖 (#62274)。

# 重要问题修复

## 查询结果正确性

- 修复 `INTERSECT` / `EXCEPT` 在谓词上推时丢失 NULL 行的问题 (#62299)。
- 修复 `count(null)` 被错误当作 `count(*)` 的问题 (#62548)。
- 修复 `count` 中包含 `MATCH_ALL` 表达式时报 NoSuchElementException 的问题 (#62172)。
- 修复 IN 谓词化简时丢失 DateTimeV2 窄化 Cast，导致结果错误的问题 (#63343)。
- 修复 Key Range 场景下 `IN_LIST` Runtime Filter 谓词丢失的问题 (#62115)。
- 修复物化视图改写时合并了查询不需要的分区，可能导致结果或性能问题 (#63081)。
- 修复 `no_use_cbo_rule` Hint 被静默忽略的问题 (#62358)。
- 修复 FragmentMgr 误取消存算分离 Virtual Cluster 查询的问题 (#62135)。

## 视图（View）

- 修复指定 COMMENT 时 `ALTER VIEW` 定义未同步至 Follower FE 的问题 (#61670)。
- 修复 View 定义丢失 Variant 子字段导致查询结果错误的问题 (#62907)。
- 修复 Lazy Materialization 下 View 列丢失 colUniqueId 的问题 (#62533)。
- 修复 View 定义中非法 Alias 改写的问题 (#63353)。

## 函数与类型

- 修复 TIMESTAMPTZ 与夏令时（DST）相关的多处结果错误：LEAD/LAG 未保留类型、spring-forward 跳变处理、DST fold 分支选择、时间差改用 UTC 语义、TopN Runtime Predicate 支持 (#62779, #62945, #63034, #63161, #63220)。
- 修复 `allow_zero_date` 函数结果错误 (#61900)。
- 修复科学计数法字符串 Cast 为 Decimal 时结果错误的问题 (#63119)。
- 修复 `from_olap_string` 解析 datetime 失败时抛异常的问题，改为返回 NULL (#63035)。
- 修复用户变量整型推导与类型解析错误 (#62524)。

## Variant 类型

- 修复无 Key 表中 Variant 列 uid=0 时 Compaction 失败的问题 (#62656)。
- 修复行存（Row Store）部分列更新后 Variant 子列丢失的问题 (#62067)。
- 修复读取旧版本单段点路径（dot-key）子列时的归一化问题 (#62409)。
- 重复 Variant JSON Path 时保留第一个 (#63697)。
- 优化 VariantStatsCaculator 构造，跳过完整 footer 扫描以提升性能 (#62819)。

## 导入与流式处理

**数据丢失 / 完整性**

- 修复 Broker Load 指定多文件路径时仅加载首个文件的问题 (#62969)。
- 修复任务重启后 PostgreSQL DML 被静默丢弃的问题 (#61481)。
- 修复 FE Checkpoint 重启后 S3 Offset 与作业统计丢失的问题 (#62449)。
- 修复读取 FE 持久化 CDC Offset 时 Split 边界 Java 类型还原错误的问题 (#63219)。

**挂起 / 泄漏**

- 修复 VNodeChannel `close_wait` 挂起的问题 (#58024)。
- 修复暂停 / 恢复时取消流式任务导致 PostgreSQL Replication Slot 泄漏的问题 (#62010)。
- 修复 InsertLoadJob 任务卡在 PENDING 导致内存泄漏的问题 (#62890)。

**重启与元数据**

- 修复 FE 重启后流式作业属性未解析的问题 (#62298)。
- 修复 EditLog Replay 时 StreamingInsertJob NPE 的问题 (#62416)。
- 修复 Gson Replay 后未能正确重建 Broker Load 存储属性的问题 (#63094)。
- 修复 FE 重启后 `SHOW LOAD` 中 INSERT 作业统计丢失的问题 (#62331)。

**Routine Load / 解析**

- 修复 Routine Load Kafka Meta 请求 NPE (#63180)。
- 修复协调 BE 重启时 Routine Load 报 IllegalMonitorStateException 的问题 (#62892)。
- 修复带 UTF-8 BOM 的 CSV 使用 enclose 时列解析错误的问题 (#62092)。
- 修复 Group Commit 选择 Backend 时 NPE 与负载可用性问题 (#60652, #61555)。
- 修复 Broker Load / Routine Load 导入属性与表属性的冲突校验 (#58054)。
- 修复 HTTPS 模式下 `to_load_error_http_path` 返回 URL 错误的问题 (#61785)。

## 存储与 Compaction

- 修复 OlapScanner 相关 Schema Cache 并发问题导致的 BE 崩溃 (#61510, #62327)。
- 修复 IOContext Use-After-Free 崩溃 (#59947)。
- 修复读取缺失 precision / frac 的旧版 DecimalV2 Segment 的问题 (#63569)。
- 修复 Packed File 异步关闭轮询时阻塞的问题 (#62938)。
- 修复 ANN 向量索引构建时 OpenMP 并发预算问题 (#61313)。

## 存算分离（云模式）

- 修复 Schema Change 过程中的多处正确性问题：在 `add_rowsets` 前删除本地 Rowset、运行前填补 Version 空洞、Delete Bitmap Capture 前未归一化 Rowset 图，并新增 `SC_COMPACTION_CONFLICT` 错误码以重试跨 V1 Compaction 失败 (#62256, #63443, #63981, #62272)。
- 修复 Cache Warmup 的多处问题：不支持 Packed File、错误后未重试、取消 / 过期时 NPE 与缓存清理等 (#60375, #62886, #62805, #62839, #62941, #62931)。
- 修复 `balanced_tablets_shards` 内存泄漏与 Warmup inflight 计数问题 (#59093, #60480)。
- 修复排队删除任务过多导致 Recycler OOM 的问题 (#59331)。
- 修复首次动态分区初始化与 `CREATE MATERIALIZED VIEW` 并发时的竞争问题 (#62755)。
- 修复向客户端暴露 `KV_TXN_MAYBE_COMMITTED` 内部状态的问题 (#62244)。
- 修复云模式不打印 Meta Service 日志的问题 (#61766)。
- 修复 `SHOW PROC` 未显示分区 Cached Version 的问题 (#60807)。

## 湖仓与外部数据源

- 修复 FileScanner 中 Native 与 JNI Reader 混用时谓词过滤丢失的问题 (#61802)。
- 修复外部 Reader 中 Hive DATE 类型时区偏移的问题 (#61330)。
- 修复跨 JDBC Catalog 时 Query TVF 列别名丢失的问题 (#61939)。
- 修复外部 Catalog 的 `SHOW PARTITIONS` 与 partitions TVF 不兼容的问题 (#62134)。
- 修复 Iceberg / Paimon 表分区列生成时的越界崩溃 (#62177)。
- 修复 Parquet 读写的多处问题：int96 Timestamp 写入、Page V2 编码、条件判断 (#61832, #63779, #63305, #63509)。
- 修复为 Paimon Scanner 预加载 Jindo 的问题 (#62351)。
- 修复 TVF 因 Thrift 消息过大超限返回错误的问题 (#61788)。

## 文件缓存与 IO

- 修复清理缓存时后台 LRU 更新导致 SIGSEGV 崩溃的问题 (#60533)。
- 修复临时 TTL 过期时间错误锚定到 Tablet 创建时间的问题 (#62287)。
- 修复文件句柄缓存 Key 未包含 HDFS 连接，可能导致连接错配的问题 (#63516)。

## 元数据与作业系统

- 修复 `CANCEL ALTER` 传入空作业列表时被误判为取消全部 Rollup 作业的问题 (#62712)。
- 修复升级后 sessionVariables 空指针的问题 (#61959)。
- 修复 `RestoreCommand` 抛出 UnsupportedOperationException 的问题 (#61890)。
- 修复未开启 Binlog 时仍链接 Binlog 文件的问题 (#61949)。
- 修复重启后带 `retention_count` 的自动分区表未正确注册到调度器的问题 (#61954)。
- 修复 `metadata_failure_recovery` 模式启动 FE 时 Host 不匹配的问题 (#62748)。
- 修复未选择数据库时无法 `SHOW TABLET` 的问题 (#63280)。
- 修复 `SHOW BACKENDS` 字段顺序不一致的问题 (#62207)。
- 修复系统表返回 unknown 统计的问题 (#62913)。
- 修复 Audit Log 的相关问题：UnboundAlias digest 计算、将内部查询失败误标记为 ERR (#62160, #62997)。
- 修复 `start_fe.sh --console` 时未生成 fe.out 的问题 (#61807)。
- 修复 `INSERT OVERWRITE` 的错误提示信息 (#62555)。

## 安全与认证

- 修复结合 CTE 时 Ranger 列级权限被绕过的问题 (#61741)。
- 修复 Arrow Flight 客户端 IP 认证的问题 (#63506)。
- Stream Load 日志脱敏敏感 Header (#62108)。

## 稳定性与其他

- 修复共享 Hash 表下 Runtime Filter 导致 BE 崩溃的问题 (#63257)。
- 修复 arrow::Status 内联静态空消息导致 core 的问题 (#63191)。
- 修复 Arrow UTF8 / String 大小限制的问题 (#63137)。
- 修复 PartitionRebalancer 向缺少所需存储介质的 BE 生成非法迁移的问题 (#62206)。
- 修复 Jetty 12 下 `jetty_server_max_http_header_size` 未生效的问题 (#61197)。
- 修复关闭 Audit Log 时 Prepared Statement QPS 指标未统计的问题 (#61621)。
- 修复分区接近上限指标由 Counter 改为 Gauge 的问题 (#61845)。
- 修复加载 JNI log4j2 配置的问题 (#63063)。
- 通过 MemTrackerLimiter 跟踪 IO 层读缓冲，提升内存可观测性 (#62288)。

> 本说明聚焦用户与运维可感知的变更，已省略部分纯内部实现的重构与无外部现象的修复。完整提交记录请参考 GitHub 上 apache/doris 仓库 4.0.6 对应的 PR 列表。
