---
{
    "title": "Doris 常见调优参数配置指南",
    "language": "zh-CN",
    "description": "Apache Doris 调优参数怎么配置？本文详解新优化器、Pipeline 并行度、Runtime Filter 等关键参数的默认值、使用场景与升级迁移建议。",
    "keywords": ["Doris 调优参数", "enable_nereids_planner", "parallel_pipeline_task_num", "runtime_filter_mode", "Doris 升级配置"]
}
---

<!-- 知识类型：参考手册 / 配置清单 -->
<!-- 适用场景：Doris 升级后参数迁移、查询性能调优、Session 变量配置 -->

本文汇总 Apache Doris 中影响查询性能的常见 Session 变量，帮助用户在升级或调优时快速定位关键开关。

## 调优前检查清单

<!-- 知识类型：操作清单 -->
<!-- 适用场景：升级后初次配置、查询性能排查 -->

- 确认当前 Doris 版本是否支持新优化器（Nereids）。
- 确认是否从低版本升级，是否需要重置历史 Session 变量。
- 评估集群资源（CPU 核数）以决定并行度策略。
- 评估查询场景是否适合启用 Runtime Filter。

## 核心调优参数一览

<!-- 知识类型：参数表 -->
<!-- 适用场景：参数对照、默认值查询 -->

下表汇总了影响查询性能的关键 Session 变量及推荐配置：

| 参数                       | 说明                        | 默认值 | 使用场景                                                                                                       |
| -------------------------- | --------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| enable_nereids_planner     | 是否打开新优化器            | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true                                                    |
| enable_nereids_dml         | 是否启用新优化器的 DML 支持 | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true                                                    |
| parallel_pipeline_task_num | Pipeline 并行度             | 0      | 低版本升级等场景，此值为之前设置的固定值；升级后，可设置为 0，表示由系统自适应策略决定并行度                   |
| runtime_filter_mode        | Runtime Filter 类型         | GLOBAL | 低版本升级等场景，此值为 NONE，表示不启用 Runtime Filter；升级后，可设置为 GLOBAL，表示默认启用 Runtime Filter |

## 参数详解与配置方法

<!-- 知识类型：操作指南 -->
<!-- 适用场景：单参数调整、升级迁移 -->

### 启用新优化器（Nereids Planner）

- **目的**：开启新一代查询优化器以获得更优的执行计划。
- **命令**：

    ```sql
    SET enable_nereids_planner = TRUE;
    ```

- **说明**：低版本升级后该开关可能仍为 `false`，建议手动设置为 `true`。

### 启用新优化器的 DML 支持

- **目的**：让 INSERT、UPDATE、DELETE 等 DML 语句也走新优化器。
- **命令**：

    ```sql
    SET enable_nereids_dml = TRUE;
    ```

- **说明**：升级后建议同步开启，与 `enable_nereids_planner` 配合使用。

### 配置 Pipeline 并行度

- **目的**：让系统自适应决定 Pipeline 的并行度，避免硬编码值不匹配集群规模。
- **命令**：

    ```sql
    SET parallel_pipeline_task_num = 0;
    ```

- **说明**：`0` 表示由系统自适应策略决定；升级前若为固定值，建议改回 `0`。

### 启用 Runtime Filter

- **目的**：在 Join 场景下利用 Runtime Filter 减少数据扫描量。
- **命令**：

    ```sql
    SET runtime_filter_mode = GLOBAL;
    ```

- **说明**：低版本升级后该值可能为 `NONE`，建议改为 `GLOBAL` 以默认启用。

## 升级前后参数对比

<!-- 知识类型：对比表 -->
<!-- 适用场景：版本升级 -->

| 参数                       | 低版本升级后实际值 | 推荐目标值 | 调整后效果           |
| -------------------------- | ------------------ | ---------- | -------------------- |
| enable_nereids_planner     | FALSE              | TRUE       | 启用新优化器         |
| enable_nereids_dml         | FALSE              | TRUE       | DML 走新优化器       |
| parallel_pipeline_task_num | 固定值（历史设定） | 0          | 自适应并行度         |
| runtime_filter_mode        | NONE               | GLOBAL     | 默认启用 Runtime Filter |

## FAQ

<!-- 知识类型：常见问题 -->
<!-- 适用场景：参数配置答疑 -->

### 为什么升级后这些参数没有自动切换为推荐值？

为兼容历史行为，低版本升级到新版本时部分变量保留旧值，需要用户根据业务场景手动调整。

### `parallel_pipeline_task_num = 0` 一定比固定值更快吗？

`0` 表示由系统根据 CPU 核数与查询特征自适应分配，通常更稳健；如有特殊压测场景可设为固定值。

### Runtime Filter 一定要开吗？

绝大多数 Join 场景开启 `GLOBAL` 后能减少右表扫描量；若发现特定查询出现性能回退，可针对该 Session 关闭。

## 相关链接

- [并行度调优](./parallelism-tuning.md)
