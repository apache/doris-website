---
{
    "title": "Release 4.1.5",
    "language": "zh-CN",
    "description": "Apache Doris 4.1.5 版本发布说明"
}
---

## 新功能

### 湖仓一体

- 支持对 Hive 表执行静态分区覆盖写入。 ([#68181](https://github.com/apache/doris/pull/68181))

### AI 与搜索

- 支持在自定义倒排索引分析器中使用 `ik_smart` 和 `ik_max_word` 分词器。 ([#68550](https://github.com/apache/doris/pull/68550))
- 新增 `norms` 索引属性，以及用于跳过 VARIANT 路径 norms 的 BE 配置。 ([#68140](https://github.com/apache/doris/pull/68140))
- 支持在 AI RESOURCE 中设置专用的 embedding 属性。 ([#68384](https://github.com/apache/doris/pull/68384))

### 存算分离与作业管理

- 支持通过 `compute_group` 属性，为 Routine Load 作业和异步物化视图显式绑定计算组。 ([#67010](https://github.com/apache/doris/pull/67010))
- 为 FE 到 MetaService、BE 到 MetaService 的 RPC 限流新增 dry-run 模式。 ([#67421](https://github.com/apache/doris/pull/67421), [#67240](https://github.com/apache/doris/pull/67240))

## 改进

### 湖仓一体与存算分离

- 批量获取 Hive Metastore 分区，减少元数据请求。 ([#68197](https://github.com/apache/doris/pull/68197))
- 支持延迟打开 Iceberg 的 HDFS 文件，并传递删除文件的大小。 ([#67842](https://github.com/apache/doris/pull/67842))
- 减少存算分离 Tablet 索引中的对象分配，复用装箱后的 ID；均衡完成后释放调度索引。 ([#67278](https://github.com/apache/doris/pull/67278), [#67248](https://github.com/apache/doris/pull/67248), [#67290](https://github.com/apache/doris/pull/67290))
- 优化 Rowset 回收时删除 Delete Bitmap 键的操作。 ([#67854](https://github.com/apache/doris/pull/67854), [#67936](https://github.com/apache/doris/pull/67936))
- BE 进入下线状态时，仅注册一次分水岭事务 ID。 ([#67632](https://github.com/apache/doris/pull/67632))

### 导入与存储

- 改进背压控制，提升写入性能。 ([#67728](https://github.com/apache/doris/pull/67728))
- 跳过 Group Commit Stream Load Sink 中冗余的 `createLocation` 操作。 ([#63685](https://github.com/apache/doris/pull/63685))
- 调整 CDC 请求超时和快照切分批次大小的默认值。 ([#67684](https://github.com/apache/doris/pull/67684))
- 避免在主键查找时复制 Segment 键边界，并提前释放不再使用的存储路径内存。 ([#67698](https://github.com/apache/doris/pull/67698), [#67956](https://github.com/apache/doris/pull/67956))

### 查询与执行

- 优化 `MERGE INTO` 的 Join 方向，将目标表放在 Probe 侧。 ([#67279](https://github.com/apache/doris/pull/67279))
- 改进 Mark Join 的 Slot 推导，消除冗余的 Mark Join。 ([#67280](https://github.com/apache/doris/pull/67280))
- 为天和周的日期运算新增字典快速路径。 ([#67233](https://github.com/apache/doris/pull/67233))
- 优化 `pow` 的平方运算，同时保持整数结果精确。 ([#68443](https://github.com/apache/doris/pull/68443))
- 避免在校验 SQL Cache 时重复请求分区版本。 ([#67415](https://github.com/apache/doris/pull/67415))
- 支持在 FileScannerV2 中按行 ID 获取数据。 ([#67922](https://github.com/apache/doris/pull/67922))

### 运维与诊断

- 在 HTTP 请求日志中记录用户名，便于审计。 ([#67319](https://github.com/apache/doris/pull/67319))
- 改进 S3 Streaming Insert 作业的审计日志。 ([#67756](https://github.com/apache/doris/pull/67756))
- 减少重复的查询取消日志，并在统计进程文件描述符数量时避免对每个文件描述符调用 `stat`。 ([#67548](https://github.com/apache/doris/pull/67548), [#68046](https://github.com/apache/doris/pull/68046))

## 问题修复

### 查询优化与正确性

- 修复 WinMagic 子查询改写导致 Join 结果行数放大的问题。 ([#67288](https://github.com/apache/doris/pull/67288))
- 保留滑动窗口中的行，直到可以安全移除；简化窗口函数时遵循窗口帧定义。 ([#67329](https://github.com/apache/doris/pull/67329), [#67743](https://github.com/apache/doris/pull/67743))
- 在 DISTINCT 窗口改写和类型转换比较中保留可空性，并在公共表达式提取时保留会话保护条件。 ([#67721](https://github.com/apache/doris/pull/67721), [#67843](https://github.com/apache/doris/pull/67843), [#67863](https://github.com/apache/doris/pull/67863))
- 消除 GROUP BY 时保持加权平均值语义，并修正聚合推导中的参与条件检查。 ([#67832](https://github.com/apache/doris/pull/67832), [#68175](https://github.com/apache/doris/pull/68175))
- 在 NULL 安全性检查前，规范化投影中的 COUNT Slot。 ([#68068](https://github.com/apache/doris/pull/68068))
- 当目标 Slot 不存在于某个 Grouping Set 中时，禁止将 Runtime Filter 下推到 Repeat 以下。 ([#67992](https://github.com/apache/doris/pull/67992))
- 禁止将 `MIN` 和 `MAX` 经由不安全的类型转换下推到存储层。 ([#67980](https://github.com/apache/doris/pull/67980))
- 修复部分 TopN 经由 Join 下推的问题，在 TopN 延迟物化时保留必要的 Slot，并对未启用轻量 Schema Change 的表禁用 TopN 延迟物化。 ([#68235](https://github.com/apache/doris/pull/68235), [#68072](https://github.com/apache/doris/pull/68072), [#67928](https://github.com/apache/doris/pull/67928))
- 在改写过程中保留 UNION 的常量行，以及子查询所需的 Generate 子节点输出。 ([#68172](https://github.com/apache/doris/pull/68172), [#68173](https://github.com/apache/doris/pull/68173))
- 在解析解引用表达式前，先解析带限定名的关联列。 ([#68062](https://github.com/apache/doris/pull/68062))
- 从查询输出中隐藏内部 HAVING 辅助列。 ([#68075](https://github.com/apache/doris/pull/68075))
- 在表值函数中保留重复的输出列位置。 ([#67829](https://github.com/apache/doris/pull/67829))
- 使常量折叠和时间间隔折叠与 BE 执行行为保持一致。 ([#68071](https://github.com/apache/doris/pull/68071), [#68174](https://github.com/apache/doris/pull/68174))
- 在 SQL Cache 中跟踪用户变量，并将 `sql_select_limit` 应用于物化的 CTE 结果。 ([#68069](https://github.com/apache/doris/pull/68069), [#68077](https://github.com/apache/doris/pull/68077))
- 将常量从单行关系中向外传播，以支持分区裁剪。 ([#67400](https://github.com/apache/doris/pull/67400))
- 改进不支持的子查询的错误信息。 ([#67693](https://github.com/apache/doris/pull/67693))

### 函数与数据类型

- 修复 `topn_array` 和 `topn_weighted` 处理 BOOLEAN 输入时的执行问题，并保留 BOOLEAN 数组结果类型。 ([#68409](https://github.com/apache/doris/pull/68409))
- 修复 `space_expand_rate` 为零时，`topn`、`topn_array` 和 `topn_weighted` 丢失候选项的问题。现在，非正值允许无限保留中间候选项；最终结果仍受 `top_num` 限制。 ([#68545](https://github.com/apache/doris/pull/68545))
- `TRY_CAST` 在发生算术溢出时返回 NULL。 ([#67985](https://github.com/apache/doris/pull/67985))
- 修复 `array_range` 的溢出、批量整数输出，以及含 NULL 参数的行处理问题。 ([#67689](https://github.com/apache/doris/pull/67689), [#68644](https://github.com/apache/doris/pull/68644))
- 修复嵌套 `array_map` 的 Lambda 捕获、向常量 NULL 数组追加元素，以及数组函数处理外层为 NULL 但内部仍含嵌套数据的容器时的问题。 ([#68471](https://github.com/apache/doris/pull/68471), [#68442](https://github.com/apache/doris/pull/68442), [#68696](https://github.com/apache/doris/pull/68696))
- 保留 `array_cum_sum` 每一行开头的 NULL 值。 ([#68605](https://github.com/apache/doris/pull/68605))
- 修复 Decimal 在保留零位小数时的舍入问题，以及小数位数边界处的舍入溢出问题。 ([#68412](https://github.com/apache/doris/pull/68412), [#68415](https://github.com/apache/doris/pull/68415))
- 修复 `LIKE` 错误匹配带有多余尾部字符的字符串的问题，并在模式可能包含转义字符时避免使用 NGram Bloom Filter 索引。 ([#68159](https://github.com/apache/doris/pull/68159), [#68319](https://github.com/apache/doris/pull/68319))
- 修复空常量正则表达式模式、使用空正则表达式切分 UTF-8 字符串，以及非常量模式回退到扩展正则表达式时的问题。 ([#68179](https://github.com/apache/doris/pull/68179), [#68417](https://github.com/apache/doris/pull/68417), [#68591](https://github.com/apache/doris/pull/68591))
- 修复 `json_set`、`json_insert` 和 `json_replace` 的参数数量校验，以及常量可空 JSON 路径的求值问题。 ([#67914](https://github.com/apache/doris/pull/67914), [#68525](https://github.com/apache/doris/pull/68525))
- 防止 JSON 文本在字符串内的 `U+0000` 处被截断，并保留 count-by-enum 键中的 NUL 字节。 ([#68735](https://github.com/apache/doris/pull/68735), [#68419](https://github.com/apache/doris/pull/68419))
- 保留日期向下取整函数的 NULL 传播行为，并在按周向下、向上取整时考虑微秒部分。 ([#68423](https://github.com/apache/doris/pull/68423), [#68416](https://github.com/apache/doris/pull/68416))
- 修复超大 Unix 时间戳的范围检查，并修正 `next_day` 和 `previous_day` 的别名。 ([#68364](https://github.com/apache/doris/pull/68364), [#68542](https://github.com/apache/doris/pull/68542))
- 修复 IPv6 按奇数字节截断，以及 IPv4 CIDR 处理零地址时的问题。 ([#68414](https://github.com/apache/doris/pull/68414), [#68420](https://github.com/apache/doris/pull/68420))
- 修复 `parse_data_size` 和 `MAKE_SET` 的 NULL 处理问题。 ([#68413](https://github.com/apache/doris/pull/68413), [#68411](https://github.com/apache/doris/pull/68411))
- 修复 `conv` 在进制转换时发生 BIGINT 溢出的问题。 ([#68424](https://github.com/apache/doris/pull/68424))
- 合并百分位数状态时保留全部样本，统一复杂类型聚合中的 NULL 排序，并恢复 `linear_histogram` 对 BOOLEAN 的支持。 ([#68475](https://github.com/apache/doris/pull/68475), [#68422](https://github.com/apache/doris/pull/68422), [#68676](https://github.com/apache/doris/pull/68676))
- 修复读取长度为零的序列化 BITMAP、HLL 或 QuantileState 单元格时的崩溃问题。 ([#68497](https://github.com/apache/doris/pull/68497))

### 湖仓读取与外部元数据

- 修复 Schema 演进后的 Iceberg 历史扫描、嵌套 Schema 演进后的 V2 读取，以及历史扫描的 Schema 绑定问题。 ([#67479](https://github.com/apache/doris/pull/67479), [#67690](https://github.com/apache/doris/pull/67690), [#68568](https://github.com/apache/doris/pull/68568))
- 在 Iceberg 时间旅行中正确支持带小数部分的时间戳。 ([#67704](https://github.com/apache/doris/pull/67704))
- 修复 Iceberg VARIANT 子路径的规划失败问题，并保留 Schema 元数据中的可空性。 ([#68121](https://github.com/apache/doris/pull/68121), [#67856](https://github.com/apache/doris/pull/67856))
- 在 Iceberg 快照文件缺失或名称映射无效时报告错误，避免返回错误数据。 ([#68143](https://github.com/apache/doris/pull/68143), [#68003](https://github.com/apache/doris/pull/68003))
- 修复 Schema 类型提升后的 Equality Delete 键匹配问题，并在表演进为无分区布局时保留文件的分区规范。 ([#68383](https://github.com/apache/doris/pull/68383), [#68481](https://github.com/apache/doris/pull/68481))
- 在对应 Catalog 的认证上下文中运行 Iceberg execute 操作。 ([#67695](https://github.com/apache/doris/pull/67695))
- 保留 Paimon CAST 谓词语义，根据快照元数据估算行数，并在刷新元数据时使 SDK 缓存失效。 ([#67933](https://github.com/apache/doris/pull/67933), [#68155](https://github.com/apache/doris/pull/68155), [#68238](https://github.com/apache/doris/pull/68238))
- 按表隔离 Hive 文件缓存条目，并修复外部元数据变更后的名称和行数缓存失效问题。 ([#68575](https://github.com/apache/doris/pull/68575), [#67417](https://github.com/apache/doris/pull/67417), [#68196](https://github.com/apache/doris/pull/68196))
- 在缓存淘汰时释放 Iceberg FileIO 和 Hudi fsView 资源。 ([#66913](https://github.com/apache/doris/pull/66913))
- 统一 Parquet 和 ORC 的时间戳语义，修复外部二进制和时间戳类型映射，以及二进制值的所有权问题。 ([#68441](https://github.com/apache/doris/pull/68441), [#68532](https://github.com/apache/doris/pull/68532), [#68297](https://github.com/apache/doris/pull/68297))
- 在 Parquet VARIANT 元数据裁剪时保持安全的谓词顺序，并强制限制 Parquet 元数据大小。 ([#68144](https://github.com/apache/doris/pull/68144), [#68047](https://github.com/apache/doris/pull/68047))
- 修复使用多字符行分隔符切分 CSV 和 JSON 文件时丢行和重复行的问题。 ([#68600](https://github.com/apache/doris/pull/68600))
- 将 HTTP 范围读取限制在文件大小以内，并确保错误响应体超过读取缓冲区时，S3 响应流仍可使用。 ([#67683](https://github.com/apache/doris/pull/67683), [#68544](https://github.com/apache/doris/pull/68544))
- 修复 BE 在 EKS Pod Identity 环境中访问 AWS 的问题。 ([#67555](https://github.com/apache/doris/pull/67555))
- 选择与所请求距离度量兼容的 Lance 向量索引，并修复 Lance JNI 与 glibc 2.17 的兼容性问题。 ([#67553](https://github.com/apache/doris/pull/67553), [#67862](https://github.com/apache/doris/pull/67862))

### Arrow Flight SQL 与客户端协议

- 防止 Arrow Flight 连接使用点查询短路路径或重放 MySQL SQL Cache 结果。 ([#67557](https://github.com/apache/doris/pull/67557), [#67556](https://github.com/apache/doris/pull/67556))
- 查询完成后及时释放 Flight Coordinator，并在结果流提前关闭时取消查询。 ([#67558](https://github.com/apache/doris/pull/67558), [#68630](https://github.com/apache/doris/pull/68630))
- 按 Backend 对并行结果端点去重。 ([#68642](https://github.com/apache/doris/pull/68642))
- 发布批次前校验 Arrow 结果数组，并拒绝超出范围的时间戳。 ([#68596](https://github.com/apache/doris/pull/68596), [#68604](https://github.com/apache/doris/pull/68604))
- 修复年份为零的 DATE 转换，保留嵌套逻辑类型元数据，并返回分析后的查询 Schema 和表类型元数据。 ([#68649](https://github.com/apache/doris/pull/68649), [#68614](https://github.com/apache/doris/pull/68614), [#68631](https://github.com/apache/doris/pull/68631))
- 修复 MySQL Connector/J 使用游标获取空结果时挂起的问题。 ([#68064](https://github.com/apache/doris/pull/68064))

### 导入与作业生命周期

- 在重放时处理不完整的 WAL 记录，并修复将含 VARIANT 列的 WAL 数据误判为不支持的文件格式而拒绝读取的问题。 ([#67420](https://github.com/apache/doris/pull/67420), [#68242](https://github.com/apache/doris/pull/68242))
- 修复虚拟计算组的 Group Commit 路由问题。 ([#67590](https://github.com/apache/doris/pull/67590))
- 将事务性 INSERT 的执行错误返回给客户端。 ([#67925](https://github.com/apache/doris/pull/67925))
- 修复缺少直接 Slot 映射时严格模式导入崩溃的问题。 ([#67953](https://github.com/apache/doris/pull/67953))
- 使用 Streaming Job 创建者的身份执行 CDC 操作。 ([#67937](https://github.com/apache/doris/pull/67937))
- 在清理历史记录时保留活跃的导出作业及其 Label 映射。 ([#67833](https://github.com/apache/doris/pull/67833))
- 修复 INSERT 审计日志记录后，`SET_VAR` 设置泄漏到后续语句的问题。 ([#68108](https://github.com/apache/doris/pull/68108))

### 物化视图与元数据

- 防止快照读取使用当前的物化视图。 ([#67729](https://github.com/apache/doris/pull/67729))
- 修复分区 Rollup 改写中对无效分区桶的补偿问题。 ([#68067](https://github.com/apache/doris/pull/68067))
- 当基表新增分区且不存在已有快照时，避免对异步物化视图执行不必要的全量刷新。 ([#68249](https://github.com/apache/doris/pull/68249))
- 在异步物化视图刷新任务中保留原始语句。 ([#68272](https://github.com/apache/doris/pull/68272))
- 元数据重新加载后恢复 Rollup 显示状态，并在中止冲突事务失败时保持 Rollup 作业等待。 ([#67596](https://github.com/apache/doris/pull/67596), [#68055](https://github.com/apache/doris/pull/68055))
- 查询 `information_schema.view_dependency` 时跳过引用失效的视图，并修复导出 DDL 中视图列名和注释的引号处理问题。 ([#67377](https://github.com/apache/doris/pull/67377), [#67398](https://github.com/apache/doris/pull/67398), [#68076](https://github.com/apache/doris/pull/68076))
- 将无效的列统计信息视为 UNKNOWN，避免整个 ANALYZE 作业失败；修复查询不存在的 ANALYZE 作业 ID 时的空指针错误。 ([#68061](https://github.com/apache/doris/pull/68061), [#68493](https://github.com/apache/doris/pull/68493))
- 仅在状态转换完成后提交 FE 类型状态。 ([#68325](https://github.com/apache/doris/pull/68325))

### 存储与 Compaction

- 将无法解析或上下界颠倒的 Zone Map 边界视为无效，完整保留 STRING 和 VARCHAR 边界的每个字节，并修复旧版 FLOAT 和 DOUBLE Zone Map 的 NaN 处理问题。 ([#67528](https://github.com/apache/doris/pull/67528), [#67550](https://github.com/apache/doris/pull/67550), [#67998](https://github.com/apache/doris/pull/67998), [#68102](https://github.com/apache/doris/pull/68102))
- 修复并行 Cumulative Compaction 期间 Cumulative Point 的推进问题，并修正 Compaction 线程计数。 ([#67425](https://github.com/apache/doris/pull/67425), [#67662](https://github.com/apache/doris/pull/67662))
- 在 Schema Change 期间保留最近 10 个版本不合并，并在 Vertical Compaction 中及时释放已耗尽的 Segment 上下文。 ([#67589](https://github.com/apache/doris/pull/67589), [#67599](https://github.com/apache/doris/pull/67599))
- 按行数对 Cumulative Compaction 任务分类，避免反复合并大型 Rowset，并在近似 Compaction 分数中计入空 Rowset。 ([#66938](https://github.com/apache/doris/pull/66938), [#65601](https://github.com/apache/doris/pull/65601), [#66656](https://github.com/apache/doris/pull/66656))
- 持久化空的倒排索引文件，并停止写入孤立的索引文件。 ([#68082](https://github.com/apache/doris/pull/68082))
- 保留 VARIANT 子路径顺序，并防止将 `element_at` 的整数索引误解为子列路径。 ([#68284](https://github.com/apache/doris/pull/68284), [#68041](https://github.com/apache/doris/pull/68041))
- 不再缓存 BetaRowset 加载 Segment 行数时的失败结果，以便后续重试。 ([#68683](https://github.com/apache/doris/pull/68683))
- 修复 Backend Tablet 扫描器并发访问 Rowset Map 的问题。 ([#68316](https://github.com/apache/doris/pull/68316))

### File Cache 与存算分离

- 避免 File Cache 监控占用 LRU Recorder 锁，并仅对实际下载的块统计淘汰字节数。 ([#67495](https://github.com/apache/doris/pull/67495), [#68157](https://github.com/apache/doris/pull/68157))
- 统一 File Cache TTL 截止时间，在延长已过期的 TTL 时恢复 TTL 块类型，并为存算分离 Schema Change 的输出设置 TTL。 ([#68313](https://github.com/apache/doris/pull/68313), [#68092](https://github.com/apache/doris/pull/68092), [#67686](https://github.com/apache/doris/pull/67686))
- 在同步 File Cache 写入时保留 Tablet ID。 ([#68347](https://github.com/apache/doris/pull/68347))
- 通过 Edit Log 滚动触发周期性的存算分离 Checkpoint。 ([#67422](https://github.com/apache/doris/pull/67422))
- 修复预热作业调度饥饿问题，在初始化失败时释放目标端，并在 FE 恢复后还原目标端锁。 ([#67643](https://github.com/apache/doris/pull/67643), [#68107](https://github.com/apache/doris/pull/68107), [#68105](https://github.com/apache/doris/pull/68105))
- 避免回收相同 Label 的事务时发生冲突，并在并发提交时返回已有的 Rowset。 ([#67478](https://github.com/apache/doris/pull/67478), [#67660](https://github.com/apache/doris/pull/67660))
- 从存算分离 Schema Change 的临时 Tablet 中排除过期 Rowset，并在计算 Compaction 最小时间戳时排除已被覆盖的 Rowset。 ([#67383](https://github.com/apache/doris/pull/67383), [#67751](https://github.com/apache/doris/pull/67751))
- 刷新持续导入的 Tablet 的元数据，并在事务提交时修复缺少 `db_id` 的 Tablet 索引。 ([#68044](https://github.com/apache/doris/pull/68044), [#68127](https://github.com/apache/doris/pull/68127))
- 在重试可见事务提交时使版本缓存失效。 ([#68650](https://github.com/apache/doris/pull/68650))
- 删除部分列更新的 Rowset 时遵循回收类型，并保留已删除实例的克隆源映射。 ([#68665](https://github.com/apache/doris/pull/68665), [#68570](https://github.com/apache/doris/pull/68570))
- 修复 Packed Slice 位置信息的生命周期问题，使用任务上下文保护 Rowset 统计信息同步，并通过 Versionstamp 安全解码事务 ID。 ([#67973](https://github.com/apache/doris/pull/67973), [#67964](https://github.com/apache/doris/pull/67964), [#67954](https://github.com/apache/doris/pull/67954))
- 修正 Delete Bitmap V2 的 FDB 大小限制配置，并修复按 Coordinator 查找已准备事务的问题。 ([#67938](https://github.com/apache/doris/pull/67938), [#68059](https://github.com/apache/doris/pull/68059))

### 认证与授权

- 统一 JDBC、Iceberg JDBC 和 Paimon JDBC Catalog 的 `driver_url` 校验，包括 ALTER CATALOG 操作。 ([#68164](https://github.com/apache/doris/pull/68164))
- 在 `SHOW FRONTEND CONFIG` 中隐藏敏感配置值。 ([#67920](https://github.com/apache/doris/pull/67920))
- 对 `/rest/v1` 的 HTTP Basic 和 Cookie 请求执行一致的检查。 ([#68635](https://github.com/apache/doris/pull/68635))
- 在 `SET PASSWORD` 和 `ALTER USER` 中，仅将 `root@'%'` 视为 root 身份。 ([#68634](https://github.com/apache/doris/pull/68634))
- 在 GRANT 和 REVOKE 中检查授权者的列权限，并拒绝超过三段的权限对象名称。 ([#68629](https://github.com/apache/doris/pull/68629), [#68682](https://github.com/apache/doris/pull/68682))
- 按用户身份限制 AI 资源的创建，并限制对 root 创建的 AI 资源的修改。 ([#68265](https://github.com/apache/doris/pull/68265), [#67782](https://github.com/apache/doris/pull/67782))

### 稳定性与平台兼容性

- 每次执行预处理语句时分配新的 StatementContext，防止长期使用预处理语句导致 FE 内存无限增长。 ([#67926](https://github.com/apache/doris/pull/67926))
- 修复工作线程拒绝任务时的 ReadListener 泄漏，并防止历史 Profile 加载器并发运行。 ([#67990](https://github.com/apache/doris/pull/67990), [#67069](https://github.com/apache/doris/pull/67069))
- 修复 Runtime Filter RPC 回调复用和内存释放问题，并解决 AutoReleaseClosure 的数据竞争。 ([#67912](https://github.com/apache/doris/pull/67912), [#67340](https://github.com/apache/doris/pull/67340))
- 修复 bvar 采样访问已释放的线程局部对象、定时器回调销毁竞争，以及自适应 Flush 回调与线程池销毁之间的竞争。 ([#68045](https://github.com/apache/doris/pull/68045), [#68523](https://github.com/apache/doris/pull/68523), [#68326](https://github.com/apache/doris/pull/68326))
- 首次使用前初始化 bthread 上下文键，并避免反复发生对端连接失败。 ([#67722](https://github.com/apache/doris/pull/67722), [#67647](https://github.com/apache/doris/pull/67647))
- 防止 AI 适配器响应格式错误导致 BE 崩溃，并从 Responses API 输出中正确提取最终文本。 ([#68333](https://github.com/apache/doris/pull/68333), [#67795](https://github.com/apache/doris/pull/67795))
- 修复 ASAN 下 PHDR 栈回溯时的重复释放错误，以及 ASAN 下 glibc 2.17 中的 `getentropy` 崩溃问题。 ([#68229](https://github.com/apache/doris/pull/68229), [#67849](https://github.com/apache/doris/pull/67849))
- 将 libunwind 升级到 1.8.3，修复 aarch64 BE 在使用 64 KiB 内存页的 Linux 系统上启动时崩溃的问题。 ([#68339](https://github.com/apache/doris/pull/68339))
- 修复 macOS 上大型 BE 二进制文件导致的 dyld 缓存崩溃，并在启动失败退出前停止后台工作线程。 ([#68218](https://github.com/apache/doris/pull/68218), [#68653](https://github.com/apache/doris/pull/68653))
- 更新 Thrift、AWS SDK、Nimbus 和 gRPC 等依赖，并移除未使用的 LZ4 依赖。 ([#67356](https://github.com/apache/doris/pull/67356), [#67554](https://github.com/apache/doris/pull/67554), [#67847](https://github.com/apache/doris/pull/67847), [#68060](https://github.com/apache/doris/pull/68060), [#67148](https://github.com/apache/doris/pull/67148), [#68557](https://github.com/apache/doris/pull/68557))
