---
{
    "title": "MAP",
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

使用若干组键值对构造一个特定类型的 [`Map<K, V>`](../../../basic-element/sql-data-types/semi-structured/MAP.md)

## 语法

```sql
MAP( <key1> , <value1> [, <key2>,<value2> ... ])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<key>` | 构造 map 的 key |
| `<value>` | 构造 map 的 value |

## 返回值

返回由若干组键值对构造的特定类型 `Map<K, V>`

## 举例

```sql
select map(1, "100", 0.1, 2),map(1, "100", 0.1, 2)[1];
```

```text
+-----------------------+--------------------------+
| map(1, "100", 0.1, 2) | map(1, "100", 0.1, 2)[1] |
+-----------------------+--------------------------+
| {1.0:"100", 0.1:"2"}  | 100                      |
+-----------------------+--------------------------+
```

* 如果有重复的 key，会去重：
```sql
select map(1, 2, 2, 11, 1, 3);
```
```text
+------------------------+
| map(1, 2, 2, 11, 1, 3) |
+------------------------+
| {2:11, 1:3}            |
+------------------------+
```
> 上面有两组参数都是以 1 为 key(1, 2 和 1, 3)，最后保留 1, 3。