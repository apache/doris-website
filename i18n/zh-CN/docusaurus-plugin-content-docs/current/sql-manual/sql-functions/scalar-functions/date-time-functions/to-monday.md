---
{
    "title": "TO_MONDAY",
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

将日期或带时间的日期向下舍入到最近的星期一。作为一种特殊情况，日期参数 1970-01-01、1970-01-02、1970-01-03 和 1970-01-04 返回日期 1970-01-01

## 语法

```sql
TO_MONDAY(<date>)
```

## 参数

| 参数 | 说明 |
|--|--|
| `<date>` | 对应日期值，为 Date 或者 Datetime 类型 |

## 返回值

日期或带时间的日期向下舍入到最近的星期一。作为一种特殊情况，日期参数 1970-01-01、1970-01-02、1970-01-03 和 1970-01-04 返回日期 1970-01-01

## 举例

```sql
SELECT TO_MONDAY('2020-1-1'),TO_MONDAY('2022-7-1 10:11:11'),TO_MONDAY('1970-01-02 10:11:11');
```

```text
+---------------------------------------+-------------------------------------------------------+---------------------------------------------------------+
| to_monday(cast('2020-1-1' as DATEV2)) | to_monday(cast('2022-7-1 10:11:11' as DATETIMEV2(0))) | to_monday(cast('1970-01-02 10:11:11' as DATETIMEV2(0))) |
+---------------------------------------+-------------------------------------------------------+---------------------------------------------------------+
| 2019-12-30                            | 2022-06-27                                            | 1970-01-01                                              |
+---------------------------------------+-------------------------------------------------------+---------------------------------------------------------+
```
