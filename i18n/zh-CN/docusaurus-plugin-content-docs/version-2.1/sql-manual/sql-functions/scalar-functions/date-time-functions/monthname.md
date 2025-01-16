---
{
    "title": "MONTHNAME",
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

返回日期对应的英文月份名称。返回值为完整的英文月份名称（January 到 December）。

## 语法

```sql
VARCHAR MONTHNAME(DATETIME date)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| date | 输入的日期时间值，类型可以是 DATE、DATETIME 或 DATETIMEV2 |

## 返回值

返回类型为 VARCHAR，表示月份的英文名称：
- 返回值范围：January, February, March, April, May, June, July, August, September, October, November, December
- 如果输入为 NULL，返回 NULL
- 返回值首字母大写，其余字母小写

## 举例

```sql
select monthname('2008-02-03 00:00:00');
```

```plaintext
+---------------------------------------------------------+
| monthname(cast('2008-02-03 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------+
| February                                                |
+---------------------------------------------------------+
```

## 关键词

    MONTHNAME
