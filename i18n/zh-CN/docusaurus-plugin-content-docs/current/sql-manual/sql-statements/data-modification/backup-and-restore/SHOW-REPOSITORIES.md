---
{
    "title": "SHOW REPOSITORIES",
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

该语句用于查看当前已创建的仓库

## 语法

```sql
SHOW REPOSITORIES;
```

## 返回值

| 字段             | 说明                                      |
|----------------|-----------------------------------------|
| **RepoId**     | 仓库的唯一标识符（ID）                            |
| **RepoName**   | 仓库的名称                                   |
| **CreateTime** | 仓库创建的时间                                 |
| **IsReadOnly** | 是否为只读仓库，`false` 表示不是只读仓库，`true` 表示是只读仓库 |
| **Location**   | 仓库中用于备份数据的根目录                           |
| **Broker**     | -                                       |
| **Type**       | 仓库类型，目前可以支持 S3 与 HDFS                   |
| **ErrMsg**     | 仓库的错误信息。如果没有错误，通常为 `NULL`               |

## 示例

查看已创建的仓库：

```sql
SHOW REPOSITORIES;
```
```text
+--------+--------------+---------------------+------------+----------+--------+------+--------+
| RepoId | RepoName     | CreateTime          | IsReadOnly | Location | Broker | Type | ErrMsg |
+--------+--------------+---------------------+------------+----------+--------+------+--------+
| 43411  | example_repo | 2025-01-17 18:50:47 | false      | s3://rep1  | -      | S3   | NULL   |
+--------+--------------+---------------------+------------+----------+--------+------+--------+
```
