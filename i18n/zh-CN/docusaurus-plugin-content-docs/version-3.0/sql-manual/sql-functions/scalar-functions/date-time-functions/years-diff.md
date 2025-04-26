---
{
    "title": "YEARS_DIFF",
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

计算两个日期时间值之间相差的年数。

## 语法

```sql
YEARS_DIFF(<enddate>, <startdate>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<enddate>` | 结束日期，类型为 DATETIME 或 DATE |
| `<startdate>` | 开始日期，类型为 DATETIME 或 DATE |

## 返回值

返回类型为 INT，表示两个日期之间相差的年数。

## 举例

```sql
SELECT YEARS_DIFF('2020-12-25', '2019-10-25');
```

```text
+----------------------------------------------------------+
| years_diff('2020-12-25 00:00:00', '2019-10-25 00:00:00') |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
```
