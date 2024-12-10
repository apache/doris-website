---
{
    "title": "逻辑视图",
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


视图（逻辑视图）是封装一个或多个 SELECT 语句的存储查询。视图在执行时动态访问并计算数据库数据。视图是只读的，可以引用表和其他视图的任意组合。

可以使用视图实现以下用途：

- 出于简化访问或安全访问的目的，让用户看不到复杂的 SELECT 语句。例如，可以创建仅显示用户所需的各表中数据的视图，同时隐藏这些表中的敏感数据。

- 将可能随时间而改变的表结构的详细信息封装在一致的用户界面后。

与物化视图不同，视图不实体化，也就是说，它们不在磁盘上存储数据。因此，存在以下限制：

- 当底层表数据发生变更时，Doris 不需要刷新视图数据。但是，访问和计算数据时，视图也会产生一些开销。

- 视图不支持插入、删除或更新操作。

## 创建视图

用于创建一个逻辑视图的语法如下：

```sql
CREATE VIEW [IF NOT EXISTS]
 [db_name.]view_name
 (column1[ COMMENT "col comment"][, column2, ...])
AS query_stmt
```

说明：

- 视图为逻辑视图，没有物理存储。所有在视图上的查询相当于在视图对应的子查询上进行。

- query_stmt 为任意支持的 SQL

## 举例

- 在 example_db 上创建视图 example_view

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```

- 创建一个包含 comment 的 view

    ```sql
    CREATE VIEW example_db.example_view
    (
        k1 COMMENT "first key",
        k2 COMMENT "second key",
        k3 COMMENT "third key",
        v1 COMMENT "first value"
    )
    COMMENT "my first view"
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```