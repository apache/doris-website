---
{
    "title": "常见调优参数",
    "language": "zh-CN",
    "description": "Apache Doris常见调优参数指南：详解enable_nereids_planner新优化器开关、enable_nereids_dml DML支持、parallel_pipeline_task_num并行度配置、runtime_filter_mode运行时过滤模式等关键参数的作用场景、默认值和升级迁移设置建议，帮助用户优化查询性能和系统配置。"
}
---

| 参数                       | 说明                        | 默认值 | 使用场景                                                     |
| -------------------------- | --------------------------- | ------ | ------------------------------------------------------------ |
| enable_nereids_planner     | 是否打开新优化器            | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true  |
| enable_nereids_dml         | 是否启用新优化器的 DML 支持 | TRUE   | 低版本升级等场景，此开关初始为 false；升级后，可设置为 true  |
| parallel_pipeline_task_num | Pipeline 并行度             | 0      | 低版本升级等场景，此值为之前设置的固定值；升级后，可设置为 0，表示由系统自适应策略决定并行度 |
| runtime_filter_mode        | Runtime Filter 类型         | GLOBAL | 低版本升级等场景，此值为 NONE，表示不启用 Runtime Filter；升级后，可设置为 GLOBAL，表示默认启用 Runtime Filter |

