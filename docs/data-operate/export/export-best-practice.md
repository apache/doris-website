---
{
    "title": "Best Practices | Export",
    "language": "en",
    "description": "This document mainly introduces how to determine whether resource utilization is reasonable during data export operations,"
}
---

This document mainly introduces how to determine whether resource utilization is reasonable during data export operations, and how to adjust resource utilization to achieve better data export efficiency.

## SELECT INTO OUTFILE

1. Enable parallel export

    The number of rows returned by `SELECT INTO OUTFILE` represents the number of parallel Writers. The more Writers, the higher the export concurrency, but the number of output files will also increase. If you find there is only one Writer, you can try enabling the parallel export feature.

    `SET enable_parallel_outfile=true`

    After enabling, the `SELECT INTO OUTFILE` operation generates the corresponding number of Writers based on the query's parallelism. The query parallelism is controlled by the session variable `parallel_pipeline_task_num`. By default, it's half of the number of CPU cores per BE.

    For example, in a cluster with 3 BE nodes, where each node has 8 CPU cores. When parallel export is enabled, it will generate (4*3=) 12 Writers.

    Note that even if `enable_parallel_outfile` is enabled, not all queries can be exported in parallel. For example, if the query contains global sorting and aggregation semantics, it cannot be exported in parallel. For example:

    ```
    SELECT * FROM table ORDER BY id;

    SELECT SUM(cost) FROM table;
    ```

2. Determine export speed

    Each row result returned by `SELECT INTO OUTFILE` contains the time (in seconds) and speed (in KB/s) of the corresponding Writer's output.

    Adding up the speeds of multiple Writers on the same node gives you the write speed of a single node. You can compare this speed with disk bandwidth (e.g., when exporting to local) or network bandwidth (e.g., when exporting to object storage) to see if it has reached the bandwidth bottleneck.

## Export

1. Determine export execution status from the return results

    The Export command essentially breaks down the task into multiple `SELECT INTO OUTFILE` clauses for execution.

    The results returned by the `SHOW EXPORT` command contain a JSON string, which is a two-dimensional array. The first dimension represents the number of concurrent threads in Export, with the number of concurrent threads representing how many Outfile statements were initiated concurrently. The second dimension represents the return results of a single Outfile statement. Example:

    ```
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

    In the above example, 2 Outfile commands were initiated. Each command has 4 Writers writing concurrently.

    By adjusting the `parallelism` parameter in the Export command properties, you can control the number of concurrent Outfile operations, thereby controlling the concurrency level.

2. Parameters affecting parallelism

    The parallelism of Export jobs depends on two parameters:

    - `parallelism`

        Used to set the maximum number of Outfile commands to split into.

    - `data_consistency`

        Whether to split Outfile commands within partitions. This parameter defaults to `partition`, which means no further splitting within partitions. That is, the number of Outfile commands will only be less than or equal to the number of partitions involved. If set to `none`, a partition will be further split, which can improve concurrency, but if the partition is being written to, it may sacrifice export consistency (i.e., different Outfile commands for the same partition may export different versions of data from that partition).

        For details, please refer to [Export Command Manual](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)

    - `async_task_consumer_thread_num`

        This is an FE configuration parameter that indicates the number of Export Tasks that the current cluster can run concurrently. The default value is 64. An Export Job is split into multiple Export Tasks based on concurrency. All Export Tasks share this threshold. To increase the overall number of concurrent export tasks that the cluster can execute, increase this parameter and restart the FE node.

