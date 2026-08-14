---
{
    "title": "文件缓存配置与使用指南（存算分离）",
    "sidebar_label": "文件缓存配置",
    "language": "zh-CN",
    "description": "介绍存算分离架构下 Doris 文件缓存的配置、索引优先写入、查询级缓存限制、缓存预热与清理、命中率监控及 TTL 策略，助力提升查询性能、降低对象存储成本。",
    "keywords": ["Doris 文件缓存", "存算分离缓存", "file cache", "索引优先缓存", "缓存预热", "缓存配额", "file_cache_query_limit_bytes", "TTL 缓存", "LRU", "缓存命中率", "对象存储加速"]
}
---

<!-- 知识类型: 架构选型决策 -->
<!-- 适用场景: 存算分离部署 / 查询性能优化 / 对象存储成本优化 -->

在存算分离架构中，数据存储于远程对象存储（如 S3、HDFS）。Doris 利用 BE 节点本地磁盘作为文件缓存层，配合多队列 LRU（Least Recently Used）策略高效管理缓存空间，特别优化了索引与元数据的访问路径，以最大化热点数据的缓存命中率。

针对多计算组（Compute Group）场景，Doris 额外提供**缓存预热**功能，在新计算组启动时可主动拉取指定表或分区的数据，快速建立本地缓存，提升首次查询性能。

## 文件缓存的作用

<!-- 知识类型: 架构选型决策 -->

在存算分离架构下，远程存储的访问存在以下两类典型问题：

| 问题类型 | 说明 |
|---|---|
| 高访问延迟 | 对象存储延迟远高于本地磁盘，高并发时尤为明显 |
| QPS / 带宽限制 | 对象存储通常有 QPS 上限与带宽约束，高并发查询易触发瓶颈 |
| 按需计费成本 | 对象存储按请求次数与数据传输量计费，频繁访问会增加运营成本 |

通过将热点数据缓存到本地磁盘，Doris 可以显著降低查询延迟，同时减少对对象存储的直接请求，从而节约成本。

### 缓存的文件类型

Doris 文件缓存主要缓存以下两类文件：

- **Segment 数据文件**：Doris 内表存储数据的基本单元，缓存后可加速数据读取，提升查询性能。
- **Inverted Index 反向索引文件**：用于加速查询中的过滤操作，缓存后可更快定位满足条件的数据，支持复杂查询场景。

## 缓存配置

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 存算分离部署前配置 / BE 参数调优 -->

Doris 通过 BE 配置文件中的以下参数控制文件缓存行为。

### 启用文件缓存

| 参数 | 默认值 | 说明 |
|---|---|---|
| `enable_file_cache` | `false` | 是否启用文件缓存功能。存算分离模式下建议设置为 `true`。 |

### 配置写入路径仅缓存索引

当本地缓存空间有限，并且查询性能更依赖索引和 Segment 元数据时，可以启用索引优先（index-only）写入策略。该策略限制的是导入、Schema Change 和 Compaction 等写入路径向 File Cache **主动写入**的内容，不影响查询读取未命中数据后的缓存回填，也不影响缓存预热。

Doris 提供一个全局策略和两个 Compaction 专用策略：

| 参数 | 类型 | 默认值 | 生效范围 | 说明 |
|---|---|---|---|---|
| `enable_file_cache_write_index_file_only` | Boolean | `false` | 所有存算分离 Rowset 写入，包括导入、Schema Change、Cumulative Compaction 和 Base Compaction | **自 4.0.8 版本起支持。** 设为 `true` 后，不主动缓存 Segment 数据；Segment 关闭后同步预加载其 footer 和内部索引范围，独立倒排索引文件仍写入 File Cache。该参数的优先级高于两个 Compaction 专用参数 |
| `enable_file_cache_write_base_compaction_index_only` | Boolean | `false` | Base Compaction | 仅当 Base Compaction 按原有策略决定写入 File Cache 时，将其输出限制为不主动缓存 Segment 文件、仍缓存独立倒排索引文件。该参数不会使原本不写缓存的 Base Compaction 输出开始写入缓存 |
| `enable_file_cache_write_cumu_compaction_index_only` | Boolean | `false` | Cumulative Compaction | 当 Cumulative Compaction 输出写入 File Cache 时，将其限制为不主动缓存 Segment 文件、仍缓存独立倒排索引文件 |

写入路径按以下优先级决定缓存行为：

1. `enable_file_cache=false` 的优先级最高，禁止所有 File Cache 写入，包括 Segment footer/内部索引预加载和独立倒排索引文件写入。
2. `enable_file_cache=true` 且 `enable_file_cache_write_index_file_only=true` 时，启用全局索引优先写入。此时两个 Compaction 专用参数不再改变最终行为。Segment 数据不会因自适应写入、Compaction 保留策略、缓存命中率阈值或请求级 `write_file_cache` 设置而主动写入缓存；索引相关内容仍按上述全局策略写入。
3. 全局索引优先写入关闭时，Base/Cumulative Compaction 专用参数只进一步限制匹配类型中**原本已决定写入缓存**的输出，不改变其他写入场景或查询读路径。
4. 三个索引优先参数均为 `false` 时，保留现有的主动写缓存、自适应写入和 Compaction 输出保留逻辑。

:::caution 注意

两个 Compaction 专用参数只区分独立倒排索引文件与 Segment 文件，不会触发全局索引优先模式中的 Segment footer/内部索引范围预加载。如果需要同时主动保留独立倒排索引和 Segment 内部索引、元数据，请使用 `enable_file_cache_write_index_file_only`。

:::

#### 全局启用索引优先写入

在所有 BE 节点的 `be.conf` 中配置：

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=true
enable_file_cache_write_base_compaction_index_only=false
enable_file_cache_write_cumu_compaction_index_only=false
```

预期行为如下：

| 场景 | 主动写入 File Cache 的内容 |
|---|---|
| 导入、Schema Change、Cumulative Compaction、Base Compaction | 不主动写入 Segment 数据；同步预加载 Segment footer/内部索引范围；写入独立倒排索引文件 |
| 查询读取数据页 | 行为不变；缓存未命中时仍可按现有读路径规则回填 Segment 数据 |
| 缓存预热 | 行为不变 |
| Packed File | 不对打包后的 Segment 小文件进行整文件缓存；打包后的独立索引小文件仍可整文件缓存 |

全局索引优先模式下，Segment footer/内部索引范围通过同步读取写入缓存，不受 `enable_flush_file_cache_async` 控制；独立倒排索引文件仍沿用已有的直接写入和异步 flush 行为。

#### 仅限制 Compaction 输出

如果只希望减少 Compaction 输出造成的缓存压力，而不改变导入和 Schema Change 的主动写缓存行为，可以配置：

```properties
enable_file_cache=true
enable_file_cache_write_index_file_only=false
enable_file_cache_write_base_compaction_index_only=true
enable_file_cache_write_cumu_compaction_index_only=true
```

Cumulative Compaction 默认会写入输出缓存，因此启用对应参数后会跳过 Segment 文件，仅保留独立倒排索引文件。Base Compaction 仍先根据 `enable_file_cache_keep_base_compaction_output` 和输入 Rowset 缓存命中率决定是否写入输出；只有决定写入时，Base Compaction 的索引优先参数才进一步限制写入内容。

#### 使用建议

- 三个参数都是 BE 参数。应在同一计算组的所有 BE 节点上保持一致，避免不同节点采用不同的写缓存策略。
- “仅缓存索引”不表示 File Cache 中永远不会出现 Segment 数据。查询读取未命中的数据页时，仍可能将数据写入缓存。
- 该策略可以降低导入和 Compaction 对缓存的污染，但紧随写入发生的大范围数据扫描可能增加远程存储读取。建议结合业务查询负载进行压测，并持续观察 Index 队列淘汰量与 SQL Profile 中的索引读取指标。

### 配置缓存路径与大小

```plaintext
file_cache_path  默认：BE 部署路径下的 storage 目录
```

该参数为 JSON 数组，每个元素指定一个缓存路径及其属性，支持字段如下：

| 字段 | 说明 |
|---|---|
| `path` | 缓存文件存储路径 |
| `total_size` | 该路径下缓存总大小（单位：字节） |
| `ttl_percent` | TTL 队列占用比例（百分比） |
| `normal_percent` | Normal 队列占用比例（百分比） |
| `disposable_percent` | Disposable 队列占用比例（百分比） |
| `index_percent` | Index 队列占用比例（百分比） |
| `storage` | 缓存存储类型，可选 `disk`（默认）或 `memory` |

**配置示例：**

- 单路径配置：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480}]
    ```

- 多路径配置：

    ```json
    [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
    ```

- 内存存储配置：

    ```json
    [{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
    ```

### 自动清理缓存

| 参数 | 默认值 | 说明 |
|---|---|---|
| `clear_file_cache` | `false` | 是否在 BE 重启时自动清理已缓存数据。设为 `true` 时，每次重启均会清空缓存。 |

### 预先淘汰机制

预先淘汰机制在缓存使用率达到阈值时主动释放空间，避免查询时触发被动淘汰导致性能抖动。

| 参数 | 默认值 | 说明 |
|---|---|---|
| `enable_evict_file_cache_in_advance` | `true` | 是否启用预先淘汰机制 |
| `file_cache_enter_need_evict_cache_in_advance_percent` | `88` | 触发预先淘汰的使用率阈值（%）。缓存使用空间或 inode 数量达到此百分比时开始预先淘汰 |
| `file_cache_exit_need_evict_cache_in_advance_percent` | `85` | 停止预先淘汰的使用率阈值（%）。缓存使用空间降至此百分比时停止淘汰 |

## 缓存配额

<!-- 知识类型: 配置参数 -->
<!-- 适用场景: 多用户共享缓存 / 防止大查询缓存抖动 -->

Doris 提供两种相互独立的查询级 File Cache 限制机制。应根据希望控制的是“查询已占用的缓存空间”还是“查询后续是否继续回填缓存”选择参数：

| 机制 | 主要参数 | 达到限制后的行为 | 适用场景 |
|---|---|---|---|
| 按缓存占用比例限制 | `file_cache_query_limit_percent` | 新缓存块仍可写入；BE 优先淘汰当前查询记录的可释放缓存块，并在需要时从其他缓存队列淘汰 | 限制单个查询的缓存占用，兼顾后续缓存回填 |
| 按远端扫描回填字节数停止写入 | `file_cache_query_limit_bytes` | 当下一个缓存块会使累计准入字节数超过阈值时，查询在该 BE 上进入 remote-only-on-miss 状态；后续未命中范围从远端读取但不再写入 File Cache | 限制一次大范围远端扫描造成的缓存写入和缓存抖动 |
| TopN 延迟物化第二阶段不写缓存 | `enable_topn_lazy_mat_phase2_no_write_file_cache` | TopN 延迟物化第二阶段的回表读取在缓存未命中时直接读远端，不回填 File Cache | 避免 TopN 回表读取的低复用数据污染缓存 |

### 按缓存占用比例限制

> 该功能自 4.0.3 版本起支持。

缓存占用比例限制用于控制单个查询在每个 File Cache 实例中可使用的最大缓存比例。在多用户或复杂查询共享缓存资源的场景下，该机制可以降低单个大查询长期占用过多缓存并淘汰其他热点数据的风险。

该功能涉及 BE 配置、FE 配置与会话变量三个层面。

**BE 配置**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enable_file_cache_query_limit` | Boolean | `false` | BE 端缓存查询限制主开关。仅开启后，BE 才会处理 FE 传递的查询限制参数 |

**FE 配置**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `file_cache_query_limit_max_percent` | Integer | `100` | 查询配额的最大约束值，用于校验会话变量的上限 |

**会话变量**

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `file_cache_query_limit_percent` | Integer | `-1` | 设置时取值范围为 `[1, file_cache_query_limit_max_percent]`。表示单个查询可使用的最大缓存比例（%）。建议计算后的缓存配额不低于 256 MB，低于该值时 BE 会在日志中输出告警 |

使用前，需要在 BE 上同时启用 `enable_file_cache` 和 `enable_file_cache_query_limit`，并确保查询会话中的 `enable_file_cache` 为 `true`。

**使用示例**

```sql
-- 限制单个查询最多使用 50% 的缓存
SET file_cache_query_limit_percent = 50;

-- 执行查询
SELECT * FROM large_table;
```

后续缓存未命中仍允许写入 File Cache；当查询的缓存占用超过配额时，BE 会通过查询级 LRU 记录和其他缓存队列释放空间。该机制不会把查询切换为“后续不再写缓存”的模式。

### 按远端扫描回填字节数停止写入

`file_cache_query_limit_bytes` 用于限制单个 SELECT 查询在**每个 BE** 上因远端扫描缓存未命中而获准回填 File Cache 的累计字节数。该机制仅在存算分离模式且 BE 的 `enable_file_cache=true` 时生效，不依赖 `enable_file_cache_query_limit` 或 `file_cache_query_limit_max_percent`。

该阈值由同一查询在一个 BE 上的并行 Scanner 共享，但不是整个查询或整个集群的总量限制。例如，一个查询在 10 个 BE 上执行并将阈值设为 1 GiB，理论上最多可在每个 BE 上分别准入约 1 GiB，而不是所有 BE 合计 1 GiB。

**参数说明**

| 参数 | 位置 | 类型 | 默认值 | 是否必选 | 说明 |
|---|---|---|---|---|---|
| `file_cache_query_limit_bytes` | Session Variable | BigInt | `-1` | 是 | 单个查询在每个 BE 上的远端扫描缓存回填阈值，单位为字节。小于 `0` 时关闭限制；等于 `0` 时从查询开始即不回填；大于 `0` 时按缓存块累计准入字节数 |
| `enable_file_cache_query_limit_segment_meta` | BE 配置 | Boolean | `false` | 否 | 是否将 Segment footer 和 Segment 元数据的缓存写入纳入同一个字节阈值。该参数支持动态修改；数据页和倒排索引写入始终受字节阈值约束 |

`file_cache_query_limit_bytes` 的取值行为如下：

| 取值 | 行为 |
|---|---|
| `< 0` | 关闭该限制，保留原有的缓存未命中回填行为 |
| `= 0` | 查询从开始就在每个 BE 上进入 remote-only-on-miss 状态；已完整覆盖请求范围的本地缓存仍可读取，未完整覆盖的范围直接从远端读取且不回填 |
| `> 0` | 允许累计准入字节数不超过阈值的缓存块写入；当下一个缓存块会使累计值超过阈值时拒绝该块，并使该查询在当前 BE 上的后续未命中读取不再回填 |

阈值按缓存块进行准入判断，并不保证实际写入量恰好等于阈值。如果剩余预算小于下一个缓存块，该块会被整体跳过，剩余预算不会继续用于更小的后续块。一旦进入 remote-only-on-miss 状态，同一查询在该 BE 上不会恢复缓存回填。

**限制远端扫描回填量**

以下示例假设 `large_table` 位于存算分离集群中，并且所有 BE 已启用 File Cache。该设置允许查询在每个 BE 上最多准入 1 GiB 的远端扫描缓存块：

```sql
SET enable_profile = true;
SET profile_level = 2;
SET file_cache_query_limit_bytes = 1073741824;

SELECT COUNT(*) FROM large_table;
```

查询结果不受影响。当某个 BE 上的下一个缓存块会使累计准入量超过 1 GiB 时，该 BE 上同一查询的后续缓存未命中会直接读取远端数据，不再产生对应的本地缓存写入。

如果希望一次性扫描从开始就不污染 File Cache，可将阈值设为 `0`；查询结束后可恢复默认值：

```sql
SET file_cache_query_limit_bytes = 0;
SELECT COUNT(*) FROM large_table;

SET file_cache_query_limit_bytes = -1;
```

**是否计入 Segment 元数据**

默认情况下，数据页和倒排索引缓存写入计入阈值，Segment footer 和 Segment 元数据不计入。此时即使查询已经进入 remote-only-on-miss 状态，Segment footer 和元数据仍可能写入 File Cache，因此 Profile 中的总写入量可能大于 `file_cache_query_limit_bytes`。

如果需要连 Segment footer 和元数据也停止回填，请在同一计算组的所有 BE 上设置：

```properties
enable_file_cache_query_limit_segment_meta=true
```

该参数可通过 BE 动态配置接口即时修改；若需重启后继续生效，应写入 `be.conf` 或使用持久化动态配置。具体方法参见 [BE 配置](../../admin-manual/config/be-config.md)。

**通过 Profile 验证**

开启 Query Profile 后，可在 Scanner 的 `FileCache` 指标组中关注：

| 指标 | 说明 |
|---|---|
| `RemoteOnlyOnMissTriggered` | 值为 `1` 表示该 Scanner 已观察到查询进入 remote-only-on-miss 状态 |
| `RemoteOnlyOnMissThresholdBytes` | 当前查询配置的字节阈值 |
| `BytesWriteIntoCache` | 实际写入 File Cache 的总字节数 |
| `InvertedIndexBytesWriteIntoCache` | 倒排索引实际写入 File Cache 的字节数 |
| `SegmentFooterIndexBytesWriteIntoCache` | Segment footer 和元数据实际写入 File Cache 的字节数 |
| `NumSkipCacheIOTotal` | 跳过缓存的 I/O 次数；该指标还可能包含其他跳过缓存策略造成的 I/O，应与 `RemoteOnlyOnMissTriggered` 一起判断 |

如果累计准入量恰好等于阈值，且查询结束前没有新的缓存块尝试超过阈值，`RemoteOnlyOnMissTriggered` 仍可能为 `0`。只有出现会超过阈值的下一个缓存块时，状态才会切换。

**使用建议与注意事项**

- 对一次性全表扫描、低复用率 ETL 或 Ad-hoc 查询，可设置较小的正值，或使用 `0` 从查询开始禁止缓存回填，避免冷数据置换热点数据。
- 该参数限制的是查询读取未命中后的 File Cache 回填，不限制远端读取量，不会终止查询，也不影响导入、Compaction、Schema Change 或显式缓存预热产生的缓存写入。
- 进入 remote-only-on-miss 状态后，已完整缓存的请求范围仍可从本地读取；未完整覆盖的请求范围会直接访问远端存储，可能增加对象存储 I/O 和查询延迟。
- 如果目标是限制查询保留在缓存中的占用比例，并允许后续未命中继续回填，应使用 `file_cache_query_limit_percent`；如果目标是在一定回填量后停止后续写入，应使用 `file_cache_query_limit_bytes`。
- 默认不计入 Segment footer 和元数据可以保留高复用元数据的缓存收益。如果业务要求查询达到阈值后不再产生这类写入，再启用 `enable_file_cache_query_limit_segment_meta`，并结合 Profile 验证效果。

### TopN 延迟物化第二阶段不写缓存

> 该功能自 4.0.8 版本起支持。

带 `ORDER BY ... LIMIT` 的查询会使用 TopN 延迟物化：第一阶段只读取排序列筛选出候选行，第二阶段再按 row id 回表读取其余列。第二阶段读取的行分布稀疏、复用率低，在存算分离模式下回填 File Cache 容易挤占热点数据。

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | Boolean | `false` | 开启后，TopN 延迟物化第二阶段读取在 File Cache 未命中时直接读取远端存储，且不将该范围回填到 File Cache |

**使用示例**

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

SELECT * FROM large_table ORDER BY create_time DESC LIMIT 100;
```

**注意事项**

- 该变量仅在存算分离模式下生效，存算一体模式下设置无效果。
- 只影响 TopN 延迟物化的第二阶段回表读取，不影响第一阶段的排序列读取、其他查询的缓存回填，也不影响导入、Compaction 与缓存预热的缓存写入。
- 第二阶段命中 File Cache 的范围仍然从本地读取；未命中的范围会直接访问远端存储，可能增加对象存储 I/O。
- 如果 TopN 查询反复命中同一批热点行，开启后可能因不再回填而增加远端读取，建议结合业务查询特征评估。

## 缓存预热

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 新计算组上线 / 热点数据快速加载 -->

Doris 提供缓存预热功能，允许用户从远端存储主动拉取数据至本地缓存。支持以下三种预热模式：

| 模式 | 说明 |
|---|---|
| 计算组间预热 | 将计算组 A 的缓存热点数据预热至计算组 B。Doris 定期收集各计算组的表/分区访问热点，并据此选择性预热 |
| 表数据预热 | 指定将某张表的全量数据预热至目标计算组 |
| 分区数据预热 | 指定将某张表的特定分区数据预热至目标计算组 |

具体用法详见 [WARM-UP SQL 文档](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)。

## 缓存清理

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 缓存空间不足 / 测试环境重置 / 故障排查 -->

Doris 提供同步与异步两种缓存清理方式：

| 方式 | 命令 | 说明 |
|---|---|---|
| 同步清理 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'` | 命令返回即代表清理完成。Doris 同步删除本地文件系统中的缓存文件并清理内存元数据，可快速释放空间，但可能影响正在执行的查询。通常用于快速测试 |
| 异步清理 | `curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'` | 命令立即返回，清理步骤异步执行，可观察到缓存空间逐步减小。Doris 遍历内存元数据逐一删除缓存文件，对正在使用的文件会延迟删除。对正在执行的查询影响较小，但完全清理耗时较长 |

## 缓存监控

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 缓存命中率分析 / 故障排查 / 性能调优 -->

### 缓存块明细

从 Doris 4.1 开始，可以查询 [`information_schema.file_cache_info`](../../admin-manual/system-tables/information_schema/file_cache_info.md)，查看缓存块明细，并按照 Tablet、BE、缓存路径或缓存类型汇总缓存空间。Doris 4.0.x 不支持该系统表。

### 热点信息

Doris 每 10 分钟收集各计算组的缓存热点信息，并写入内部系统表 `__internal_schema.cloud_cache_hotspot`。可通过以下查询语句分析热点数据，指导缓存规划。

:::info 备注
在 3.0.4 版本之前，可使用 `SHOW CACHE HOTSPOT` 语句查询缓存热度信息。从 3.0.4 版本起，该语句已不再支持，请直接查询系统表 `__internal_schema.cloud_cache_hotspot`。
:::

#### 查看所有计算组中访问最频繁的表

```sql
-- 等价于 3.0.4 版本前的 SHOW CACHE HOTSPOT "/"
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

#### 查看指定计算组中访问最频繁的表

将 `cluster_name = "compute_group_name0"` 替换为实际的计算组名称。

```sql
-- 等价于 3.0.4 版本前的 SHOW CACHE HOTSPOT '/compute_group_name0'
WITH t1 AS (
    SELECT
        cluster_id,
        cluster_name,
        table_id,
        table_name,
        insert_day,
        SUM(query_per_day) AS query_per_day_total,
        SUM(query_per_week) AS query_per_week_total
    FROM __internal_schema.cloud_cache_hotspot
    WHERE cluster_name = "compute_group_name0" -- 替换为实际的计算组名称，例如 "default_compute_group"
    GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
    cluster_id AS ComputeGroupId,
    cluster_name AS ComputeGroupName,
    table_id AS TableId,
    table_name AS TableName
FROM (
    SELECT
        ROW_NUMBER() OVER (
            PARTITION BY cluster_id
            ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
        ) AS dr2,
        *
    FROM t1
) t2
WHERE dr2 = 1;
```

### 缓存空间与命中率指标

<!-- 知识类型: 配置参数 -->

通过以下接口获取 BE 节点的缓存统计信息（`brpc_port` 默认为 8060）：

```bash
curl {be_ip}:{brpc_port}/vars
```

返回的指标名称以磁盘路径为前缀，例如前缀 `_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_` 表示路径 `/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/`。去掉路径前缀后，各指标含义如下（大小单位均为字节）：

| 指标名称（不含路径前缀） | 含义 |
|---|---|
| `file_cache_cache_size` | 当前 File Cache 总大小 |
| `file_cache_disposable_queue_cache_size` | 当前 Disposable 队列大小 |
| `file_cache_disposable_queue_element_count` | 当前 Disposable 队列元素个数 |
| `file_cache_disposable_queue_evict_size` | 启动至今 Disposable 队列累计淘汰数据量 |
| `file_cache_index_queue_cache_size` | 当前 Index 队列大小 |
| `file_cache_index_queue_element_count` | 当前 Index 队列元素个数 |
| `file_cache_index_queue_evict_size` | 启动至今 Index 队列累计淘汰数据量 |
| `file_cache_normal_queue_cache_size` | 当前 Normal 队列大小 |
| `file_cache_normal_queue_element_count` | 当前 Normal 队列元素个数 |
| `file_cache_normal_queue_evict_size` | 启动至今 Normal 队列累计淘汰数据量 |
| `file_cache_total_evict_size` | 启动至今整个 File Cache 累计淘汰数据量 |
| `file_cache_ttl_cache_evict_size` | 启动至今 TTL 队列累计淘汰数据量 |
| `file_cache_ttl_cache_lru_queue_element_count` | 当前 TTL 队列元素个数 |
| `file_cache_ttl_cache_size` | 当前 TTL 队列大小 |
| `file_cache_evict_by_heat_[A]_to_[B]` | 为写入 B 类型缓存而淘汰的 A 类型缓存数据量（基于过期时间的淘汰方式） |
| `file_cache_evict_by_size_[A]_to_[B]` | 为写入 B 类型缓存而淘汰的 A 类型缓存数据量（基于空间的淘汰方式） |
| `file_cache_evict_by_self_lru_[A]` | A 类型缓存为写入新数据而淘汰自身的数据量（基于 LRU 的淘汰方式） |

### SQL Profile 缓存指标

SQL Profile 中缓存相关指标位于 `SegmentIterator` 节点下：

| 指标名称 | 含义 |
|---|---|
| `BytesScannedFromCache` | 从 File Cache 读取的数据量 |
| `BytesScannedFromRemote` | 从远程存储读取的数据量 |
| `BytesWriteIntoCache` | 写入 File Cache 的数据量 |
| `LocalIOUseTimer` | 读取 File Cache 的耗时 |
| `NumLocalIOTotal` | 读取 File Cache 的次数 |
| `NumRemoteIOTotal` | 读取远程存储的次数 |
| `NumSkipCacheIOTotal` | 从远程存储读取但未写入 File Cache 的次数 |
| `RemoteIOUseTimer` | 读取远程存储的耗时 |
| `WriteCacheIOUseTimer` | 写入 File Cache 的耗时 |

启用索引优先写入后，可以进一步关注以下分类指标，分别判断独立倒排索引和 Segment footer/内部索引是否命中缓存：

| 指标名称 | 含义 |
|---|---|
| `InvertedIndexBytesScannedFromCache` / `InvertedIndexBytesScannedFromRemote` | 从 File Cache / 远程存储读取的独立倒排索引数据量 |
| `InvertedIndexNumLocalIOTotal` / `InvertedIndexNumRemoteIOTotal` | 独立倒排索引的本地 / 远程读取次数 |
| `InvertedIndexLocalIOUseTimer` / `InvertedIndexRemoteIOUseTimer` | 独立倒排索引的本地 / 远程读取耗时 |
| `SegmentFooterIndexBytesScannedFromCache` / `SegmentFooterIndexBytesScannedFromRemote` | 从 File Cache / 远程存储读取的 Segment footer 和内部索引数据量 |
| `SegmentFooterIndexNumLocalIOTotal` / `SegmentFooterIndexNumRemoteIOTotal` | Segment footer 和内部索引的本地 / 远程读取次数 |
| `SegmentFooterIndexLocalIOUseTimer` / `SegmentFooterIndexRemoteIOUseTimer` | Segment footer 和内部索引的本地 / 远程读取耗时 |

您可以通过[查询性能分析](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)查看完整的查询性能报告。

## TTL 缓存策略

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 热点表常驻缓存 / 防止大查询驱逐热点数据 -->

TTL（Time-To-Live）缓存策略允许为特定表的数据设置缓存保留时长，保证热点小表或近期导入数据在缓存中有足够的保留时间，避免被大查询的 LRU 淘汰逻辑替换。

### 建表时设置 TTL

在 `CREATE TABLE` 的 `PROPERTIES` 中设置 `file_cache_ttl_seconds`（单位：秒）：

```sql
CREATE TABLE IF NOT EXISTS customer (
    C_CUSTKEY     INTEGER NOT NULL,
    C_NAME        VARCHAR(25) NOT NULL,
    C_ADDRESS     VARCHAR(40) NOT NULL,
    C_NATIONKEY   INTEGER NOT NULL,
    C_PHONE       CHAR(15) NOT NULL,
    C_ACCTBAL     DECIMAL(15,2) NOT NULL,
    C_MKTSEGMENT  CHAR(10) NOT NULL,
    C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES (
    "file_cache_ttl_seconds" = "300"
);
```

上表中，所有新导入的数据将在缓存中保留 300 秒。

### 修改表的 TTL 设置

```sql
ALTER TABLE customer SET ("file_cache_ttl_seconds" = "3000");
```

:::info 备注
修改后的 TTL 值不会立即生效，存在一定延迟。若建表时未设置 TTL，同样可通过 `ALTER TABLE` 语句补充设置。
:::

## 实践案例

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 混合大小表场景 / TTL 策略调优 -->

**场景描述：**

某用户拥有一系列数据表，总数据量超过 3 TB，可用缓存容量仅为 1.2 TB。其中有两张高频访问表：

| 表名 | 大小 | 访问特征 |
|---|---|---|
| `dimension_table`（维度表） | 200 MB | 访问频繁，数据变动不大 |
| `fact_table`（事实表） | 100 GB | 每日新增数据导入，需要 T+1 查询 |

其他大表访问频率较低。

**问题：** 在默认 LRU 策略下，大表查询可能将维度表数据从缓存中淘汰，导致维度表查询性能波动。

**解决方案：** 为两张高频表分别设置 TTL，保证其数据在缓存中的保留时长。

```sql
-- 维度表：数据量小，变动不大，设置 1 年 TTL 确保常驻缓存
ALTER TABLE dimension_table SET ("file_cache_ttl_seconds" = "31536000");

-- 事实表：每日全量导入，设置 1 天 TTL 与导入周期对齐
ALTER TABLE fact_table SET ("file_cache_ttl_seconds" = "86400");
```

## 常见问题

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 缓存命中率低 / 缓存配置问题排查 -->

**Q：缓存命中率低，查询仍然慢，如何排查？**

1. 通过 `curl {be_ip}:{brpc_port}/vars` 检查各队列的 `evict_size` 指标，判断是否存在频繁淘汰。
2. 查看 SQL Profile 中的 `BytesScannedFromRemote` 与 `BytesScannedFromCache` 比值，确认命中情况。
3. 若大查询频繁驱逐热点数据，考虑启用**缓存配额**功能（`enable_file_cache_query_limit`）或为热点表配置 **TTL 策略**。

**Q：BE 重启后缓存数据丢失？**

检查 `clear_file_cache` 配置是否被设置为 `true`。若不希望重启清空缓存，将其设置为 `false`（默认值）。

**Q：新计算组上线后首次查询很慢？**

使用**缓存预热**功能，提前将热点表或分区数据从远端存储拉取到新计算组的本地缓存中。具体用法详见 [WARM-UP SQL 文档](../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP.md)。

**Q：如何判断当前缓存空间是否已满？**

通过 `file_cache_cache_size` 指标与 `file_cache_path` 中配置的 `total_size` 进行对比。若接近上限，可检查是否需要扩容或调整各队列的占用比例。
