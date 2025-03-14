---
{
    "title": "SHOW DELETE",
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




## 描述

该语句用于展示已执行成功的历史 delete 任务

## 语法

```sql
SHOW DELETE [FROM <db_name>]
```

## 可选参数
**<db_name>** : 需要展示的数据库名称

## 返回值
| 列名               | 描述                                                         |
|-------------------|------------------------------------------------------------|
| `TableName`       | 执行删除操作的表名。                                         |
| `PartitionName`   | 受删除操作影响的分区名称。                                   |
| `CreateTime`      | 删除操作执行时的时间戳。                                     |
| `DeleteCondition` | 删除操作使用的条件，指定被删除的行。                         |
| `State`           | 删除操作的状态。                                             |


## 示例
1. 到 test 库下查看所有历史 delete 任务
    ```sql
    show delete;
    ```
    ```text
    +---------------+---------------+---------------------+-----------------+----------+
    | TableName     | PartitionName | CreateTime          | DeleteCondition | State    |
    +---------------+---------------+---------------------+-----------------+----------+
    | iceberg_table | *             | 2025-03-14 15:53:32 | id EQ "1"       | FINISHED |
    +---------------+---------------+---------------------+-----------------+----------+
    ```

2. 展示数据库 tpch 的所有历史 delete 任务

    ```sql
    show delete from tpch;
    ```
    ```text
    +-----------+---------------+---------------------+-------------------+----------+
    | TableName | PartitionName | CreateTime          | DeleteCondition   | State    |
    +-----------+---------------+---------------------+-------------------+----------+
    | customer  | *             | 2025-03-14 15:45:19 | c_custkey EQ "18" | FINISHED |
    +-----------+---------------+---------------------+-------------------+----------+
    ```

