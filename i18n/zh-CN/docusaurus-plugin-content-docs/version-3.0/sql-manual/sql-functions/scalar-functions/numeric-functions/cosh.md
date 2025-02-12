---
{
    "title": "COSH",
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

返回 `x` 的双曲余弦。

## 语法

`COSH(<x>)`

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 需要被计算双曲余弦的值 |

## 返回值

参数 `x` 的双曲余弦值

## 示例

```sql
select cosh(0);
```
```text
+-------------------------+
| cosh(cast(0 as DOUBLE)) |
+-------------------------+
|                     1.0 |
+-------------------------+
```

```sql
select cosh(1);
```
```text
+-------------------------+
| cosh(cast(1 as DOUBLE)) |
+-------------------------+
|       1.543080634815244 |
+-------------------------+
```

```sql
select cosh(-1);
```
```text
+--------------------------+
| cosh(cast(-1 as DOUBLE)) |
+--------------------------+
|        1.543080634815244 |
+--------------------------+
```