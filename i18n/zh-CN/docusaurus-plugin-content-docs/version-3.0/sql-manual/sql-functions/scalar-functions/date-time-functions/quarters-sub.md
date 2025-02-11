---
{
    "title": "QUARTERS_SUB",
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
函数用于在指定的日期或日期时间值基础上，增加或减少指定的季度数，并返回计算后的日期值。

## 语法

```sql
QUARTERS_SUB(<date/datetime>, <quarters>)
```

## 参数

| 参数                | 说明                                 |
|-------------------|------------------------------------|
| `<date/datetime>` | 输入的日期或日期时间值，支持 DATE 或 DATETIME 类型。 |
| `<quarters>`      | 要增加或减少的季度数，正整数表示增加，负整数表示减少。        |

## 返回值
- 返回一个日期值，与输入的日期类型一致。
- 如果 `<date/datetime>` 为 NULL，函数返回 NULL。
- 如果 `<date/datetime>` 为非法日期（如 0000-00-00），函数返回 NULL。

## 举例

```sql
select quarters_sub("2020-01-31 02:02:02", 1);
```

```text
+---------------------------------------------------------------+
| quarters_sub(cast('2020-01-31 02:02:02' as DATETIMEV2(0)), 1) |
+---------------------------------------------------------------+
| 2019-10-31 02:02:02                                           |
+---------------------------------------------------------------+
```