---
{
    "title": "SECOND",
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
函数用于返回指定日期时间值中的秒数部分。秒数的范围是 0 到 59。

## 语法

```sql
SECOND(<datetime>)
```

## 参数

| 参数           | 说明                                 |
|--------------|------------------------------------|
| `<datetime>` | 输入的日期或日期时间值，支持 DATE 或 DATETIME 类型。 |

## 返回值
- 返回一个整数，表示输入日期时间值中的秒数部分，范围为 0 到 59。
- 如果输入值为 NULL，函数返回 NULL。
- 如果输入值为非法日期（如 0000-00-00 00:00:00），函数返回 NULL。

## 举例
```sql
select second('2018-12-31 23:59:59');
```
```text
+------------------------------------------------------+
| second(cast('2018-12-31 23:59:59' as DATETIMEV2(0))) |
+------------------------------------------------------+
|                                                   59 |
+------------------------------------------------------+
```