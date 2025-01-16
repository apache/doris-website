---
{
    "title": "MINUTE",
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

从日期时间值中提取分钟部分的值。返回值范围为 0 到 59。

## 语法

```sql
INT MINUTE(DATETIME date)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| date | 输入的日期时间值，类型可以是 DATE、DATETIME、DATETIMEV2 或 TIME |

## 返回值

返回类型为 INT，表示分钟值（0-59）。

## 举例

```sql
SELECT MINUTE('2018-12-31 23:59:59');
```

```plaintext
+------------------------------------------------------+
| minute(cast('2018-12-31 23:59:59' as DATETIMEV2(0))) |
+------------------------------------------------------+
|                                                   59 |
+------------------------------------------------------+
```

注意：
- 输入参数可以是多种时间相关类型
- 返回值始终是 0-59 之间的整数
- 如果输入参数为 NULL，则返回 NULL

## 关键词

    MINUTE
