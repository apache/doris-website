---
{
    "title": "MINUTES_ADD",
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

向日期时间值中添加指定的分钟数，返回一个新的日期时间值。

## 语法

```sql
MINUTES_ADD(<date>, <minutes>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型可以是 DATE、DATETIME 或 DATETIMEV2 |
| `<minutes>` | 要添加的分钟数，类型为 INT，可以为正数或负数 |

## 返回值

返回类型为 DATETIME，表示添加指定分钟数后的日期时间值。

## 举例

```sql
SELECT MINUTES_ADD("2020-02-02", 1);
```

```text
+-----------------------------------------------------+
| minutes_add(cast('2020-02-02' as DATETIMEV2(0)), 1) |
+-----------------------------------------------------+
| 2020-02-02 00:01:00                                 |
+-----------------------------------------------------+
```

注意：
- 当添加的分钟数为负数时，相当于减去对应的分钟数
- 函数会自动处理跨小时、跨天的情况
- 如果输入参数为 NULL，则返回 NULL
