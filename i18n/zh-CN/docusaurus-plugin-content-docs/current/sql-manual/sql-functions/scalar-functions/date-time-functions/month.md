---
{
    "title": "MONTH",
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

从日期时间值中提取月份值。返回值范围为 1 到 12，分别代表一年中的 12 个月。

## 语法

```sql
MONTH(<date>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型可以是 DATE、DATETIME 或 DATETIMEV2 |

## 返回值

返回类型为 INT，表示月份值：
- 范围：1 到 12
- 1 表示一月，12 表示十二月
- 如果输入为 NULL，返回 NULL

## 举例

```sql
SELECT MONTH('1987-01-01');
```

```text
+--------------------------------------------+
| month(cast('1987-01-01' as DATETIMEV2(0))) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
