---
{
    "title": "ARRAY_POSITION",
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

返回`value`在数组中第一次出现的位置/索引。

## 语法

```sql
ARRAY_POSITION(<arr>, <vaule>)
```

## 参数

| 参数 | 说明 | 
| --- | --- |
| `<arr>` | ARRAY 数组 |
| `<vaule>` | 待查询的元素 |

## 返回值

value 在 arr 中的位置（从 1 开始计算）。特殊情况：
- 0，如果 value 在 arr 中不存在；
- NULL，如果数组为 NULL。

## 举例

```sql
CREATE TABLE array_test (
                            id INT,
                            c_array ARRAY<INT>,
                            array_position INT
)
    duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test (id, c_array, array_position) VALUES
                                                         (1, [1, 2, 3, 4, 5], 5),
                                                         (2, [6, 7, 8], 0),
                                                         (3, [], 0),
                                                         (4, NULL, NULL);
SELECT id,c_array,array_position(c_array, 5) FROM `array_test`;
```
```text
+------+-----------------+------------------------------+
| id   | c_array         | array_position(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            5 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+
```
```sql
select array_position([1, null], null);
```
```text
+--------------------------------------+
| array_position(ARRAY(1, NULL), NULL) |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
```

