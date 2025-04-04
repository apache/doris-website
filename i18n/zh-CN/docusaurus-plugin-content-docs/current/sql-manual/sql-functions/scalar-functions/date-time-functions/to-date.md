---
{
    "title": "TO_DATE",
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
日期转换函数，用于将日期时间（DATETIME）转换为日期类型（DATE），即去掉时间部分，仅保留日期（YYYY-MM-DD）

## 语法
```sql
TO_DATE(<datetime_value>)
```

## 必选参数
| 参数               | 描述                 |
|------------------|--------------------|
| `datetime_value` | DATETIME 类型日期时间    |


## 举例

将 `2020-02-02 00:00:00` 转换为 `2020-02-02`
```sql
select to_date("2020-02-02 00:00:00");
```
```text
+--------------------------------+
| to_date('2020-02-02 00:00:00') |
+--------------------------------+
| 2020-02-02                     |
+--------------------------------+
```