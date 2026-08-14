---
{
    "title": "Release 4.0.8",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.8 版本发布说明：这是 4.0 系列维护版本，聚焦存算分离部署、导入与事务稳定性、File Cache 行为、内部接口安全加固以及湖仓兼容性。"
}
---

# 版本概述

Apache Doris 4.0.8 是 4.0 系列的维护版本，聚焦存算分离部署、导入与事务稳定性、File Cache 行为、内部接口安全加固以及湖仓兼容性。建议所有 4.0.x 用户升级。

本次发布的重点包括：

- **安全加固**：为 BE `_stream_load_forward` 接口增加鉴权与配置开关，为 FE meta-service HTTP 调用增加内部鉴权 Token，为 manager REST API 增加鉴权校验，并对 Kafka Routine Load 凭证进行脱敏。
- **云模式增强**：Colocate Tablet 分布使用 rendezvous hashing，通过快照读取表版本避免事务冲突，Tablet header 锁改为 bthread 友好实现，并新增仅将索引内容写入 File Cache 的模式。
- **升级行为**：从 3.x 升级的集群现在会启用 Nereids distribute planner，而不是静默保留 legacy planner。
- **大量正确性与稳定性修复**：覆盖 Group Commit、事务、Routine Load、Paimon 与 Iceberg 读取、File Cache、内存统计，以及多处 BE 崩溃与死锁路径。

> 升级前，请先阅读下方 **行为变更**。

# 行为变更

- 升级到 4.0 现在会启用 Nereids distribute planner。此前 variable version 低于 400 的集群会从 image 中恢复持久化的 `enable_nereids_distribute_planner=false`，升级后继续使用 legacy distribute planner；variable version 400 的迁移逻辑现在会将其启用 (#66604)。
- 默认不再在高内存时暂停 Compaction。暂停会使高 Compaction Score 的 Tablet 更难合并，反而加剧了它本应缓解的元数据与内存积压 (#61288)。
- BE `_stream_load_forward` 接口现在仅在新增 BE 配置 `enable_group_commit_streamload_be_forward` 开启时才会注册（默认 `false`），并且需要鉴权。依赖 Group Commit Stream Load 转发的部署需要在 FE 与 BE 上同时开启该配置 (#64935)。
- `autobucket_min_buckets` 默认值由 1 改为 3，避免 auto bucket 策略计算出过小的分桶数，导致并行度与数据分布不合理 (#63729)。
- Recycler 默认不再开启 `enable_mark_delete_rowset_before_recycle` 与 `enable_abort_txn_and_job_for_delete_rowset_before_recycle`，因为该功能目前存在性能开销 (#66150)。
- S3 `SlowDown` 重试处理重新支持配置，并按角色区分：BE 客户端继续开启限流重试，Recycler 则关闭，进一步细化了 4.0.7 中的改动 (#65508)。
- 移除未使用的 session variable `plan_nereids_dump`。该变量仅用于 minidump replay，现在改为由 `MinidumpUtils` 设置的内部标记，`PLAY '<dumpfile>'` 仍可正常工作 (#66371)。
- 云模式下，Tablet 数据大小统一按 remote size 上报，`SHOW TABLETS` 与 `information_schema.partitions` 不再与 `information_schema.backend_tablets` 不一致 (#60887)。
- 云模式下，`SHOW PROC '/colocation_group/{GroupId}'` 现在将 `ReplicaAllocation` 显示为 `NULL`，`SHOW PROC '/cluster_health/tablet_health'` 也不再因本地模式健康检查而报告 `UNRECOVERABLE` (#60944)。

# 新功能与改进

## 存算分离

- 通过新增 BE 配置 `enable_file_cache_write_index_file_only`（默认 `false`）支持仅将索引内容写入 File Cache。开启后 Rowset 写入与 Compaction 输出会保护倒排索引文件以及 Segment 索引与 footer 区间，避免大量数据页污染容量有限的本地缓存 (#64995)。
- Colocate Tablet 分布使用 rendezvous hashing (#64638)。
- 新增在 TopN 延迟物化期间跳过 File Cache 写入的选项 (#65021)。
- `commit_txn`、`commit_partition`、`commit_index` 与 `drop_partition` 中的表版本 hint 改用快照读取，消除了导致同一张表并发提交报 `KV_TXN_CONFLICT` 的读冲突区间 (#64647)。
- 将 get-version 超时时间提升到 30 秒 (#65625)。
- `start.sh` 支持多个配置文件 (#63924)。
- 新增用于同步与导出 Cloud FE 元数据的 HTTP API，支持跨 FE 与 FDB 的元数据备份 (#60739)。

## 安全与权限

- 新增 `fe_meta_auth_token`，用于 FE meta-service 内部 HTTP 鉴权 (#65551)。
- 为 manager node 与 query-error REST API 增加鉴权校验 (#65042)。
- 对 Routine Load 作业的敏感 Kafka 属性进行脱敏 (#64786)。
- 在 `INSERT OVERWRITE` 的所有退出路径上重置 `skipAuth` (#66383)。

## 可观测性与运维

- 展示 Routine Load 作业的首个错误信息 (#65553)。
- 定时任务执行失败时记录任务结束时间 (#66232)。
- 新增虚拟 Compute Group 切换指标 (#63036)。
- 新增 delete bitmap 任务的排队时间 (#65248)。
- Warmup 时间戳展示中包含日期 (#64606)。
- Iceberg 元数据提交失败时报告根因，而不是误导性的 `Self-suppression not permitted` 信息 (#66417)。
- 不再将数据与表达式错误包装为误导性的 "storage reader" 信息 (#64755)。
- 升级第三方依赖 (#62858, #64196, #64208)。

## 性能

- 优化大表场景下 `information_schema.tables` 的状态扫描：BE 现在会将所需列传递给 FE，轻量查询不再为 Tablet 相关的状态字段付出额外代价 (#64933)。
- 下推可展开的 S3 glob 前缀 (#64684)。
- 加速 BE 启动期间的 File Cache LRU 恢复流程 (#65174)。
- 为 Glue Catalog 在 `ConfigurationAWSCredentialsProvider` 中缓存凭证提供器 (#65165)。
- 复用同一个 Ranger Doris access controller，避免元数据 checkpoint 泄漏两个 `PolicyRefresher` 线程 (#65570)。

# 重要问题修复

## 查询结果正确性

- `SimplifyAggGroupBy` 改写 `GROUP BY` 表达式前先校验单射性 (#64335)。
- 在 `PullUpJoinFromUnionAll` 中拒绝不匹配的 compare plan (#65472)。
- 在过滤与 TopN 下推规则中对 `UniqueFunction` 做保护 (#62742)。
- 要求 Partition TopN 优化选择的窗口函数分区键是 co-located 键的子集 (#64764)。
- 修复读取历史 decimal 数据时精度与 scale 缺失的问题 (#65419)。
- 修正 `from_base64` 与 `to_base64` 的输出缓冲区大小计算与非法输入处理 (#65141)。

## 导入与事务

- 修复预处理语句复用执行计划且 Group Commit 共用同一个 `load_id` 时丢行的问题 (#64362)。
- 避免中止携带相同 label 的更新事务 (#64939)。
- INSERT 期间 Backend 重启时快速失败 (#65525)。
- 处理 delete partial update 中的 generated column (#64884)。
- 修复列名为大写时的 Arrow Stream Load (#65127)。
- FE Stream Load 路由与规划支持 Compute Group (#65571)。
- 分配导入任务时跳过正在下线的 Backend (#65049)。
- 仅允许导入源 scanner 更新导入计数器 (#63781)。
- 隔离流式作业中 CDC snapshot split 的 Schema (#65645)。

## 存算分离

- 云模式副本路由、Routine Load 分配与 Kafka proxy 选择均排除正在下线的 Backend (#65221)。
- 避免 urgent load 抢占 Schema Change 锁 (#66082)。
- Tablet header 锁改用 bthread 友好的 shared mutex。写锁可能跨越会挂起的 warmup 调用，迁移后的 bthread 会在另一个 worker 线程上解锁 `pthread_rwlock_t` (#64574)。
- 重试因 -230 失败的查询时，临时将 `version_cache_ttl` 置为 0 (#63721)。
- `CloudUpgradeMgr` 等待期间检查并中止失败的冲突事务 (#60830)。
- 回收空 Rowset 时保留 Resource ID (#65862)。
- 回收 Rowset 时跳过 packed slice 删除 (#63295)。
- 为 Recycler S3 client 设置 `requestTimeoutMs`，避免 `DeleteObjects` 调用较慢时出现 curl-28 错误 (#64758)。
- 云模式下 S3 限流器配置支持动态生效 (#64554)。
- Compute Group 被删除时取消其重建的虚拟 Compute Group Warmup 作业 (#65426)。
- 重试成功后清除 Warmup 错误信息 (#64813)。
- 修复 colocate 副本分布的 edit log (#65457)。
- 解决默认副本属性冲突问题：该问题可能在表元数据中残留过期的 `default.replication_num`，导致 `SHOW CREATE TABLE` 展示错误的默认副本分布 (#65836)。
- 修复 FE 响应不完整导致的 `SchemaVariablesScanner` 崩溃 (#65994)。

## File Cache 与存储

- 修复 File Cache 队列 evict size 指标 (#64897)。
- 限制 LRU recorder shadow 队列大小 (#64798)。
- 处理 S3 file writer 中的异步任务提交失败 (#64779)。

## 湖仓与外部数据源

- 在 split 之间保留 Paimon 分区元数据。此前仅在开启运行时分区裁剪时才生成分区元数据，导致 count、native 与 JNI split 到达 BE 时缺少稳定的分区值，且复用的裁剪 block 会被插入的替换列破坏 (#65583)。
- Iceberg 扫描使用 split 中的文件格式 (#65760)。
- 保留 Iceberg 与 Paimon 外部表列名的大小写 (#65094)。
- Paimon JNI 读取支持 IOManager，并新增 Paimon JNI scanner 可观测性 (#65332, #65354)。
- 校验 task executor 的 scan handle (#65054)。
- 修复 Avro JNI reader 空指针崩溃 (#64699)。

## 内存与稳定性

- 避免本地 Runtime Filter merge 死锁 (#64866)。
- 捕获 block 序列化异常，避免 BE core dump (#64852)。
- 将 brpc 次要 package alias 改为非持有语义，避免 `brpc::Server` 关闭时二次释放 (#65777)。
- 关闭 brpc 中的 SSL BIO buffer (#64962)。
- Workload Group 内存限制变更时强制刷新其配置 (#65542)。
- 用户直接修改 cgroup 限制时更快地更新内存统计 (#65695)。

## 协议与可观测性

- 修复 Arrow Flight SQL 的 FE 内存问题：在 `createPreparedStatement` 中关闭临时 `VectorSchemaRoot` (#65311)、修复剩余的堆外内存泄漏 (#66437)，并在外部表扫描时让 coordinator 在 `GetFlightInfo` 与 `DoGet` 之间保持存活 (#64799)。
- `information_schema.routine_load_jobs` 由 Master FE 提供数据，查询落到非 Master FE 时 `FIRST_ERROR_MSG` 与 `ERROR_LOG_URLS` 不再为空 (#65942)。
- 访问执行 Profile 时使用 profile manager 读锁保护 (#65353)。
- 修复时分复用执行器上报的排队任务数 (#63568)。
- 修复 node action REST API 因 `PathVariable` 注解未声明 value 而抛出的 `-parameters` 错误 (#59708)。

> 本说明聚焦用户与运维可感知的变更。测试提交、CI 调整、外部 Docker 环境相关工作、发布版本号更新以及无外部现象的纯内部变更已省略。完整提交历史请参考 4.0.7 到 4.0.8-rc02 的完整对比。

# 致谢

感谢本次发布中包含其 Pull Request 的所有贡献者：

@0AyanamiRei @924060929 @BiteTheDDDDt @bobhan1 @CalvinKirs @deardeng @freemandealer @Gabriel39 @gavinchou @GJ100 @heguanhui @hello-stephen @hubgeter @jacktengg @JNSimba @Jungzhang @liaoxin01 @luwei16 @morningman @Mryange @mymeiyi @shuke987 @sollhui @stevenpall @suxiaogang223 @w41ter @wyxxxcat @xylaaaaa @yiguolei @yujun777 @zgxme @zhangstar333
