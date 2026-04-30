---
{
    "title": "性能调优流程指南",
    "language": "zh-CN",
    "description": "Doris 慢查询如何系统化调优？本文给出四步调优流程：慢 SQL 定位、Schema 调优、计划调优、执行调优，覆盖工具与场景。",
    "keywords": ["Doris 性能调优", "慢查询定位", "Schema 调优", "执行计划调优", "Profile 分析", "调优流程"]
}
---

<!-- 知识类型：流程方法论 -->
<!-- 适用场景：慢查询调优、性能瓶颈定位、系统化性能优化 -->

Doris 性能调优是系统工程，需要方法论指导。Doris 提供[诊断工具](diagnostic-tools.md)和[分析工具](analysis-tools.md)支持系统化诊断，可高效完成性能问题的定位、分析与解决。

**调优前自检 Checklist：**

- 已确认存在慢 SQL 或性能下降现象
- 可访问 FE 节点日志或 Doris Manager
- 熟悉业务表的 Schema 设计与查询模式
- 了解 `EXPLAIN`、`Profile` 等基础分析工具

完整的调优四步流程如下：

![性能调优流程](/images/query-tuning-steps.jpg)

| 步骤 | 阶段 | 核心目标 | 主要工具 |
| --- | --- | --- | --- |
| 第 1 步 | 慢查询定位 | 找出待优化的 SQL | Doris Manager、`fe.audit.log`、`audit_log` 表 |
| 第 2 步 | Schema 调优 | 排除设计层瓶颈 | 分区分桶、索引、Colocate Group |
| 第 3 步 | 计划调优 | 优化执行计划 | `EXPLAIN`、物化视图、Hint |
| 第 4 步 | 执行调优 | 优化运行时性能 | `Profile`、Runtime Filter、并行度参数 |

## 第 1 步：慢查询定位

<!-- 知识类型：操作指引 -->
<!-- 适用场景：识别需要调优的慢 SQL -->

**目的**：从业务系统中筛选出需要调优的慢 SQL。

**操作方式**：

| 场景 | 推荐方式 | 说明 |
| --- | --- | --- |
| 已部署 Doris Manager | 使用 Manager 日志页面 | 可视化界面，便于筛选与排序 |
| 未部署 Doris Manager | 查询 FE 节点的 `fe.audit.log` 或 `audit_log` 系统表 | 获取慢 SQL 列表后按优先级排序调优 |

更多工具用法请参考[诊断工具](diagnostic-tools.md)。

## 第 2 步：Schema 设计与调优

<!-- 知识类型：调优方法 -->
<!-- 适用场景：因表结构或索引设计不合理导致的性能问题 -->

定位慢 SQL 后，优先检查业务 Schema 设计，排除设计层导致的性能问题。Schema 调优分为三个方面：

| 调优方向 | 主要内容 | 参考文档 |
| --- | --- | --- |
| 表级 Schema 调优 | 分区分桶个数、字段类型 | [优化表 Schema](../tuning/tuning-plan/optimizing-table-schema.md) |
| 索引设计调优 | 前缀索引、Bloom Filter、倒排索引等 | [优化表索引](../tuning/tuning-plan/optimizing-table-index.md) |
| 特定优化手段 | Colocate Group 等 | [使用 Colocate Group 优化 Join](../tuning/tuning-plan/optimizing-join-with-colocate-group.md) |

详细案例请参考 [计划调优](../tuning/tuning-plan/optimizing-table-schema.md)。

## 第 3 步：计划调优

<!-- 知识类型：调优方法 -->
<!-- 适用场景：执行计划不合理导致的性能瓶颈 -->

完成 Schema 检查后进入调优主体阶段。该阶段充分利用 Doris 各层级的 `EXPLAIN` 工具，系统分析慢 SQL 的执行计划，定位关键优化点。

**按场景分类的调优手段：**

-   **单表查询/分析场景**
    -   分析执行计划，确认[分区裁剪](../tuning/tuning-plan/optimizing-table-scanning.md)是否生效
    -   [使用单表物化视图加速查询](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md)

-   **复杂多表分析场景**
    -   分析 Join Order 是否合理，定位性能瓶颈
    -   [使用多表物化视图透明改写](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md)加速查询
    -   通过 Hint 手工绑定执行计划：
        -   [使用 Leading Hint 控制 Join Order](../tuning/tuning-plan/reordering-join-with-leading-hint.md)
        -   [使用 Shuffle Hint 调整 Join Shuffle 方式](../tuning/tuning-plan/adjusting-join-shuffle.md)
        -   [使用 Hint 控制代价改写行为](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)

-   **特定加速场景**
    -   [使用 SQL Cache 加速查询](../sql-cache-manual.md)

详细案例请参考 [计划调优](../tuning/tuning-plan/optimizing-table-schema.md)。

## 第 4 步：执行调优

<!-- 知识类型：调优方法 -->
<!-- 适用场景：执行计划合理但运行时性能不达预期 -->

执行调优阶段需要根据 SQL 实际运行情况，验证计划调优效果，并继续分析执行侧瓶颈，例如执行阶段耗时分布、并行度不足等。

**以多表分析查询为例，可通过 Profile 检查：**

-   计划规划的 Join 顺序是否合理
-   Runtime Filter 是否生效
-   并行度是否符合预期
-   机器负载情况（如 IO 慢、网络传输性能不达预期）

针对机器负载类问题，需要使用系统级别工具辅助诊断。详细案例请参考 [执行调优](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)。

:::tip 提示
分析具体性能问题时，**推荐先检查计划，后调优执行**。先用 `EXPLAIN` 确认执行计划，再用 `Profile` 定位执行性能。顺序颠倒可能导致效率低下，不利于快速定位问题。
:::

## 常见问题

<!-- 知识类型：FAQ -->
<!-- 适用场景：调优过程中常见疑问 -->

**Q1：调优时应该先做 Schema 调优还是先做计划调优？**

应优先做 Schema 调优。Schema 设计不合理（如分区分桶字段错误、缺少必要索引）会导致执行计划本身无法优化，先解决 Schema 问题可避免在错误的基础上反复调优。

**Q2：`EXPLAIN` 与 `Profile` 的区别是什么？**

| 工具 | 输出内容 | 使用阶段 |
| --- | --- | --- |
| `EXPLAIN` | 静态执行计划（不实际运行） | 计划调优 |
| `Profile` | 实际运行的耗时与资源指标 | 执行调优 |

**Q3：Join Order 不合理怎么办？**

观察 `EXPLAIN` 输出，使用 [Leading Hint](../tuning/tuning-plan/reordering-join-with-leading-hint.md) 手工指定 Join 顺序。

**Q4：发现 IO 慢、网络慢等问题如何处理？**

`Profile` 可反馈机器负载情况，但根因定位需要结合操作系统级工具（如 `iostat`、`sar`、`netstat`）排查硬件或网络瓶颈。

## 总结

Doris 提供多维度调优工具，支持从慢查询定位、Schema 设计、执行计划到运行时性能的全链路诊断。建议业务人员与 DBA 按"定位 → Schema → 计划 → 执行"的四步流程进行系统化调优，以充分释放 Doris 的性能优势。
