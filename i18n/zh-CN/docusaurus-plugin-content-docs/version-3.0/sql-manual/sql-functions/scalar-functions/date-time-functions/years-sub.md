---
{
    "title": "YEARS_SUB",
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

返回一个新的日期时间值，该值是从输入的日期时间中减去指定的年数。

## 语法

```sql
YEARS_SUB(<date>, <years>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型为 DATETIME 或 DATE |
| `<years>` | 要减去的年数，类型为 INT |

## 返回值

返回与输入 `<date>` 类型相同的值（DATETIME 或 DATE），表示从输入日期时间中减去指定年数后的时间值。

## 举例

```sql
SELECT YEARS_SUB('2020-02-02 02:02:02', 1);
```

```text
+-------------------------------------+
| years_sub('2020-02-02 02:02:02', 1) |
+-------------------------------------+
| 2019-02-02 02:02:02                 |
+-------------------------------------+
```
