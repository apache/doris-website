---
{
    "title": "MILLISECONDS_DIFF",
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

计算两个日期时间值之间的毫秒差值。结果为 `<end_date>` 减去 `<start_date>` 的毫秒数。

## 语法

```sql
MILLISECONDS_DIFF(<enddate>, <startdate>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<end_date>` | 结束时间，类型为 DATETIMEV2 |
| `<start_date>` | 开始时间，类型为 DATETIMEV2 |

## 返回值

返回类型为 INT，表示两个时间之间的毫秒差值。
- 如果 `<end_date>` 大于 `<start_date>`，返回正数
- 如果 `<end_date>` 小于 `<start_date>`，返回负数
- 1 秒 = 1,000 毫秒
- 1 毫秒 = 1,000 微秒

## 举例

```sql
SELECT MILLISECONDS_DIFF('2020-12-25 21:00:00.623000', '2020-12-25 21:00:00.123000');
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| milliseconds_diff(cast('2020-12-25 21:00:00.623000' as DATETIMEV2(3)), cast('2020-12-25 21:00:00.123000' as DATETIMEV2(3))) |
+-----------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                         500 |
+-----------------------------------------------------------------------------------------------------------------------------+
```

注意：
- 示例中的时间差为 0.5 秒，即 500 毫秒
- 函数的计算结果与输入时间的精度有关，示例使用了 3 位小数精度
- 结果只返回毫秒差值，不包含微秒部分
