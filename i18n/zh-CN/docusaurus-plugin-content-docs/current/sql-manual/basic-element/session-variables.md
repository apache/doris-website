---
{
    "title": "会话变量列表",
    "language": "zh-CN",
    "description": "Doris 会话变量（Session Variable）的取值、默认值与作用说明。"
}
---

:::caution 本页面正在建设中，尚不完善

本页面用于集中说明 Doris 的会话变量（Session Variable）。目前只收录了近期版本中**新增、默认值变更或已移除**的变量，尚未覆盖全部会话变量。未在本页出现的变量，可通过 `SHOW VARIABLES LIKE '<pattern>'` 查看当前取值。

关于变量的分类、作用域与设置方式，请参阅 [变量](./variables.md)。

:::

## 查看与设置

```sql
-- 查看
SHOW VARIABLES LIKE 'enable_file_scanner_v2';

-- 仅当前会话生效
SET enable_file_scanner_v2 = false;

-- 全局生效（对后续新建的会话生效）
SET GLOBAL enable_file_scanner_v2 = false;
```

## 4.1.4 版本变更概览

| 类别 | 变量 |
| --- | --- |
| 新增 | `enable_file_scanner_v2`、`enable_expr_zonemap_filter`、`enable_local_exchange_before_agg`、`enable_local_exchange_before_streaming_agg`、`runtime_filter_broadcast_join_producer_num`、`runtime_filter_tree_publish_max_send_bytes`、`bucket_shuffle_downgrade_ratio`、`eager_aggregation_on_broadcast_join`、`eager_agg_broadcast_row_count`、`force_eager_agg_hint`、`enable_topn_lazy_mat_phase2_no_write_file_cache`、`file_cache_query_limit_bytes`、`file_presigned_url_ttl_seconds`、`force_forward_all_queries` |
| 语义变更 | `enable_runtime_filter_partition_prune`、`enable_nereids_distribute_planner` |
| 移除 | `eager_aggregation_on_join`、`plan_nereids_dump` |

## 外表扫描

### `enable_file_scanner_v2`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 新增 |

是否使用 File Scanner V2 扫描外部文件。开启后，`FileScanNode` 在支持的查询场景下使用新的原生扫描引擎，覆盖 Parquet、ORC、CSV、JSON 格式以及 Hive、Iceberg、Paimon、Hudi 等表格式。JDBC Catalog、Iceberg 系统表等场景仍走旧的扫描路径。

怀疑查询问题与新扫描器相关时，可以设置为 `false` 做对比验证。详见 [数据湖查询调优](../../lakehouse/best-practices/optimization.md)。

### `enable_expr_zonemap_filter`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 新增 |

控制**遵循该变量的扫描器**是否启用表达式 ZoneMap 过滤。

File Scanner V2 始终启用安全的表达式 ZoneMap 过滤，不受该变量影响。

### `enable_runtime_filter_partition_prune`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 语义变更 |

控制**遵循该变量的扫描器**是否启用 Runtime Filter 分区裁剪。

自 4.1.4 版本起，File Scanner V2 始终启用安全的分区裁剪，把该变量设置为 `false` 对 File Scanner V2 无效。

## 查询规划与执行

### `enable_nereids_distribute_planner`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 升级行为变更 |

是否使用 Nereids 分布式规划器。

自 4.1.4 版本起，升级会把该变量的**全局默认值刷新为 `true`**，即使集群元数据中此前持久化的是 `false`。升级后如果观察到查询计划的分布方式与升级前不同，可执行 `SET GLOBAL enable_nereids_distribute_planner = false;` 回退。

### `runtime_filter_broadcast_join_producer_num`

| 项 | 值 |
| --- | --- |
| 类型 | Int |
| 默认值 | `3` |
| 版本 | 4.1.4 新增 |

Broadcast Join 场景下，每个 Runtime Filter 的生产者 BE 数量上限。小于等于 `0` 表示不限制。

Broadcast Join 的 Runtime Filter 由所有 Build 端 BE 重复生成同一份内容，限制生产者数量可以显著降低大集群下的 RPC 开销。仅对 Nereids 分布式规划路径生效，旧的 Coordinator 路径保持原有行为。

### `runtime_filter_tree_publish_max_send_bytes`

| 项 | 值 |
| --- | --- |
| 类型 | Long（字节） |
| 默认值 | `268435456`（256MB） |
| 版本 | 4.1.4 新增 |

全局 Runtime Filter 分发时，单次 RPC 发送的最大字节数。超过该阈值时改用树形（多级）分发，避免合并节点向所有 Scan 节点重复发送大 Filter。

取值为 `0` 表示关闭树形分发，退回直接分发。取值必须大于等于 `0`，否则设置时报错。

### `bucket_shuffle_downgrade_ratio`

| 项 | 值 |
| --- | --- |
| 类型 | Double |
| 默认值 | `0.8` |
| 版本 | 4.1.4 新增（实验性） |

当基表一侧的总桶数小于「总实例数 × 该比例」时，放弃 Bucket Shuffle Join，降级为普通 Shuffle Join。取值小于等于 `0` 时永不降级。默认值 `0.8` 保持原有行为。

### `enable_local_exchange_before_agg`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 新增 |

聚合算子之前是否插入 Local Exchange。

:::caution 注意
不建议关闭。4.1.4 之前的实现中，关闭该行为在串行 / 非 Hash Local Exchange 场景下可能返回**错误结果**，该问题已在 4.1.4 修复。
:::

### `enable_local_exchange_before_streaming_agg`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `false` |
| 版本 | 4.1.4 新增 |

Streaming 聚合算子之前是否插入 Local Exchange。

### `eager_aggregation_on_broadcast_join`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `true` |
| 版本 | 4.1.4 新增 |

是否允许在 Broadcast Join 上做 Eager Aggregation（聚合下推）。

### `eager_agg_broadcast_row_count`

| 项 | 值 |
| --- | --- |
| 类型 | Int |
| 默认值 | `250000` |
| 版本 | 4.1.4 新增 |

Broadcast Join 场景下判断是否做 Eager Aggregation 的行数阈值。

### `force_eager_agg_hint`

| 项 | 值 |
| --- | --- |
| 类型 | String |
| 默认值 | `""`（空） |
| 版本 | 4.1.4 新增 |

用于测试 / 调试 Eager Aggregation 下推的强制匹配 Hint，**不建议在生产环境使用**。

格式为 `<func>:<qualifier.column | *>=<push|nopush>`，多个条目以分号分隔，例如：

```sql
SET force_eager_agg_hint = 'sum:t1.a=push; sum:t2.a=nopush; count:*=push';
```

注意：Hint 按聚合函数匹配，但生效粒度是当前候选下推分支 / 子树，而不是单个聚合函数独立生效。同一分支中只要有任一匹配项为 `nopush`，该分支本次就不下推；否则只要有任一匹配项为 `push`，该分支本次可被强制下推，同分支内其他聚合函数会跟随这一分支级决定。

### `force_forward_all_queries`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `false` |
| 版本 | 4.1.4 新增 |

开启后，当前会话的所有查询都会被转发到 Master FE 执行。可用于排查主从 FE 元数据不一致导致的问题。该变量是 FE 同名配置的会话级开关。

## 缓存

### `file_cache_query_limit_bytes`

| 项 | 值 |
| --- | --- |
| 类型 | Long（字节） |
| 默认值 | `-1` |
| 版本 | 4.1.4 新增 |

单个查询在每个 BE 上最多允许通过 Read-Through 写入 File Cache 的远端扫描字节数：

- 小于 `0`：不限制（关闭该功能）；
- 等于 `0`：查询从一开始就不写 File Cache；
- 大于 `0`：累计远端扫描量达到该阈值后，不再写 File Cache。

用于避免一次性的大扫描把热数据从缓存中挤出。

### `enable_topn_lazy_mat_phase2_no_write_file_cache`

| 项 | 值 |
| --- | --- |
| 类型 | Boolean |
| 默认值 | `false` |
| 版本 | 4.1.4 新增 |

开启后，TopN 延迟物化第二阶段的读取在 File Cache 未命中时直接读远端，并且**不把该次读取的数据写回 File Cache**。适用于 TopN 第二阶段读取模式随机、缓存命中率低的场景。

## AI 函数

### `file_presigned_url_ttl_seconds`

| 项 | 值 |
| --- | --- |
| 类型 | Long（秒） |
| 默认值 | `3600` |
| 版本 | 4.1.4 新增 |

多模态 `EMBED()` 场景中，为 S3 兼容存储对象生成的预签名 URL 的有效期。媒体文件较大、Provider 拉取耗时较长时可以适当调大。详见 [EMBED](../sql-functions/ai-functions/distance-functions/embed.md)。

## 已移除的变量

| 变量 | 移除版本 | 说明 |
| --- | --- | --- |
| `eager_aggregation_on_join` | 4.1.4 | 聚合下推策略调整，改用 `eager_aggregation_on_broadcast_join` 与 `eager_agg_broadcast_row_count` 控制。脚本中如仍设置该变量，需要删除 |
| `plan_nereids_dump` | 4.1.4 | 改为内部状态，仅在回放 Minidump 时由系统内部开启，不再支持通过 `SET` 设置 |
