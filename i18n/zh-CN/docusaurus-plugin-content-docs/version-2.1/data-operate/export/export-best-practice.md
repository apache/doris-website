---
{
    "title": "最佳实践",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

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






