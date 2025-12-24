---
{
    "title": "最佳实践",
    "language": "zh-CN",
    "description": "本文档主要用于介绍在进行数据导出操作中，如何判断资源利用是否合理，以及如何调整资源利用率已达到更好的数据导出效率。"
}
---

本文档主要用于介绍在进行数据导出操作中，如何判断资源利用是否合理，以及如何调整资源利用率已达到更好的数据导出效率。

## SELECT INTO OUTFILE

1. 开启并行导出

    `SELECT INTO OUTFILE` 返回的行数即代表并行的 Writer 数量。Writer 的数量越多，则导出的并发度越高，但写出的文件数量也会越多。如果发现只有一个 Writer，则可以尝试开启并行导出功能。

    `SET enable_parallel_outfile=true`

    开启后，`SELECT INTO OUTFILE` 操作为根据查询的并行度来生成对应数量的 Writer。查询并行度由会话变量 `parallel_pipeline_task_num` 控制。默认为单 BE CPU 核数的一半。

    比如在一个 3 BE 节点的集群中，每个节点的 CPU 核数为 8。则开启并行导出情况下，会产生（4*3=）12 个 Writer。

    注意，即使开启了并行导出功能，也不是所有查询都能够并行导出。比如查询中包含全局排序、聚合语义时，则是无法并行导出的。如：

    ```
    SELECT * FROM table ORDER BY id;

    SELECT SUM(cost) FROM table;
    ```

2. 判断导出速度

    `SELECT INTO OUTFILE` 返回的每一行结果中，都带有对应的 Writer 的写出时的时间（单位：秒）和速度（单位：KB/s）。

    将同一个节点的多个 Writer 的速度相加，即为单个节点的写出速度。可以用这个速度，和磁盘带宽（比如导出到本地）或网络带宽（比如导出到对象存储）进行比较，看是否已经达到带宽瓶颈。

## Export

1. 根据返回结果判断导出执行情况

    Export 命令本质上是将任务拆分成多个 `SELECT INTO OUTFILE` 子句进行执行。

    通过 `SHOW EXPORT` 命令返回的结果中包含一个 Json 字符串，是一个二维数组。第一维代表 Export 并发的线程数，并发多少个线程代表并发发起了多少个 Outfile 语句。第二维代表单个 Outfile 语句的返回结果。示例：

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

    上面的示例中，发起了 2 个 Outfile 命令。每个命令有 4 个 Writer 并发写出。

    通过调整 Export 命令属性中的 `parallelism` 参数，可以控制并发 Outfile 的个数，从而控制并发度。

2. 影响并行度的参数

    Export 作业的并行度取决于两个参数：

    - `parallelism`

        用于设置最多拆分成几个 Outfile 命令。

    - `data_consistency`

        是否在分区内部进行 Outfile 命令的拆分。该参数默认为 `partition`，即不对分区进一步拆分。即 Outfile 命令的数量，只会小于等于涉及到的分区数量。如果设置为 `none`，则会对一个分区进一步拆分，这样可以提高并发，但如果分区在写入数据，则可能会牺牲导出的一致性（即同一个分区的不同 Outfile 命令，可能导出的是这个分区的不同版本的数据）。

        具体可参阅 [Export 命令手册](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)

    - `async_task_consumer_thread_num`

        FE 配置参数，表示当前集群能够同时运行的 Export Task 的数量，默认是是 64。一个 Export Job 会根据并发度拆分成多个 Export Task。所有 Export Task 共享这个阈值。如果希望提升集群整体的可并发执行导出任务的数量，可以调大这个参数，并重启 FE 节点。

