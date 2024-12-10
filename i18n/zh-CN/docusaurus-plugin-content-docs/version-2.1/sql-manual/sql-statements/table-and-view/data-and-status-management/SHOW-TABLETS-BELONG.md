---
{
    "title": "SHOW TABLETS BELONG",
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




### 描述

该语句用于展示指定 Tablets 归属的表的信息

语法：

```sql
SHOW TABLETS BELONG tablet-ids;
```

说明：

1. tablet-ids：代表一到多个 tablet-id 构成的列表。如有多个，使用逗号分隔
2. 结果中 table 相关的信息和 `SHOW-DATA` 语句的口径一致

### 示例

1. 展示 3 个 tablet-id 的相关信息（tablet-id 可去重）

    ```sql
    SHOW TABLETS BELONG 27028,78880,78382,27028;
    ```

    ```sql
    +---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
    | DbName              | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds      |
    +---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
    | default_cluster:db1 | kec       | 613.000 B | 379          | 604       | 604          | [78880, 78382] |
    | default_cluster:db1 | test      | 1.874 KB  | 1            | 1         | 1            | [27028]        |
    +---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
    ```

### 关键词

    SHOW, TABLETS, BELONG


