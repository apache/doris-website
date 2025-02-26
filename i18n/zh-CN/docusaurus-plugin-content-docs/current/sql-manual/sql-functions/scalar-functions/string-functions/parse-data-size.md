---
{
    "title": "PARSE_DATA_SIZE",
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

解析格式为“数值 + 单位”的字符串，将其中的值解析为数字，其中值是单位值的分数。
当输入参数不合法时，会进行报错，返回值的最大值为 Int128 Max.

**数据存储单位对照表**

| 单位  | 描述        | 值          |
|------|-----------|------------|
| B    | Bytes      | 1          |
| kB   | Kilobytes    | 1024       |
| MB   | Megabytes    | 1024²      |
| GB   | Gigabytes    | 1024³      |
| TB   | Terabytes    | 1024⁴      |
| PB   | Petabytes    | 1024⁵      |
| EB   | Exabytes    | 1024⁶      |
| ZB   | Zettabytes    | 1024⁷      |
| YB   | Yottabytes    | 1024⁸      |

## 语法

```sql
PARSE_DATA_SIZE(<str>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 带单位的字符串数值 |

## 返回值

将带单位的字符串的值解析为数字

## 举例

```sql
SELECT parse_data_size('1B');
```

```text
+-----------------------+
| parse_data_size('1B') |
+-----------------------+
| 1                     |
+-----------------------+
```

```sql
SELECT parse_data_size('1kB');
```

```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```

```sql
SELECT parse_data_size('2.3MB');
```

```text
+--------------------------+
| parse_data_size('2.3MB') |
+--------------------------+
| 2411724                  |
+--------------------------+
```