---
{
    "title": "数据导出最佳实践",
    "language": "zh-CN",
    "description": "如何判断 Doris 数据导出的资源利用是否合理？本文给出 SELECT INTO OUTFILE 与 EXPORT 的并发调优、速度评估方法。",
    "sidebar_label": "最佳实践",
    "keywords": [
        "Doris 数据导出",
        "SELECT INTO OUTFILE",
        "EXPORT 命令",
        "并行导出",
        "导出性能调优",
        "enable_parallel_outfile",
        "parallelism",
        "data_consistency",
        "async_task_consumer_thread_num",
        "导出带宽瓶颈"
    ]
}
---

<!-- 知识类型: 性能调优 / 配置参数 -->
<!-- 适用场景: 导出性能瓶颈分析 / 并发度调优 / 带宽利用率评估 -->

本文介绍在 Doris 数据导出中，如何判断资源利用是否合理，以及如何通过调整并发度等参数获得更高的导出效率。内容覆盖两类常用导出方式：

| 导出方式               | 适用场景                                        | 并发控制方式                          |
| ---------------------- | ----------------------------------------------- | ------------------------------------- |
| `SELECT INTO OUTFILE`  | 单条 SQL 查询结果导出，灵活、可定制             | `enable_parallel_outfile` 会话变量    |
| `EXPORT`               | 大表/分区批量导出，自动拆分为多个 Outfile 任务  | `parallelism`、`data_consistency` 等  |

## SELECT INTO OUTFILE 调优

<!-- 知识类型: 操作步骤 -->

`SELECT INTO OUTFILE` 通过 Writer 并行写出数据。Writer 数量越多，导出并发度越高，但产生的文件数量也越多。

### 1. 开启并行导出

**目的**：提高 `SELECT INTO OUTFILE` 的并发度。

**判断依据**：`SELECT INTO OUTFILE` 返回的行数即代表并行 Writer 数量。如果只有 1 行返回结果（单 Writer），可以尝试开启并行导出。

**操作命令**：

```sql
SET enable_parallel_outfile = true;
```

**说明**：

- 开启后，`SELECT INTO OUTFILE` 根据查询的并行度生成对应数量的 Writer。
- 查询并行度由会话变量 `parallel_pipeline_task_num` 控制，默认为单 BE CPU 核数的一半。
- 示例：3 个 BE 节点、每节点 8 核的集群，开启并行导出后会产生 `4 × 3 = 12` 个 Writer。

**限制**：以下查询无法并行导出，即使开启了 `enable_parallel_outfile`：

- 包含全局排序的查询，如 `SELECT * FROM table ORDER BY id;`
- 包含全局聚合语义的查询，如 `SELECT SUM(cost) FROM table;`

### 2. 评估导出速度

**目的**：判断导出是否已达到磁盘或网络带宽瓶颈。

**操作步骤**：

1. 查看 `SELECT INTO OUTFILE` 返回结果中每行 Writer 的写出时间（单位：秒）和速度（单位：KB/s）。
2. 将同一节点上多个 Writer 的速度相加，得到该节点的写出速度。
3. 将该速度与瓶颈带宽对比：
    - 导出到本地：与磁盘带宽对比
    - 导出到对象存储：与网络带宽对比

如果实际速度已接近瓶颈带宽，说明资源已被充分利用；否则可继续调优并发度。

## EXPORT 调优

<!-- 知识类型: 操作步骤 / 配置参数 -->

`EXPORT` 命令本质上是将一个导出任务拆分成多个 `SELECT INTO OUTFILE` 子句执行。理解其拆分模型是调优的前提。

### 1. 通过返回结果判断执行情况

**操作命令**：

```sql
SHOW EXPORT;
```

返回结果中包含一个 JSON 字符串，结构为二维数组：

- **第一维**：Export 并发的线程数，即并发发起的 Outfile 语句数量
- **第二维**：单个 Outfile 语句的返回结果（多个 Writer 的写出明细）

**示例**：

```json
[
    [
        {
            "fileNumber": "1",
            "totalRows": "640321",
            "fileSize": "350758307",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_59fd917c43874adc-9b1c3e9cd6e655be_*",
            "writeTime": "17.989",
            "writeSpeed": "19041.66"
        },
        {...},
        {...},
        {...}
    ],
    [
        {
            "fileNumber": "1",
            "totalRows": "646609",
            "fileSize": "354228704",
            "url": "file:///127.0.0.1/mnt/disk2/ftw/tmp/export/exp_c75b9d4b59bf4943-92eb94a7b97e46cb_*",
            "writeTime": "17.249",
            "writeSpeed": "20054.64"
        },
        {...},
        {...},
        {...}
    ]
]
```

**示例说明**：上例发起了 2 个 Outfile 命令，每个命令有 4 个 Writer 并发写出。可通过 Export 命令属性中的 `parallelism` 参数控制并发 Outfile 个数，从而控制整体并发度。

### 2. 影响并行度的参数

<!-- 知识类型: 配置参数 -->

Export 作业的整体并行度由以下参数共同决定：

| 参数                              | 作用域       | 默认值     | 说明                                                                                       |
| --------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `parallelism`                     | Export 命令  | -          | 控制 Export 作业最多拆分成几个 Outfile 命令                                                |
| `data_consistency`                | Export 命令  | `partition`| 控制是否在分区内部进一步拆分 Outfile 命令                                                  |
| `async_task_consumer_thread_num`  | FE 配置      | `64`       | 集群同时可运行的 Export Task 总数，所有 Export Task 共享该阈值                             |

#### parallelism

控制单个 Export 作业最多拆分成几个 Outfile 命令，即作业内部的并发度上限。

#### data_consistency

控制是否在分区内部进一步拆分 Outfile 命令：

- `partition`（默认）：不对分区进一步拆分。Outfile 命令数量小于等于涉及的分区数量。
- `none`：对分区进一步拆分，可提高并发度。但如果分区在写入数据，可能牺牲导出一致性（同一分区不同 Outfile 命令可能导出不同版本的数据）。

详细说明可参阅 [EXPORT 命令手册](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)。

#### async_task_consumer_thread_num

FE 配置参数，表示当前集群能够同时运行的 Export Task 数量上限，默认 `64`。

- 一个 Export Job 会根据并发度拆分成多个 Export Task。
- 所有 Export Task 共享该阈值。
- 如果希望提升集群整体可并发执行的导出任务数量，可调大该参数并重启 FE 节点。

## 调优流程参考

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 导出性能瓶颈定位 -->

针对导出性能不达预期的场景，建议按以下顺序排查：

1. **确认并发度**：通过返回结果（`SELECT INTO OUTFILE` 的行数或 `SHOW EXPORT` 的 JSON）判断实际并发的 Writer 数量。
2. **评估带宽利用率**：将单节点 Writer 速度相加，与磁盘/网络带宽对比，判断是否已达瓶颈。
3. **调整并发参数**：
    - `SELECT INTO OUTFILE`：开启 `enable_parallel_outfile`，必要时调整 `parallel_pipeline_task_num`。
    - `EXPORT`：调整 `parallelism`，必要时将 `data_consistency` 设为 `none`。
4. **调整集群级阈值**：如果集群同时运行的 Export 任务过多被限流，调大 FE 配置 `async_task_consumer_thread_num` 并重启 FE。
