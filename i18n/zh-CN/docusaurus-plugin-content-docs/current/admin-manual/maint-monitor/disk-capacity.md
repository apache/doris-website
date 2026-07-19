---
{
    "title": "磁盘空间管理",
    "language": "zh-CN",
    "description": "介绍 Doris BE 磁盘水位机制（高水位、危险水位）、FE/BE 相关参数以及磁盘写满后的应急释放与恢复方法。",
    "keywords": [
        "磁盘空间管理",
        "磁盘水位",
        "高水位",
        "危险水位",
        "Flood Stage",
        "High Watermark",
        "storage_root_path",
        "BE 磁盘写满",
        "磁盘使用率",
        "ADMIN CLEAN TRASH",
        "回收站清理",
        "磁盘空间释放",
        "Doris 运维",
        "tablet 删除",
        "副本修改"
    ]
}
---

<!-- 知识类型: 运维管理 / 配置参数 / 故障排查 -->
<!-- 适用场景: BE 磁盘使用率过高、磁盘写满导致进程异常、需要主动控制磁盘水位 -->

本文档介绍 Doris 中与磁盘存储空间有关的系统参数与处理策略，帮助运维同学理解磁盘水位机制、配置合理阈值，并在磁盘紧张甚至写满时快速恢复集群。

Doris 的数据磁盘若不加以控制，一旦写满会导致 BE 进程异常退出。Doris 通过监测每块磁盘的使用率和剩余空间，并设置不同的警戒水位，对系统中的操作进行限制，从而尽量避免磁盘被写满。

## 适用场景

<!-- 知识类型: 场景说明 -->

| 场景 | 关注重点 |
| --- | --- |
| 日常容量规划 | 理解 FE/BE 水位机制，提前预警 |
| 磁盘使用率接近高水位 | 调整 FE 阈值、避免均衡/恢复占用更多空间 |
| 磁盘使用率达到危险水位 | 排查写入被禁原因，主动释放空间 |
| BE 因磁盘写满无法启动 | 删除临时文件、紧急恢复进程 |
| 多副本快速降本 | 临时降低副本数，待恢复后再调回 |

## 名词解释

- **Data Dir（数据目录）**：在 BE 配置文件 `be.conf` 的 `storage_root_path` 中指定的各个数据目录。通常一个数据目录对应一块磁盘，因此下文中 **磁盘** 也指代一个数据目录。
- **高水位（High Watermark）**：FE 侧的较低阈值，超过后会限制部分操作（如均衡）。
- **危险水位（Flood Stage）**：FE 与 BE 侧均存在的较高阈值，超过后会禁止写入等关键操作，用于自我保护。

## 基本原理

<!-- 知识类型: 工作机制 -->

1. BE 每隔约 1 分钟向 FE 上报一次磁盘使用情况。
2. FE 根据上报的统计值，对不同操作进行限制：
    - 使用率高于 **高水位** 时，限制均衡、Decommission 等操作。
    - 使用率高于 **危险水位** 时，禁止导入、恢复等写入类操作。
3. 由于 FE 不能完全实时感知 BE 磁盘状态，也无法控制 BE 自身的内部任务（如 Compaction），因此 BE 上同样设置了 **危险水位**，由 BE 主动拒绝和停止部分操作，达到自我保护的目的。

## FE 参数

<!-- 知识类型: 配置参数 -->

FE 侧分别配置 **高水位** 与 **危险水位** 两级阈值。每一级阈值都包含「使用率」与「剩余空间」两个判断条件。

### 高水位（High Watermark）

```text
storage_high_watermark_usage_percent 默认 85 (85%)。
storage_min_left_capacity_bytes 默认 2GB。
```

触发条件：磁盘空间使用率 **大于** `storage_high_watermark_usage_percent`，**或者** 磁盘剩余空间 **小于** `storage_min_left_capacity_bytes`。

触发后，该磁盘不再作为以下操作的目的路径：

- Tablet 均衡操作（Balance）
- Colocation 表数据分片的重分布（Relocation）
- Decommission

### 危险水位（Flood Stage）

```text
storage_flood_stage_usage_percent 默认 95 (95%)。
storage_flood_stage_left_capacity_bytes 默认 1GB。
```

触发条件：磁盘空间使用率 **大于** `storage_flood_stage_usage_percent`，**并且** 磁盘剩余空间 **小于** `storage_flood_stage_left_capacity_bytes`。

触发后，该磁盘不再作为目的路径，并禁止以下操作：

- Tablet 均衡操作（Balance）
- Colocation 表数据分片的重分布（Relocation）
- 副本补齐
- 恢复操作（Restore）
- 数据导入（Load/Insert）

### FE 参数一览

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `storage_high_watermark_usage_percent` | 85（85%） | FE 高水位使用率阈值 |
| `storage_min_left_capacity_bytes` | 2 GB | FE 高水位剩余空间阈值 |
| `storage_flood_stage_usage_percent` | 95（95%） | FE 危险水位使用率阈值 |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | FE 危险水位剩余空间阈值 |

## BE 参数

<!-- 知识类型: 配置参数 -->

BE 侧仅设置 **危险水位**，用于在 FE 感知延迟或无法控制 BE 内部任务时进行自我保护。

```text
storage_flood_stage_usage_percent 默认 90 (90%)。
storage_flood_stage_left_capacity_bytes 默认 1GB。
```

触发条件：磁盘空间使用率 **大于** `storage_flood_stage_usage_percent`，**并且** 磁盘剩余空间 **小于** `storage_flood_stage_left_capacity_bytes`。

触发后，该磁盘上的以下操作会被禁止：

- Base/Cumulative Compaction
- 数据写入（包括各种导入操作）
- Clone Task：通常发生于副本修复或均衡时
- Push Task：发生在 Hadoop 导入的 Loading 阶段，下载文件
- Alter Task：Schema Change 或 Rollup 任务
- Download Task：恢复操作的 Downloading 阶段

### BE 参数一览

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `storage_flood_stage_usage_percent` | 90（90%） | BE 危险水位使用率阈值 |
| `storage_flood_stage_left_capacity_bytes` | 1 GB | BE 危险水位剩余空间阈值 |

## 磁盘空间释放

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 磁盘高于高水位或危险水位、需要快速恢复集群 -->

当磁盘使用率高于高水位甚至危险水位后，很多操作都会被禁止。此时可以按以下方式尝试降低磁盘使用率，恢复系统。优先选择风险较低的方式，最后才考虑直接删除数据文件。

| 优先级 | 操作 | 适用场景 | 风险 |
| --- | --- | --- | --- |
| 1 | 删除表或分区 | 存在可清理的历史数据 | 不可恢复，但范围可控 |
| 2 | 扩容 BE | 资源允许、可等待数小时至数天 | 低 |
| 3 | 修改表/分区副本数 | 紧急情况下临时降本 | 数据可靠性下降 |
| 4 | 删除多余文件（log/snapshot/trash） | BE 因磁盘写满无法启动 | 影响回收站恢复 |
| 5 | 删除数据文件 | 上述方法均失败的最后手段 | **可能造成数据丢失** |

### 删除表或分区

通过删除表或分区可以快速降低磁盘使用率，恢复集群。

> **注意**：只有 `DROP` 操作可以达到快速降低磁盘空间使用率的目的，`DELETE` 操作不可以。

```text
DROP TABLE tbl;
ALTER TABLE tbl DROP PARTITION p1;
```

### 扩容 BE

扩容后，数据分片会自动均衡到磁盘使用率较低的 BE 节点上。扩容操作会根据数据量及节点数量不同，在数小时或数天后使集群达到均衡状态。

### 修改表或分区的副本数

可以将表或分区的副本数降低。例如默认 3 副本可以降低为 2 副本。该方法虽然降低了数据的可靠性，但能够快速降低磁盘使用率，使集群恢复正常，通常用于紧急恢复系统。请在恢复后，通过扩容或删除数据等方式降低磁盘使用率，再将副本数恢复为 3。

修改副本操作瞬间生效，后台会异步删除多余的副本。

```text
ALTER TABLE tbl MODIFY PARTITION p1 SET("replication_num" = "2");
```

### 删除多余文件

当 BE 进程已经因为磁盘写满而挂掉并无法启动时（此现象可能因 FE 或 BE 检测不及时而发生），可以通过删除数据目录下的临时文件，保证 BE 进程能够启动。以下目录中的文件可以直接删除：

- `log/`：日志目录下的日志文件。
- `snapshot/`：快照目录下的快照文件。
- `trash/`：回收站中的文件。

> **注意**：这种操作会对 [从 BE 回收站中恢复数据](../data-admin/recyclebin) 产生影响。

如果 BE 还能够启动，可以使用以下命令主动清理临时文件。该命令会清理 **所有** trash 文件和过期 snapshot 文件，**这将影响从回收站恢复数据的操作**：

```text
ADMIN CLEAN TRASH ON(BackendHost:BackendHeartBeatPort);
```

如果不手动执行 `ADMIN CLEAN TRASH`，系统仍会在几分钟至几十分钟内自动执行清理，分为两种情况：

- 如果磁盘占用 **未达到** 危险水位（Flood Stage）的 90%：仅清理过期 trash 文件和过期 snapshot 文件，保留部分近期文件，不影响数据恢复。
- 如果磁盘占用 **已达到** 危险水位（Flood Stage）的 90%：清理 **所有** trash 文件和过期 snapshot 文件，**此时会影响从回收站恢复数据的操作**。

自动执行的时间间隔可通过配置项 `max_garbage_sweep_interval` 和 `min_garbage_sweep_interval` 修改。

出现由于缺少 trash 文件而导致恢复失败的情况时，可能返回如下结果：

```text
{"status": "Fail","msg": "can find tablet path in trash"}
```

### 删除数据文件（危险！！！）

当以上所有操作都无法释放空间时，需要通过直接删除数据文件来释放空间。数据文件位于指定数据目录的 `data/` 目录下。

> **警告**：删除数据分片（Tablet）前必须确保该 Tablet 至少有一个副本是正常的，否则 **删除唯一副本会导致数据丢失**。

假设要删除 id 为 `12345` 的 Tablet，操作步骤如下：

1. 找到 Tablet 对应的目录，通常位于 `data/shard_id/tablet_id/` 下。例如：

    ```text
    data/0/12345/
    ```

2. 记录 tablet id 和 schema hash。其中 schema hash 为上一步目录的下一级目录名。例如 `352781111`：

    ```text
    data/0/12345/352781111
    ```

3. 删除数据目录：

    ```shell
    rm -rf data/0/12345/
    ```

4. 删除 Tablet 元数据（具体参考 [Tablet 元数据管理工具](../trouble-shooting/tablet-meta-tool)）：

    ```shell
    ./lib/meta_tool --operation=delete_header --root_path=/path/to/root_path --tablet_id=12345 --schema_hash=352781111
    ```

## 常见问题

<!-- 知识类型: 故障排查 -->

### Q: 导入任务报错被拒绝，怎么处理？

磁盘使用率超过 FE 或 BE 的危险水位。参考「磁盘空间释放」章节，优先 `DROP` 历史分区或扩容。

### Q: 副本均衡长时间不收敛，怎么处理？

部分磁盘超过高水位，无法作为均衡目的路径。释放高水位磁盘或扩容 BE 后等待自动均衡。

### Q: BE 进程启动失败、磁盘已满，怎么处理？

`data/` 所在磁盘写满。先删除 `log/`、`snapshot/`、`trash/` 释放空间，再启动 BE。

### Q: 执行 `ADMIN CLEAN TRASH` 后无法恢复数据，怎么处理？

trash 文件被清理，该操作不可逆，恢复前请评估影响。

### Q: 自动清理返回 `can find tablet path in trash`，怎么处理？

磁盘已达危险水位的 90%，trash 被全部清理。检查水位状态，恢复磁盘空间后再尝试。
