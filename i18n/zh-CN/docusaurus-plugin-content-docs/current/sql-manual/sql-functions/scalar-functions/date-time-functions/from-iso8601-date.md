---
{
    "title": "FROM_ISO8601_DATE",
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

将 ISO8601 格式的日期表达式转化为 date 类型的日期表达式。

## 语法

```sql
DATE from_iso8601_date(VARCHAR date)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| date | ISO8601 格式的日期 |

## 返回值

 date 类型的日期表达式。

## 举例

```sql
SELECT from_iso8601_date('0000-01'),from_iso8601_date('0000-W01'),from_iso8601_date('0000-059');
```

```text
+------------------------------+-------------------------------+-------------------------------+
| from_iso8601_date('0000-01') | from_iso8601_date('0000-W01') | from_iso8601_date('0000-059') |
+------------------------------+-------------------------------+-------------------------------+
| 0000-01-01                   | 0000-01-03                    | 0000-02-28                    |
+------------------------------+-------------------------------+-------------------------------+
```