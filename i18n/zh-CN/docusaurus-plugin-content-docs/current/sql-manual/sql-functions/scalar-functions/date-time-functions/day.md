---
{
    "title": "DAY",
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

获得日期中的天信息，返回值范围从 1-31。

## 别名

- dayofmonth

## 语法

```sql
DAY(<dt>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<dt>` | 合法的日期表达式 |

## 返回值

返回日期中的天信息

## 举例

```sql
select day('1987-01-31');
```

```text
+----------------------------+
| day('1987-01-31 00:00:00') |
+----------------------------+
|                         31 |
+----------------------------+
```