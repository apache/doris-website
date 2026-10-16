---
{
    "title": "Lance 查询 Profile 指标参考",
    "sidebar_label": "Lance 查询 Profile",
    "language": "zh-CN",
    "description": "解读 Apache Doris Lance 查询 Profile：FE 元数据与规划、BE 索引和扫描指标、缓存统计、计时边界及第二阶段 Row ID 回表。",
    "keywords": [
        "Lance",
        "Query Profile",
        "性能分析",
        "向量检索",
        "索引缓存"
    ]
}
---

本文介绍普通 Lance 扫描、向量检索、全文检索和第二阶段 Row ID 回表的 Profile 指标。Profile 的采集、查看和通用算子分析方法见 [Query Profile 分析指南](../../query-acceleration/query-profile.md)；Lance 访问配置见 [Lance Catalog](../catalogs/lance-catalog.mdx)。

:::note
Lance Catalog 是实验性功能，从 Apache Doris 4.2 开始支持。下述指标取决于运行的 FE/BE 和内置 Lance 版本。
:::

执行 Lance 查询前开启 Profile：

```sql
SET enable_profile = true;
```

以下名称对应当前 Lance 埋点。较旧的 Doris 构建或内置 Lance 版本可能缺少部分指标，或使用旧名称。比较结果时，应查看已完成查询的 Profile，并确认实际运行的 FE/BE 版本。

## FE 元数据与规划

对于 Catalog 查询，包括普通扫描、`COUNT`、向量检索和全文检索，在 `Execution Summary` 下查看 `Lance Metadata Metrics`：

| 计时器 | 含义 |
|---|---|
| `MetadataReadTime` | 一次 Catalog 元数据读取的总耗时，包含表访问解析、Dataset 访问和资源清理。 |
| `TableAccessResolveTime` | 解析表访问，包括 Namespace 访问、凭证和存储选项。 |
| `DatasetOpenTime` | FE 打开 Dataset 的耗时，历史查询可能需要多次打开。 |
| `VersionResolveTime` | 在需要时解析目标历史快照。 |
| `SchemaReadTime` | 读取 Arrow Schema。 |
| `FragmentMetadataReadTime` | 读取 Fragment 元数据并构造行数描述。 |
| `FieldIdsReadTime` | 读取并映射 Lance field ID。 |
| `IndexMetadataReadTime` | 发现逻辑索引并读取 Index Segment 元数据。 |
| `SplitPlanningTime` | 规划普通扫描、元数据 COUNT、向量检索或全文检索的 Split。 |

已执行的操作或步骤还会生成对应的 `Calls` 计数，例如 `DatasetOpenCalls`。`MetadataReadFailures` 和 `SplitPlanningFailures` 表示失败操作次数，失败操作的耗时也会记录；它们不是失败 SQL 数量。未执行的元数据步骤不生成计数器。本组累计同一条 SQL 中不同表和重复读取的 Catalog 工作；独立文件 TVF 和 `SHOW INDEX` 不产生本组统计。

`MetadataReadTime` 包含元数据子步骤，`SplitPlanningTime` 单独计时。通用的 `External Table Get Table Meta Time`、`External Table Get File Scan Tasks Time` 和 `External Table Meta Time` 已包含相应工作，不应再与 Lance 细分计时或外层分析/规划时间相加。FE 的 `DatasetOpenTime` 与 BE 的 `LanceDatasetOpenTime` 分属不同进程。

## BE 分组与统计边界

在扫描 Profile 中查找 `TableReader` → `LanceReader`。其下的分组是标签，不是计时器；分组层级不表示子项耗时可以相加。

| 分组 | 内容 |
|---|---|
| `LanceTiming` | Dataset 打开、Scanner 配置和读取、Runtime Filter 转换、Arrow 转换及 Row ID 回表。 |
| `LanceIO` | 已埋点执行流的读取操作数、请求数和字节数。 |
| `LanceIndex` | 索引对象/内部部件加载、缓存查询、比较、索引打开和已搜索分区。 |
| `LanceVectorIndex` | IVF 分区选择、向量索引 delta、ANN 阶段及向量距离计算。 |
| `LanceScalarIndex` | 标量索引求值、Segment 搜索、候选、回退和结果序列化。 |
| `LanceExecutionPlan` | Lance 执行计划中的排序、归并和 Take 工作。 |
| `LanceScan` | Fragment/行范围/行数扫描、读取任务等待和 Row ID Prefilter 构造。 |
| `LanceSearchPlan` | 分配给读取器的检索 Segment/Fragment 数。 |
| `LanceDataCache` | Dataset handle 的数据文件缓存及源存储请求字节数。 |

Doris 计时器围绕相应调用更新。Lance 执行计数在流消费到 EOF 后通过统计回调累加；失败、取消或提前终止可能导致执行统计不完整。Scanner 指标会预注册，包括可选的原生指标：零值也可能表示原生路径没有报告该指标。不能仅凭指标缺失或为零，就判断没有使用索引、过滤或 I/O 路径。仅使用元数据的 `COUNT` 和 Row ID 回表不经过普通 Scanner 回调路径。

时间按调用和并行任务累加，可能大于 SQL 墙钟时间。应结合最慢 Scanner、调度、依赖等待、FE 结果处理和客户端耗时分析，不应累加所有 Scanner 或嵌套计时来还原查询延迟。

## 读取器计时

| 计时器 | 含义 |
|---|---|
| `LanceDatasetOpenTime` | 通过 BE 共享 Session 打开 Dataset，包含必要的元数据访问。复用读取器中已打开的 Dataset 时不再次计时。 |
| `LanceScannerConfigureTime` | 配置 Scanner、投影、过滤、回调和 Split/检索选项；延迟到读取时执行的工作在后续阶段计时。 |
| `LanceRuntimeFilterSqlTranslationTime` | 将 Doris Runtime Filter 转换/组合为 Lance SQL，包括转换缓存查询；不是执行过滤的耗时。 |
| `LanceScannerNextTime` | 累计读取 batch 的调用耗时，包含首批准备、索引计算、I/O、解码和等待，不含随后 Arrow 到 Doris 的转换。 |
| `LanceArrowToDorisBlockTime` | 将返回的 Arrow batch 转换为 Doris Block，扫描与 Row ID 回表均使用此指标。 |

`LanceScannerNextTime` 与下述内部索引、扫描和执行计划计时重叠，仅凭它较大不能认定存储是瓶颈。

## I/O、索引加载与缓存查询

| 计数器 | 含义 |
|---|---|
| `LanceIOReadOps` | 已埋点的读取操作数，不是每秒操作数或 HTTP 请求数。 |
| `LanceIOReadRequests` | 已埋点的存储读取请求数；范围合并/拆分会使它与 `LanceIOReadOps` 不同。 |
| `LanceIOReadBytes` | 执行计划报告的读取字节数，包含已埋点的数据/索引路径；可能包含由缓存提供的读取，不是实测远端流量或解码后的内存大小。 |
| `LanceIndexObjectLoads` | 加载的顶层索引对象数，不是 Segment 数或其内部页的加载数。 |
| `LanceIndexComponentsLoaded` | 加载的索引内部部件数，例如页、分区或 posting；不是索引缓存未命中计数，加载/合并与埋点差异可能使两者不同。 |
| `LanceIndexCacheHits`、`LanceIndexCacheMisses` | 已埋点索引路径报告的本次执行缓存查询，与 BE 共享 Session 的命中/未命中总量不同。部分流式路径不保留加载内容，因此持续未命中不能单独证明缓存容量不足。 |
| `LanceIndexComparisons` | 各索引实现定义的比较/查找工作量，不是候选行数，也不是跨索引类型统一的 CPU 成本单位。 |

这些计数适用于已埋点的向量、标量和全文索引路径。顶层索引对象可以仍在缓存中，而其页或分区需要重新加载。增大容量前，应结合缓存使用量、可复现的冷/热缓存查询及 I/O 判断。独立磁盘数据缓存和 BE 全局指标见[查看缓存效果](../catalogs/lance-catalog.mdx#查看缓存效果)。

## Row ID Prefilter 与标量索引工作

Row ID Prefilter 指标描述消费 Row ID 并构造允许行 mask 的加载器，不覆盖所有 TVF `filter`、所有标量索引查询，也不是最终 ANN/FTS 结果数。

| 计数器或计时器 | 含义 |
|---|---|
| `RowIdPrefilterLoads` | 实际 Row ID 加载器执行次数；重复查询节点可能重复加载。 |
| `RowIdPrefilterInputRows`、`RowIdPrefilterInputBatches` | 加载器消费的非 null Row ID 数和 batch 数。 |
| `RowIdPrefilterIds` | 构造后的 mask 中保留的允许行 ID 数，按加载器累加，不是全查询去重数量。 |
| `RowIdPrefilterLoadTime` | 加载器总耗时，包括输入轮询和 mask 构造。 |
| `RowIdPrefilterInputTime`、`RowIdPrefilterBuildTime` | 输入流等待/读取和 mask 构造耗时，均包含在 `RowIdPrefilterLoadTime` 中，不能把总量与子项相加。 |
| `LanceScalarIndexQueryTime` | 标量索引表达式求值，可能包含多次索引搜索和集合运算。 |
| `LanceScalarIndexResultSerializationTime` | 将标量索引结果序列化给下游 Lance 节点，不是网络序列化或 Arrow 到 Doris 的转换。 |
| `LanceScalarIndexSegmentsRequested`、`LanceScalarIndexSegmentsSearched` | 显式标量 Segment 路径的请求次数与完成 Segment 求值的次数，属于执行计数，不是表中不同 Segment 的数量。 |
| `LanceScalarIndexSegmentFallbacks` | 显式标量 Segment 加速回退为分配 Fragment 范围内的完整过滤扫描；已搜索的 Segment 也可能回退。 |
| `LanceScalarIndexCandidateRows` | 基数已知时的候选 mask 大小，在读取器限定 Fragment 范围和应用完整谓词之前记录；不是 SQL 结果数，零值也可能表示基数不可得。 |
| `LanceScalarIndexCandidateEvaluationTime` | 准备、求值和安装标量 Segment 候选，包含索引打开/搜索及回退准备，不含后续数据扫描。 |
| `LanceScalarIndexSegmentSearchTime` | 求值所选 Segment 的索引表达式，包含其加载和集合运算；已包含在 `LanceScalarIndexCandidateEvaluationTime` 中。 |

一个 Segment 可以覆盖比单个任务更多的 Fragment，重复任务也可能重复统计相同候选，因此不能把 `CandidateRows` 当作任务范围内的命中行数。常规标量表达式路径与显式 Segment 路径使用不同计时，不要求两者值相同。热缓存下，大 mask 或重复 Segment 求值仍可能消耗 CPU 和内存。

## 向量与执行计划工作

| 计数器或计时器 | 含义 |
|---|---|
| `LanceIVFPartitionsConsidered` | 选择分区时考虑的 IVF 分区规模，按所选索引 delta 累加，不是实际执行的探测数。 |
| `LanceIVFPartitionSelectionTime` | 为查询选择 IVF 分区，不含外层索引打开。 |
| `LanceIndexPartitionsSearched` | 索引执行实际报告的分区搜索计数，FTS 也报告此指标，需结合 `LanceSearchType` 解读；不是全查询去重分区数。 |
| `LanceVectorIndexDeltasSearched` | 提交给 ANN 分区路径的向量索引 delta 数，不证明每个 delta 均已完成搜索。 |
| `LanceIndexOpenTime` | 打开索引 handle，包含缓存查询和元数据访问。 |
| `LanceIndexPartitionLoadTime`、`LanceIndexPartitionPrepareTime` | 分区加载包含缓存查询、缓存填充等待和未命中后的加载/解码；分区准备包含加载和过滤准备，两者计时重叠。 |
| `LanceIndexPrefilterWaitTime` | 等待索引 Prefilter 就绪，与构建 Row ID mask 不同。 |
| `LanceIndexCpuQueueWaitTime` | 分区搜索任务从提交到开始 CPU 工作的等待时间。 |
| `LanceIndexSearchTime` | 已准备分区的 CPU 搜索，包含查询准备和结果构造。 |
| `LanceIndexQueryPrepareTime` | 构造距离计算器和查询查找表。 |
| `LanceIndexDistanceTopKTime` | 融合的候选过滤、距离计算和 Top-K 堆更新，不是纯距离计算或精排计时。 |
| `LanceIndexResultMaterializeTime` | 将搜索结果堆转换为 Arrow 数组/batch，不是 Doris 第二阶段输出回表。 |
| `LanceANNPartitionExecTime`、`LanceANNSubIndexExecTime`、`LanceANNBatchExecTime` | 已埋点 ANN 执行节点的计算时间，可能与详细索引计时重叠。 |
| `LanceVectorDistanceComputeTime` | 向量距离执行节点报告的计算耗时，不覆盖索引内部所有距离计算。 |
| `LanceSortComputeTime`、`LanceSortMergeComputeTime`、`LanceTakeExecTime` | Lance 执行节点的排序、归并和 Take 计算耗时，不是 Doris TopN 或完整第二阶段回表耗时。 |

分区工作并发执行，计时可以嵌套或重叠。不应将 `LanceIndexSearchTime` 与其查询准备、距离/Top-K 和结果构造子项相加。调整 `nprobes`、`ef` 或 `refine_factor` 前，先对比分区探测数、CPU 队列等待、Prefilter 等待和 I/O，并同时测量召回率与延迟。

## 计划规模、扫描行数与输出回表

| 计数器或计时器 | 含义 |
|---|---|
| `LancePlannedIndexSegmentCount` | 分配给读取器的检索索引 Segment 数，在配置 Split 时累加，不证明已完成搜索。 |
| `LancePlannedIndexedFragmentCount` | 分配给带索引的向量/全文检索 Split 的 Fragment 数。 |
| `LancePlannedFlatSearchFragmentCount` | 分配给向量 Flat Search Split 的 Fragment 数，FTS 不注册此计数器。 |
| `LanceFragmentsScanned`、`LanceRowOffsetRangesScanned`、`LanceRowsScanned` | FilteredRead 路径报告的 Fragment 数、行偏移范围数和行数，并非所有读取路径均报告；不是全表去重数量或最终 SQL 行数。 |
| `LanceScanTaskWaitTime` | FilteredRead 消费者等待读取任务的耗时，不是 Doris Scanner 调度时间，也不是完整的 I/O 等待总量。 |
| `LanceRowIdFetchCalls`、`LanceRowIdFetchRows` | 第二阶段 `take_rows` 调用次数与回读行数。 |
| `LanceRowIdTakeReadTime` | 创建并消费 Row ID Take 流，包括延迟读取，不含 Arrow 到 Doris 的转换。 |
| `LanceRowIdFetchTotalTime` | 非空 Row ID 回表处理总耗时，包括 Dataset 打开、Take 读取、转换和结果校验；包含前述子步骤，不含端到端 RPC/Materialization 开销。 |

检索规划可将 `EXPLAIN` 中的 `lanceSearchIndexSegments`、`lanceSearchIndexFragments`、`lanceSearchUnindexedFragments` 与 `LanceSearchPlan` 计数对照。普通标量 Segment 扫描应查看 `lanceGroupingIndexSegments`、`lanceGroupingIndexedFragments`、`lanceGroupingUnindexedFragments`；它们是 FE 计划字段，不是 BE Profile 计数器。Fragment 数按任务累加，不保证去重。

两阶段回表使用单独的读取器，不注册 Scanner 执行统计回调。其回表计时、回表计数和 `LanceDataCacheBytesReadFromCache`/`LanceDataCacheBytesReadFromRemote` 也会显示在 Row ID Fetch/Materialization Profile 信息中。该处缺少 `LanceIOReadBytes` 不代表没有 I/O。分析时应区分扫描和回表范围，避免重复计算同一份导出的回表统计。

使用 `LanceDatasetVersion` 和 `LanceDatasetUri` 确认执行快照，使用 `LanceSearchType` 区分向量和全文检索。`LanceTopK`、`LanceOffset`、`LanceFtsCoverageMode`、`LanceFtsQueryType`、`LanceFtsMatchOperator`、`LanceFtsMaxFuzzyDistance`、`LanceFtsPhraseSlop`、`LancePushdownFormat` 和 Runtime Filter ID 条目描述配置或下推状态，属于信息字符串，不能作为计数器相加。`LanceTopK` 和 `LanceOffset` 描述每个 Split 的请求：TVF 查询设为 `top_k=K`、`offset=n` 时，检索 Split 请求最多 `K+n` 个候选，局部 offset 为 `0`；最终由 Doris TopN 应用用户 offset。

