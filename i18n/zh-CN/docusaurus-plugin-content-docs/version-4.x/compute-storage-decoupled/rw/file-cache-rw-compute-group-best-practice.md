---
{
    "title": "读写分离场景 File Cache 缓存优化最佳实践",
    "sidebar_label": "读写分离: File Cache 优化",
    "language": "zh-CN",
    "description": "介绍 Apache Doris 存算分离读写分离场景下，如何通过缓存预热配置解决只读计算组 Cache Miss 问题，提升查询性能稳定性。",
    "keywords": ["File Cache", "缓存预热", "读写分离", "Cache Miss", "计算组", "存算分离", "Compaction", "查询性能"]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 性能调优 / 读写分离部署 -->

在 Apache Doris 存算分离架构中，当部署多个计算组（Compute Group）实现读写分离时，查询性能高度依赖 File Cache 的命中率。只读计算组（Read-Only Compute Group）发生缓存未命中（Cache Miss）时，需从远端对象存储拉取数据，会导致查询延迟（Query Latency）显著增加。

本文介绍如何通过缓存预热及相关配置，减少 **Compaction**、**数据导入（Data Ingestion）** 和 **Schema Change** 等场景引起的缓存未命中问题，从而保障只读集群的查询性能稳定性。

## 核心问题：新数据版本（Rowset）引发的缓存失效

<!-- 知识类型: 原理说明 -->

在 Doris 中，Compaction、Schema Change 和数据导入都会生成新的数据文件集合（Rowset）。写入计算组（Write-Only Compute Group）在写入时会将数据默认缓存到本地 File Cache，因此该计算组的查询性能不受影响。

对于只读计算组，当其同步元数据并感知到新 Rowset 时，本地缓存中并没有这些新数据。此时若有查询访问新 Rowset，就会触发缓存未命中，导致性能下降。

**核心思路：让数据在被查询之前，提前或智能地加载到只读计算组的缓存中。**

## 缓存预热机制概览

<!-- 知识类型: 功能概述 -->
<!-- 适用场景: 部署前规划 -->

缓存预热（Cache Warm-up）是主动将远端存储中的数据加载到 BE 节点 File Cache 的过程。Doris 提供两种主要的预热方式：

| 预热方式 | 适用场景 | 特点 |
| --- | --- | --- |
| 主动增量预热 | 大多数场景，用户有权限配置预热关系 | 智能自动化，推荐优先使用 |
| 只读计算组自动预热 | 无权配置预热关系，或使用非 MoW 表 | 轻量级，配置简单 |

### 主动增量预热（推荐）

<!-- 知识类型: 操作步骤 -->

通过在写入计算组和只读计算组之间建立预热关系，当写入或 Compaction 等事件产生新 Rowset 时，主动通知并触发关联的只读计算组进行异步缓存预热。

详细配置方法请参考：[FileCache 主动增量预热](./read-write-separation)。

### 只读计算组自动预热

<!-- 知识类型: 配置参数 -->

在只读计算组的 BE 节点上开启配置后，系统在感知到新 Rowset 时自动触发异步预热任务。

在只读计算组的 `be.conf` 中设置：

```properties
enable_warmup_immediately_on_new_rowset = true
```

## 优化 Compaction / Schema Change 对查询性能的影响

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 / 性能调优 -->

后台 Compaction 会合并旧的 Rowset 并生成新的 Rowset。如果新 Rowset 未被预热，只读计算组的查询性能会因 Cache Miss 出现抖动。以下提供两种解决方案。

### 方案一：主动增量预热 + 延迟提交（推荐）

该方案从根本上避免只读计算组查询到未缓存的、由 Compaction / Schema Change 产生的新 Rowset。

**实现原理：**

1. 配置写入计算组和只读计算组之间的主动增量预热关系。
2. 在写入计算组的 BE 节点上，开启 Compaction / Schema Change 延迟提交功能。

在写入计算组的 `be.conf` 中设置：

```properties
enable_compaction_delay_commit_for_warm_up = true
```

**工作流程：**

1. Compaction / Schema Change 任务在写入计算组上完成，生成新 Rowset。
2. 新 Rowset **不会立刻提交生效**（对只读计算组不可见）。
3. 系统触发关联的只读计算组对新 Rowset 进行缓存预热。
4. 所有关联只读计算组完成预热后，新 Rowset 才最终提交，对所有计算组可见。

**优势：**

- **无感知切换**：所有对只读计算组可见的 Compaction 后数据均已在缓存中，查询性能不出现抖动。
- **高稳定性**：是读写分离场景下保障查询性能最稳健的方案。

### 方案二：只读计算组自动预热 + 查询感知

该方案通过查询层的智能选择，尽量跳过尚未预热完成的新 Rowset。

> **注意**：对于 Unique Key MoW 表，因正确性要求，Compaction 产生的 Rowset 无法跳过。

**实现步骤：**

1. 在只读计算组的 `be.conf` 中开启自动预热：

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. 在查询时，通过 Session 变量或用户属性开启"预热感知"的 Rowset 选择策略：

    设置查询会话：

    ```sql
    SET enable_prefer_cached_rowset = true;
    ```

    或设置用户属性：

    ```sql
    SET property for "jack" enable_prefer_cached_rowset = true;
    ```

**工作流程：**

1. 只读计算组感知到 Compaction 产生的新 Rowset 时，异步触发预热任务。
2. 开启 `enable_prefer_cached_rowset` 后，查询执行器优先选择已预热完成的 Rowset 版本。
3. 对于尚在预热中的新 Rowset，在不影响数据一致性的前提下，查询自动忽略并访问合并前的旧 Rowset。

**注意事项：**

此方案是"尽力而为"的策略。若新 Rowset 对应的旧 Rowset 已被清理，或查询必须访问最新数据版本，查询仍需等待预热完成或直接访问冷数据。

## 优化数据导入对查询性能的影响

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 高频写入 / 实时导入性能优化 -->

高频数据导入（如 `INSERT INTO`、`Stream Load`）会持续产生新的小文件（Rowset），给只读计算组带来 Cache Miss 问题。若业务可以容忍秒级或亚秒级的数据延迟，可采用以下组合策略，以极小的"数据新鲜度"代价换取显著的性能提升。

**实现原理：** 结合自动预热与查询时的新鲜度容忍度设置，让查询执行器智能跳过在指定时间窗口内尚未预热完成的最新数据。

**实施步骤：**

1. **开启预热机制**：在只读计算组上开启主动增量预热，或开启只读计算组自动预热：

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. **设置查询新鲜度容忍度**：在只读计算组的查询会话或用户属性中设置 `query_freshness_tolerance_ms`：

    设置查询会话：

    ```sql
    -- 设置可以容忍 1000 毫秒（1 秒）的数据延迟
    SET query_freshness_tolerance_ms = 1000;
    ```

    或设置用户属性：

    ```sql
    SET property for "jack" query_freshness_tolerance_ms = 1000;
    ```

**工作流程：**

1. 查询开始执行时，检查需要访问的 Rowset。
2. 若某 Rowset 在**最近 1000 ms 内**生成且**尚未预热完成**，查询执行器自动跳过，转而访问较旧但已缓存的数据。
3. 绝大多数查询命中缓存，避免因读取最新写入的冷数据导致的性能下降。

**回退机制：** 若某 Rowset 的预热超过 `query_freshness_tolerance_ms` 设置的时间仍未完成（例如超过 1000 ms），为保证数据最终可见性，查询不再跳过，回退到直接读取冷数据的默认行为。

**优势：**

- **性能提升显著**：对高吞吐写入场景，能有效消除查询性能毛刺。
- **灵活性高**：用户可根据业务需求，在数据新鲜度和查询性能之间灵活权衡。

## 方案对比与选型建议

<!-- 知识类型: 架构选型决策 -->

| 方案 | 适用场景 | Compaction 影响 | Schema Change 影响 | 新写入数据影响 |
| --- | --- | --- | --- | --- |
| 主动增量预热 + 延迟提交（+ 可选数据新鲜度容忍） | 查询 Latency 要求极高，有权限配置预热关系 | 无 | 无 | 取决于新鲜度容忍时间配置 |
| 只读计算组自动预热 + 优先缓存数据（+ 可选数据新鲜度容忍） | 无权配置预热关系；未配置新鲜度容忍时对 MoW 主键表无效 | 无 | Cache Miss | 取决于新鲜度容忍时间配置 |

通过合理运用上述缓存预热策略和相关配置，可以有效管理 Apache Doris 在读写分离架构下的缓存行为，最大限度减少缓存未命中带来的性能损失，确保只读查询业务稳定高效运行。

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 故障排查 / 运维答疑 -->

**Q：主动增量预热和只读计算组自动预热可以同时开启吗？**

可以。两者不互斥，同时开启可以提高预热覆盖率。建议优先依赖主动增量预热，自动预热作为补充。

**Q：开启延迟提交后，Compaction 结果何时对外可见？**

待所有关联只读计算组完成预热后，Compaction 结果才会提交并对全部计算组可见。若预热超时，系统会强制提交以保证 Compaction 流程不阻塞。

**Q：`query_freshness_tolerance_ms` 设置多大合适？**

建议根据业务对数据延迟的容忍度设置。通常 500–2000 ms 可兼顾性能与新鲜度。若业务对实时性要求极高，不建议开启该配置。

**Q：为什么 MoW 主键表的 Compaction Rowset 无法跳过？**

MoW（Merge-on-Write）表的删除语义依赖 Compaction 后的数据版本，跳过可能导致查询结果不正确，因此系统强制读取最新 Rowset。

**Q：只读计算组查询性能突然下降，如何快速排查？**

1. 检查 BE 监控中的 File Cache 命中率指标，确认是否存在大量 Cache Miss。
2. 确认是否有近期的 Compaction、Schema Change 或大批量数据导入操作。
3. 检查是否已正确配置预热机制（`enable_warmup_immediately_on_new_rowset` 或主动增量预热）。
4. 检查预热任务的执行状态，确认预热是否正常完成。
