---
{
    "title": "EXPLODE_JSON_OBJECT",
    "language": "zh-CN"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

## EXPLODE_JSON_OBJECT

### Description

展开一个 json 对象。当给定的 json 为 NULL 或不是 json 对象时，`explode_json_object_outer` 将返回 NULL。

> 注意:
>
> 表函数必须与later view 结合使用

#### Syntax

```Sql
explode_json_object(json_object_string)
explode_json_object(json_object)
-- outer means keep the NULL elements    
explode_json_object_outer(json_object_string)
explode_json_object_outer(json_object)    
```

### Example

原始表数据:

```
mysql> select * from tbl_test_jsonb order by id;
+------+---------------------------------------------------------------+
| id   | j                                                             |
+------+---------------------------------------------------------------+
|    1 | NULL                                                          |
|    2 | null                                                          |
|    3 | true                                                          |
|    4 | false                                                         |
|    5 | 100                                                           |
|    6 | 10000                                                         |
|    7 | 1000000000                                                    |
|    8 | 1152921504606846976                                           |
|    9 | 6.18                                                          |
|   10 | "abcd"                                                        |
|   11 | {}                                                            |
|   12 | {"k1":"v31","k2":300}                                         |
|   13 | []                                                            |
|   14 | [123,456]                                                     |
|   15 | ["abc","def"]                                                 |
|   16 | [null,true,false,100,6.18,"abc"]                              |
|   17 | [{"k1":"v41","k2":400},1,"a",3.14]                            |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 | NULL                                                          |
|   27 | {"k1":"v1","k2":200}                                          |
|   28 | {"a.b.c":{"k1.a1":"v31","k2":300},"a":"niu"}                  |
|   29 | 12524337771678448270                                          |
|   30 | -9223372036854775808                                          |
|   31 | 18446744073709551615                                          |
|   32 | {"":"v1"}                                                     |
|   33 | {"":1,"":"v1"}                                                |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |
+------+---------------------------------------------------------------+
27 rows in set (0.22 sec)
```

Lateral View :

```
mysql> select id, j, k,v from tbl_test_jsonb lateral view explode_json_object(j) tmp as k,v order by id, k;
+------+---------------------------------------------------------------+-------+------------------------------------+
| id   | j                                                             | k     | v                                  |
+------+---------------------------------------------------------------+-------+------------------------------------+
|   12 | {"k1":"v31","k2":300}                                         | k1    | "v31"                              |
|   12 | {"k1":"v31","k2":300}                                         | k2    | 300                                |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | a1    | [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | k1    | "v31"                              |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | k2    | 300                                |
|   27 | {"k1":"v1","k2":200}                                          | k1    | "v1"                               |
|   27 | {"k1":"v1","k2":200}                                          | k2    | 200                                |
|   28 | {"a.b.c":{"k1.a1":"v31","k2":300},"a":"niu"}                  | a     | "niu"                              |
|   28 | {"a.b.c":{"k1.a1":"v31","k2":300},"a":"niu"}                  | a.b.c | {"k1.a1":"v31","k2":300}           |
|   32 | {"":"v1"}                                                     |       | "v1"                               |
|   33 | {"":1,"":"v1"}                                                |       | 1                                  |
|   33 | {"":1,"":"v1"}                                                |       | "v1"                               |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | 1                                  |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | "v1"                               |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | 2                                  |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 | ab    | "v1"                               |
+------+---------------------------------------------------------------+-------+------------------------------------+
16 rows in set (0.15 sec)

mysql> select id, j, k,v from tbl_test_jsonb lateral view explode_json_object_outer(j) tmp as k,v order by id, k;
+------+---------------------------------------------------------------+-------+------------------------------------+
| id   | j                                                             | k     | v                                  |
+------+---------------------------------------------------------------+-------+------------------------------------+
|    1 | NULL                                                          | NULL  | NULL                               |
|    2 | null                                                          | NULL  | NULL                               |
|    3 | true                                                          | NULL  | NULL                               |
|    4 | false                                                         | NULL  | NULL                               |
|    5 | 100                                                           | NULL  | NULL                               |
|    6 | 10000                                                         | NULL  | NULL                               |
|    7 | 1000000000                                                    | NULL  | NULL                               |
|    8 | 1152921504606846976                                           | NULL  | NULL                               |
|    9 | 6.18                                                          | NULL  | NULL                               |
|   10 | "abcd"                                                        | NULL  | NULL                               |
|   11 | {}                                                            | NULL  | NULL                               |
|   12 | {"k1":"v31","k2":300}                                         | k1    | "v31"                              |
|   12 | {"k1":"v31","k2":300}                                         | k2    | 300                                |
|   13 | []                                                            | NULL  | NULL                               |
|   14 | [123,456]                                                     | NULL  | NULL                               |
|   15 | ["abc","def"]                                                 | NULL  | NULL                               |
|   16 | [null,true,false,100,6.18,"abc"]                              | NULL  | NULL                               |
|   17 | [{"k1":"v41","k2":400},1,"a",3.14]                            | NULL  | NULL                               |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | a1    | [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | k1    | "v31"                              |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | k2    | 300                                |
|   26 | NULL                                                          | NULL  | NULL                               |
|   27 | {"k1":"v1","k2":200}                                          | k1    | "v1"                               |
|   27 | {"k1":"v1","k2":200}                                          | k2    | 200                                |
|   28 | {"a.b.c":{"k1.a1":"v31","k2":300},"a":"niu"}                  | a     | "niu"                              |
|   28 | {"a.b.c":{"k1.a1":"v31","k2":300},"a":"niu"}                  | a.b.c | {"k1.a1":"v31","k2":300}           |
|   29 | 12524337771678448270                                          | NULL  | NULL                               |
|   30 | -9223372036854775808                                          | NULL  | NULL                               |
|   31 | 18446744073709551615                                          | NULL  | NULL                               |
|   32 | {"":"v1"}                                                     |       | "v1"                               |
|   33 | {"":1,"":"v1"}                                                |       | 1                                  |
|   33 | {"":1,"":"v1"}                                                |       | "v1"                               |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | 1                                  |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | "v1"                               |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 |       | 2                                  |
|   34 | {"":1,"ab":"v1","":"v1","":2}                                 | ab    | "v1"                               |
+------+---------------------------------------------------------------+-------+------------------------------------+
36 rows in set (0.27 sec)
```

### Keywords

explode,json,object,explode_json,explode_json_object
