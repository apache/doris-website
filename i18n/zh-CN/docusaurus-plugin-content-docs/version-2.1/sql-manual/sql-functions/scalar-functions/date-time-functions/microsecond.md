---
{
    "title": "MICROSECOND",
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

从日期时间值中提取微秒部分的值。返回的范围是 0 到 999999。

## 语法

```sql
MICROSECOND(<date>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型为 DATETIMEV2，精度需要大于 0 |

## 返回值

返回类型为 INT，返回日期时间值中的微秒部分。取值范围为 0 到 999999。对于精度小于 6 的输入，不足的位数补 0。

## 举例

```sql
SELECT MICROSECOND(CAST('1999-01-02 10:11:12.000123' AS DATETIMEV2(6))) AS microsecond;
```

```text
+-------------+
| microsecond |
+-------------+
|         123 |
+-------------+
```
