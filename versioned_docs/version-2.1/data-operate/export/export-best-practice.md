---
{
    "title": "Best Practices",
    "language": "en"
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

