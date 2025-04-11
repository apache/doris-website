---
{
   "title": "TO_DAYS",
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
日期计算函数，它用于将日期转换为天数数值，即计算从公元 0 年 12 月 31 日（基准日期）到指定日期的总天数。

## 语法

```sql
TO_DAYS([<datetime_value> | <date_value>])
```

## 可选参数
| 参数              | 描述                    |
|-----------------|-----------------------|
| `<datetime_value>` | `datetime` 类型日期时间 |
| `<date_value>`     | `date` 类型日期时间     |


## 举例

查询2007年10月7日距今有多少天
```sql
select to_days('2007-10-07');
```
```text
+---------------------------------------+
| to_days(cast('2007-10-07' as DATEV2)) |
+---------------------------------------+
|                                733321 |
+---------------------------------------+
```

```sql
select to_days('2007-10-07 10:03:09');
```
```text
+------------------------------------------------+
| to_days(cast('2007-10-07 10:03:09' as DATEV2)) |
+------------------------------------------------+
|                                         733321 |
+------------------------------------------------+
```