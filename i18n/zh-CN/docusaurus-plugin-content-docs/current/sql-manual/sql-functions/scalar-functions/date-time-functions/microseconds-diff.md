---
{
    "title": "MICROSECONDS_DIFF",
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

计算两个日期时间值之间的微秒差值。结果为 enddate 减去 startdate 的微秒数。

## 语法

```sql
MICROSECONDS_DIFF(<enddate>, <startdate>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| enddate | 结束时间，类型为 DATETIMEV2 |
| startdate | 开始时间，类型为 DATETIMEV2 |

## 返回值

返回类型为 INT，表示两个时间之间的微秒差值。
- 如果 enddate 大于 startdate，返回正数
- 如果 enddate 小于 startdate，返回负数
- 1 秒 = 1,000,000 微秒

## 举例

```sql
SELECT MICROSECONDS_DIFF('2020-12-25 21:00:00.623000','2020-12-25 21:00:00.123000');
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| microseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(3)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(3))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                      500000 |
+-----------------------------------------------------------------------------------------------------------------------------+
```
