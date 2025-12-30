---
{
    "title": "Release 3.1.4",
    "language": "zh-CN",
    "description": "Apache Doris 3.1.4 带来了以下主要改进："
}
---

## 新功能（New Features）

### 查询与优化器

- 支持 Dereference Expression（解引用表达式）[#58550](https://github.com/apache/doris/pull/58550)

### 数据湖

- Catalog 支持通过 `AwsCredentialsProviderChain` 加载凭证 [#59054](https://github.com/apache/doris/pull/59054)
- 支持将 `credentials_provider_type` 传递给 BE 用于 S3 访问 [#59158](https://github.com/apache/doris/pull/59158)
- 支持 Elasticsearch flatten 类型 [#58793](https://github.com/apache/doris/pull/58793)
  - 
  - 

### 查询审计与可观测性

- 支持在审计日志中对 SQL 进行加密存储 [#58508](https://github.com/apache/doris/pull/58508)
- QueryPlanAction 支持将表查询计划中的 SQL 写入审计日志 [#59121](https://github.com/apache/doris/pull/59121)
- 为 Nereids 解析的语句生成 SQL Digest [#59215](https://github.com/apache/doris/pull/59215)

## 优化（Optimizations & Improvements）

### 查询优化器

- 调整类型推导与强制转换（coercion）行为，提升表达式一致性 [#57961](https://github.com/apache/doris/pull/57961)
- 防止分析任务污染列统计信息缓存，提升统计准确性 [#58742](https://github.com/apache/doris/pull/58742)
- 优化多 distinct 聚合函数的拆分执行能力 [#58973](https://github.com/apache/doris/pull/58973)
- 优化 Join / Set / CTE / 谓词下推规则，避免不必要的执行计划复杂化 [#58664](https://github.com/apache/doris/pull/58664), [#59141](https://github.com/apache/doris/pull/59141), [#59151](https://github.com/apache/doris/pull/59151)

### 数据湖

- 加速 Hive 分区裁剪与写入性能，显著降低大分区表写入延迟 [#58886](https://github.com/apache/doris/pull/58886), [#58932](https://github.com/apache/doris/pull/58932)
- Iceberg 支持忽略 dangling delete 以提升 count 下推能力 [#59069](https://github.com/apache/doris/pull/59069)
- Iceberg REST Catalog 增强连通性检测与网络超时控制 [#58433](https://github.com/apache/doris/pull/58433), [#58434](https://github.com/apache/doris/pull/58434)
- Paimon 增量查询行为与 Spark 对齐（单 snapshot 场景） [#58253](https://github.com/apache/doris/pull/58253)

### 存算分离

- 支持动态修改 tablet rebalancer 配置，提升云环境运维灵活性 [#58376](https://github.com/apache/doris/pull/58376)
- 优化存算分离场景下 TopN 查询，避免不必要的远程广播读 [#58112](https://github.com/apache/doris/pull/58112), [#58155](https://github.com/apache/doris/pull/58155)
- 提升升级过程中的 tablet 性能一致性，降低热点节点风险 [#58247](https://github.com/apache/doris/pull/58247)
- Schema Change 过程自适应 File Cache，降低大表变更对缓存命中率的影响 [#58622](https://github.com/apache/doris/pull/58622)
- 在 Profile 中增加下载等待时间指标，提升 IO 排查能力 [#58870](https://github.com/apache/doris/pull/58870)
- File Cache 增强调试能力，支持 LRU Dump [#58871](https://github.com/apache/doris/pull/58871)
  - 

### 安全与稳定性

- Glue Catalog 强制使用 HTTPS，提升外部 Catalog 安全性 [#58366](https://github.com/apache/doris/pull/58366)
- Create Stage 增加 SSRF 安全校验 [#58874](https://github.com/apache/doris/pull/58874)

## Bug 修复

### 查询优化器

- 修复 TopN / Limit / Join 规则在特定场景下可能触发的死循环问题 [#58697](https://github.com/apache/doris/pull/58697)
- 修复聚合、窗口函数、Repeat、类型转换等逻辑错误 [#58080](https://github.com/apache/doris/pull/58080), [#58114](https://github.com/apache/doris/pull/58114), [#58330](https://github.com/apache/doris/pull/58330), [#58548](https://github.com/apache/doris/pull/58548)

### 物化视图

- 禁止在 MOW 表上创建包含 value 列条件的非法物化视图 [#57937](https://github.com/apache/doris/pull/57937)

### 导入

- 修复 JSON Reader 多次调用导致的未定义行为，避免潜在数据错误 [#58192](https://github.com/apache/doris/pull/58192)
- 修复 Broker Load 中 `COLUMNS FROM PATH` 相关行为异常 [#58351](https://github.com/apache/doris/pull/58351), [#58904](https://github.com/apache/doris/pull/58904)
- 修复 Group Commit 在节点下线或退役场景下的异常行为 [#59118](https://github.com/apache/doris/pull/59118)
- 修复 Load / Delete / Partial Update 在部分边界条件下失败的问题 [#58553](https://github.com/apache/doris/pull/58553), [#58230](https://github.com/apache/doris/pull/58230), [#59096](https://github.com/apache/doris/pull/59096)

### 存算分离

- 修复存算分离场景下 Tablet Drop、Compaction、首次启动慢等稳定性问题 [#58157](https://github.com/apache/doris/pull/58157), [#58195](https://github.com/apache/doris/pull/58195), [#58761](https://github.com/apache/doris/pull/58761)
- 修复 File Cache 在异常或 BE 宕机场景下可能导致的崩溃与资源泄漏问题 [#58196](https://github.com/apache/doris/pull/58196), [#58819](https://github.com/apache/doris/pull/58819), [#59058](https://github.com/apache/doris/pull/59058)
- 修复 Compaction 后 Segment Footer Cache 未清理导致的读行为异常问题 [#59185](https://github.com/apache/doris/pull/59185)
- 修复 Copy Into 在 ORC / Parquet 格式下执行失败的问题 [#58551](https://github.com/apache/doris/pull/58551)