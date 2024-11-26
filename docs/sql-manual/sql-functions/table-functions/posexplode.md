---
{
"title": "POSEXPLODE",
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

## Description

The table function is used in conjunction with Lateral View and can support multiple Lateral Views. It only supports the new optimizer.

It expands an array column into multiple rows and adds a column indicating the position, returning a struct type. When the array is NULL or empty, posexplode_outer returns NULL. Both posexplode and posexplode_outer will return NULL elements within the array.

## Syntax
```sql
posexplode(array)
posexplode_outer(array)
```

### Example

```sql
    CREATE TABLE IF NOT EXISTS `table_test`(
                `id` INT NULL,
                `name` TEXT NULL,
                `score` array<string> NULL
              ) ENGINE=OLAP
        DUPLICATE KEY(`id`)
        COMMENT 'OLAP'
        DISTRIBUTED BY HASH(`id`) BUCKETS 1
        PROPERTIES ("replication_allocation" = "tag.location.default: 1");

mysql> insert into table_test values (0, "zhangsan", ["Chinese","Math","English"]),(1, "lisi", ["null"]),(2, "wangwu", ["88a","90b","96c"]),(3, "lisi2", [null]),(4, "amory", NULL);


mysql [test_query_qa]>select * from table_test order by id;
+------+----------+--------------------------------+
| id   | name     | score                          |
+------+----------+--------------------------------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |
|    1 | lisi     | ["null"]                       |
|    2 | wangwu   | ["88a", "90b", "96c"]          |
|    3 | lisi2    | [null]                         |
|    4 | amory    | NULL                           |
+------+----------+--------------------------------+

mysql [test_query_qa]>select id,name,score, k,v from table_test lateral view posexplode(score) tmp as k,v order by id;
+------+----------+--------------------------------+------+---------+
| id   | name     | score                          | k    | v       |
+------+----------+--------------------------------+------+---------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |    0 | Chinese |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    1 | Math    |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    2 | English |
|    1 | lisi     | ["null"]                       |    0 | null    |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    0 | 88a     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    1 | 90b     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    2 | 96c     |
|    3 | lisi2    | [null]                         |    0 | NULL    |
+------+----------+--------------------------------+------+---------+

mysql [test_query_qa]>select id,name,score, k,v from table_test lateral view posexplode_outer(score) tmp as k,v order by id;
+------+----------+--------------------------------+------+---------+
| id   | name     | score                          | k    | v       |
+------+----------+--------------------------------+------+---------+
|    0 | zhangsan | ["Chinese", "Math", "English"] |    0 | Chinese |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    1 | Math    |
|    0 | zhangsan | ["Chinese", "Math", "English"] |    2 | English |
|    1 | lisi     | ["null"]                       |    0 | null    |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    0 | 88a     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    1 | 90b     |
|    2 | wangwu   | ["88a", "90b", "96c"]          |    2 | 96c     |
|    3 | lisi2    | [null]                         |    0 | NULL    |
|    4 | amory    | NULL                           | NULL | NULL    |
+------+----------+--------------------------------+------+---------+
```

### Keywords
POSEXPLODE,POSEXPLODE_OUTER
