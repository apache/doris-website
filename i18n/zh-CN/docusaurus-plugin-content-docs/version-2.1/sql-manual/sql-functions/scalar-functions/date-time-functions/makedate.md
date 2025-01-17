---
{
    "title": "MAKEDATE",
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

根据指定的年份和一年中的天数（dayofyear）构建并返回一个日期。

特殊情况：
- 当 `dayofyear` 小于等于 0 时，返回 NULL
- 当 `dayofyear` 超过当年天数时，会自动往后顺延到下一年

## 语法

```sql
MAKEDATE(<year>, <dayofyear>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| year | 指定的年份，类型为 INT |
| dayofyear | 一年中的第几天（1-366），类型为 INT |

## 返回值

返回类型为 DATE，返回以指定年份和一年中的第几天构建的日期。

## 举例

```sql
SELECT MAKEDATE(2021, 1), MAKEDATE(2021, 100), MAKEDATE(2021, 400);
```

```text
+-------------------+---------------------+---------------------+
| makedate(2021, 1) | makedate(2021, 100) | makedate(2021, 400) |
+-------------------+---------------------+---------------------+
| 2021-01-01        | 2021-04-10          | 2022-02-04          |
+-------------------+---------------------+---------------------+
```
