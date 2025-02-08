---
{
    "title": "cosine_distance",
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

计算两个向量（向量值为坐标）之间的余弦距离

## 语法

```sql
COSINE_DISTANCE(<array1>, <array2>)
```

## 参数

| 参数 | 说明 |
|---|--|
| `<array1>` | 第一个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与array2保持一致 |
| `<array2>` | 第二个向量（向量值为坐标），输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE，元素数量需与array1保持一致 |

## 返回值

返回两个向量（向量值为坐标）之间的余弦距离。如果输入array为NULL，或者array中任何元素为NULL，则返回NULL。

## 举例

```sql
SELECT COSINE_DISTANCE([1, 2], [2, 3]),COSINE_DISTANCE([3, 6], [4, 7]);
```

```text
+---------------------------------+---------------------------------+
| cosine_distance([1, 2], [2, 3]) | cosine_distance([3, 6], [4, 7]) |
+---------------------------------+---------------------------------+
|            0.007722123286332261 |           0.0015396467945875125 |
+---------------------------------+---------------------------------+
```
