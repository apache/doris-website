---
{
    "title": "SHOW PARTITION",
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

SHOW PARTITION 用于展示指定分区的详细信息。包括所属数据库名字和 ID，所属表名字和 ID 以及分区名字。

## 语法

```sql
SHOW PARTITION <partition_id>
```

## 必选参数

`<partition_id>`

> 分区的 ID。分区 ID 可以通过 SHOW PARTITIONS 等方式获得。更多信息请参阅“SHOW PARTITIONS”章节

## 权限控制

执行此 SQL 命令的用户至少具有`ADMIN_PRIV`权限

## 示例

查询分区 ID 为 13004 的分区信息：

```sql
SHOW PARTITION 13004;
```

结果如下：

```sql
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```