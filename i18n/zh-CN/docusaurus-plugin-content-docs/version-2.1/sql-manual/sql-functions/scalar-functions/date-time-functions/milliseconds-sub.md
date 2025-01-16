---
{
    "title": "MILLISECONDS_SUB",
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

从日期时间值中减去指定的毫秒数，返回一个新的日期时间值。

## 语法

```sql
DATETIMEV2 MILLISECONDS_SUB(DATETIMEV2 basetime, INT delta)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| basetime | 输入的日期时间值，类型为 DATETIMEV2 |
| delta | 要减去的毫秒数，类型为 INT，1 秒 = 1,000 毫秒 = 1,000,000 微秒 |

## 返回值

返回类型为 DATETIMEV2，精度与输入参数 basetime 的精度相同。

## 举例

```sql
select MILLISECONDS_SUB('2023-09-08 16:02:08.435123', 1);
```

```text
+--------------------------------------------------------------------------+
| milliseconds_sub(cast('2023-09-08 16:02:08.435123' as DATETIMEV2(6)), 1) |
+--------------------------------------------------------------------------+
| 2023-09-08 16:02:08.434123                                               |
+--------------------------------------------------------------------------+
1 row in set (0.11 sec)
```

注意：
- 示例中减去 1 毫秒后，时间从 .435123 减少到 .434123
- 1 毫秒等于 1000 微秒
- 函数的计算结果与输入时间的精度有关，示例使用了 6 位小数精度
- 结果保留了微秒级别的精度

## 关键词

    MILLISECONDS_SUB
