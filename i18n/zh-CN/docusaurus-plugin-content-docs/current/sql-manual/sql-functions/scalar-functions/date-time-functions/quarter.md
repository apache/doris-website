---
{
    "title": "QUARTER",
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
函数用于返回指定 日期所属的季度（1 到 4）。每个季度包含三个月：
- 第 1 季度：1 月至 3 月
- 第 2 季度：4 月至 6 月
- 第 3 季度：7 月至 9 月
- 第 4 季度：10 月至 12 月

## 语法

```sql
QUARTER(<datetime>)
```

## 参数

| 参数           | 说明                                     |
|--------------|----------------------------------------|
| `<datetime>` | 输入的日期或日期时间值，必须是有效的 DATE 或 DATETIME 类型。 |

## 返回值
- 返回一个整数，表示输入日期所属的季度，范围为 1 到 4。
- 如果输入值为 NULL，函数返回 NULL。
- 如果输入值为非法日期（如 0000-00-00），函数返回 NULL。

## 举例

```sql
SELECT QUARTER('2025-01-16'),QUARTER('2025-01-16 01:11:10');
```

```text
+-----------------------------------------+--------------------------------------------------+
| quarter(cast('2025-01-16' as DATETIME)) | quarter(cast('2025-01-16 01:11:10' as DATETIME)) |
+-----------------------------------------+--------------------------------------------------+
|                                       1 |                                                1 |
+-----------------------------------------+--------------------------------------------------+
```