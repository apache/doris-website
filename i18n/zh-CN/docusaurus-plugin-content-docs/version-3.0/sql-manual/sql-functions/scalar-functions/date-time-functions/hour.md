---
{
    "title": "HOUR",
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

获得日期时间中的小时的信息。

## 语法

```sql
INT HOUR(DATE date)
INT HOUR(TIME date)
INT HOUR(DATETIME date)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| date | 需要计算的日期 |

## 返回值

返回日期中的小时的信息。返回值范围从 0-23。当参数为 Time，返回值可以大于 24

## 举例

```sql
select hour('2018-12-31 23:59:59');
```

```text
+-----------------------------+
| hour('2018-12-31 23:59:59') |
+-----------------------------+
|                          23 |
+-----------------------------+
```

```sql
select cast(4562632 as time),hour(cast(4562632 as time)), minute(cast(4562632 as time)),second(cast(4562632 as time));
```

```text
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| cast(4562632 as TIME) | hour(cast(4562632 as TIME)) | minute(cast(4562632 as TIME)) | second(cast(4562632 as TIME)) |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
| 456:26:32             |                         456 |                            26 |                            32 |
+-----------------------+-----------------------------+-------------------------------+-------------------------------+
```