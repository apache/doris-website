---
{
    "title": "Data Export Best Practices",
    "language": "en",
    "description": "How can you tell whether resource utilization for Doris data export is reasonable? This article explains concurrency tuning and speed evaluation methods for SELECT INTO OUTFILE and EXPORT.",
    "sidebar_label": "Best Practices",
    "keywords": [
        "Doris data export",
        "SELECT INTO OUTFILE",
        "EXPORT command",
        "parallel export",
        "export performance tuning",
        "enable_parallel_outfile",
        "parallelism",
        "data_consistency",
        "async_task_consumer_thread_num",
        "export bandwidth bottleneck"
    ]
}
---

<!-- Knowledge type: Performance tuning / Configuration parameters -->
<!-- Applicable scenarios: Export performance bottleneck analysis / Concurrency tuning / Bandwidth utilization evaluation -->

This article explains, for Doris data export, how to determine whether resource utilization is reasonable and how to achieve higher export efficiency by tuning parameters such as concurrency. It covers two common export methods:

| Export Method          | Applicable Scenarios                                            | Concurrency Control                              |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `SELECT INTO OUTFILE`  | Exporting the result of a single SQL query, flexible and customizable | `enable_parallel_outfile` session variable       |
| `EXPORT`               | Bulk export of large tables or partitions, automatically split into multiple Outfile tasks | `parallelism`, `data_consistency`, and others    |

## Tuning SELECT INTO OUTFILE

<!-- Knowledge type: Operating procedure -->

`SELECT INTO OUTFILE` writes data out in parallel through Writers. The more Writers there are, the higher the export concurrency, but the more files are produced.

### 1. Enable Parallel Export

**Purpose**: Increase the concurrency of `SELECT INTO OUTFILE`.

**How to judge**: The number of rows returned by `SELECT INTO OUTFILE` represents the number of parallel Writers. If only 1 row is returned (a single Writer), you can try enabling parallel export.

**Command**:

```sql
SET enable_parallel_outfile = true;
```

**Notes**:

- Once enabled, `SELECT INTO OUTFILE` generates a number of Writers that matches the parallelism of the query.
- Query parallelism is controlled by the session variable `parallel_pipeline_task_num`, which defaults to half the CPU core count of a single BE.
- Example: For a cluster with 3 BE nodes and 8 cores per node, enabling parallel export produces `4 × 3 = 12` Writers.

**Limitations**: The following queries cannot be exported in parallel, even with `enable_parallel_outfile` enabled:

- Queries that include global sorting, such as `SELECT * FROM table ORDER BY id;`
- Queries with global aggregation semantics, such as `SELECT SUM(cost) FROM table;`

### 2. Evaluate Export Speed

**Purpose**: Determine whether the export has reached the disk or network bandwidth bottleneck.

**Steps**:

1. Look at the write time (in seconds) and speed (in KB/s) of each Writer in the rows returned by `SELECT INTO OUTFILE`.
2. Sum the speeds of multiple Writers on the same node to obtain the write speed of that node.
3. Compare this speed with the bottleneck bandwidth:
    - Exporting to local: compare with disk bandwidth.
    - Exporting to object storage: compare with network bandwidth.

If the actual speed is close to the bottleneck bandwidth, resources are already fully utilized. Otherwise, you can continue to tune concurrency.

## Tuning EXPORT

<!-- Knowledge type: Operating procedure / Configuration parameters -->

The `EXPORT` command essentially splits one export job into multiple `SELECT INTO OUTFILE` statements for execution. Understanding this splitting model is the prerequisite for tuning.

### 1. Inspect Execution Through the Returned Result

**Command**:

```sql
SHOW EXPORT;
```

The returned result contains a JSON string structured as a two-dimensional array:

- **First dimension**: The number of concurrent Export threads, that is, the number of Outfile statements issued in parallel.
- **Second dimension**: The return value of a single Outfile statement (the write details of multiple Writers).

**Example**:

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

**Explanation**: The example above issued 2 Outfile commands, each with 4 Writers writing in parallel. You can control the number of concurrent Outfile commands, and therefore the overall concurrency, through the `parallelism` parameter in the Export command properties.

### 2. Parameters That Affect Parallelism

<!-- Knowledge type: Configuration parameters -->

The overall parallelism of an Export job is jointly determined by the following parameters:

| Parameter                         | Scope         | Default     | Description                                                                                |
| --------------------------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `parallelism`                     | Export command | -          | Controls the maximum number of Outfile commands an Export job can be split into            |
| `data_consistency`                | Export command | `partition`| Controls whether to further split Outfile commands within a partition                      |
| `async_task_consumer_thread_num`  | FE config     | `64`        | Total number of Export Tasks the cluster can run concurrently, shared by all Export Tasks  |

#### parallelism

Controls the maximum number of Outfile commands a single Export job can be split into, that is, the upper limit of concurrency within the job.

#### data_consistency

Controls whether to further split Outfile commands within a partition:

- `partition` (default): Does not split partitions further. The number of Outfile commands is less than or equal to the number of partitions involved.
- `none`: Splits partitions further to increase concurrency. However, if data is being written to a partition, export consistency may be sacrificed (different Outfile commands on the same partition may export data of different versions).

For details, see the [EXPORT command manual](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md).

#### async_task_consumer_thread_num

An FE configuration parameter that represents the upper limit on the number of Export Tasks the current cluster can run concurrently. The default is `64`.

- An Export Job is split into multiple Export Tasks based on its concurrency.
- All Export Tasks share this threshold.
- To increase the number of export tasks the cluster can run concurrently, increase this parameter and restart the FE nodes.

## Tuning Workflow Reference

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Export performance bottleneck localization -->

When export performance does not meet expectations, follow the order below to investigate:

1. **Confirm concurrency**: Use the returned result (the row count of `SELECT INTO OUTFILE` or the JSON of `SHOW EXPORT`) to determine the actual number of concurrent Writers.
2. **Evaluate bandwidth utilization**: Sum the Writer speeds on a single node, compare with disk or network bandwidth, and determine whether the bottleneck has been reached.
3. **Adjust concurrency parameters**:
    - `SELECT INTO OUTFILE`: Enable `enable_parallel_outfile` and, if necessary, adjust `parallel_pipeline_task_num`.
    - `EXPORT`: Adjust `parallelism` and, if necessary, set `data_consistency` to `none`.
4. **Adjust cluster-level thresholds**: If too many Export tasks are running concurrently in the cluster and are being throttled, increase the FE configuration `async_task_consumer_thread_num` and restart the FE.
