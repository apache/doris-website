---
{
    "title": "Release 4.1.4",
    "language": "zh-CN",
    "description": "Apache Doris 4.1.4 版本发布说明"
}
---

# 新功能

## AI 与搜索
- 支持在 Merge-on-Write 表上创建 ANN 索引 (#67155)
- 支持多模态文件 Embedding (#66461)

## 查询与执行
- 新增自适应的全局 Runtime Filter 树下发机制，以支持大规模集群 (#65599)
- 支持将 Limit 下推到 CTE Producer (#63675)
- 新增分区过滤条件的 SQL 拦截规则 (#62196)

## 导入与 Streaming Job
- 新增自适应随机分桶的导入路由 (#65450)
- 支持转发 Group Commit 的 Stream Load 请求 (#63594)
- Stream Load 支持 Compute Group 路由与规划 (#65571)
- 支持 OceanBase CDC Streaming Job (#65588)
- 支持从 Relation 事件中识别 PostgreSQL 的 Schema 变更 (#64850)
- Streaming Job 支持 MySQL 的 `ADD` 和 `DROP` Schema 变更 (#65325)

## 云原生
- FE 侧新增 MetaService RPC 限流 (#65694)
- 新增外部元数据缓存的内存治理 (#66717)
- 存算一体模式下支持 `SHOW COMPUTE GROUPS` (#66697)
- 支持通过 SQL 触发 Tablet 粒度的 Compaction (#66611)
- 新增 Resource Group 的成功 Quorum 校验 (#66751)

## 湖仓一体
- 支持修改 Iceberg 和 Paimon 表属性 (#66428)
- 支持阿里云 OSS Tables REST Catalog (#66823)

## 安全与认证
- Doris 内部通信支持 TLS (#64016)
- 新增 FE 与 MetaService 之间的内部 HTTP 认证 (#66090)

## 其他
- 审计日志新增 `queue_time_ms` 字段 (#66641)

# 改进

## 查询与执行
- 使用 AVX2 批量路径优化 MD5 计算 (#63484)
- 提升 percentile 聚合函数性能 (#62520)
- 优化 Hash Join 探测侧的输出性能 (#65600)
- 优化 Repeat 拆解时的 Shuffle Key 选择 (#66532)
- 对 Repeat Project 中的 grouping 标量函数去重 (#65880)
- 基于 NDV 统计信息推导集合运算的去重属性 (#64618)
- 避免低估 `NOT IN` 谓词的行数 (#66632)
- 在 Hash Join Profile 中增加 Instance ID (#66097)
- 新增落盘读取的反序列化耗时统计 (#67041)
- 让随机 Shuffle 优先选择本地通道 (#59431)

## 存储与压缩
- 为 File Cache 新增远程索引字节数指标 (#65398)
- 新增 Delete Bitmap 任务的排队耗时指标 (#65523)
- 加快启动时 File Cache LRU 的恢复速度 (#65174)
- 限制 File Cache LRU recorder 的影子队列大小 (#64798)
- 跳过非 TTL Tablet 的冗余 TTL 扫描 (#65434)
- 新增在 TopN 延迟物化过程中关闭 File Cache 写入的开关 (#66414)
- 远程扫描量达到阈值后关闭 File Cache 写入 (#66479)
- 优化 Serverless 模式下 cgroup 配置变更时的内存上限刷新 (#66463)
- Backport 可空列与 Project 相关的优化 (#66586)

## 导入与 Streaming Job
- 优化 CSV 与 Text 导入中可空字符串的反序列化 (#64476)
- 按表级 WAL 数量对异步 Group Commit 进行反压 (#65362)

## 云原生
- 新增 S3 限流的可观测性 (#64038)
- BE 侧新增预热任务数量指标 (#66136)
- 使用 Rendezvous Hashing 进行 Colocate Tablet 的分布 (#64638)
- 新增 MetaService 限流 dry-run 的可观测性 (#66969)
- 新增云上 Tablet 均衡器的相关指标 (#66576)
- 预分配全局云上 Tablet 路由集合的容量 (#66447)
- 计算 TopN Delete Bitmap 分数时跳过非 MoW Tablet (#65964)

## 湖仓一体
- 在 Hadoop S3A 适配层缓存凭证 Provider (#65165)
- 使用包含凭证信息的 Hadoop FileSystem 缓存 Key (#65586)
- 加速 Parquet 中定长二进制 Decimal 的解码 (#66379)
- 优化 Parquet 分片批次中可空列的选择规划 (#66397)

# 问题修复

## AI 与搜索
- 修复空查询的倒排索引谓词导致的崩溃 (#65138)
- 拆分跨多个 Segment 的倒排索引 Reader (#63138)
- 修复 CLucene 多 Segment 场景下的 `readBlock` 处理 (#66736)
- 拒绝包含内嵌 NUL 字节的倒排索引词项 (#67179)
- 关闭 Score 查询的 DSL 缓存 (#65436)
- 校验嵌套 Variant 上的 `MATCH` 谓词 (#66207)
- 修复索引被删除后的索引查找问题 (#66316)
- 追加嵌套 Variant 值时保持原子性 (#66421)
- 将可空的数组元素识别为 NestedGroup 类型 (#66196)
- 优先使用 Variant 的稀疏字段而非根值 (#65660)
- 无需重建根节点即可读取 shredded Variant 叶子节点 (#66941)
- 在 `explode` 过程中保留 NestedGroup 的访问路径 (#67022)
- ANN IVF 列表缓存缺失时避免递归 (#67024)

## 查询与执行
- 修复分析函数分区键在转换为 64 位列之前溢出的问题 (#65240)
- 并发销毁期间保护执行 Profile 的访问 (#65442)
- 修复 `PushDownAggThroughJoinOnPkFk` 产生重复 Join 节点的问题 (#65172)
- 在 Filter 和 TopN 下推规则中保护 `UniqueFunction` 的处理 (#62742)
- 输入均为 key 列且去重时，为多参数聚合开启预聚合 (#65846)
- 修复旧版 Decimal 数据缺失精度和小数位的问题 (#65419)
- 在 Block 合并前物化常量列 (#65770)
- 复杂类型使用序列化后的 Hash Key (#66777)
- 修复阻塞队列的等待者计数 (#65827)
- 修复 Eager Aggregation 中不安全的可空性转换 (#66208)
- 修复通过 Project 下推的重复聚合函数 (#66531)
- 下推的 CHAR 类型 `MIN` 和 `MAX` 保留 `NULL` (#65952)
- 修复下层 Join 为 Mark Join 时非法的 Semi Join 交换 (#66574)
- 丢弃 Join 外侧无效的函数依赖 (#65982)
- 阻止不安全的 CTE Runtime Filter 下推 (#65247)
- 在 Scan 函数依赖推导中屏蔽无效的唯一性约束 (#66801)
- 修复 TIMESTAMPTZ 可空类型的相等判断 (#66722)
- 修复 `COALESCE` 中的 TIMESTAMPTZ 取值 (#66689)
- 保留用户变量中的 TIMESTAMPTZ 类型 (#66833)
- 处理时间戳类型转换单调性中的夏令时回拨 (#65903)
- 支持范围分区边界中带空格的 TIMESTAMPTZ 时区偏移 (#66292)
- Arrow 和 Thrift 返回 DATETIME 时使用不带时区的时间戳 (#67027, #67232)
- 修正 Flight SQL `GetTables` 的 Schema 以及 TIMESTAMPTZ 的 Arrow Reader (#66344)
- 修复 `count_substrings` 尾部过度匹配的问题 (#63215)
- 避免函数中 ICU 默认 locale 的竞争 (#66440)
- 保持 multi-match 正则缓存的所有权有效 (#66909)
- 输出大小超过 `INT_MAX` 时避免 `explode_bitmap` 崩溃 (#66034)
- `NULL` 行跳过 CHAR 负载校验 (#67043)
- 恢复 NULL 字面量的返回类型处理 (#66280)
- 修复严格模式下字符串转换将 `NULL` 行附加到下一个值的问题 (#66952)
- 缓存前先物化常量虚拟列 (#67112)
- 处理自动分区函数参数的大小写不敏感问题 (#67121)
- 延迟按行号取数时保留嵌套路径 (#67205)
- 处理 TopN 中空的行号取数 RPC 失败 (#66443)
- 云上模式下按 Function ID 缓存 UDF class 并及时清理 (#67046)

## 存储与压缩
- FLOAT 和 DOUBLE 的 ZoneMap 保留最短往返表示 (#65302)
- 修复 Parquet 裁剪时浮点数的相等判断 (#66470)
- 修复稀疏场景下垂直 Compaction 的目标偏移量 (#66306)
- 拒绝在正在关闭的 Tablet 上 prepare 事务 (#66448)
- 查询结束时清理落盘目录 (#66458)
- 避免 Scan Executor 在关闭过程中的 use-after-free (#65220)
- 在 File Reader 和 Packed File 缓存上下文中显式传递 Tablet ID (#61683, #65701)
- 避免将 Segment Cache 的 Block 转换为 Index Cache 的 Block (#65905)
- 修复 Schema Change 作业失败后的 BE 内存泄漏 (#56207)
- 修复 `PublishVersionDaemon` 的线程池泄漏 (#60720)
- 保证可空列 Hash 状态更新的异常安全 (#66517)
- 同步导入错误日志的访问 (#66250)
- 修复 OLAP 分区被删除后缓存查找失败的问题 (#65889)
- HTTP 分块响应的 Reader 跳过 File Cache (#66932)

## 导入与 Streaming Job
- 导入 Writer 的详细信息遵循 Profile Level 设置 (#64978)
- 修复 Arrow Stream Load 大写列名的问题 (#65617)
- INSERT 过程中 BE 重启时快速失败 (#65525)
- 导入路由时跳过正在下线的 BE (#65406)
- 修正增量导入流的 Quorum 参与者 (#66016)
- 修复 Stream Receiver 与 `close_load` 竞争导致的泄漏 (#65584)
- 修复 Broker Load 挂起重试期间 Label 自冲突的问题 (#66469)
- 恢复事务已可见的 Broker Load 作业 (#66987)
- 中止 Broker Load 事务后清理事务 ID (#66884)
- CDC Stream Load 记录按 UTF-8 编码 (#66771)
- 避免非 GTID 保活重连时 MySQL CDC 丢数据 (#66998)
- 隔离 CDC 全量快照各分片之间的 Schema (#65645)
- 保持 CDC 结束位点与当前进度一致 (#65688)
- 规范化 Streaming Job 使用的 MySQL JDBC URL (#65647)
- 避免对 Stream Load 应用全局的 BE 认证前置校验 (#66629)
- Stream Load 的大小限制以 MiB 为单位上报 (#66224)
- 移除不支持的、会修改会话变量的 Workload Policy Action (#64856)

## 云原生
- 对 MetaService 返回的 `too busy` 进行重试 (#65378)
- 为 Recycler 设置 S3 请求超时，避免 `DeleteObjects` 缓慢失败 (#64758)
- 回收空 Rowset 时保留 Resource ID (#65862)
- 回收 Rowset 时跳过 Packed Slice 的删除 (#65533)
- 修正 Schema 视图中本地与远程 Tablet 大小的语义 (#60887)
- 规范化 `SHOW PARTITIONS` 中的存储和副本字段 (#60871)
- 云上模式下对齐 Colocate proc 输出与 Tablet 健康度上报 (#60944)
- 云上 BE 选择时排除正在下线的 BE (#65221)
- 避免紧急导入抢占 Schema Change 锁 (#66082)
- 表属性变更后跳过不必要的 MetaService Tablet 更新 (#65983)
- 避免旧版客户端把未知的 MetaService 状态码当作成功 (#64148)
- 遇到未知的 MetaService 响应码时按失败处理 (#66364)
- 跳过 Lazy Commit 未完成时的 Rowset 提升 (#66253)
- 记录实例删除的回收状态并保留实例 Tombstone (#66519, #66870)
- 以正确的 Blob 读取和引用计数回收 Delete Bitmap 的 Packed File (#66728, #66919)
- 回收前只标记已 prepare 的 Rowset (#65550)
- 非 MoW Tablet 跳过多版本 Delete Bitmap 的清理 (#67084)
- 分离 Recycler 作业 Key 与校验 Key 的 HTTP 编码 (#67243)
- Compute Group 被删除后清理过期的 CloudReplica 路由 (#66984)
- 修复 FE 响应不完整时 `SchemaVariablesScanner` 的崩溃 (#65994)
- Tablet Header 锁改用 bthread 友好的共享锁 (#66020)
- 修复云上模式下 Schema Change 的 alter version 获取 (#62506)
- 云上模式下将 FE 配置的运行时修改限制为 root 用户 (#66478)
- 解决默认副本属性冲突的问题 (#65836)
- BE 均衡时排除大小为 0 的 Tablet (#66499)
- 云上升级期间检查并中止失败的冲突事务 (#60830)
- 虚拟 Compute Group 被删除时取消其重建的预热任务 (#65426)
- 修复添加分区时的回滚处理 (#64650)

## 湖仓一体
- 修正 MaxCompute `IN` 谓词下推的极性 (#65083)
- 完善 MaxCompute Catalog 的参数校验 (#64119)
- 多 Catalog 查询中保留外表分区元数据 (#66012)
- 分区刷新后失效过期的 Hive 文件缓存 (#65334)
- 安全地发布 Hadoop Catalog 属性 (#66392)
- 修复 Schema 查找时远程 JDBC 表名缺失的问题 (#65718)
- 加强 JDBC 驱动 URL 校验，并移除文件上传 HTTP 接口 (#67149)
- 通过标准 SerDe 路径解析 ORC 时间戳 (#64807)
- Parquet 谓词扫描中保留嵌套类型的可空性 (#66799)
- 使用 Bloom Filter 裁剪嵌套 Parquet 列时保证安全 (#66471)
- 修复 Iceberg Merge-on-Read 延迟按行号读取时的崩溃 (#66506)
- 避免计算 Iceberg 分区谓词时 BE 异常退出 (#66835)
- 扫描 Iceberg 表时使用 Split 的文件格式 (#65760)
- 写入失败后删除外表数据文件，避免产生孤儿文件 (#64678)
- 跨 Split 保留 Paimon 分区元数据 (#65581)
- 处理 Paimon 分区值中的特殊字符 (#65904)

## 安全与认证
- `_stream_load_forward` 需要鉴权并由显式配置开关控制 (#65377)
- 脱敏 Kafka Routine Load 的敏感属性 (#64786)
- 在 BE 信息接口中隐藏 Stream Load Token 和认证数据 (#60656, #59743)
- 转义审计日志的记录分隔符，防止伪造记录行 (#66580)
- 脱敏加密密钥相关系统表中的敏感字段 (#66834)
- 脱敏 BE 配置中的私钥密码 (#66836)
- 脱敏认证与 Stream Load 日志中的凭证信息 (#66917)
- 停止将 Arrow Flight 的 Bearer Token 写入 `fe.log` (#67146)

## 物化视图
- 修复扫描物化的模式上下文校验 (#65414)
- 区分分区补偿与 `UNION ALL` 改写 (#66445)
- 降低序列化 MTMV 任务 TVF 信息时 Master FE 的 CPU 占用 (#66792)
- 优化 MTMV 分区血缘检查 (#63899)
- 避免物化视图 null-reject 补偿中的非法 Slot 转换 (#66613)
- 排除的触发表发生变化后刷新 MTMV (#64041)

## 其他
- 修复 Arrow Flight SQL 预处理语句的直接内存泄漏 (#65311)
- 修复定时作业失败时的任务结束时间戳 (#66232)
- Metric 仓库初始化前保护查询 Instance 指标的访问 (#62762)
- 移除 HDFS File Reader 中的查询 Profile (#67293)
