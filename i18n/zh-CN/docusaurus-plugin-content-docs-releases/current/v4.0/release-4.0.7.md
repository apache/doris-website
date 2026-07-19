---
{
    "title": "Release 4.0.7",
    "language": "zh-CN",
    "description": "Apache Doris 4.0.7 版本发布说明：这是 4.0 系列维护版本，聚焦查询正确性、导入稳定性、存算分离部署、File Cache 可靠性、对象存储访问、可观测性以及外部数据源兼容性。"
}
---

# 版本概述

Apache Doris 4.0.7 是 4.0 系列的维护版本，聚焦查询正确性、导入稳定性、存算分离部署、File Cache 可靠性以及外部数据源兼容性。建议所有 4.0.x 用户升级。

本次发布的重点包括：

- **云模式增强**：新增表级事件驱动 Cache Warmup，默认开启 Packed File 与空 Rowset 优化，并修复多项 Recycler、Schema Change、Compaction 与 File Cache 问题。
- **对象存储改进**：支持 S3 Storage Vault 在不指定 Role ARN 的情况下使用凭证提供器，并允许确定性 S3 路径在无 `ListBucket` 权限时访问。
- **可观测性增强**：新增 FE 连接数限制指标、按作业粒度的 Routine Load 指标、File Cache 队列指标，以及 MTMV 刷新任务使用的 Compute Group 信息。
- **大量正确性与稳定性修复**：覆盖 TopN、Join、物化视图改写、Stream Load、Routine Load、外部 Catalog、File Cache 崩溃与内存使用等问题。

> 升级前，请先阅读下方 **行为变更**。

# 行为变更

- `INSERT OVERWRITE` 现在会永久删除被替换的分区，而不是将其放入回收站。这可以降低回收站压力，但这些分区无法再从回收站恢复 (#62510)。
- 云模式默认开启 `enable_packed_file` 与 `skip_writing_empty_rowset_metadata` (#63475)。
- BE `/api/file_cache?op=clear` API 不再支持同步清理。携带 `sync=true` 的请求现在会异步执行并返回 warning (#64321)。
- 对象存储客户端不再在 SDK 重试策略中重试 S3 `SlowDown` 或 Azure HTTP 429 响应，避免在上层处理生效前引入额外延迟 (#63776)。
- `COM_RESET_CONNECTION` 现在会按照 MySQL 语义一致地重置连接级状态 (#63884)。
- 云模式下，`SHOW PARTITIONS` 现在会将 `StorageMedium` 显示为 `OBJECT_STORAGE`，并将 `ReplicaAllocation` 显示为 `NULL` (#60871)。

# 新功能与改进

## 存算分离

- 事件驱动 Cache Warmup 支持通过 `ON TABLES` 进行表级过滤 (#63832)。
- 新增动态 Recycler 实例过滤配置 (#63822)。
- 按查询缓存 Compute Group ID，并移除 Backend 选择热点路径上的冗余锁 (#63636)。
- 跳过异步 Rowset Warmup 等待，降低写入延迟 (#63877)。

## 对象存储与外部数据源

- 支持 S3 Storage Vault 在不指定 Role ARN 的情况下使用凭证提供器 (#64766)。
- 对确定性 S3 路径使用 HEAD 请求，使其仅依赖 `s3:GetObject` 权限即可访问，不再需要 `s3:ListBucket` (#60414)。
- 在估算表行数时填充 Hive 元数据缓存，避免规划阶段重复访问 HMS (#63470)。

## 可观测性与运维

- 新增 `doris_fe_connection_max` 与按用户维度的 `doris_fe_user_connection_max` 指标 (#64742)。
- 新增按作业粒度的 Routine Load 指标，并更及时地刷新 Routine Load lag (#63576, #63654)。
- SQL Block Rules 支持分区过滤条件 (#62196)。
- 展示 MTMV 刷新任务使用的 Compute Group (#63206)。
- Nereids 物理计划中包含 scan node ID (#62509)。
- Audit Log 记录单查询 `SET_VAR` Hint 设置的 session variables (#64569)。
- 改进 Audit Log 中 `CREATE USER` 与 `ALTER USER` 语句的密码脱敏 (#62141)。
- 支持 LDAP 默认角色 (#63411)。

## 内存与性能

- 在 cgroup 环境中将可回收的 `inactive_file` page cache 视为可用内存，减少不必要的查询取消 (#64347)。
- 新增 BE 级 Tablet Schema 缓存用于导入场景 (#64581)。
- 降低 Row Store MemTable flush 的内存使用 (#63342)。
- 截断 Segment key bounds 时不再保留完整底层 buffer (#63469)。
- 聚合非 MOW Segment key bounds，降低元数据大小 (#64305)。
- Packed File writer flush 后立即释放 buffer (#63967)。
- 使用 Segment footer 中的 `raw_data_bytes` 改进首次 Compaction batch size 估算 (#62263)。
- 限制 File Cache LRU replay 队列大小，并新增队列积压指标 (#64381)。

# 重要问题修复

## 查询结果正确性

- 修复 Set Operation 改写错误：错误地使用 CTE producer 输出替代常规 child 输出 (#64908)。
- 移除不安全的 TopN 到 Max 改写，避免产生错误结果 (#63519)。
- 修复带外层 `OFFSET` 的嵌套 TopN 合并时行数错误的问题 (#64306)。
- 合并排序键存在前缀关系的 TopN 时保留确定性排序 (#64685)。
- 修复 TopN Runtime Filter 生效问题 (#63969)。
- 对相关标量子查询中的 TopN 表达式进行拒绝，而不是生成非法计划 (#64251)。
- 修复窗口函数与标量子查询场景下聚合 `ORDER BY` 表达式下推问题 (#64787)。
- 修复 Cast Project 下推穿过 `UNION DISTINCT` 可能改变去重语义的问题 (#64080)。
- 修复子查询中 Null-Aware 谓词被错误消除的问题 (#64639)。
- 修复 Join 分支间 pre-aggregation context 泄漏的问题 (#63357)。
- 修复 Outer Join 的 Runtime Filter 处理问题 (#64157)。
- 对齐 Legacy Planner 与 Nereids 的字面量比较语义 (#63481)。
- 修复 FE Master 切换期间查询结果包缺失、客户端可能等待至超时的问题 (#62721)。
- 修复多跳 Outer Join 与 null-reject 补偿场景下的 MTMV 改写问题 (#62492, #63268)。
- 修复处理 MTMV 刷新触发器时被排除触发表发生变更的问题 (#62984)。
- 修复底层外部表 Schema 变化后 View 查询失败的问题 (#64007)。

## 函数与类型

- 修复 `convert_tz` 在夏令时切换期间的常量折叠与分区裁剪问题 (#63853, #64029)。
- 保留负数且不足一小时的 TIMESTAMPTZ 偏移符号 (#62823)。
- 修复 `datediff` 对 zero date 的常量折叠问题 (#64084)。
- 修复 `json_contains` 对候选数组重复元素返回 false 的问题 (#63301)。
- `array_first` 与 `array_last` 支持 Boolean Cast (#64847)。
- 校验 `array_sort` 接受的 Lambda 参数个数 (#64825)。
- 在分析阶段拒绝非法的多参数 `COUNT(DISTINCT ...)` Window Function (#64783)。
- 将 `retention()` 限制在支持的最多 32 个参数内，避免越界内存访问 (#64521)。
- 对 `COUNT(DISTINCT variant)` 返回清晰的不支持类型错误，而不是 BE 内部错误 (#63479)。
- 拒绝对没有倒排索引的列执行 Lucene 语法搜索 (#63857)。
- 在 `CREATE TABLE` 分析阶段拒绝非法 IPv4 默认值 (#62906)。
- 修复 `ISNULL` 表达式解析位置，将其放到 `primaryExpression` 下 (#63619)。

## 导入与事务

- 修复通过 `http_stream` 从压缩文件推断 Schema 时输入被截断的问题 (#64769)。
- 修复比较大 Backend ID 时整数溢出导致的 Stream Load 失败 (#63565)。
- 将 Tablet Writer close 轮询替换为事件唤醒，减少等待与调度开销 (#64221)。
- 修复 Stream Load 重定向时未消费请求体可能导致 Broken Pipe 的问题 (#64303)。
- 修复 Auto Partition 表的 `load_to_single_tablet` 路由问题 (#64356)。
- 修复 `COPY INTO ... SELECT` 无法绑定文件列占位符的问题 (#64395)。
- 保持共享 Delta Writer 状态与原始 sink 所属 Runtime State 独立 (#64349)。
- 修复 `enable_insert_strict` 错误改变 `enable_strict_cast` 语义的问题 (#63794)。
- 将 `INSERT OVERWRITE` 分区路由延后到 incremental open 阶段 (#63209)。
- 从当前 Compute Group 中选择事务 INSERT Backend (#63634)。
- 避免 Delete Push 任务失败导致 quorum 卡住 (#61647)。
- 修复 Auto Partition 创建期间并发删除分区导致的 NPE (#65357)。
- Auto Partition 创建新分区时保持导入行数指标单调递增 (#64109)。
- 修复 force-finished Publish 任务中的 NPE (#63069)。

## Routine Load

- 当任务提交失败时，串行化 Routine Load 任务续期 (#64731)。
- 改进 Kafka `read_committed` 零行诊断，并对零行 batch 延迟重试 (#63664, #64046)。

## 存算分离

- 重试 Cloud Schema Change V1 前刷新 base Tablet，避免 stale version 导致反复 Compaction 冲突 (#64312)。
- 修复同一 Tablet 上 Empty Cumulative Compaction 与 Base/Cumulative Compaction 的竞争问题 (#64619)。
- 修复 File Cache miss 后读取 Packed Inverted Index 文件的问题 (#64383)。
- 在 `commit_rowset` 时校验 Recycle Rowset key 状态，保证幂等性并避免非法提交 (#63985)。
- 空 Rowset 回收不再要求 Resource ID (#64630)。
- 防止部分回收失败后 Tablet KV 元数据泄漏 (#63377)。
- 对 pending one-shot Cache Warmup 作业去重 (#62384)。
- 修复 FE 重启与 replay 后 Azure resource 持久化问题 (#65052)。
- 避免云模式下 Tablet 诊断误报 (#60805)。

## File Cache 与存储

- 修复扫描 Backend Tablet Rowset map 时的竞争问题 (#65288)。
- 在异步 IO worker 线程上初始化 Thread Context (#64846)。
- 修复部分 File Cache 命中后的 fallback 读取错误，并将 LRU 更新移出查询读取路径 (#61083)。
- 修复延迟 File Cache holder 引用已删除 cache cell 导致的崩溃 (#62437)。
- 修复 finalized scan 找不到本地 File Cache writer 导致的崩溃 (#62389)。
- 修复 BE 重启后立即清理缓存时 File Cache 百分比溢出的问题 (#63410)。
- 确保内部同步 File Cache 删除安全执行 (#64578)。
- 修复 `NewOlapScanner` 中 File Cache 指标重复累加的问题 (#61072)。
- File Cache 命中率指标排除 Cache Warmup 读取 (#63394)。
- 修复 finalized Pipeline task 被再次提交并导致 BE 崩溃的问题 (#64946)。

## 湖仓与外部数据源

- 修复 Iceberg `COUNT(*)` 下推在 snapshot summary counter 缺失时报 NPE 的问题 (#64648)。
- 修复 Iceberg `varint` 类型映射不支持的问题 (#64331)。
- 修复迁移后的 Iceberg 表格式检测问题 (#64134)。
- 修复前一个 Row Group 使用 Dictionary Filtering 时 Parquet Reader 失败或 BE 崩溃的问题 (#63168)。
- 规范化外部 Catalog 中的 HDFS 默认路径与 OSS bucket endpoint 路径 (#63476, #64943)。
- SQL Server 与 Oracle Boolean 谓词下推时使用 `1` 和 `0`，而不是不支持的 `TRUE` 和 `FALSE` 字面量 (#64760)。
- 在 MySQL JDBC Catalog 中正确识别 Doris 兼容目标 (#64389)。
- 修复 MaxCompute Scanner 内存泄漏并改进大字段写入 (#61245)。

## 元数据、协议与可观测性

- 修复远程 Arrow Flight SQL 结果接收器初始化问题 (#63136)。
- 修复 `SHOW PROCESSLIST FULL` 返回异常结果的问题 (#64631)。
- 修复 `SHOW VARIABLES` 中持久化变量的输出问题 (#63734)。
- MySQL 兼容模式匹配支持 `$` (#64259)。
- 导出 Prometheus 指标时保留 Histogram metric labels (#63485)。
- Follower FE 同步统计信息时跳过已删除列 (#63882)。

> 本说明聚焦用户与运维可感知的变更。测试提交、CI 调整、发布版本号更新以及无外部现象的纯内部变更已省略。完整提交历史请参考 4.0.6-rc02 到 4.0.7-rc02 的完整对比。

# 致谢

感谢本次发布中包含其 Pull Request 的所有贡献者：

@924060929 @airborne12 @BiteTheDDDDt @bobhan1 @CalvinKirs @csun5285 @dataroaring @deardeng @eldenmoon @englefly @feiniaofeiafei @felixwluo @foxtail463 @freemandealer @Gabriel39 @gavinchou @Hastyshell @HonestManXin @iaorekhov-1980 @jacktengg @Jungzhang @liaoxin01 @liutang123 @morningman @morrySnow @mrhhsg @Mryange @raghav-reglobe @seawinde @sollhui @starocean999 @suxiaogang223 @wyxxxcat @yiguolei @yoock @yujun777 @Yukang-Lian @zclllyybb @zhangrq5 @zhangstar333 @zhaorongsheng
