---
{
    "title": "调优流程",
    "language": "zh-CN",
    "description": "性能调优是一个系统工程，需要一个完善的方法论和实施体系，来进行系统化的诊断和调优。Doris 系统有了诊断工具和分析工具的强大支持，可以高效的进行性能问题的诊断，分析定位和调优解决。完整的调优四步流程如下所示："
}
---

## 概述

性能调优是一个系统工程，需要一个完善的方法论和实施体系，来进行系统化的诊断和调优。Doris 系统有了[诊断工具](diagnostic-tools.md)和[分析工具](analysis-tools.md)的强大支持，可以高效的进行性能问题的诊断，分析定位和调优解决。完整的调优四步流程如下所示：

![性能调优流程](/images/query-tuning-steps.jpg)

## 第 1 步：使用性能诊断工具进行慢查询定位

针对运行在 Doris 上的业务系统，使用上述性能[诊断工具](diagnostic-tools.md)进行慢 SQL 的定位。

- 如果已经安装了 Doris Manager，推荐使用 Manager 日志页面，方便的进行可视化的慢查询定位。
- 如果没有安装 Manager，可以直查 FE 节点上的 `fe.audit.log` 或者 audit_log 系统表来获取慢 SQL 列表，按优先级进行调优。

## 第 2 步：Schema 设计与调优

定位到具体的慢 SQL 之后，优先需要对业务 Schema 设计进行检查与调优，排除因为 Schema 设计不合理导致的性能问题。

Schema 设计调优基本可分为三个方面：

- [表级别 Schema 设计调优](../tuning/tuning-plan/optimizing-table-schema.md)，如分区分桶个数和字段调优；
- [索引的设计和调优](../tuning/tuning-plan/optimizing-table-index.md)；
- 特定优化手段的使用，如[使用 Colocate Group 优化 Join](../tuning/tuning-plan/optimizing-join-with-colocate-group.md) 等。主要目的是排除因为 Schema 设计不合理或者没有充分利用 Doris 现有优化能力导致的性能问题。

详细调优案例请参考文档 [计划调优](../tuning/tuning-plan/optimizing-table-schema.md)。

## 第 3 步：计划调优

检查和优化完业务 Schema 后，将进入调优的主体工作，即计划调优与执行调优。如上所述，在性能调优工具中，这个阶段的主要工作是充分利用 Doris 所提供的各种层级的 Explain 工具，对慢 SQL 的执行计划进行系统分析，以找到关键优化点进行针对性优化。

- 针对单表查询和分析场景，可以通过分析执行计划，查看[分区裁剪](../tuning/tuning-plan/optimizing-table-scanning.md)是否正常，[使用单表物化视图进行查询加速](../tuning/tuning-plan/transparent-rewriting-with-sync-mv.md)等。
- 针对复杂多表分析场景，可以分析 Join Order 是否合理等定位具体的性能瓶颈，也可以[使用多表物化视图进行透明改写](../tuning/tuning-plan/transparent-rewriting-with-async-mv.md)，以加速查询。如果出现非预期的情况，比如 Join Order 不合理，通过观察 Explain 的结果，手工指定 Join Hint 进行执行计划的绑定，如[使用 Leading hint 控制 Join Order](../tuning/tuning-plan/reordering-join-with-leading-hint.md)，[使用 Shuffle Hint 调整 Join shuffle 方式](../tuning/tuning-plan/adjusting-join-shuffle.md)，[使用 Hint 控制代价改写行为](../tuning/tuning-plan/controlling-hints-with-cbo-rule.md)等，以达到调优执行计划的目的。
- 针对部分特定场景，还可以通过使用 Doris 提供的高级功能，比如[使用 SQL Cache 加速查询](../tuning/tuning-plan/accelerating-queries-with-sql-cache.md)。

详细调优案例请参考文档 [计划调优](../tuning/tuning-plan/optimizing-table-schema.md)。

## 第 4 步：执行调优

进入执行调优阶段后，需要根据 SQL 的实际运行情况，一方面验证计划调优的效果，另外一方面在现有计划的前提下，继续分析执行侧的瓶颈点，定位哪个执行阶段慢，或者其他普遍性的原因，如并行度不优等。

以多表分析的查询为例，我们可以通过分析 Profile，来检查计划规划的 Join 顺序是否合理，Runtime Filter 是否生效，并行度是否符合预期等。此外 Profile 还能反馈出一些机器负载的情况，例如 io 慢，网络传输性能不符合预期等。在对这类问题进行确认和定位时，需要使用系统级别的工具来辅助诊断和调优。

详细调优案例请参考文档 [执行调优](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)。

:::tip 提示
在分析具体性能问题的时候，推荐先检查计划，后调优执行的顺序。首先利用 Explain 工具进行执行计划的确认，然后再利用 Profile 工具进行执行性能的定位和调优。如果使用顺序颠倒，有可能会导致效率低下，不利于性能问题的快速定位。
:::

## 总结

查询调优是一个系统工程，Doris 为用户提供了各个维度的工具，方便从不同层面进行性能问题的诊断、定位、分析与解决。业务人员和 DBA 熟悉了这些诊断和分析工具后，使用合理的调优方法，能够快速有效的解决性能瓶颈，更好的释放 Doris 强大的性能优势，更好的适配业务场景进行业务赋能。
