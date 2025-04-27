---
{
    "title": "TIMESTAMP",
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

TIMESTAMP 函数有两种用法：

1. 将日期时间字符串转换为 DATETIME 类型
2. 将两个参数组合成一个 DATETIME 类型

## 语法

```sql
TIMESTAMP(string)
TIMESTAMP(date, time)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `string` | 日期时间字符串 |
| `date` | 日期值，可以是 DATE 类型或格式正确的日期字符串 |
| `time` | 时间值，可以是 TIME 类型或格式正确的时间字符串 |

## 返回值

返回类型为 DATETIME。

## 举例

```sql
-- 将字符串转换为 DATETIME
SELECT TIMESTAMP('2019-01-01 12:00:00');
```

```text
+------------------------------------+
| timestamp('2019-01-01 12:00:00')   |
+------------------------------------+
| 2019-01-01 12:00:00                |
+------------------------------------+
```

```sql
-- 将日期和时间组合成 DATETIME
SELECT TIMESTAMP('2019-01-01', '12:00:00');
```

```text
+----------------------------------------+
| timestamp('2019-01-01', '12:00:00')    |
+----------------------------------------+
| 2019-01-01 12:00:00                    |
+----------------------------------------+
```
