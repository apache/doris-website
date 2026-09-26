---
{
    "title": "Release 4.1.3",
    "language": "zh-CN",
    "description": "Apache Doris 4.1.3 版本发布说明"
}
---

# 新功能

## 查询与执行
- 支持 Python UDF/UDAF/UDTF (#63387)
- 在工作负载策略中支持远程扫描字节数熔断 (#64649)
- 新增基于用户名的 BE 端工作负载策略支持 (#60559)
- 新增 `is_valid_utf8` 函数 (#62515)

## 云原生
- 新增表级事件驱动预热 (#63832)

## 导入
- 支持 Stream Load zstd 压缩 (#64711)

## 索引与搜索
- 为 ANN TopN 小候选集场景增加暴力搜索回退机制 (#64555)

# 改进

## 查询与执行
- 将 `inactive_file` 视为可用内存，避免在 cgroup 环境中误取消查询 (#64347)
- 默认将 profile level 设置为 2，以输出更详细的查询 Profile (#64378)
- 为 ETL 场景下的 INSERT publish 超时新增可配置的返回模式 (#64583)

## 导入
- 让 from-to streaming 任务的超时判断感知任务进度 (#64301)
- 为 Kafka read_committed 导入新增零行提示，并延迟零行重试 (#64585)
- 更及时地刷新 Routine Load 延迟指标 (#63654)

## 云原生
- 为 BE 到 Meta-Service 的 RPC 增加限流 (#64396)
- 新增虚拟 Compute Group 切换指标 (#63036)

# 问题修复

## 索引与搜索
- 读取 Variant 时处理被截断的 sparse path 统计信息 (#64205)
- 将 JSONB 转换为 Variant 时保留 JSON 对象 (#63792)
- 对标量字符串 Variant 调用 `element_at` 时返回原始字符串 (#64103)
- 转义 JSONB 路径成员中的控制字符 (#63517)

## 查询与执行
- 修复 `SimplifyAggGroupBy` 未验证单射性的问题 (#64335)
- 修复 Partition TopN 优化要求窗口函数分区键必须是共置键子集的问题 (#65073)
- 修复 sender queue 就绪时 sorted merge 的继续执行逻辑 (#65004)
- 修复使用子节点前缀排序键时的 TopN 合并问题 (#64685)
- 修复可空聚合函数的 visitor 分派问题 (#64885)
- 修复存在重复别名时聚合合并结果错误的问题 (#65025)
- 修复 timeout checker 遇到异常后停止运行的问题 (#65040)
- 限制 auto salt join 重写，避免产生错误结果 (#64518)
- 修复 delete partial update 对生成列的处理 (#64884)
- 在 `PushDownAggThroughJoinOnPkFk` 中使用 arity 检查保护 `Count(*)` 子节点访问 (#64848)
- 修复云模式查询重试在错误码为 -230 时临时将 `version_cache_ttl` 设为 0 的问题 (#63721)
- 修复 recursive CTE 数据块未发送到每个 scan instance 的问题 (#64964)
- 修复 SHOW PROCESSLIST 在 FULL 模式下返回非预期结果的问题 (#64631)
- 修复 `isNull` 在解析器中未置于 primaryExpression 下的问题 (#63619)
- 修复子查询错误消除 null-aware anti-join 的问题 (#64639)
- 当 `light_schema_change=false` 时跳过 TopN 延迟物化 (#64441)
- 修复 `copy into select` 未绑定文件列占位符的问题 (#64591)
- 根据父节点 offset 限制 MERGE_TOP_N 的合并 limit (#64306)
- 阻止 cast project 下推穿过 UNION DISTINCT (#64080)
- 对共享基列禁用 row-store 延迟读取 (#62864)
- 修复 FragmentMgr 清理 query context map 时发生的自死锁 (#64552)
- 修复 month 函数对可空 DateTimeV2 字面量的绑定 (#64459)
- 移除错误的 TopN-to-MAX 优化器重写 (#63519)
- 修复本地 Runtime Filter 合并死锁 (#65102)
- 从物化算子的 row-ID fetcher 返回错误状态 (#62513)
- 规范化聚合函数的 ORDER BY 下推 (#64787)
- 修复 proxy 流程因缺少 parsedStatement 而未创建 NereidsCoordinator 的问题 (#64363)
- 拒绝 COUNT DISTINCT 窗口函数使用超过 1 个参数 (#64783)
- 避免 `convert_tz` 在 DST 切换期间执行错误的分区裁剪 (#63853)
- 修复 `MAKE_SET` 常量折叠未清除先前结果的问题 (#64907)
- 避免 `int_divide` 处理有符号最小值时触发 SIGFPE (#64828)
- 修复 `nth_value` 对上界窗口的处理 (#64864)
- 当权重和为零时让 `avg_weighted` 返回 NaN (#64333)
- 稳定 conjunct cost 排序 (#64637)
- 取消后停止算子的额外工作 (#64077)
- 修复 `array_first`/`array_last` 的布尔类型转换 (#64847)
- 校验 `array_sort` 的 lambda 参数数量 (#64825)
- 将 `retention` 参数数量限制为 32，避免 BE heap 溢出 (#64521)
- 修复 `concat_ws` 对可空数组的处理 (#64703)
- 修复 `split_by_delimiter` 未处理反斜杠转义的问题 (#61995)
- 规范化 v1 日期字符串的转换结果 (#64575)
- 修复高 EPS 下 AgentCombiner/TLS 竞态导致 `bvar::take_sample` 触发 SIGSEGV 的问题 (#64040)
- 校验 sequence pattern 的事件编号 (#64930)
- 在 pipeline scheduler 中捕获标准异常 (#65019)
- 捕获 block 序列化异常，避免 coredump (#64852)
- 校验 task executor 的 scan handle (#65054)
- 在 AsyncIO worker 线程中初始化 thread context (#64846)
- 修复读取切片后的 FixedSizeBinary Arrow 字符串的问题 (#64829)
- 避免对可变 nullable 数据执行 CRC32C 哈希 (#64944)
- 在 OUTFILE CSV 导出中保留 DateTimeV2 scale (#64344)
- 在 CREATE TABLE 时拒绝无效的 IPv4 默认值 (#62906)
- 强化 Arrow Flight split source 错误路径，避免扫描外表时 BE 崩溃 (#64797)

## 存储与压缩
- 修复 group commit block queue 不可用的问题 (#63722)
- 修复 prepared statement 复用具有相同 load_id 的计划时 group commit 丢行的问题 (#64362)
- 修复 shared delta writer state 的生命周期问题 (#64504)
- 修复 load channel 中 tablet writer map 的查找竞态 (#64604)
- 避免 cloud compaction 在同一 tablet 上发生 EMPTY_CUMULATIVE / BASE-CUMU 竞态 (#64619)
- 持久化子事务提交的更新时间 (#64739)
- 使 S3 限流配置在云模式下动态生效 (#64554)
- 使用 snapshot read 获取 table version，避免事务冲突 (#64647)
- 回收缺少 resource ID 的空 rowset (#64630)
- 修复 recycler_service 重复赋值导致 recycler 异常的问题 (#64168)
- 避免将未过期 job 临时 rowset 的 delete bitmap 误报为泄漏 (#64313)
- 在执行 Schema Change V1 前刷新 base tablet (#64312)
- 禁止在云模式下恢复 `light_schema_change=false` 的表 (#62914)
- 在云模式恢复期间重写表属性和分区信息 (#64466)
- 同步清理 File Cache 时使用安全删除 (#64578)
- 在 HTTP API 中禁用同步清理 File Cache (#64321)
- 计算 File Cache 命中率指标时排除预热读取 (#63394)
- 在 INSERT OVERWRITE 中强制删除分区 (#62510)
- 为 `getBaseViewsOneLevel` 增加空值保护，保持 MTMV 向后兼容 (#64412)
- 修复 MTMV 修改已排除触发表的问题 (#62984)
- 避免已结束的 pipeline task 在提交时崩溃 (#64953)

## 导入
- 串行组装 audit loader batch，修复竞态问题 (#65107)
- 在提交失败时为 Routine Load 任务续租加锁 (#65007)
- 修复 Stream Load 对 IPv6 主机地址的解析 (#64147)
- 使用事件唤醒替换 tablet writer close 轮询 (#64221)
- 修复转发的 INSERT 统计信息为空的问题 (#64439)
- 修复 `load_to_single_tablet` 对自动分区的路由 (#64356)
- 在审计日志中记录每个查询通过 SET_VAR hint 设置的会话变量 (#64569)
- 修复 AVRO JNI reader 在 TVF 执行期间因空指针导致的 coredump (#64699)

## 湖仓一体
- 修复 Iceberg snapshot summary 缺少 total-* 计数器时下推 COUNT(*) 触发的 NPE (#64648)
- 修复 Iceberg 二进制列使用错误 Arrow 类型写入的问题 (#64949)
- 为 Iceberg/Hive Parquet/ORC writer 增加 LZ4 压缩支持 (#64723)
- 支持禁用 REST Catalog 的 view 操作 (#63320)
- 读取 Hive text 文件时保留空记录 (#64671)
- 根据 Arrow buffer 估算 MaxCompute write block 大小，避免逐行序列化估算 (#64612)
- JDBC 下推 SQL Server/Oracle 布尔谓词时使用 1/0，而不是 TRUE/FALSE (#64757)
- 从 Iceberg 表元数据中获取表 comment 属性 (#64263)
- 避免外部元数据缓存刷新因慢速 miss load 而阻塞 (#64705)

## 安全与认证
- 为 manager node 和 query error REST API 增加权限检查 (#65080)
